import fs from 'node:fs'

// Adds the #/ import alias and the lint, format and typecheck scripts; returns true if anything changed.
export function patchPackageJson(pkg, vars) {
  const before = JSON.stringify(pkg)
  // Metro resolves #/ through tsconfig paths, so Expo apps skip the package.json imports field.
  if (vars.web) pkg.imports = { ...pkg.imports, '#/*': vars.alias }
  pkg.scripts = {
    ...pkg.scripts,
    typecheck: pkg.scripts?.typecheck ?? 'tsc --noEmit',
    format: pkg.scripts?.format ?? vars.formatScript,
    check: pkg.scripts?.check ?? 'prettier --check .',
  }
  return JSON.stringify(pkg) !== before
}

export function patchTsconfig(tsconfig, vars) {
  const before = JSON.stringify(tsconfig)
  const options = (tsconfig.compilerOptions ??= {})
  options.paths = { ...options.paths, '#/*': [vars.alias] }
  options.noUnusedLocals = true
  options.noUnusedParameters = true
  return JSON.stringify(tsconfig) !== before
}

const TOKEN_MARKER = 'cleanstart:tokens'

// Appends brand tokens mapped onto shadcn's names; skipped if they were added before.
export function patchStyles(file, dryRun) {
  if (!fs.existsSync(file)) return false
  const css = fs.readFileSync(file, 'utf8')
  if (css.includes(TOKEN_MARKER)) return false

  const hasBase = /--background\s*:/.test(css)
  const block = `
/* ${TOKEN_MARKER}: brand tokens. Components use bg-primary or text-foreground, never hex values. */
:root {
${hasBase ? '' : '  --background: #ffffff;\n  --foreground: #171717;\n'}  --primary: #d2461a;
  --primary-foreground: #ffffff;
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
export function patchLayout(file, dryRun) {
  const src = fs.readFileSync(file, 'utf8')
  if (src.includes('QueryProvider')) return 'present'
  if (!src.includes('{children}')) return 'manual'

  const out = addProviderImport(src).replace('{children}', '<QueryProvider>{children}</QueryProvider>')
  if (!dryRun) fs.writeFileSync(file, out)
  return 'patched'
}

// Expo Router's root layout returns the navigator, so the provider wraps the default export's returned JSX.
export function patchNativeLayout(file, dryRun) {
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
    const out = addProviderImport(src.slice(0, at) + src.slice(at).replace(`return ${inline[1]}`, jsx))
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
  const out = addProviderImport(src.slice(0, start) + wrapped + src.slice(end))
  if (!dryRun) fs.writeFileSync(file, out)
  return 'patched'
}

// Inserts the QueryProvider import after the last import, matching the file's quote and semicolon style.
function addProviderImport(src) {
  const quote = /from "/.test(src) ? '"' : "'"
  const semi = /^import .*;\s*$/m.test(src) ? ';' : ''
  const importLine = `import { QueryProvider } from ${quote}#/integrations/tanstack-query/query-provider${quote}${semi}`
  const lines = src.split('\n')
  const lastImport = lines.findLastIndex((line) => /^import\s/.test(line) || /^\} from ['"]/.test(line))
  lines.splice(lastImport + 1, 0, importLine)
  return lines.join('\n')
}
