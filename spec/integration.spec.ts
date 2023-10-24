// @vitest-environment miniflare
import { afterEach, expect, test, vi } from 'vitest'
import { Hono } from 'hono'
import { getQueryLocale } from '@intlify/utils/hono'
import {
  defineI18nMiddleware,
  detectLocaleFromAcceptLanguageHeader,
  useTranslation,
} from '../src/index.ts'

import type { Context } from 'hono'

let app: Hono

afterEach(() => {
  vi.resetAllMocks()
})

test('translation', async () => {
  const i18nMiddleware = defineI18nMiddleware({
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
  app = new Hono()
  app.use('*', i18nMiddleware)
  app.get('/', (c) => {
    const t = useTranslation(c)
    return c.json({ message: t('hello', { name: 'h3' }) })
  })

  const res = await app.request('http://localhost', {
    headers: {
      'accept-language': 'en;q=0.9,ja;q=0.8',
    },
  })
  expect(await res.json()).toEqual({ message: 'hello, h3' })
})

test('custom locale detection', async () => {
  const defaultLocale = 'en'

  // define custom locale detector
  const localeDetector = (ctx: Context): string => {
    try {
      return getQueryLocale(ctx).toString()
    } catch (_e) {
      return defaultLocale
    }
  }

  const i18nMiddleware = defineI18nMiddleware({
    locale: localeDetector,
    messages: {
      en: {
        hello: 'hello, {name}',
      },
      ja: {
        hello: 'こんにちは, {name}',
      },
    },
  })
  app = new Hono()
  app.use('*', i18nMiddleware)
  app.get('/', (c) => {
    const t = useTranslation(c)
    return c.json({ message: t('hello', { name: 'h3' }) })
  })

  const res = await app.request('/?locale=ja')
  expect(await res.json()).toEqual({ message: 'こんにちは, h3' })
})
