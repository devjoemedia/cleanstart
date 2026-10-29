import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from '#/components/common/icon'
import { MenuItemCard } from '#/components/menu/menu-item-card'
import { radius, spacing } from '#/constants/tokens'
import { menuContent } from '#/content/menu'
import { useMenuQuery } from '#/hooks/queries/menu.query'
import { useColors } from '#/hooks/use-colors'

export function MenuList() {
  const colors = useColors()
  const { data, isPending, isError, error, refetch, isRefetching } = useMenuQuery()

  if (isPending) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]} accessibilityRole="progressbar">
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.mutedForeground }}>{menuContent.loading}</Text>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]} accessibilityRole="alert">
        <View style={styles.row}>
          <Icon name="alert" size={18} color={colors.primary} />
          <Text style={[styles.heading, { color: colors.foreground }]}>{menuContent.error}</Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>{error.message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => refetch()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonLabel, { color: colors.primaryForeground }]}>{menuContent.retry}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MenuItemCard item={item} />}
      onRefresh={() => refetch()}
      refreshing={isRefetching}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={[styles.title, { color: colors.foreground }]}>{menuContent.title}</Text>
          <Text style={{ color: colors.mutedForeground }}>{menuContent.intro}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={{ color: colors.mutedForeground }}>{menuContent.empty}</Text>}
    />
  )
}

const styles = StyleSheet.create({
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heading: { fontSize: 16, fontWeight: '500' },
  button: { borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  buttonLabel: { fontSize: 14, fontWeight: '500' },
  list: { gap: spacing.lg, padding: spacing.xl },
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '600' },
})
