import { StyleSheet, Text, View } from 'react-native'
import { radius, spacing } from '#/constants/tokens'
import { menuContent } from '#/content/menu'
import { useColors } from '#/hooks/use-colors'
import { formatPrice } from '#/lib/format'
import type { MenuItem } from '#/types'

export function MenuItemCard({ item }: { item: MenuItem }) {
  const colors = useColors()

  return (
    <View style={[styles.card, { borderColor: colors.border }, !item.available && styles.unavailable]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.price, { color: colors.foreground }]}>
          {item.available ? formatPrice(item.price) : menuContent.unavailable}
        </Text>
      </View>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>{item.description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: spacing.lg },
  unavailable: { opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.lg },
  name: { flexShrink: 1, fontSize: 16, fontWeight: '500' },
  price: { fontSize: 14, fontVariant: ['tabular-nums'] },
  description: { marginTop: spacing.sm, fontSize: 14 },
})
