import { FEATURE_FLAGS } from '#/constants/env'

// Half-finished sections ship switched off; turn them on with an environment variable.
export const FEATURES = {
  newsletter: FEATURE_FLAGS.includes('newsletter'),
} as const
