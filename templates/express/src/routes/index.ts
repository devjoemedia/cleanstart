import { Router } from 'express'
{{#example}}
import { menuRouter } from '#/modules/menu/menu.routes{{ext}}'
{{/example}}

// Every domain router is mounted here, so the whole URL map reads in one place.
export const router: Router = Router()
{{#example}}

router.use('/menu', menuRouter)
{{/example}}
