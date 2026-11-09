/**
 * Business logic for the menu, reading through the data seam.
 * @author {{author}}
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { getMenu, getMenuItemBySlug } from '#/data/menu{{ext}}'
import type { MenuItem } from '#/types{{#esm}}/index.js{{/esm}}'

@Injectable()
export class MenuService {
  // Returning promises now means a database call slots in later without touching the controller.
  findAll(category?: string): Promise<Array<MenuItem>> {
    return Promise.resolve(getMenu(category))
  }

  findOne(slug: string): Promise<MenuItem> {
    const item = getMenuItemBySlug(slug)
    return item ? Promise.resolve(item) : Promise.reject(new NotFoundException(`No menu item called "${slug}"`))
  }
}
