type CSSPropertiesExportedData = {
  readonly [key: string]: CSSPropertiesExportedData | string
}

declare module '*.css?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}
declare module '*.scss?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}
declare module '*.less?export' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}