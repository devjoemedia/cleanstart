import { Module } from '@nestjs/common'
import { MenuController } from '#/modules/menu/menu.controller{{ext}}'
import { MenuService } from '#/modules/menu/menu.service{{ext}}'

@Module({
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
