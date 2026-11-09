import { z } from 'zod'

// GET /menu?category=coffee
export const menuQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
})
