import { Hono } from 'hono'
import {
  defineI18nMiddleware,
  detectLocaleFromAcceptLanguageHeader,
  useTranslation,
} from '../../src/index.ts' // `@inlify/hono`

const i18n = defineI18nMiddleware({
  locale: detectLocaleFromAcceptLanguageHeader,
  messages: {
    en: {
      hello: 'hello, {name}',
    },
    ja: {
      hello: 'こんにちは, {name}',
    },
  },
})

const app = new Hono()
app.use('*', i18n)
app.get('/', (c) => {
  const t = useTranslation(c)
  return c.text(t('hello', { name: 'hono' }) + `\n`)
})

export default app
