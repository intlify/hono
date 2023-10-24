// @vitest-environment miniflare
import { describe, expect, test } from 'vitest'
import { createCoreContext } from '@intlify/core'

import type { Context } from 'hono'
import type { LocaleDetector } from '@intlify/core'

import {
  defineI18nMiddleware,
  detectLocaleFromAcceptLanguageHeader,
  useTranslation,
} from './index.ts'

test('detectLocaleFromAcceptLanguageHeader', () => {
  const mockContext = {
    req: {
      header: (_name) => _name === 'accept-language' ? 'en-US,en;q=0.9,ja;q=0.8' : '',
    },
  } as Context

  expect(detectLocaleFromAcceptLanguageHeader(mockContext)).toBe('en-US')
})

test('defineI18nMiddleware', () => {
  const middleware = defineI18nMiddleware({
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
  expect(typeof middleware).toBe('function')
})

describe('useTranslation', () => {
  test('basic', () => {
    /**
     * setup `defineI18nMiddleware` emulates
     */
    const context = createCoreContext({
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
    const mockContext = {
      req: {
        header: (_name) => _name === 'accept-language' ? 'ja;q=0.9,en;q=0.8' : '',
      },
      get: (_key: string) => context,
    } as Context
    const locale = context.locale as unknown
    const bindLocaleDetector = (locale as LocaleDetector).bind(null, mockContext)
    // @ts-ignore ignore type error because this is test
    context.locale = bindLocaleDetector

    // test `useTranslation`
    const t = useTranslation(mockContext)
    expect(t('hello', { name: 'hono' })).toEqual('こんにちは, hono')
  })

  test('not initilize context', () => {
    const mockContext = {
      req: {
        header: (_name) => 'ja,en',
      },
      get: (_key: string) => undefined,
    } as Context

    expect(() => useTranslation(mockContext)).toThrowError()
  })
})
