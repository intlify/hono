// in your project, `import { ... } from '@inlify/hono'`
import { defineI18nMiddleware } from '../../src/index.ts'
import { Hono } from 'hono'

// define resource schema
type ResourceSchema = {
  hello: string
}

// you can specify resource schema and locales to type parameter.
// - first type parameter: resource schema
// - second type parameter: locales
const i18n = defineI18nMiddleware<[ResourceSchema], 'en' | 'ja'>({
  messages: {
    en: { hello: 'Hello, {name}' },
    // you can see the type error, when you will comment out the below `ja` resource
    ja: { hello: 'こんにちは、{name}' },
  },
  // something options
  // ...
})

const app = new Hono()
app.use('*', i18n)
// someting your implementation code ...
// ...

export default app
