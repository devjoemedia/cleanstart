import fs from 'node:fs'
import path from 'node:path'

// Works out which framework, package manager and folder layout the target project uses.
export function detectProject(cwd, forcedFramework) {
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`No package.json in ${cwd}. Run cleanstart inside a Next.js or TanStack Start project.`)
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  const framework = forcedFramework ?? (deps.next ? 'next' : deps['@tanstack/react-start'] ? 'tanstack' : null)
  if (!framework) {
    throw new Error('Could not find next or @tanstack/react-start in package.json. Pass --framework next|tanstack.')
  }

  // TanStack Start always uses src/; Next.js may or may not.
  const srcDir = framework === 'tanstack' || fs.existsSync(path.join(cwd, 'src')) ? 'src' : '.'
  const appDir = framework === 'next' ? path.join(srcDir, 'app') : null
  if (appDir && !fs.existsSync(path.join(cwd, appDir))) {
    throw new Error(`Expected a Next.js App Router folder at ${appDir}/. The Pages Router is not supported.`)
  }

  return { pkg, framework, srcDir, appDir, pm: detectPackageManager(cwd), name: pkg.name ?? path.basename(cwd) }
}

function detectPackageManager(cwd) {
  const has = (file) => fs.existsSync(path.join(cwd, file))
  if (has('pnpm-lock.yaml')) return 'pnpm'
  if (has('yarn.lock')) return 'yarn'
  if (has('bun.lock') || has('bun.lockb')) return 'bun'
  if (has('package-lock.json')) return 'npm'
  const agent = process.env.npm_config_user_agent ?? ''
  for (const pm of ['pnpm', 'yarn', 'bun']) if (agent.startsWith(pm)) return pm
  return 'npm'
}

export const pmCommands = {
  npm: { run: 'npm run', exec: 'npx', add: ['install'], addDev: ['install', '-D'] },
  pnpm: { run: 'pnpm', exec: 'pnpm exec', add: ['add'], addDev: ['add', '-D'] },
  yarn: { run: 'yarn', exec: 'yarn', add: ['add'], addDev: ['add', '-D'] },
  bun: { run: 'bun run', exec: 'bunx', add: ['add'], addDev: ['add', '-d'] },
}
