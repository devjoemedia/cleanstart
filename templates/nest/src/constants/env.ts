// Environment access lives here so the rest of the app never reads process.env directly.
export const FEATURE_FLAGS = (process.env.FEATURES ?? '')
  .split(',')
  .map((flag) => flag.trim())
  .filter(Boolean)
