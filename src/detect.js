import fs from 'node:fs'
import path from 'node:path'

// Every supported framework: the dependency that identifies it and whether it renders to the web or native.
export const FRAMEWORKS = {
  next: { label: 'Next.js', dep: 'next', platform: 'web' },
  tanstack: { label: 'TanStack Start', dep: '@tanstack/react-start', platform: 'web' },
  expo: { label: 'Expo (React Native)', dep: 'expo', platform: 'native' },
}

// Reads the target project and works out its framework (null if unknown) and package manager.
export function readProject(cwd) {
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`No package.json in ${cwd}. Run cleanstart inside a Next.js, TanStack Start or Expo project.`)
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const detected = Object.keys(FRAMEWORKS).filter((key) => deps[FRAMEWORKS[key].dep])
  return { pkg, deps, detected, pm: detectPackageManager(cwd), name: pkg.name ?? path.basename(cwd) }
}

// Finds where source files and routes live for the chosen framework.
export function resolveLayout(cwd, framework, deps) {
  const has = (rel) => fs.existsSync(path.join(cwd, rel))

  if (framework === 'tanstack') return { srcDir: 'src', appDir: null }

  if (framework === 'next') {
    const srcDir = has('src') ? 'src' : '.'
    const appDir = path.join(srcDir, 'app')
    if (!has(appDir)) throw new Error(`Expected a Next.js App Router folder at ${appDir}/. The Pages Router is not supported.`)
    return { srcDir, appDir }
  }

  // Expo Router reads routes from src/app when it exists, otherwise from app/ at the root.
  if (!deps['expo-router']) {
    throw new Error('cleanstart needs Expo Router. Install it first: npx expo install expo-router')
  }
  const srcDir = has('src/app') ? 'src' : '.'
  const appDir = path.join(srcDir, 'app')
  if (!has(appDir)) throw new Error(`Expected an Expo Router folder at ${appDir}/.`)
  return { srcDir, appDir }
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
