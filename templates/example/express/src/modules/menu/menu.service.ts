/**
 * Business logic for the menu, reading through the data seam.
 * @author {{author}}
 */
import { getMenu, getMenuItemBySlug } from '#/data/menu{{ext}}'
import { NotFoundError } from '#/lib/errors{{ext}}'
import type { MenuItem } from '#/types{{#esm}}/index.js{{/esm}}'

// Returning promises now means a database call slots in later without touching the controller.
export const menuService = {
  list(category?: string): Promise<Array<MenuItem>> {
    return Promise.resolve(getMenu(category))
  },

  getBySlug(slug: string): Promise<MenuItem> {
    const item = getMenuItemBySlug(slug)
    return item ? Promise.resolve(item) : Promise.reject(new NotFoundError(`No menu item called "${slug}"`))
  },
}
