interface CSSPropertiesExportedData {
  readonly [key: string]: Record<string, any> | string
}

declare module '*.css?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.scss?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.sass?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.less?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.styl?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.stylus?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

/**
 * If `shouldTransform` is used, you must handle type checking for special cases like this yourself.
 */
declare module '*.scss?export&shouldTransformString' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}
