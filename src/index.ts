import type { CoreOptions } from '@intlify/core'
import type { Context, MiddlewareHandler, Next } from 'hono'

export function defineI18nMiddleware(_options: CoreOptions = {}): MiddlewareHandler {
  // TODO:

  return async (_ctx: Context, next: Next) => {
    // TODO:
    await next()
  }
}
