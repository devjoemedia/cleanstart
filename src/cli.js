import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { FRAMEWORKS, pmCommands, readProject, resolveLayout } from './detect.js'
import { copyTemplates, readJsonc, writeJson } from './files.js'
import { askProjectDetails, jsString, lighten, readableOn, titleCase } from './prompts.js'
import {
  patchAppJson,
  patchJestConfig,
  patchLayout,
  patchNativeLayout,
  patchNestMain,
  patchNestModule,
  patchPackageJson,
  patchStyles,
  patchTsconfig,
} from './patch.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const templates = path.join(root, 'templates')
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const frameworkKeys = Object.keys(FRAMEWORKS)

const help = `
  cleanstart ${version}
  Adds a clean, CMS-ready project structure to a Next.js, TanStack Start, Expo, NestJS or Express app.

  Usage
    npx @devjoemedia/cleanstart [options]   run inside the project folder

  Options
    --framework <${frameworkKeys.join('|')}>   skip detection
    --example                       also add the menu example slice (type → data → hook → page → component,
                                    or type → data → service → controller on an API)
    --name <name>                   project name (asked if not given)
    --description <text>            one-line description
    --url <url>                     site URL (web only)
    --author <name>                 author for file headers (default: git user.name)
    --color <hex>                   brand colour, e.g. #d2461a (web and Expo only)
    -y, --yes                       don't ask anything; use flags and defaults
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
  expo: ['@tanstack/react-query', 'lucide-react-native', 'react-native-svg'],
  nest: ['class-validator', 'class-transformer'],
  express: ['zod'],
}
const devDeps = {
  next: ['prettier'],
  tanstack: [],
  expo: ['prettier'],
  nest: [],
  express: ['typescript', 'tsx', 'tsc-alias', '@types/express', '@types/node', 'prettier'],
}

// Template layers, applied in order. Each may hold src/ (→ source folder), root/ (→ project root) and app/ (→ routes).
// client holds what every front end shares; an API's platform is already server, so the set drops the repeat.
function layersFor(framework, example) {
  const { platform } = FRAMEWORKS[framework]
  const side = platform === 'server' ? 'server' : 'client'
  const layers = ['shared', side, platform, framework]
  // TanStack Start and NestJS ship their own Prettier setup.
  if (framework !== 'tanstack' && framework !== 'nest') layers.push('prettier')
  if (example) layers.push('example/shared', `example/${side}`, `example/${platform}`, `example/${framework}`)
  else layers.push(`blank/${side}`)
  return [...new Set(layers)]
}

export async function run(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      framework: { type: 'string' },
      example: { type: 'boolean' },
      name: { type: 'string' },
      description: { type: 'string' },
      url: { type: 'string' },
      author: { type: 'string' },
      color: { type: 'string' },
      yes: { type: 'boolean', short: 'y' },
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
  const project = readProject(cwd)
  const framework = values.framework ?? (await chooseFramework(project.detected))
  const { srcDir, appDir } = resolveLayout(cwd, framework, project.deps)
  const { pm, pkg } = project
  const cmd = pmCommands[pm]
  const { label, platform } = FRAMEWORKS[framework]
  const server = platform === 'server'

  const details = await askProjectDetails({
    flags: { ...values },
    defaults: { name: titleCase(project.name), author: gitUserName() },
    web: platform === 'web',
    server,
    interactive: Boolean(process.stdin.isTTY) && !values.yes,
    askExample: true,
  })
  const { example } = details

  console.log(`\n  cleanstart ${version}${dryRun ? ' (dry run)' : ''}`)
  console.log(`  ${label} · ${pm} · src: ${srcDir === '.' ? 'project root' : `${srcDir}/`}${example ? ' · with menu example' : ''}\n`)

  const vars = {
    next: framework === 'next',
    tanstack: framework === 'tanstack',
    expo: framework === 'expo',
    nest: framework === 'nest',
    express: framework === 'express',
    web: platform === 'web',
    native: platform === 'native',
    client: !server,
    server,
    // Node's ESM resolver needs the .js extension; CommonJS builds (NestJS 11 and earlier) can't rewrite aliases with one.
    esm: server && pkg.type === 'module',
    ext: server && pkg.type === 'module' ? '.js' : '',
    hasLint: framework !== 'express',
    example,
    projectName: details.name,
    projectNameJs: jsString(details.name),
    description: details.description,
    descriptionJs: jsString(details.description || 'One or two sentences about what this site is and who it is for.'),
    hasDescription: Boolean(details.description),
    siteUrl: details.url,
    author: details.author,
    primary: details.color,
    primaryDark: lighten(details.color),
    primaryForeground: readableOn(details.color),
    primaryForegroundDark: readableOn(lighten(details.color)),
    framework: label,
    run: cmd.run,
    exec: cmd.exec,
    pm,
    srcDir,
    srcPath: srcDir === '.' ? '' : `${srcDir}/`,
    appDir: appDir ?? '',
    alias: srcDir === '.' ? './*' : `./${srcDir}/*`,
    // Next.js, Expo and NestJS resolve @/ already; TanStack Start uses the #/ subpath import.
    // Node rejects #/ at runtime, so the APIs use tsconfig paths, rewritten at build time.
    importPrefix: framework === 'tanstack' ? '#/' : '@/',
    devScript: { expo: 'web', nest: 'start:dev' }[framework] ?? 'dev',
    devPort: platform === 'native' ? 8081 : 3000,
    formatScript:
      platform === 'native' || framework === 'express' ? 'prettier --write .' : 'prettier --write . && eslint --fix',
    scripts:
      framework === 'express'
        ? { dev: 'tsx watch src/server.ts', build: 'tsc && tsc-alias', start: 'node dist/server.js' }
        : {},
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
  if (patchPackageJson(pkg, vars)) {
    writeJson(pkgFile, pkg, dryRun)
    report.updated.push(`package.json (${vars.importPrefix === '#/' ? '#/ alias, ' : ''}scripts)`)
  }

  const tsFile = path.join(cwd, 'tsconfig.json')
  // A tsconfig cleanstart just wrote already has the alias (and doesn't exist yet in a dry run).
  const wroteTsconfig = report.created.includes('tsconfig.json')
  if (!wroteTsconfig && fs.existsSync(tsFile)) {
    const tsconfig = readJsonc(tsFile)
    if (patchTsconfig(tsconfig, vars)) {
      writeJson(tsFile, tsconfig, dryRun)
      report.updated.push(`tsconfig.json (${vars.importPrefix} path, unused locals and parameters)`)
    }
  } else if (!wroteTsconfig) report.manual.push(`Add "${vars.importPrefix}*": ["${vars.alias}"] to compilerOptions.paths in tsconfig.json.`)

  if (vars.web) {
    const stylesFile = path.join(cwd, framework === 'next' ? path.join(appDir, 'globals.css') : path.join(srcDir, 'styles.css'))
    const styles = patchStyles(stylesFile, vars, dryRun)
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

  if (framework === 'expo') {
    const appJson = path.join(cwd, 'app.json')
    if (patchAppJson(appJson, details.name, dryRun)) report.updated.push('app.json (app name)')
  }

  if (framework === 'nest') patchNest({ cwd, pkg, vars, example, dryRun, report })
  if (framework === 'express') checkExpress({ cwd, pkg, project, dryRun, report })

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
  if (vars.server) return printServerNextSteps({ framework, vars, cmd, example })
  const steps =
    framework === 'expo'
      ? ['Set the app icon and splash screen in app.json.', `Fine-tune the brand palette in ${vars.srcPath}constants/tokens.ts.`]
      : [`Check ${vars.srcPath}constants/site.ts (OG image, locale, Twitter handle).`]
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

function printServerNextSteps({ framework, vars, cmd, example }) {
  const dev = `${cmd.run} ${vars.devScript}`
  const shape = framework === 'nest' ? 'type → data → service → controller → module' : 'type → data → service → controller → routes'
  const steps = []
  // Nest's Prettier config uses semicolons; the templates are written without them.
  if (framework === 'nest') steps.push(`Run ${cmd.run} format once so the new files match the project's Prettier style.`)
  if (example) {
    steps.push(
      `Run ${dev} and open http://localhost:3000/menu to see the example slice: ${shape}.`,
      `Read CLAUDE.md, then copy modules/menu for your first real domain and delete the example.`,
    )
  } else steps.push(`Read CLAUDE.md, then build your first domain in modules/: ${shape}.`)
  const checks = [`${cmd.run} typecheck`, vars.hasLint && `${cmd.run} lint`, framework === 'nest' && `${cmd.run} test`]
  steps.push(`Check everything: ${checks.filter(Boolean).join(' && ')}`)
  console.log(`\n  Next steps\n${steps.map((step, i) => `    ${i + 1}. ${step}`).join('\n')}\n`)
}

// Registers the global pipe and filter, mounts the example module and teaches Jest the alias.
function patchNest({ cwd, pkg, vars, example, dryRun, report }) {
  const mainFile = path.join(cwd, 'src/main.ts')
  const filter = `${vars.importPrefix}common/filters/all-exceptions.filter${vars.ext}`
  const main = patchNestMain(mainFile, filter, dryRun)
  if (main === 'patched') report.updated.push('src/main.ts (ValidationPipe, AllExceptionsFilter)')
  else if (main === 'manual') {
    report.manual.push(
      'Before app.listen() in src/main.ts, add app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))' +
        ` and app.useGlobalFilters(new AllExceptionsFilter()) from '${filter}'.`,
    )
  }

  if (example) {
    const source = `${vars.importPrefix}modules/menu/menu.module${vars.ext}`
    const moduleFile = path.join(cwd, 'src/app.module.ts')
    const result = fs.existsSync(moduleFile) ? patchNestModule(moduleFile, 'MenuModule', source, dryRun) : 'manual'
    if (result === 'patched') report.updated.push('src/app.module.ts (MenuModule)')
    else if (result === 'manual') report.manual.push(`Add MenuModule from '${source}' to the imports of your root module.`)
  }

  // Vitest (NestJS 12+) reads tsconfig paths itself; Jest needs a moduleNameMapper.
  const mapped = []
  if (patchJestConfig(pkg.jest, vars.importPrefix, '<rootDir>/$1')) {
    writeJson(path.join(cwd, 'package.json'), pkg, dryRun)
    mapped.push('package.json')
  }
  const e2eFile = path.join(cwd, 'test/jest-e2e.json')
  if (fs.existsSync(e2eFile)) {
    const e2e = readJsonc(e2eFile)
    if (patchJestConfig(e2e, vars.importPrefix, '<rootDir>/../src/$1')) {
      writeJson(e2eFile, e2e, dryRun)
      mapped.push('test/jest-e2e.json')
    }
  }
  for (const file of mapped) report.updated.push(`${file} (Jest ${vars.importPrefix} alias)`)
}

// Express has no project layout of its own, so this flags what the new src/ structure can't take care of.
function checkExpress({ cwd, pkg, project, dryRun, report }) {
  const gitignore = path.join(cwd, '.gitignore')
  if (!fs.existsSync(gitignore)) {
    if (!dryRun) fs.writeFileSync(gitignore, 'node_modules\ndist\n.env\n')
    report.created.push('.gitignore')
  }
  if (/^\D*4\./.test(project.deps.express)) {
    report.manual.push('Express 4 does not pass rejected promises to the error handler. Upgrade: express@5 @types/express@5.')
  }
  const entry = ['index.js', 'app.js', 'server.js', 'index.ts', 'app.ts', 'server.ts'].find((file) =>
    fs.existsSync(path.join(cwd, file)),
  )
  if (entry) report.manual.push(`Move the routes in ${entry} into src/modules/; the app now starts from src/server.ts.`)
  if (pkg.scripts?.start && pkg.scripts.start !== 'node dist/server.js') {
    report.manual.push(`Your start script runs "${pkg.scripts.start}"; point it at node dist/server.js once you have moved over.`)
  }
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
