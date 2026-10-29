'use client'

import { Icon } from '#/components/common/icon'
import { MenuItemCard } from '#/components/menu/menu-item-card'
import { menuContent } from '#/content/menu'
import { useMenuQuery } from '#/hooks/queries/menu.query'

export function MenuList() {
  const { data, isPending, isError, error, refetch } = useMenuQuery()

  if (isPending) {
    return (
      <p role="status" className="text-muted-foreground">
        {menuContent.loading}
      </p>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-border p-4">
        <p className="flex items-center gap-2 font-medium">
          <Icon name="alert" className="size-4 text-primary" />
          {menuContent.error}
        </p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {menuContent.retry}
        </button>
      </div>
    )
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground">{menuContent.empty}</p>
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {data.map((item) => (
        <li key={item.id}>
          <MenuItemCard item={item} />
        </li>
      ))}
    </ul>
  )
}
