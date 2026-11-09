import { NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MenuService } from '#/modules/menu/menu.service{{ext}}'

describe('MenuService', () => {
  let service: MenuService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ providers: [MenuService] }).compile()
    service = moduleRef.get(MenuService)
  })

  it('filters the menu by category', async () => {
    const items = await service.findAll('coffee')
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.category === 'coffee')).toBe(true)
  })

  it('throws NotFoundException for an unknown slug', async () => {
    await expect(service.findOne('does-not-exist')).rejects.toBeInstanceOf(NotFoundException)
  })
})
