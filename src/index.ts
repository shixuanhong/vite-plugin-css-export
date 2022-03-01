import type { Plugin } from 'vite'
import { dataToEsm } from '@rollup/pluginutils'
import { parse } from 'postcss'
import {
  drillDown,
  isProgram,
  isAcornNode,
  clearExportNamedDeclaration
} from './utils'
import type { CSSModuleOptions, ViteCSSExportPluginOptions, SharedCSSData, ParseResult } from './interface'
import type { Program } from 'estree'
import type { TransformPluginContext } from 'rollup'
import escodegen from 'escodegen'

export {
  CSSModuleOptions, ViteCSSExportPluginOptions, SharedCSSData
}

const exportRE = /(\?|&)export(?:&|$)/
const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`
const cssLangRE = new RegExp(cssLangs)
const cssModuleRE = new RegExp(`\\.module${cssLangs}`)

const matchedList = [':export', ':share']
const macthingRE = new RegExp(
  `(^(${matchedList.join('|')})$|^(${matchedList.join('|')})\\s)`
)
const errorCharacters = '[~><\\[\\]\\(\\)\\.#\\:\\*]'
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

export const isCSSRequest = (request: string): boolean =>
  cssLangRE.test(request)

/**
 * parse css code after vite:css
 *
 * @param {TransformPluginContext} this
 * @param {string} cssCode
 * @return {ParseResult}
 */
function parseCode(this: TransformPluginContext, cssCode: string): ParseResult {
  const sharedData: SharedCSSData = {}
  let otherCode = ''

  parse(cssCode).walkRules((ruleNode) => {
    const selector = ruleNode.selector
    if (macthingRE.test(selector)) {
      // error
      let nameErrorValidResult = nameErrorValidRE.exec(selector)
      if (nameErrorValidResult && nameErrorValidResult.length > 0) {
        this.error(
          `property names are not allowed to contain characters in this regular expression: ${errorCharacters}`,
          ruleNode.positionInside(nameErrorValidResult.index)
        )
      } else {
        // warning 
        let nameWarnValidResult = nameWarnValidRE.exec(selector)
        if (nameWarnValidResult && nameWarnValidResult.length > 0) {
          this.warn(
            `property names should not contain the characters in this regular expression: ${warnCharacters}`,
            ruleNode.positionInside(nameWarnValidResult.index)
          )
        }
        // assign values to sharedData
        const levels = selector.split(' ').slice(1)
        const target = drillDown(sharedData, levels)
        ruleNode.walkDecls((declNode) => {
          target[declNode.prop] = declNode.value
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

function hijackCSSPostPlugin(
  cssPostPlugin: Plugin,
  cssModuleOptions: CSSModuleOptions,
  parseResultCache: Map<string, ParseResult>
): void {
  if (cssPostPlugin.transform) {
    const {
      isGlobalCSSModule = false,
      enableExportMerge = false,
      sharedDataExportName = 'sharedData'
    } = cssModuleOptions
    const _transform = cssPostPlugin.transform
    cssPostPlugin.transform = async function (this: any, ...args: any[]) {
      const id = args[1]
      // result of vite:post
      const result = (await _transform.apply(this, args as any)) as string
      // this result will be modified if the conditions of vite:css-export are met.
      if (isCSSRequest(id) && exportRE?.test(id)) {
        const ast = this.parse(result) as acorn.Node | Program
        const parseResult = parseResultCache.get(id)
        let sharedAst = this.parse(
          dataToEsm(parseResult?.sharedData, {
            namedExports: true,
            preferConst: true
          })
        )

        // compatible with css module
        if (cssModuleRE.test(id) || isGlobalCSSModule) {
          if (enableExportMerge) {
            return result.replace(
              /export default\s*\{/,
              [
                `export const ${sharedDataExportName} = ${JSON.stringify(
                  parseResult?.sharedData
                )}`,
                `export default { ${sharedDataExportName},`
              ].join('\n')
            )
          } else {
            // override
            // clear all named exports, exclude /^__vite__/
            clearExportNamedDeclaration(ast, /^__vite__/)
            isProgram(ast) && (ast.body = ast.body.concat(sharedAst.body))
          }
        } else {
          if (isProgram(ast)) {
            // remove the original default export
            const defaultIndex = ast.body.findIndex(
              (item: { type: string }) =>
                item.type === 'ExportDefaultDeclaration'
            )
            defaultIndex > -1 && ast.body.splice(defaultIndex, 1)
            ast.body = ast.body.concat(sharedAst.body)
          }
        }
        return escodegen.generate(ast)
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
  const { cssModule = defaultCSSModuleOptions, additionalData = {} } = options
  const parseResultCache = new Map<string, ParseResult>()
  let config
  return {
    name: pluginName,
    configResolved(resolvedConfig) {
      config = resolvedConfig
      const cssPostPlugin = (<Array<any>>config.plugins).find(
        (item) => item.name === 'vite:css-post'
      )
      cssPostPlugin &&
        hijackCSSPostPlugin(cssPostPlugin, cssModule, parseResultCache)
    },
    buildStart() {
      parseResultCache.clear()
    },
    async transform(code, id, options) {
      if (isCSSRequest(id) && exportRE.test(id)) {
        const parseResult = parseCode.call(this as TransformPluginContext, code)
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
