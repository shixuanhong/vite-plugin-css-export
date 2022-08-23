/// <reference types="vite/client" />

interface CSSPropertiesExportedData {
  fontColor: string
  fontSize: string
  button: {
    bgColor: string
    color: string
  }
  menu: {
    menuItem:{
      bgColor: string
      color: string
    }
  }
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}