import { Hono } from 'hono'
import {
  defineI18nMiddleware,
  detectLocaleFromAcceptLanguageHeader,
  useTranslation,
} from '../../src/index.ts' // in your project, `import { ... } from '@inlify/hono'`

import en from './locales/en.ts'
import ja from './locales/ja.ts'

// 'en' resource is master schema
type ResourceSchema = typeof en

// you can put the type extending with `declare module` as global resource schema
declare module '../../src/index.ts' { // please use `declare module '@intlifly/hono'`, if you want to use global resource schema in your project.
  export interface DefineLocaleMessage extends ResourceSchema {}
}

const i18n = defineI18nMiddleware({
  locale: detectLocaleFromAcceptLanguageHeader,
  messages: {
    en,
    ja,
  },
})

const app = new Hono()
app.use('*', i18n)
app.get('/', (c) => {
  const t = useTranslation(c)
  return c.text(t('hello', { name: 'hono' }))
})

export default app
