import { menuContent } from '#/content/menu'
import { cn, formatPrice } from '#/lib/utils'
import type { MenuItem } from '#/types'

export function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <article className={cn('h-full rounded-lg border border-border p-4', !item.available && 'opacity-60')}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-medium">{item.name}</h2>
        <span className="text-sm tabular-nums">
          {item.available ? formatPrice(item.price) : menuContent.unavailable}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
    </article>
  )
}
