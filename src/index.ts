// deno-lint-ignore-file no-explicit-any ban-types

import { createCoreContext, NOT_REOSLVED, translate as _translate } from '@intlify/core'
import { getHeaderLocale } from '@intlify/utils/hono'

export * from '@intlify/utils/hono'

import type {
  CoreContext,
  CoreOptions,
  IsEmptyObject,
  Locale,
  LocaleDetector,
  LocaleMessage,
  LocaleParams,
  NamedValue,
  PickupPaths,
  RemovedIndexResources,
  RemoveIndexSignature,
  SchemaParams,
  TranslateOptions,
} from '@intlify/core'
import type { Context, MiddlewareHandler, Next } from 'hono'

declare module 'hono' {
  interface ContextVariableMap {
    i18n: CoreContext
  }
}

type DefaultLocaleMessageSchema<
  Schema = RemoveIndexSignature<
    {
      [K in keyof DefineLocaleMessage]: DefineLocaleMessage[K]
    }
  >,
> = IsEmptyObject<Schema> extends true ? LocaleMessage<string> : Schema

/**
 * The type definition of Locale Message for `@intlify/hono` package
 *
 * @description
 * The typealias is used to strictly define the type of the Locale message.
 *
 * @example
 * ```ts
 * // type.d.ts (`.d.ts` file at your app)
 * import { DefineLocaleMessage } from '@intlify/hono'
 *
 * declare module '@intlify/hono' {
 *   export interface DefineLocaleMessage {
 *     title: string
 *     menu: {
 *       login: string
 *     }
 *   }
 * }
 * ```
 */
// deno-lint-ignore no-empty-interface
export interface DefineLocaleMessage extends LocaleMessage<string> {}

/**
 * define i18n middleware for Hono
 *
 * @description
 * Define the middleware to be specified for Hono [`app.use`]({@link https://hono.dev/guides/middleware})
 *
 * @param {CoreOptions} options - An i18n options like vue-i18n [`createI18n`]({@link https://vue-i18n.intlify.dev/guide/#javascript}), which are passed to `createCoreContext` of `@intlify/core`, see about details [`CoreOptions` of `@intlify/core`](https://github.com/intlify/vue-i18n-next/blob/6a9947dd3e0fe90de7be9c87ea876b8779998de5/packages/core-base/src/context.ts#L196-L216)
 *
 * @returns {MiddlewareHandler} A defined i18n middleware
 *
 * @example
 *
 * ```js
 * import { Hono } from 'hono'
 * import { defineI18nMiddleware } from '@intlify/hono'
 *
 * const i18nMiddleware = defineI18nMiddleware({
 *   messages: {
 *     en: {
 *       hello: 'Hello {name}!',
 *     },
 *     ja: {
 *       hello: 'こんにちは、{name}！',
 *     },
 *   },
 *   // your locale detection logic here
 *   locale: (event) => {
 *     // ...
 *   },
 * })
 *
 * const app = new Hono()
 * app.use('*', i18nMiddleware)
 * ```
 */
export function defineI18nMiddleware<
  Schema = DefaultLocaleMessageSchema,
  Locales = string,
  Message = string,
  Options extends CoreOptions<
    Message,
    SchemaParams<Schema, Message>,
    LocaleParams<Locales>
  > = CoreOptions<
    Message,
    SchemaParams<Schema, Message>,
    LocaleParams<Locales>
  >,
>(options: Options): MiddlewareHandler {
  const i18n = createCoreContext(options as CoreOptions)
  const orgLocale = i18n.locale

  let staticLocaleDetector: LocaleDetector | null = null
  if (typeof orgLocale === 'string') {
    console.warn(
      `defineI18nMiddleware 'locale' option is static ${orgLocale} locale! you should specify dynamic locale detector function.`,
    )
    staticLocaleDetector = () => orgLocale
  }

  const getLocaleDetector = (ctx: Context): LocaleDetector => {
    // deno-fmt-ignore
    return typeof orgLocale === 'function'
      ? orgLocale.bind(null, ctx)
      : staticLocaleDetector != null
        ? staticLocaleDetector.bind(null, ctx)
        : detectLocaleFromAcceptLanguageHeader.bind(null, ctx)
  }

  return async (ctx: Context, next: Next) => {
    i18n.locale = getLocaleDetector(ctx)
    ctx.set('i18n', i18n)

    await next()

    i18n.locale = orgLocale
    ctx.set('i18n', undefined)
  }
}

/**
 * locale detection with `Accept-Language` header
 *
 * @param {Context} context - A Hono context
 *
 * @returns {Locale} A locale string, which will be detected of **first** from `Accept-Language` header
 *
 * @example
 * ```js
 * import { Hono } from 'hono'
 * import { defineI18nMiddleware, detectLocaleWithAcceeptLanguageHeader } from '@intlify/hono'
 *
 * const i18nMiddleware = defineI18nMiddleware({
 *   messages: {
 *     en: {
 *       hello: 'Hello {name}!',
 *     },
 *     ja: {
 *       hello: 'こんにちは、{name}！',
 *     },
 *   },
 *   locale: detectLocaleWithAcceeptLanguageHeader
 * })
 *
 * const app = new Hono()
 * app.use('*', i18nMiddleware)
 * ```
 */
export const detectLocaleFromAcceptLanguageHeader = (
  ctx: Context,
): Locale => getHeaderLocale(ctx).toString()

type ResolveResourceKeys<
  Schema extends Record<string, any> = {},
  DefineLocaleMessageSchema extends Record<string, any> = {},
  DefinedLocaleMessage extends RemovedIndexResources<
    DefineLocaleMessageSchema
  > = RemovedIndexResources<DefineLocaleMessageSchema>,
  SchemaPaths = IsEmptyObject<Schema> extends false
    ? PickupPaths<{ [K in keyof Schema]: Schema[K] }>
    : never,
  DefineMessagesPaths = IsEmptyObject<DefinedLocaleMessage> extends false ? PickupPaths<
      { [K in keyof DefinedLocaleMessage]: DefinedLocaleMessage[K] }
    >
    : never,
> = SchemaPaths | DefineMessagesPaths

/**
 * The translation function, which will be defined by {@link useTranslation}.
 */
export interface TranslationFunction<
  Schema extends Record<string, any> = {},
  DefineLocaleMessageSchema extends Record<string, any> = {},
  ResourceKeys = ResolveResourceKeys<Schema, DefineLocaleMessageSchema>,
> {
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(key: Key | ResourceKeys): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {number} plural A plural choice number
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(key: Key | ResourceKeys, plural: number): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {number} plural A plural choice number
   * @param {TranslateOptions} options A translate options, about details see {@link TranslateOptions}
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(
    key: Key | ResourceKeys,
    plural: number,
    options: TranslateOptions,
  ): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {string} defaultMsg A default message, if the key is not found
   * @returns {string} A translated message, if the key is not found, return the `defaultMsg` argument
   */
  <Key extends string>(key: Key | ResourceKeys, defaultMsg: string): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {string} defaultMsg A default message, if the key is not found
   * @param {TranslateOptions} options A translate options, about details see {@link TranslateOptions}
   * @returns {string} A translated message, if the key is not found, return the `defaultMsg` argument
   */
  <Key extends string>(
    key: Key | ResourceKeys,
    defaultMsg: string,
    options: TranslateOptions,
  ): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {unknown[]} list A list for list interpolation
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(key: Key | ResourceKeys, list: unknown[]): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {unknown[]} list A list for list interpolation
   * @param {number} plural A plural choice number
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(key: Key | ResourceKeys, list: unknown[], plural: number): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {unknown[]} list A list for list interpolation
   * @param {string} defaultMsg A default message, if the key is not found
   * @returns {string} A translated message, if the key is not found, return the `defaultMsg` argument
   */
  <Key extends string>(key: Key | ResourceKeys, list: unknown[], defaultMsg: string): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {unknown[]} list A list for list interpolation
   * @param {TranslateOptions} options A translate options, about details see {@link TranslateOptions}
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(key: Key | ResourceKeys, list: unknown[], options: TranslateOptions): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {NamedValue} named A named value for named interpolation
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(key: Key | ResourceKeys, named: NamedValue): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {NamedValue} named A named value for named interpolation
   * @param {number} plural A plural choice number
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(key: Key | ResourceKeys, named: NamedValue, plural: number): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {NamedValue} named A named value for named interpolation
   * @param {string} defaultMsg A default message, if the key is not found
   * @returns {string} A translated message, if the key is not found, return the `defaultMsg` argument
   */
  <Key extends string>(key: Key | ResourceKeys, named: NamedValue, defaultMsg: string): string
  /**
   * @param {Key | ResourceKeys} key A translation key
   * @param {NamedValue} named A named value for named interpolation
   * @param {TranslateOptions} options A translate options, about details see {@link TranslateOptions}
   * @returns {string} A translated message, if the key is not found, return the key
   */
  <Key extends string>(
    key: Key | ResourceKeys,
    named: NamedValue,
    options: TranslateOptions,
  ): string
}

/**
 * use translation function in event handler
 *
 * @description
 * This function must be initialized with defineI18nMiddleware. See about the {@link defineI18nMiddleware}
 *
 * @param {Context} context - A Hono context
 *
 * @returns {TranslationFunction} Return a translation function, which can be translated with i18n resource messages
 *
 * @example
 * ```js
 * import { Hono } from 'hono'
 * import { defineI18nMiddleware } from '@intlify/hono'
 *
 * const i18nMiddleware = defineI18nMiddleware({
 *   messages: {
 *     en: {
 *       hello: 'Hello {name}!',
 *     },
 *     ja: {
 *       hello: 'こんにちは、{name}！',
 *     },
 *   },
 * })
 *
 * const app = new Hono()
 * app.use('*', i18nMiddleware)
 * // setup other middlewares ...
 *
 * app.get('/', (ctx) => {
 *   const t = useTranslation(ctx)
 *   return ctx.text(t('hello', { name: 'hono' }))
 * })
 * ```
 */
export function useTranslation<
  Schema extends Record<string, any> = {},
  HonoContext extends Context = Context,
>(ctx: HonoContext): TranslationFunction<Schema, DefineLocaleMessage> {
  const i18n = ctx.get('i18n')
  if (i18n == null) {
    throw new Error(
      'middleware not initialized, please setup `app.use` with the middleware obtained with `defineI18nMiddleware`',
    )
  }

  function translate(key: string, ...args: unknown[]): string {
    const result = Reflect.apply(_translate, null, [
      i18n!,
      key,
      ...args,
    ])
    return NOT_REOSLVED === result ? key : result as string
  }

  return translate as TranslationFunction<Schema, DefineLocaleMessage>
}
