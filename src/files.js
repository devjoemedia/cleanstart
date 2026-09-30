import fs from 'node:fs'
import path from 'node:path'

// Fills {{key}} values and keeps only the {{#framework}}…{{/framework}} blocks that apply.
export function render(text, vars) {
  return text
    .replace(/\{\{#(\w+)\}\}\n?([\s\S]*?)\{\{\/\1\}\}\n?/g, (_, flag, body) => (vars[flag] ? body : ''))
    .replace(/\{\{(\w+)\}\}/g, (match, key) => (key in vars ? String(vars[key]) : match))
}

export function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full)]
  })
}

// Files that get the template appended below existing content instead of being skipped.
const APPENDABLE = new Set(['CLAUDE.md'])
const MARKER = '<!-- cleanstart -->'

// Copies a template folder into the project; existing files are left alone unless forced.
export function copyTemplates({ from, to, cwd, vars, force, dryRun, report }) {
  for (const rel of listFiles(from)) {
    const target = path.join(cwd, to, rel)
    const shown = path.relative(cwd, target)
    const exists = fs.existsSync(target)
    const content = rel.endsWith('.gitkeep') ? '' : render(fs.readFileSync(path.join(from, rel), 'utf8'), vars)
    if (exists && !force) {
      const current = fs.readFileSync(target, 'utf8')
      if (APPENDABLE.has(rel) && !current.includes(MARKER)) {
        if (!dryRun) fs.writeFileSync(target, `${current.trimEnd()}\n\n${content}`)
        report.updated.push(`${shown} (conventions appended)`)
      } else report.skipped.push(shown)
      continue
    }
    if (!dryRun) {
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, content)
    }
    ;(exists ? report.overwritten : report.created).push(shown)
  }
}

// Reads tsconfig-style JSON that may contain comments and trailing commas.
export function readJsonc(file) {
  const text = fs.readFileSync(file, 'utf8')
  let out = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      out += ch
      if (ch === '\\') out += text[++i]
      else if (ch === '"') inString = false
    } else if (ch === '"') {
      inString = true
      out += ch
    } else if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
      out += '\n'
    } else if (ch === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i++
    } else out += ch
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'))
}

export function writeJson(file, data, dryRun) {
  if (!dryRun) fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}
