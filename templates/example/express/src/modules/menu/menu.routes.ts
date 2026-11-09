import { Router } from 'express'
import { getMenuItem, listMenu } from '#/modules/menu/menu.controller{{ext}}'

export const menuRouter: Router = Router()

menuRouter.get('/', listMenu)
menuRouter.get('/:slug', getMenuItem)
