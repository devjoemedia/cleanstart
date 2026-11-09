/**
 * HTTP layer for the menu: reads the request, calls the service, sends JSON.
 * @author {{author}}
 */
import type { RequestHandler } from 'express'
import { parse } from '#/lib/validate{{ext}}'
import { menuQuerySchema } from '#/modules/menu/menu.schema{{ext}}'
import { menuService } from '#/modules/menu/menu.service{{ext}}'

// Express 5 passes a rejected promise to the error handler, so there is no try/catch here.
export const listMenu: RequestHandler = async (req, res) => {
  const { category } = parse(menuQuerySchema, req.query)
  res.json(await menuService.list(category))
}

export const getMenuItem: RequestHandler<{ slug: string }> = async (req, res) => {
  res.json(await menuService.getBySlug(req.params.slug))
}
