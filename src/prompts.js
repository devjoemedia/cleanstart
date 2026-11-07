import readline from 'node:readline/promises'

const DEFAULT_COLOR = '#d2461a'

// Turns a package name like "@acme/my-app" into "My App".
export function titleCase(name) {
  return name
    .replace(/^@[^/]+\//, '')
    .split(/[-_\s.]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

export function normalizeColor(value) {
  const hex = value.trim().replace(/^#?/, '#').toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(hex)) return `#${[...hex.slice(1)].map((c) => c + c).join('')}`
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : null
}

export function normalizeUrl(value) {
  const raw = value.trim()
  try {
    const url = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`)
    return url.hostname.includes('.') || url.hostname === 'localhost' ? url.origin : null
  } catch {
    return null
  }
}

const checks = {
  name: (v) => (v.trim() ? v.trim() : null),
  description: (v) => v.trim(),
  url: normalizeUrl,
  author: (v) => (v.trim() ? v.trim() : null),
  color: normalizeColor,
}

const errors = {
  name: 'Enter a name.',
  url: 'Enter a URL like https://example.com.',
  author: 'Enter a name.',
  color: 'Enter a hex colour like #d2461a.',
}

// Collects the project details: flags win, then answers at the terminal, then defaults.
export async function askProjectDetails({ flags, defaults, web, interactive, askExample }) {
  const fallback = {
    name: defaults.name,
    description: '',
    url: 'https://www.example.com',
    author: defaults.author || 'Your Name',
    color: DEFAULT_COLOR,
  }

  const details = {}
  for (const key of Object.keys(checks)) {
    if (flags[key] === undefined) continue
    const value = checks[key](flags[key])
    if (value === null) throw new Error(`--${key}: ${errors[key]}`)
    details[key] = value
  }
  let example = flags.example

  if (interactive) {
    const questions = [
      { key: 'name', label: 'Project name' },
      { key: 'description', label: 'Short description', hint: 'optional' },
      web && { key: 'url', label: 'Site URL' },
      { key: 'author', label: 'Author' },
      { key: 'color', label: 'Brand colour' },
    ].filter(Boolean)

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    try {
      console.log('\n  A few details to fill in the files (Enter keeps the default):\n')
      for (const { key, label, hint } of questions) {
        if (key in details) continue
        const shown = fallback[key] || hint
        for (;;) {
          const answer = await rl.question(`  ${label}${shown ? ` (${shown})` : ''}: `)
          if (!answer.trim()) {
            details[key] = fallback[key]
            break
          }
          const value = checks[key](answer)
          if (value !== null) {
            details[key] = value
            break
          }
          console.log(`    ${errors[key]}`)
        }
      }
      if (askExample && example === undefined) {
        const answer = (await rl.question('  Add the menu example slice? (y/N): ')).trim().toLowerCase()
        example = answer === 'y' || answer === 'yes'
      }
      console.log('')
    } finally {
      rl.close()
    }
  }

  return { ...fallback, ...details, example: Boolean(example) }
}

// A lighter version of the colour for dark mode, mixed towards white.
export function lighten(hex, amount = 0.2) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `#${channels.map((c) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')).join('')}`
}

// White or near-black text, whichever reads better on the colour.
export function readableOn(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return (1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05) ? '#ffffff' : '#171717'
}

// Escapes a value for a single-quoted JS/TS string.
export function jsString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}
