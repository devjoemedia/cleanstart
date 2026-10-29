import Ionicons from '@expo/vector-icons/Ionicons'
import type { ComponentProps } from 'react'
import type { IconName } from '#/types'

type IoniconProps = ComponentProps<typeof Ionicons>

// Content refers to icons by string key; this is the only place keys become glyphs.
const icons = {
  'arrow-right': 'arrow-forward',
  alert: 'alert-circle-outline',
} satisfies Record<IconName, IoniconProps['name']>

export function Icon({ name, ...props }: { name: IconName } & Omit<IoniconProps, 'name'>) {
  return <Ionicons name={icons[name]} accessibilityElementsHidden importantForAccessibility="no" {...props} />
}
