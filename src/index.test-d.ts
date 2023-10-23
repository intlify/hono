import { expectTypeOf, test } from 'vitest'
import { defineI18nMiddleware } from './index.ts'
import { MiddlewareHandler } from 'hono'

test('defineI18nMiddleware', () => {
  const en = {
    hello: 'workd',
  }
  type ResourceSchema = typeof en
  const middleware = defineI18nMiddleware({
    messages: {
      en: { hello: 'world' },
      ja: { hello: '世界' },
    },
  })

  expectTypeOf<MiddlewareHandler>(middleware).toMatchTypeOf<MiddlewareHandler>()
})
