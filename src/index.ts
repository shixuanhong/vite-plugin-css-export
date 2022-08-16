import type { Plugin, ResolvedConfig } from 'vite'
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
import type { TransformPluginContext, TransformResult, SourceDescription } from 'rollup'
import escodegen from 'escodegen'

export {
  CSSModuleOptions, ViteCSSExportPluginOptions, SharedCSSData
}

export * from './transformer'

const exportRE = /(\?|&)export(?:&|$)/
const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`
const cssLangRE = new RegExp(cssLangs)
const cssModuleRE = new RegExp(`\\.module${cssLangs}`)

const matchedList = [':export', ':share']
const macthingRE = new RegExp(
  `(^(${matchedList.join('|')})$|^(${matchedList.join('|')})\\s)`
)
const errorCharacterArr = ['/', '~', '>', '<', '[', ']', '(', ')', '.', '#', '@', ':', '*']
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

const isCSSRequest = (request: string): boolean =>
  cssLangRE.test(request)

/**
 * parse css code after vite:css
 *
 * @param {TransformPluginContext} this
 * @param {string} cssCode
 * @return {ParseResult}
 */
function parseCode(this: TransformPluginContext, cssCode: string, propertyNameTransformer?: (key: string) => string): ParseResult {
  const sharedData: SharedCSSData = {}
  let otherCode = ''

  parse(cssCode).walkRules((ruleNode) => {
    const selector = ruleNode.selector
    if (macthingRE.test(selector)) {
      // error
      let nameErrorValidResult = nameErrorValidRE.exec(selector)
      if (nameErrorValidResult && nameErrorValidResult.length > 0) {
        this.error(
          `the property name cannot contain the characters: ${errorCharacterArr.map(c => `"${c}"`).join(', ')}\n`,
          ruleNode.positionInside(nameErrorValidResult.index)
        )
      } else {
        // warning 
        let nameWarnValidResult = nameWarnValidRE.exec(selector)
        if (nameWarnValidResult && nameWarnValidResult.length > 0) {
          this.warn(
            `the property name should not contain the characters: ${warnCharacterArr.map(c => `"${c}"`).join(', ')}\n`,
            ruleNode.positionInside(nameWarnValidResult.index)
          )
        }
        // assign values to sharedData
        const levelNames = selector.split(' ').slice(1).map(levelName => propertyNameTransformer ? propertyNameTransformer(levelName) : levelName)
        const target = drillDown(sharedData, levelNames)
        ruleNode.walkDecls((declNode) => {
          let propertyName = propertyNameTransformer ? propertyNameTransformer(declNode.prop) : declNode.prop
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

function vitePostCodeHandler(this: any, id: string, code: string, cssModuleOptions: CSSModuleOptions, parseResultCache: Map<string, ParseResult>): string {
  const {
    isGlobalCSSModule = false,
    enableExportMerge = false,
    sharedDataExportName = 'sharedData'
  } = cssModuleOptions
  const ast = this.parse(code) as acorn.Node | Program
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
      return code.replace(
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
}

function hijackCSSPostPlugin(
  cssPostPlugin: Plugin,
  config: ResolvedConfig,
  cssModuleOptions: CSSModuleOptions,
  parseResultCache: Map<string, ParseResult>
): void {
  if (cssPostPlugin.transform) {

    const _transform = cssPostPlugin.transform
    cssPostPlugin.transform = async function (this: any, ...args: any[]) {
      const id = args[1]
      // result of vite:post
      const result = (await _transform.apply(this, args as any)) as TransformResult
      // this result will be modified if the conditions of vite:css-export are met.
      if (isCSSRequest(id) && exportRE?.test(id)) {
        if (config.command === "serve") {
          return vitePostCodeHandler.call(this, id, (result as string), cssModuleOptions, parseResultCache)
        }
        else {
          (result as SourceDescription).code = vitePostCodeHandler.call(this, id, (result as SourceDescription).code, cssModuleOptions, parseResultCache)
          return result
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
  const { cssModule = defaultCSSModuleOptions, additionalData = {}, propertyNameTransformer } = options
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
        hijackCSSPostPlugin(cssPostPlugin, config, cssModule, parseResultCache)
    },
    buildStart() {
      parseResultCache.clear()
    },
    async transform(code, id, options) {
      if (isCSSRequest(id) && exportRE.test(id)) {
        const parseResult = parseCode.call(this as TransformPluginContext, code, propertyNameTransformer)
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
