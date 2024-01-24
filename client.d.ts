interface CSSPropertiesExportedData {
  readonly [key: string]: any
}

// css module
declare module '*.module.css?export' {}

declare module '*.module.scss?export' {}

declare module '*.module.sass?export' {}

declare module '*.module.less?export' {}

declare module '*.module.styl?export' {}

declare module '*.module.stylus?export' {}

// css pre-processor
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

// inline
declare module '*.css?export&inline' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.scss?export&inline' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.sass?export&inline' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.less?export&inline' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.styl?export&inline' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}

declare module '*.stylus?export&inline' {
  const cssExportVariables: CSSPropertiesExportedData
  export default cssExportVariables
}
