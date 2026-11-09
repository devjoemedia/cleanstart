import { createApp } from '#/app{{ext}}'
import { PORT } from '#/constants/env{{ext}}'

createApp().listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
