export interface CSSModuleOptions {
  /**
   * Whether the CSS Module is used globally, not just in the `.module.[suffix]` file.
   *
   * @default false
   * @type {boolean}
   * @memberof CSSModuleOptions
   */
  isGlobalCSSModule?: boolean
  /**
   * When value is true, `sharedData` will be merged with the result of CSS Module,
   * otherwise only `sharedData` will be exported.
   *
   * `sharedData` is the parsed result of the plugin.
   *
   * @default false
   * @type {boolean}
   * @memberof CSSModuleOptions
   */
  enableExportMerge?: boolean
  /**
   * When `cssModule.enableExportMerge` is true, modify the property name of `sharedData` in the merged result.
   *
   * @default "sharedData"
   * @type {string}
   * @memberof CSSModuleOptions
   */
  sharedDataExportName?: string
}
export interface ViteCSSExportPluginOptions {
  /**
   * TODO
   *
   * @memberof ViteCSSExportPluginOptions
   */
  propertyFilter?: (key: string, value: any) => boolean
  /**
   * TODO
   *
   * @memberof ViteCSSExportPluginOptions
   */
  propertyTransform?: (key: string) => string
  /**
   * the option allows you to append data to all processed results, we can share some common variables here
   *
   * @type {SharedCSSData}
   * @memberof ViteCSSExportPluginOptions
   */
  additionalData?: SharedCSSData
  /**
   * options related to css module
   * 
   * @type {CSSModuleOptions}
   * @memberof ViteCSSExportPluginOptions
   */
  cssModule?: CSSModuleOptions
}

export interface SharedCSSData {
  [key: string]: SharedCSSData | string
}

export interface ParseResult {
  /**
   * data shared with JavaScript
   *
   * @type {SharedCSSData}
   */
  sharedData: SharedCSSData
  /**
   * unprocessed css code
   *
   * @type {string}
   */
  otherCode: string
}
