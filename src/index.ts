import type { Plugin } from 'vite'
import { dataToEsm } from '@rollup/pluginutils'
import { parse } from 'postcss'
import { drillDown } from './utils'

export interface ViteCSSExportPluginOption {
  propertyFilter?: (key: string, value: any) => boolean,
  propertyTransform?: (key: string) => string,
  additionalData?: CSSExportVariables
}

export type CSSExportVariables = {
  [index: string]: CSSExportVariables | string
}

const exportRE = /(\?|&)export(?:&|$)/
const cssLangRE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\?)/
export const isCSSRequest = (request: string): boolean => cssLangRE.test(request)

function parseCode(cssCode: string): CSSExportVariables {
  const result: CSSExportVariables = {}
  parse(cssCode).walkRules(/^:export/, (ruleNode => {
    if (ruleNode.selector === ":export") {
      ruleNode.walkDecls(declNode => {
        result[declNode.prop] = declNode.value
      })
    }
    else {
      const levels = ruleNode.selector.split(" ").slice(1)
      const target = drillDown(result, levels)
      ruleNode.walkDecls(declNode => {
        target[declNode.prop] = declNode.value
      })
    }
  }))
  return result
}

function hijackCSSPostPlugin(cssPostPlugin: Plugin): void {
  if (cssPostPlugin.transform) {
    const _transform = cssPostPlugin.transform
    cssPostPlugin.transform = async function (this: any, ...args: any[]) {
      const id = args[1]
      if (isCSSRequest(id) && exportRE?.test(id)) {
        return null
      }
      else {
        const result = await (_transform).apply(this, args as any)
        return result
      }
    }
  }
}

export default function ViteCSSExportPlugin(opt?: ViteCSSExportPluginOption): Plugin {
  let config
  return {
    name: 'vite:css-export',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      const cssPostPlugin = (<Array<any>>config.plugins).find(item => item.name === "vite:css-post")
      cssPostPlugin && hijackCSSPostPlugin(cssPostPlugin)
    },
    async transform(code, id, options) {
      if (isCSSRequest(id) && exportRE.test(id)) {
        const parsed = parseCode(code)
        return {
          code: dataToEsm(parsed, {
            namedExports: true,
            preferConst: true
          }),
          map: { mappings: '' }
        }

      }
      return null
    }
  } as Plugin
}