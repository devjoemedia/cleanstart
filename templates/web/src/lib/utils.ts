import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

// Merges Tailwind classes so later ones win (shadcn relies on this).
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}
