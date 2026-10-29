// Brand tokens. Components read colours through useColors() and spacing from here, never raw values.
const light = {
  background: '#ffffff',
  foreground: '#171717',
  primary: '#d2461a',
  primaryForeground: '#ffffff',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  border: '#e4e4e7',
}

export type Colors = typeof light

const dark: Colors = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  primary: '#e8673d',
  primaryForeground: '#ffffff',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  border: '#3f3f46',
}

export const palette = { light, dark }

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

export const radius = { md: 8, lg: 12 } as const
