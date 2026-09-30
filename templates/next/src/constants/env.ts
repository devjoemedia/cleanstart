// Environment access lives here so the rest of the app never reads process.env directly.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const FEATURE_FLAGS = (process.env.NEXT_PUBLIC_FEATURES ?? '')
  .split(',')
  .map((flag) => flag.trim())
  .filter(Boolean)
