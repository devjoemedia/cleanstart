/**
 * Parses request input against a zod schema; a failure becomes a 400 with one line per problem.
 * @author {{author}}
 */
import type { z } from 'zod'
import { ValidationError } from '#/lib/errors{{ext}}'

export function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  throw new ValidationError(
    result.error.issues.map((issue) => `${issue.path.map(String).join('.') || 'input'}: ${issue.message}`),
  )
}
