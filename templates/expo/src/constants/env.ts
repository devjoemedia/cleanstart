// Environment access lives here so the rest of the app never reads process.env directly.
// Expo inlines EXPO_PUBLIC_* variables at build time, so they must be read with dot access.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export const FEATURE_FLAGS = (process.env.EXPO_PUBLIC_FEATURES ?? '')
  .split(',')
  .map((flag: string) => flag.trim())
  .filter(Boolean)
