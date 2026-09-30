import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { detectProject, pmCommands } from './detect.js'
import { copyTemplates, readJsonc, writeJson } from './files.js'
import { patchLayout, patchPackageJson, patchStyles, patchTsconfig } from './patch.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const templates = path.join(root, 'templates')
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

const help = `
  cleanstart ${version}
  Adds a clean, CMS-ready project structure to a Next.js or TanStack Start app.

  Usage
    npx cleanstart [options]        run inside the project folder

  Options
    --framework <next|tanstack>     skip detection
    --cwd <dir>                     project folder (default: current folder)
    --dry-run                       show what would change, write nothing
    --force                         overwrite files that already exist
    --no-install                    don't install packages
    -h, --help                      show this help
    -v, --version                   show the version
`

const deps = {
  common: ['@tanstack/react-query', 'clsx', 'tailwind-merge', 'lucide-react'],
  next: [],
  tanstack: [],
}
const devDeps = { common: [], next: ['prettier'], tanstack: [] }

export async function run(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      framework: { type: 'string' },
      cwd: { type: 'string' },
      'dry-run': { type: 'boolean' },
      force: { type: 'boolean' },
      'no-install': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })
  if (values.help) return console.log(help)
  if (values.version) return console.log(version)
  if (values.framework && !['next', 'tanstack'].includes(values.framework)) {
    throw new Error('--framework must be next or tanstack')
  }

  const cwd = path.resolve(values.cwd ?? process.cwd())
  const dryRun = Boolean(values['dry-run'])
  const project = detectProject(cwd, values.framework)
  const { framework, srcDir, appDir, pm } = project
  const cmd = pmCommands[pm]
  const label = framework === 'next' ? 'Next.js' : 'TanStack Start'

  console.log(`\n  cleanstart ${version}${dryRun ? ' (dry run)' : ''}`)
  console.log(`  ${label} · ${pm} · src: ${srcDir === '.' ? 'project root' : `${srcDir}/`}\n`)

  const vars = {
    next: framework === 'next',
    tanstack: framework === 'tanstack',
    projectName: project.name,
    author: gitUserName() || 'Your Name',
    framework: label,
    run: cmd.run,
    exec: cmd.exec,
    pm,
    srcDir: srcDir === '.' ? '.' : srcDir,
    srcPath: srcDir === '.' ? '' : `${srcDir}/`,
    appDir: appDir ?? '',
    alias: srcDir === '.' ? './*' : `./${srcDir}/*`,
  }

  const report = { created: [], overwritten: [], skipped: [], updated: [], manual: [] }
  const copy = (from, to) =>
    copyTemplates({ from: path.join(templates, from), to, cwd, vars, force: values.force, dryRun, report })

  copy('common/src', srcDir)
  copy('common/root', '.')
  copy(`${framework}/src`, srcDir)
  copy(`${framework}/root`, '.')
  if (appDir) copy('next/app', appDir)

  const pkgFile = path.join(cwd, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
  if (patchPackageJson(pkg, vars)) {
    writeJson(pkgFile, pkg, dryRun)
    report.updated.push('package.json (#/ alias, scripts)')
  }

  const tsFile = path.join(cwd, 'tsconfig.json')
  if (fs.existsSync(tsFile)) {
    const tsconfig = readJsonc(tsFile)
    if (patchTsconfig(tsconfig, vars)) {
      writeJson(tsFile, tsconfig, dryRun)
      report.updated.push('tsconfig.json (#/ path, unused locals and parameters)')
    }
  }

  const stylesFile = path.join(cwd, framework === 'next' ? path.join(appDir, 'globals.css') : path.join(srcDir, 'styles.css'))
  const styles = patchStyles(stylesFile, dryRun)
  if (styles) report.updated.push(`${path.relative(cwd, stylesFile)} (brand tokens)`)
  else if (!fs.existsSync(stylesFile)) report.manual.push(`Add the brand tokens to your main stylesheet (${path.relative(cwd, stylesFile)} not found).`)

  if (framework === 'next') {
    const layoutFile = ['layout.tsx', 'layout.jsx'].map((f) => path.join(cwd, appDir, f)).find(fs.existsSync)
    const result = layoutFile ? patchLayout(layoutFile, dryRun) : 'missing'
    if (result === 'patched') report.updated.push(`${path.relative(cwd, layoutFile)} (QueryProvider)`)
    else if (result !== 'present') {
      report.manual.push(`Wrap {children} in ${appDir}/layout.tsx with <QueryProvider> from '#/integrations/tanstack-query/query-provider'.`)
    }
  }

  const toInstall = [...deps.common, ...deps[framework]].filter((d) => !pkg.dependencies?.[d])
  const toInstallDev = [...devDeps.common, ...devDeps[framework]].filter(
    (d) => !pkg.devDependencies?.[d] && !pkg.dependencies?.[d],
  )

  printReport(report)

  if (values['no-install'] || dryRun) {
    if (toInstall.length) console.log(`  Packages to install: ${toInstall.join(' ')}`)
    if (toInstallDev.length) console.log(`  Dev packages to install: ${toInstallDev.join(' ')}`)
  } else {
    install(pm, cmd.add, toInstall, cwd)
    install(pm, cmd.addDev, toInstallDev, cwd)
    // The new /menu route needs to be in routeTree.gen.ts before tsc can see it.
    if (framework === 'tanstack' && pkg.scripts?.['generate-routes']) {
      spawnSync(pm, ['run', 'generate-routes'], { cwd, stdio: 'ignore', shell: process.platform === 'win32' })
    }
  }

  console.log(`
  Next steps
    1. Fill in ${vars.srcPath}constants/site.ts (name, URL, description).
    2. Open /menu to see the example slice: type → data → query hook → ${framework === 'next' ? 'server prefetch' : 'loader'} → component.
    3. Read CLAUDE.md, then copy the menu slice for your first real domain.
    4. Check everything: ${cmd.exec} tsc --noEmit && ${cmd.run} lint
`)
}

function install(pm, args, packages, cwd) {
  if (!packages.length) return
  console.log(`  Installing ${packages.join(' ')}…`)
  const result = spawnSync(pm, [...args, ...packages], { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) throw new Error(`${pm} ${args.join(' ')} failed. Install manually: ${packages.join(' ')}`)
}

function printReport({ created, overwritten, skipped, updated, manual }) {
  const section = (title, items) => {
    if (!items.length) return
    console.log(`  ${title}`)
    for (const item of items) console.log(`    ${item}`)
    console.log('')
  }
  section('Created', created)
  section('Overwritten', overwritten)
  section('Updated', updated)
  section('Skipped (already exist, use --force to overwrite)', skipped)
  section('Do by hand', manual)
}

function gitUserName() {
  try {
    return execSync('git config user.name', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}
