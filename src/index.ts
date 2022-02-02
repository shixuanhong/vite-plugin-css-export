import type { Plugin } from 'vite'
import { dataToEsm } from '@rollup/pluginutils'
import { parse } from 'postcss'
import { drillDown } from './utils'
import type { Program, BaseNode, Identifier, VariableDeclarator } from 'estree'
import escodegen from 'escodegen'
import acornWalk from 'acorn-walk'
export interface CSSModuleOption {
  /**
   * @default false
   * @type {boolean}
   * @memberof CSSModuleOption
   */
  isGlobalCSSModule?: boolean
  /**
   *
   * @default false
   * @type {boolean}
   * @memberof CSSModuleOption
   */
  enableExportMerge?: boolean
}
export interface ViteCSSExportPluginOptions {
  propertyFilter?: (key: string, value: any) => boolean
  propertyTransform?: (key: string) => string
  additionalData?: SharedCSSData
  cssModule?: CSSModuleOption
}

export type SharedCSSData = {
  [key: string]: SharedCSSData | string
}

type ParseResult = {
  sharedData: SharedCSSData
  otherCode: string
}

const exportRE = /(\?|&)export(?:&|$)/
const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`
const cssLangRE = new RegExp(cssLangs)
const cssModuleRE = new RegExp(`\\.module${cssLangs}`)

export const isCSSRequest = (request: string): boolean =>
  cssLangRE.test(request)

function isProgram(obj: acorn.Node | Program): obj is Program {
  return (<Program>obj).body !== undefined
}

function isAcornNode(obj: acorn.Node | Program): obj is acorn.Node {
  return (<acorn.Node>obj).type !== undefined
}

function parseCode(cssCode: string): ParseResult {
  const sharedData: SharedCSSData = {}
  let otherCode = ''
  const matchedList = [':export', ':share']
  const macthingRE = new RegExp(
    `(^(${matchedList.join('|')})$|^(${matchedList.join('|')})\\s)`
  )
  parse(cssCode).walkRules((ruleNode) => {
    const selector = ruleNode.selector
    if (macthingRE.test(selector)) {
      const levels = selector.split(' ').slice(1)
      const target = drillDown(sharedData, levels)
      ruleNode.walkDecls((declNode) => {
        target[declNode.prop] = declNode.value
      })
    } else {
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
  cssModuleOption: CSSModuleOption,
  parseResultCache: Map<string, ParseResult>
): void {
  if (cssPostPlugin.transform) {
    const { isGlobalCSSModule = false, enableExportMerge = false } =
      cssModuleOption
    const _transform = cssPostPlugin.transform
    cssPostPlugin.transform = async function (this: any, ...args: any[]) {
      const id = args[1]
      const result = (await _transform.apply(this, args as any)) as string
      const ast = this.parse(result) as acorn.Node | Program
      if (isCSSRequest(id) && exportRE?.test(id)) {
        const parseResult = parseResultCache.get(id)
        let sharedAst = this.parse(
          dataToEsm(parseResult?.sharedData, {
            namedExports: true,
            preferConst: true
          })
        )
        if (cssModuleRE.test(id) || isGlobalCSSModule) {
          if (enableExportMerge) {
            return result.replace(
              'export default {',
              'export const sharedData = ' +
                JSON.stringify(parseResult?.sharedData) +
                ';\n' +
                'export default { sharedData,'
            )
          } else {
            const filteredNodeList: Array<unknown> = []
            if (isAcornNode(ast)) {
              acornWalk.simple(ast, {
                ExportNamedDeclaration(node) {
                  acornWalk.simple(node, {
                    VariableDeclarator(variableDeclaratorNode: unknown) {
                      if (
                        (<Identifier>(
                          (<VariableDeclarator>variableDeclaratorNode).id
                        )).name.indexOf('__vite__') === -1
                      ) {
                        filteredNodeList.push(node)
                      }
                    }
                  })
                },
                ExportDefaultDeclaration(node) {
                  filteredNodeList.push(node)
                }
              })
            }
            if (isProgram(ast)) {
              ast.body = ast.body.filter(
                (item) => filteredNodeList.indexOf(item) === -1
              )
              ast.body = ast.body.concat(sharedAst.body)
            }
          }
          return escodegen.generate(ast)
        } else {
          if (isProgram(ast)) {
            const defaultIndex = ast.body.findIndex(
              (item: { type: string }) =>
                item.type === 'ExportDefaultDeclaration'
            )
            defaultIndex > -1 && ast.body.splice(defaultIndex, 1)
            ast.body = ast.body.concat(sharedAst.body)
          }
          return escodegen.generate(ast)
        }
      } else {
        return result
      }
    }
  }
}

export default function ViteCSSExportPlugin(
  options: ViteCSSExportPluginOptions = {}
): Plugin {
  const pluginName = 'vite:css-export'
  const { cssModule = { isGlobalCSSModule: false, enableExportMerge: false } } =
    options
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
        const parseResult = parseCode(code)
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
