import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { FRAMEWORKS, pmCommands, readProject, resolveLayout } from './detect.js'
import { copyTemplates, readJsonc, writeJson } from './files.js'
import { patchLayout, patchNativeLayout, patchPackageJson, patchStyles, patchTsconfig } from './patch.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const templates = path.join(root, 'templates')
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const frameworkKeys = Object.keys(FRAMEWORKS)

const help = `
  cleanstart ${version}
  Adds a clean, CMS-ready project structure to a Next.js, TanStack Start or Expo app.

  Usage
    npx @devjoemedia/cleanstart [options]   run inside the project folder

  Options
    --framework <${frameworkKeys.join('|')}>   skip detection
    --example                       also add the menu example slice (type → data → hook → page → component)
    --cwd <dir>                     project folder (default: current folder)
    --dry-run                       show what would change, write nothing
    --force                         overwrite files that already exist
    --no-install                    don't install packages
    -h, --help                      show this help
    -v, --version                   show the version
`

// Packages each framework needs; Expo's go through \`expo install\` so they match the SDK.
const deps = {
  next: ['@tanstack/react-query', 'clsx', 'tailwind-merge', 'lucide-react'],
  tanstack: ['@tanstack/react-query', 'clsx', 'tailwind-merge', 'lucide-react'],
  expo: ['@tanstack/react-query', '@expo/vector-icons'],
}
const devDeps = { next: ['prettier'], tanstack: [], expo: ['prettier'] }

// Template layers, applied in order. Each may hold src/ (→ source folder), root/ (→ project root) and app/ (→ routes).
function layersFor(framework, example) {
  const { platform } = FRAMEWORKS[framework]
  const layers = ['shared', platform, framework]
  // TanStack Start ships its own Prettier setup.
  if (framework !== 'tanstack') layers.push('prettier')
  if (example) layers.push('example/shared', `example/${platform}`, `example/${framework}`)
  else layers.push('blank')
  return layers
}

export async function run(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      framework: { type: 'string' },
      example: { type: 'boolean' },
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
  if (values.framework && !FRAMEWORKS[values.framework]) {
    throw new Error(`--framework must be one of: ${frameworkKeys.join(', ')}`)
  }

  const cwd = path.resolve(values.cwd ?? process.cwd())
  const dryRun = Boolean(values['dry-run'])
  const example = Boolean(values.example)
  const project = readProject(cwd)
  const framework = values.framework ?? (await chooseFramework(project.detected))
  const { srcDir, appDir } = resolveLayout(cwd, framework, project.deps)
  const { pm } = project
  const cmd = pmCommands[pm]
  const { label, platform } = FRAMEWORKS[framework]

  console.log(`\n  cleanstart ${version}${dryRun ? ' (dry run)' : ''}`)
  console.log(`  ${label} · ${pm} · src: ${srcDir === '.' ? 'project root' : `${srcDir}/`}${example ? ' · with menu example' : ''}\n`)

  const vars = {
    next: framework === 'next',
    tanstack: framework === 'tanstack',
    expo: framework === 'expo',
    web: platform === 'web',
    native: platform === 'native',
    example,
    projectName: project.name,
    author: gitUserName() || 'Your Name',
    framework: label,
    run: cmd.run,
    exec: cmd.exec,
    pm,
    srcDir,
    srcPath: srcDir === '.' ? '' : `${srcDir}/`,
    appDir: appDir ?? '',
    alias: srcDir === '.' ? './*' : `./${srcDir}/*`,
    // Next.js and Expo scaffold with @/ already; TanStack Start uses the #/ subpath import.
    importPrefix: framework === 'tanstack' ? '#/' : '@/',
    devScript: platform === 'native' ? 'web' : 'dev',
    devPort: platform === 'native' ? 8081 : 3000,
    formatScript: platform === 'native' ? 'prettier --write .' : 'prettier --write . && eslint --fix',
  }

  const report = { created: [], overwritten: [], skipped: [], updated: [], manual: [] }
  for (const layer of layersFor(framework, example)) {
    const copy = (from, to) =>
      copyTemplates({ from: path.join(templates, layer, from), to, cwd, vars, force: values.force, dryRun, report })
    copy('src', srcDir)
    copy('root', '.')
    if (appDir) copy('app', appDir)
  }

  const pkgFile = path.join(cwd, 'package.json')
  const pkg = project.pkg
  if (patchPackageJson(pkg, vars)) {
    writeJson(pkgFile, pkg, dryRun)
    report.updated.push(`package.json (${vars.importPrefix === '#/' ? '#/ alias, ' : ''}scripts)`)
  }

  const tsFile = path.join(cwd, 'tsconfig.json')
  if (fs.existsSync(tsFile)) {
    const tsconfig = readJsonc(tsFile)
    if (patchTsconfig(tsconfig, vars)) {
      writeJson(tsFile, tsconfig, dryRun)
      report.updated.push(`tsconfig.json (${vars.importPrefix} path, unused locals and parameters)`)
    }
  } else report.manual.push(`Add "${vars.importPrefix}*": ["${vars.alias}"] to compilerOptions.paths in tsconfig.json.`)

  if (vars.web) {
    const stylesFile = path.join(cwd, framework === 'next' ? path.join(appDir, 'globals.css') : path.join(srcDir, 'styles.css'))
    const styles = patchStyles(stylesFile, dryRun)
    if (styles) report.updated.push(`${path.relative(cwd, stylesFile)} (brand tokens)`)
    else if (!fs.existsSync(stylesFile)) report.manual.push(`Add the brand tokens to your main stylesheet (${path.relative(cwd, stylesFile)} not found).`)
  }

  if (framework === 'next' || framework === 'expo') {
    const layoutName = framework === 'next' ? 'layout' : '_layout'
    const layoutFile = ['tsx', 'jsx', 'js'].map((ext) => path.join(cwd, appDir, `${layoutName}.${ext}`)).find(fs.existsSync)
    const patch = framework === 'next' ? patchLayout : patchNativeLayout
    const result = layoutFile ? patch(layoutFile, vars.importPrefix, dryRun) : 'missing'
    const shown = layoutFile ? path.relative(cwd, layoutFile) : path.join(appDir, `${layoutName}.tsx`)
    if (result === 'patched') report.updated.push(`${shown} (QueryProvider)`)
    else if (result !== 'present') {
      const what = framework === 'next' ? '{children}' : 'the returned navigator'
      report.manual.push(`Wrap ${what} in ${shown} with <QueryProvider> from '${vars.importPrefix}integrations/tanstack-query/query-provider'.`)
    }
  }

  const toInstall = deps[framework].filter((d) => !pkg.dependencies?.[d])
  const toInstallDev = devDeps[framework].filter((d) => !pkg.devDependencies?.[d] && !pkg.dependencies?.[d])

  printReport(report)

  if (values['no-install'] || dryRun) {
    if (toInstall.length) console.log(`  Packages to install: ${toInstall.join(' ')}`)
    if (toInstallDev.length) console.log(`  Dev packages to install: ${toInstallDev.join(' ')}`)
  } else {
    if (framework === 'expo') {
      const [bin, ...pre] = cmd.exec.split(' ')
      install(bin, [...pre, 'expo', 'install'], toInstall, cwd)
    } else install(pm, cmd.add, toInstall, cwd)
    install(pm, cmd.addDev, toInstallDev, cwd)
    // A new route needs to be in routeTree.gen.ts before tsc can see it.
    if (framework === 'tanstack' && example && pkg.scripts?.['generate-routes']) {
      spawnSync(pm, ['run', 'generate-routes'], { cwd, stdio: 'ignore', shell: process.platform === 'win32' })
    }
  }

  printNextSteps({ framework, vars, cmd, example })
}

// Uses the one detected framework, or asks when there are none or several (and a person is at the terminal).
async function chooseFramework(detected) {
  if (detected.length === 1) return detected[0]
  const options = detected.length ? detected : frameworkKeys
  if (!process.stdin.isTTY) {
    const why = detected.length ? `Found ${detected.join(' and ')}.` : 'Could not detect the framework.'
    throw new Error(`${why} Pass --framework ${options.join('|')}.`)
  }

  console.log(detected.length ? '\n  More than one framework found. Which one is this project?' : '\n  Which framework is this project?')
  options.forEach((key, i) => console.log(`    ${i + 1}. ${FRAMEWORKS[key].label}`))
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    for (;;) {
      const answer = (await rl.question(`  Choose 1-${options.length}: `)).trim()
      const picked = options[Number(answer) - 1] ?? options.find((key) => key === answer)
      if (picked) return picked
    }
  } finally {
    rl.close()
  }
}

function printNextSteps({ framework, vars, cmd, example }) {
  const steps =
    framework === 'expo'
      ? ['Set the app name, icon and splash screen in app.json.', `Replace the brand palette in ${vars.srcPath}constants/tokens.ts.`]
      : [`Fill in ${vars.srcPath}constants/site.ts (name, URL, description).`]
  if (example) {
    const how = { next: 'server prefetch', tanstack: 'loader', expo: 'screen' }[framework]
    steps.push(
      `Open /menu to see the example slice: type → data → query hook → ${how} → component.`,
      'Read CLAUDE.md, then copy the menu slice for your first real domain and delete the example.',
    )
  } else {
    const view = vars.native ? 'screen' : 'page'
    steps.push(`Read CLAUDE.md, then build your first domain: type → data → query hook → ${view} → component.`)
  }
  steps.push(`Check everything: ${cmd.run} typecheck && ${cmd.run} lint`)
  console.log(`\n  Next steps\n${steps.map((step, i) => `    ${i + 1}. ${step}`).join('\n')}\n`)
}

function install(bin, args, packages, cwd) {
  if (!packages.length) return
  console.log(`  Installing ${packages.join(' ')}…`)
  const result = spawnSync(bin, [...args, ...packages], { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) throw new Error(`${bin} ${args.join(' ')} failed. Install manually: ${packages.join(' ')}`)
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
