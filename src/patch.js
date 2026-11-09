import fs from 'node:fs'

// Adds the import alias plus typecheck, format and check scripts (and dev, build, start on Express); true if changed.
export function patchPackageJson(pkg, vars) {
  const before = JSON.stringify(pkg)
  // package.json imports only allow #-prefixed keys; @/ resolves through tsconfig paths alone.
  if (vars.importPrefix === '#/') pkg.imports = { ...pkg.imports, '#/*': vars.alias }
  // Scripts the project already has are kept as they are.
  const defaults = { ...vars.scripts, typecheck: 'tsc --noEmit', format: vars.formatScript, check: 'prettier --check .' }
  pkg.scripts = { ...pkg.scripts }
  for (const [name, command] of Object.entries(defaults)) pkg.scripts[name] ??= command
  return JSON.stringify(pkg) !== before
}

export function patchTsconfig(tsconfig, vars) {
  const before = JSON.stringify(tsconfig)
  const options = (tsconfig.compilerOptions ??= {})
  options.paths = { ...options.paths, [`${vars.importPrefix}*`]: [vars.alias] }
  options.noUnusedLocals = true
  options.noUnusedParameters = true
  return JSON.stringify(tsconfig) !== before
}

const TOKEN_MARKER = 'cleanstart:tokens'

// Appends brand tokens mapped onto shadcn's names; skipped if they were added before.
export function patchStyles(file, vars, dryRun) {
  if (!fs.existsSync(file)) return false
  const css = fs.readFileSync(file, 'utf8')
  if (css.includes(TOKEN_MARKER)) return false

  const hasBase = /--background\s*:/.test(css)
  const block = `
/* ${TOKEN_MARKER}: brand tokens. Components use bg-primary or text-foreground, never hex values. */
:root {
${hasBase ? '' : '  --background: #ffffff;\n  --foreground: #171717;\n'}  --primary: ${vars.primary};
  --primary-foreground: ${vars.primaryForeground};
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --border: #e4e4e7;
  --radius: 0.5rem;
}

@theme inline {
${hasBase ? '' : '  --color-background: var(--background);\n  --color-foreground: var(--foreground);\n'}  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --radius-lg: var(--radius);
}
`
  if (!dryRun) fs.writeFileSync(file, css.trimEnd() + '\n' + block)
  return true
}

// Next.js needs its own QueryClientProvider (TanStack Start's router integration already adds one).
export function patchLayout(file, importPrefix, dryRun) {
  const src = fs.readFileSync(file, 'utf8')
  if (src.includes('QueryProvider')) return 'present'
  if (!src.includes('{children}')) return 'manual'

  const out = addProviderImport(src, importPrefix).replace('{children}', '<QueryProvider>{children}</QueryProvider>')
  if (!dryRun) fs.writeFileSync(file, out)
  return 'patched'
}

// Expo Router's root layout returns the navigator, so the provider wraps the default export's returned JSX.
export function patchNativeLayout(file, importPrefix, dryRun) {
  const src = fs.readFileSync(file, 'utf8')
  if (src.includes('QueryProvider')) return 'present'

  const component = src.search(/export default function\b/)
  if (component === -1) return 'manual'

  // Single-line form from the blank template: return <Stack />
  const inline = /return (<[^\n]*>);?[ \t]*$/m.exec(src.slice(component))
  const open = src.indexOf('return (', component)
  if (inline && (open === -1 || component + inline.index < open)) {
    const at = component + inline.index
    const jsx = `return <QueryProvider>${inline[1]}</QueryProvider>`
    const out = addProviderImport(src.slice(0, at) + src.slice(at).replace(`return ${inline[1]}`, jsx), importPrefix)
    if (!dryRun) fs.writeFileSync(file, out)
    return 'patched'
  }
  if (open === -1) return 'manual'
  const start = open + 'return ('.length
  let depth = 1
  let end = start
  for (; end < src.length && depth > 0; end++) {
    if (src[end] === '(') depth++
    else if (src[end] === ')') depth--
  }
  if (depth !== 0) return 'manual'
  end-- // index of the matching ')'

  const body = src.slice(start, end).replace(/^\n/, '').replace(/\s+$/, '')
  const indent = body.match(/^\s*/)[0]
  const nested = body
    .split('\n')
    .map((line) => (line.trim() ? `  ${line}` : line))
    .join('\n')
  const wrapped = `\n${indent}<QueryProvider>\n${nested}\n${indent}</QueryProvider>\n${indent.slice(2)}`
  const out = addProviderImport(src.slice(0, start) + wrapped + src.slice(end), importPrefix)
  if (!dryRun) fs.writeFileSync(file, out)
  return 'patched'
}

function addProviderImport(src, importPrefix) {
  return addImport(src, 'QueryProvider', `${importPrefix}integrations/tanstack-query/query-provider`)
}

// Adds a named import, joining an existing import from the same module or going after the last import,
// in the file's quote and semicolon style.
function addImport(src, name, source) {
  const quote = /from "/.test(src) ? '"' : "'"
  const semi = /^import .*;\s*$/m.test(src) ? ';' : ''
  const sameSource = new RegExp(`^import \\{([^}]*)\\} from ['"]${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'm')
  const existing = sameSource.exec(src)
  if (existing) {
    const names = existing[1].split(',').map((n) => n.trim()).filter(Boolean)
    if (names.includes(name)) return src
    return src.replace(existing[0], existing[0].replace(`{${existing[1]}}`, `{ ${[...names, name].join(', ')} }`))
  }
  const importLine = `import { ${name} } from ${quote}${source}${quote}${semi}`
  const lines = src.split('\n')
  const lastImport = lines.findLastIndex((line) => /^import\s/.test(line) || /^\} from ['"]/.test(line))
  lines.splice(lastImport + 1, 0, importLine)
  return lines.join('\n')
}

// Registers the global validation pipe and error filter in a NestJS main.ts, just before app.listen().
export function patchNestMain(file, filterSource, dryRun) {
  const src = fs.readFileSync(file, 'utf8')
  if (src.includes('AllExceptionsFilter')) return 'present'
  const listen = /^([ \t]*)await app\.listen\(/m.exec(src)
  if (!listen) return 'manual'

  const semi = /^import .*;\s*$/m.test(src) ? ';' : ''
  const indent = listen[1]
  const setup =
    `${indent}app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))${semi}\n` +
    `${indent}app.useGlobalFilters(new AllExceptionsFilter())${semi}\n`
  let out = src.slice(0, listen.index) + setup + src.slice(listen.index)
  out = addImport(out, 'ValidationPipe', '@nestjs/common')
  out = addImport(out, 'AllExceptionsFilter', filterSource)
  if (!dryRun) fs.writeFileSync(file, out)
  return 'patched'
}

// Adds a feature module to the root module's imports array.
export function patchNestModule(file, name, source, dryRun) {
  const src = fs.readFileSync(file, 'utf8')
  if (src.includes(name)) return 'present'
  const list = /imports:\s*\[([^\]]*)\]/.exec(src)
  // Nested brackets mean the regex stopped early; leave those for a person.
  if (!list || list[1].includes('[')) return 'manual'

  const items = list[1].trim().replace(/,$/, '')
  const out = addImport(src.replace(list[0], `imports: [${items ? `${items}, ` : ''}${name}]`), name, source)
  if (!dryRun) fs.writeFileSync(file, out)
  return 'patched'
}

// Jest (NestJS 11 and earlier) can't read tsconfig paths, so the alias is mapped for it too.
export function patchJestConfig(config, importPrefix, target) {
  if (!config) return false
  const key = `^${importPrefix}(.*?)(\\.js)?$`
  if (config.moduleNameMapper?.[key]) return false
  config.moduleNameMapper = { ...config.moduleNameMapper, [key]: target }
  return true
}

// Sets the Expo app's display name; the slug is left alone because EAS ties builds to it.
export function patchAppJson(file, name, dryRun) {
  if (!fs.existsSync(file)) return false
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const expo = (json.expo ??= {})
  if (expo.name === name) return false
  expo.name = name
  if (!dryRun) fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`)
  return true
}
