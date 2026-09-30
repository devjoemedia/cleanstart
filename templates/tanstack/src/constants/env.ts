// Environment access lives here so the rest of the app never reads import.meta.env directly.
export const API_URL = import.meta.env.VITE_API_URL ?? ''

export const FEATURE_FLAGS = (import.meta.env.VITE_FEATURES ?? '')
  .split(',')
  .map((flag: string) => flag.trim())
  .filter(Boolean)
