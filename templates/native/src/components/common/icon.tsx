import { ArrowRight, CircleAlert } from 'lucide-react-native'
import type { LucideIcon, LucideProps } from 'lucide-react-native'
import type { IconName } from '#/types'

// Content refers to icons by string key; this is the only place keys become components.
const icons = {
  'arrow-right': ArrowRight,
  alert: CircleAlert,
} satisfies Record<IconName, LucideIcon>

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Component = icons[name]
  return <Component accessibilityElementsHidden importantForAccessibility="no" {...props} />
}
