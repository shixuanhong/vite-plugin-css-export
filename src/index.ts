import type { Plugin, ResolvedConfig } from 'vite'
import { dataToEsm } from '@rollup/pluginutils'
import { parse } from 'postcss'
import {
  drillDown,
  clearExportNamedDeclaration,
  isSourceDescription,
  getPluginTransformHandler,
  getCSSVirtualId
} from './utils'
import type {
  CSSModuleOptions,
  ViteCSSExportPluginOptions,
  SharedCSSData,
  ParsedResult
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
 * @return {ParsedResult}
 */
function parseCode(
  this: TransformPluginContext,
  cssCode: string,
  propertyNameTransformer?: (key: string) => string
): ParsedResult {
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
  } as ParsedResult
}

function vitePostCodeHandler(
  this: any,
  id: string,
  code: string,
  cssModuleOptions: CSSModuleOptions,
  parsedResultCache: Map<string, ParsedResult>
): string {
  const {
    isGlobalCSSModule = false,
    enableExportMerge = false,
    sharedDataExportName = 'sharedData'
  } = cssModuleOptions
  if (!parsedResultCache.has(id)) {
    return ''
  }
  const parsedResult = parsedResultCache.get(id)
  const sharedDataStr = dataToEsm(parsedResult.sharedData, {
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
              parsedResult.sharedData
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
  parsedResultCache: Map<string, ParsedResult>,
  codeCacheMap: Map<string, string>
): void {
  if (cssPostPlugin.transform) {
    const _transform = getPluginTransformHandler(cssPostPlugin.transform)
    cssPostPlugin.transform = async function (...args) {
      const [cssCode, id, ...restArgs] = args
      if (isCSSRequest(id) && isTransform(id)) {
        const { isGlobalCSSModule = false } = cssModuleOptions
        // result of vite:post
        // this result will be modified if the conditions of vite:css-export are met.
        let result: TransformResult = ''
        if (cssModuleRE.test(id) || isGlobalCSSModule) {
          result = await _transform.apply(this, ['', id, ...restArgs])
        }
        let jsCode
        if (isSourceDescription(result)) {
          jsCode = vitePostCodeHandler.call(
            this,
            id,
            result.code,
            cssModuleOptions,
            parsedResultCache
          )
        } else {
          jsCode = vitePostCodeHandler.call(
            this,
            id,
            result as string,
            cssModuleOptions,
            parsedResultCache
          )
        }
        const output = []
        if (!inlineRE.test(id)) {
          const cssVirtualId = getCSSVirtualId(id)
          codeCacheMap.set(cssVirtualId, cssCode)
          output.push(`import "${cssVirtualId}"`)
        }
        output.push(jsCode)

        return {
          code: output.join('\n'),
          map: { mappings: '' },
          moduleSideEffects: true
        }
      } else {
        return await _transform.apply(this, args)
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

  const parsedResultCache = new Map<string, ParsedResult>()
  const codeCacheMap = new Map<string, string>()
  let config
  return {
    name: pluginName,
    configResolved(resolvedConfig) {
      config = resolvedConfig
      const cssPostPlugin = config.plugins.find(
        (item) => item.name === 'vite:css-post'
      )
      cssPostPlugin &&
        hijackCSSPostPlugin(
          cssPostPlugin,
          config,
          cssModule,
          parsedResultCache,
          codeCacheMap
        )
    },
    buildStart() {
      codeCacheMap.clear()
      parsedResultCache.clear()
    },
    resolveId(id) {
      if (codeCacheMap.has(id)) {
        return id
      }
    },
    load(id, options) {
      if (codeCacheMap.has(id)) {
        return codeCacheMap.get(id) ?? ''
      }
    },
    async transform(code, id, _options) {
      if (isCSSRequest(id) && isTransform(id)) {
        const parsedResult = parseCode.call(this, code, propertyNameTransformer)
        // append additionalData
        Object.assign(parsedResult.sharedData, additionalData)
        // cache the current parsedResult for use in vite:post
        parsedResultCache.set(id, parsedResult)
        return {
          code: parsedResult.otherCode,
          map: { mappings: '' }
        }
      }
      return null
    }
  } as Plugin
}
