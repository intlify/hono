import { Hono } from 'hono'
import {
  defineI18nMiddleware,
  detectLocaleFromAcceptLanguageHeader,
  useTranslation,
} from '../../src/index.ts' // in your project, `import { ... } from '@inlify/hono'`

import en from './locales/en.ts'
import ja from './locales/ja.ts'

const i18n = defineI18nMiddleware({
  locale: detectLocaleFromAcceptLanguageHeader,
  messages: {
    en,
    ja,
  },
})

const app = new Hono()
app.use('*', i18n)
app.get(
  '/',
  (c) => {
    type ResourceSchema = {
      hello: string
    }
    const t = useTranslation<ResourceSchema>(c)
    return c.text(t('hello', { name: 'hono' }))
  },
)

export default app
