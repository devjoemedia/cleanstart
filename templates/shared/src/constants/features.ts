import { FEATURE_FLAGS } from '#/constants/env{{ext}}'

// Half-finished {{#client}}sections{{/client}}{{#server}}endpoints{{/server}} ship switched off; turn them on with an environment variable.
export const FEATURES = {
  newsletter: FEATURE_FLAGS.includes('newsletter'),
} as const
