import type { Plugin, ResolvedConfig } from 'vite'
import { dataToEsm } from '@rollup/pluginutils'
import { parse } from 'postcss'
import {
  drillDown,
  clearExportNamedDeclaration,
  isSourceDescription,
  getPluginTransformHandler
} from './utils'
import type {
  CSSModuleOptions,
  ViteCSSExportPluginOptions,
  SharedCSSData,
  ParseResult
} from './interface'
import type { Program } from 'estree'
import type { TransformPluginContext, TransformResult } from 'rollup'
import escodegen from 'escodegen'

export { CSSModuleOptions, ViteCSSExportPluginOptions, SharedCSSData }

export * from './transformer'

let shouldTransform: ViteCSSExportPluginOptions['shouldTransform']
const exportRE = /(?:\?|&)export\b/
const inlineRE = /(?:\?|&)inline\b/
const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`
const cssLangRE = new RegExp(cssLangs)
const cssModuleRE = new RegExp(`\\.module${cssLangs}`)

const matchedList = [':export', ':share']
const macthingRE = new RegExp(
  `(^(${matchedList.join('|')})$|^(${matchedList.join('|')})\\s)`
)
const errorCharacterArr = [
  '/',
  '~',
  '>',
  '<',
  '[',
  ']',
  '(',
  ')',
  '.',
  '#',
  '@',
  ':',
  '*'
]
const warnCharacterArr = ['\\', '-']

const errorCharacters = '[/~><\\[\\]\\(\\)\\.#@\\:\\*]'
const warnCharacters = '[\\-]'
const nameErrorValidRE = new RegExp(
  `(?!${macthingRE.source})${errorCharacters}`
)
const nameWarnValidRE = new RegExp(`(?!${macthingRE.source})${warnCharacters}`)

const defaultCSSModuleOptions: CSSModuleOptions = {
  isGlobalCSSModule: false,
  enableExportMerge: false,
  sharedDataExportName: 'sharedData'
}

const isCSSRequest = (request: string): boolean => cssLangRE.test(request)

const isTransform = (id: string): boolean =>
  shouldTransform ? shouldTransform(id) || exportRE.test(id) : exportRE.test(id)

/**
 * parse css code after vite:css
 *
 * @param {TransformPluginContext} this
 * @param {string} cssCode
 * @return {ParseResult}
 */
function parseCode(
  this: TransformPluginContext,
  cssCode: string,
  propertyNameTransformer?: (key: string) => string
): ParseResult {
  const sharedData: SharedCSSData = {}
  let otherCode = ''

  parse(cssCode).walkRules((ruleNode) => {
    const selector = ruleNode.selector
    if (macthingRE.test(selector)) {
      // error
      let nameErrorValidResult = nameErrorValidRE.exec(selector)
      if (nameErrorValidResult && nameErrorValidResult.length > 0) {
        this.error(
          `The property name cannot contain the characters: ${errorCharacterArr
            .map((c) => `"${c}"`)
            .join(', ')}.\n`,
          ruleNode.positionInside(nameErrorValidResult.index)
        )
      } else {
        // warning
        let nameWarnValidResult = nameWarnValidRE.exec(selector)
        if (
          !propertyNameTransformer &&
          nameWarnValidResult &&
          nameWarnValidResult.length > 0
        ) {
          this.warn(
            `The property name should not contain the characters: ${warnCharacterArr
              .map((c) => `"${c}"`)
              .join(
                ', '
              )}. Use option propertyNameTransformer to suppress this warning.`,
            ruleNode.positionInside(nameWarnValidResult.index)
          )
        }
        // assign values to sharedData
        const levelNames = selector
          .split(' ')
          .slice(1)
          .map((levelName) =>
            propertyNameTransformer
              ? propertyNameTransformer(levelName)
              : levelName
          )
        const target = drillDown(sharedData, levelNames)
        ruleNode.walkDecls((declNode) => {
          let propertyName = propertyNameTransformer
            ? propertyNameTransformer(declNode.prop)
            : declNode.prop
          target[propertyName] = declNode.value
        })
      }
    } else {
      // unprocessed css code will be injected into the index.html by vite:css-post
      otherCode += `\n${ruleNode.toString()}`
    }
  })
  return {
    sharedData,
    otherCode
  } as ParseResult
}

function vitePostCodeHandler(
  this: any,
  id: string,
  code: string,
  cssModuleOptions: CSSModuleOptions,
  parseResultCache: Map<string, ParseResult>
): string {
  const {
    isGlobalCSSModule = false,
    enableExportMerge = false,
    sharedDataExportName = 'sharedData'
  } = cssModuleOptions
  const parseResult = parseResultCache.get(id)
  const sharedDataStr = dataToEsm(parseResult.sharedData, {
    namedExports: true,
    preferConst: true
  })
  let sharedAst = this.parse(sharedDataStr)
  if (typeof code === 'string' && code !== '') {
    const ast = this.parse(code) as Program
    // compatible with css module
    if (cssModuleRE.test(id) || isGlobalCSSModule) {
      if (enableExportMerge && !inlineRE.test(id)) {
        return code.replace(
          /export default\s*\{/,
          [
            `export const ${sharedDataExportName} = ${JSON.stringify(
              parseResult.sharedData
            )}`,
            `export default { ${sharedDataExportName},`
          ].join('\n')
        )
      } else {
        // override
        // clear all named exports, exclude /^__vite__/
        clearExportNamedDeclaration(ast, /^__vite__/)
      }
    }
    // remove the original default export
    const defaultIndex = ast.body.findIndex(
      (item: { type: string }) => item.type === 'ExportDefaultDeclaration'
    )
    defaultIndex > -1 && ast.body.splice(defaultIndex, 1)
    ast.body = ast.body.concat(sharedAst.body)

    return escodegen.generate(ast)
  } else {
    return sharedDataStr
  }
}

function hijackCSSPostPlugin(
  cssPostPlugin: Plugin,
  config: ResolvedConfig,
  cssModuleOptions: CSSModuleOptions,
  parseResultCache: Map<string, ParseResult>
): void {
  if (cssPostPlugin.transform) {
    const _transform = getPluginTransformHandler(cssPostPlugin.transform)
    cssPostPlugin.transform = async function (this, ...args) {
      const id = args[1]
      // result of vite:post
      const result = (await _transform.apply(this, args)) as TransformResult
      // this result will be modified if the conditions of vite:css-export are met.
      if (isCSSRequest(id) && isTransform(id)) {
        let code
        if (isSourceDescription(result)) {
          code = vitePostCodeHandler.call(
            this,
            id,
            result.code,
            cssModuleOptions,
            parseResultCache
          )
        } else {
          code = vitePostCodeHandler.call(
            this,
            id,
            result as string,
            cssModuleOptions,
            parseResultCache
          )
        }
        return {
          code,
          map: { mappings: '' },
          moduleSideEffects: false
        }
      } else {
        return result
      }
    }
  }
}

/**
 * the plugin is applied after vite:css and before vite:post
 * @param {ViteCSSExportPluginOptions} [options={}]
 * @return {Plugin}
 */
export default function ViteCSSExportPlugin(
  options: ViteCSSExportPluginOptions = {}
): Plugin {
  const pluginName = 'vite:css-export'
  const {
    cssModule = defaultCSSModuleOptions,
    additionalData = {},
    propertyNameTransformer,
    shouldTransform: _shouldTransform
  } = options

  shouldTransform = _shouldTransform

  const parseResultCache = new Map<string, ParseResult>()
  let config
  return {
    name: pluginName,
    configResolved(resolvedConfig) {
      config = resolvedConfig
      const cssPostPlugin = config.plugins.find(
        (item) => item.name === 'vite:css-post'
      )
      cssPostPlugin &&
        hijackCSSPostPlugin(cssPostPlugin, config, cssModule, parseResultCache)
    },
    buildStart() {
      parseResultCache.clear()
    },
    async transform(code, id, _options) {
      if (isCSSRequest(id) && isTransform(id)) {
        const parseResult = parseCode.call(this, code, propertyNameTransformer)
        // append additionalData
        Object.assign(parseResult.sharedData, additionalData)
        // cache the current parseResult for use in vite:post
        parseResultCache.set(id, parseResult)
        return {
          code: parseResult.otherCode,
          map: { mappings: '' }
        }
      }
      return null
    }
  } as Plugin
}
