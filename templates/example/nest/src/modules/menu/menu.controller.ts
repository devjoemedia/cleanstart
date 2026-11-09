/**
 * HTTP layer for the menu: reads the request, calls the service, returns JSON.
 * @author {{author}}
 */
import { Controller, Get, Param, Query } from '@nestjs/common'
import { MenuQueryDto } from '#/modules/menu/dto/menu-query.dto{{ext}}'
import { MenuService } from '#/modules/menu/menu.service{{ext}}'
import type { MenuItem } from '#/types{{#esm}}/index.js{{/esm}}'

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  findAll(@Query() query: MenuQueryDto): Promise<Array<MenuItem>> {
    return this.menuService.findAll(query.category)
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<MenuItem> {
    return this.menuService.findOne(slug)
  }
}
