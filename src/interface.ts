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
   * This option allows you to additionally specify which style files should be transformed, not just `?export` or `?share`.
   *
   * ``` typescript
   *  shouldTransform(id) {
   *    const include = path.resolve(process.cwd(), 'example/assets/style/share-to-js')
   *    return path.resolve(id).indexOf(include) > -1
   *  }
   * ```
   * 
   * @memberof ViteCSSExportPluginOptions
   */
  shouldTransform?: (id: string) => boolean
  /**
   * The option allows you to define a method for transforming CSS property names, but doesn`t transform additionalData.
   *
   * @memberof ViteCSSExportPluginOptions
   */
  propertyNameTransformer?: (key: string) => string
  /**
   * The option allows you to append data to all processed results, we can share some common variables here.
   *
   * @type {SharedCSSData}
   * @memberof ViteCSSExportPluginOptions
   */
  additionalData?: SharedCSSData
  /**
   * Options related to css module.
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
   * Data shared with JavaScript.
   *
   * @type {SharedCSSData}
   */
  sharedData: SharedCSSData
  /**
   * Unprocessed css code.
   *
   * @type {string}
   */
  otherCode: string
}
