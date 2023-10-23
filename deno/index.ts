import type { CoreOptions } from '@intlify/core'
import type { Context, MiddlewareHandler, Next } from 'hono'

export function defineI18nMiddleware(options: CoreOptions = {}): MiddlewareHandler {
  // TODO:

  return async (ctx: Context, next: Next) => {
    // TODO:
    await next()
  }
}
