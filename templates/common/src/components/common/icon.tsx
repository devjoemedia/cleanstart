import { AlertCircle, ArrowRight, Coffee, Gift, UtensilsCrossed } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { IconName } from '#/types'

// Content refers to icons by string key; this is the only place keys become components.
const icons = {
  coffee: Coffee,
  gift: Gift,
  utensils: UtensilsCrossed,
  'arrow-right': ArrowRight,
  alert: AlertCircle,
} satisfies Record<IconName, React.ComponentType<LucideProps>>

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Component = icons[name]
  return <Component aria-hidden {...props} />
}
