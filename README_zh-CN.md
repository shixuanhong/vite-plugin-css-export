# vite-plugin-css-export 🥰

[中文](https://github.com/shixuanhong/vite-plugin-css-export/blob/main/README_zh-CN.md) | [English](https://github.com/shixuanhong/vite-plugin-css-export/blob/main/README.md)

**从 CSS 导出变量到 JS 中，并且支持嵌套规则。**

<p align="left">
  <a href="https://npmjs.com/package/vite-plugin-css-export"><img src="https://img.shields.io/npm/v/vite-plugin-css-export" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/vite-plugin-css-export" alt="node compatibility"></a>
  <a href="https://www.npmjs.com/package/vite"><img src="https://img.shields.io/npm/dependency-version/vite-plugin-css-export/peer/vite" alt="vite compatibility"></a>
</p>

这个插件允许你在 CSS 中使用 `:export` 伪类，并且这个伪类下的属性将会被导出到 JavaScript 中。

除此之外，如果在 Vite 中启用了 CSS 预处理器，那我们就可以在 .scss、.sass、.less、.styl 和 .stylus 文件中使用 `:export`。

[如何在 Vite 中使用 CSS 预处理器](https://vitejs.dev/guide/features.html#css-pre-processors)

## 安装 ❤️

```shell
npm install vite-plugin-css-export -D
```

or

```shell
yarn add vite-plugin-css-export -D
```

or

```shell
pnpm add vite-plugin-css-export -D
```

## 使用 💡

### 快速上手

```typescript
// vite.config.ts
import ViteCSSExportPlugin from 'vite-plugin-css-export'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [ViteCSSExportPlugin()]
})
```

```css
/* example.css */
:root {
  --font-color: #333;
}

:export {
  fontColor: var(--font-color);
  fontSize: 14px;
}

:export button {
  bgColor: #462dd3;
  color: #fff;
}

:export menu menuItem {
  bgColor: #1d243a;
  color: #fff;
}
```

```typescript
// 如果使用了 Typescript ，你需要引用这个声明文件
// 里面包含了所需的通配符模块声明，如 *.css?export
// env.d.ts
/// <reference types="vite-plugin-css-export/client" />

// 如果你想要代码提示
interface CSSPropertiesExportedData {
  fontColor: string
  fontSize: string
  button: {
    bgColor: string
    color: string
  }
  menu: {
    menuItem: {
      bgColor: string
      color: string
    }
  }
}
```

在导入时，路径中需加入后缀 `?export`。

```typescript
// main.ts
import cssResult from './assets/style/example.css?export'

console.log(cssResult)

// output
// {
//     fontColor: "var(--font-color)",
//     fontSize: "14px",
//     button: {
//         bgColor: "#462dd3",
//         color: "#fff"
//     },
//     menu: {
//         menuItem: {
//             bgColor: "#1d243a",
//             color: "#fff"
//         }
//     }
// }
```

### CSS 预处理器

如果你启用了 CSS 预处理器，那么你可以使用嵌套规则，便于我们定义一些复杂的结构。

```scss
// .scss
:root {
  --font-color: #333;
}

$menuItemBgColor: #1d243a;

:export {
  fontColor: var(--font-color);
  fontSize: 14px;
  button {
    bgcolor: #462dd3;
    color: #fff;
  }
  menu {
    menuItem {
      bgcolor: $menuItemBgColor;
      color: #fff;
    }
  }
}
```

### CSS Module

与 CSS module 一起使用时，需要进行一些简单的配置，默认情况下，导出的结果中不会包含 CSS module 的相关内容（除了`:export`下的内容）。

```typescript
// vite.config.ts
import ViteCSSExportPlugin from 'vite-plugin-css-export'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    ViteCSSExportPlugin({
      cssModule: {
        isGlobalCSSModule: false,
        enableExportMerge: true, // default false
        sharedDataExportName: 'cssExportedData' // default 'sharedData'
      }
    })
  ]
})
```

```scss
// example.module.scss
:root {
  --font-color: #333;
}

$menuItemBgColor: #1d243a;

.base-button {
  background-color: transparent;
}

// :export 的别名
:share {
  fontcolor: var(--font-color);
  fontsize: 14px;

  button {
    bgcolor: #462dd3;
    color: #fff;
  }

  menu {
    menuItem {
      bgcolor: $menuItemBgColor;
      color: #fff;
    }
  }
}

:export {
  fontColor: var(--font-color);
  fontSize: 14px;
}
```

```typescript
// main.ts
import cssModuleResult from './assets/style/example.module.scss?export'

console.log(cssModuleResult)

// output
// {
//     cssExportedData: {
//         fontColor: "var(--font-color)",
//         fontSize: "14px",
//         button: {
//             bgColor: "#462dd3",
//             color: "#fff"
//         },
//         menu: {
//             menuItem: {
//                 bgColor: "#1d243a",
//                 color: "#fff"
//             }
//         }
//     },
//     fontColor: "var(--font-color)",
//     fontSize: "14px",
//     "base-button": "_base-button_1k9w3_5" // css module
// }

// 当 enableExportMerge 为 false时，将不会包含CSS module的相关内容
// output
// {
//     fontColor: "var(--font-color)",
//     fontSize: "14px",
//     button: {
//         bgColor: "#462dd3",
//         color: "#fff"
//     },
//     menu: {
//         menuItem: {
//             bgColor: "#1d243a",
//             color: "#fff"
//         }
//     }
// }
```

### 注意 ⚠

如果插件与 CSS module 一起使用，请将 `:export` 替换为 `:share` ，这样做可以避免与 CSS module 提供的`:export`之间的未知冲突。

> 实际上你仍然可以使用`:export`，它并不会导致运行错误，`:share` 是 `:export` 的别名。

请不要在属性名称中键入以下字符：

```bash

"/", "~", ">", "<", "[", "]", "(", ")", ".", "#", "@", ":", "*"
```

由于本插件应用在`vite:css`之后，所以一切解析行为都基于`vite:css`返回的结果，当你键入以上字符时，存在一些字符本插件无法给出正确的警告/错误信息，例如：`@`

```scss
// your code
:export {
  fontColor: var(--font-color);
  fontSize: 14px;

  button {
    bgcolor: #462dd3;
    color: #fff;
  }

  @menu {
    menuItem {
      bgcolor: $menuItemBgColor;
      color: #fff;
    }
  }
}
```

```css
/** after vite:css */
:export {
  fontColor: var(--font-color);
  fontSize: 14px;
}
:export button {
  bgColor: #462dd3;
  color: #fff;
}
/** 无法捕捉 @menu */
@menu {
  :export menuItem {
    bgColor: #1d243a;
    color: #fff;
  }
}
```

```javascript
// after vite:css-export
{
  fontColor: "var(--font-color)",
  fontSize: "14px",
  button: {
    bgColor: "#462dd3",
    color: "#fff"
  },
  // menu 丢失
  menuItem: {
    bgColor: "#1d243a",
    color: "#fff"
  }
}
```

### 代码检查

你可能会得到编辑器或者 Stylelint 的一些警告，你可以把相关规则关闭。

#### VS Code

```json
{
  "css.lint.unknownProperties": "ignore",
  "scss.lint.unknownProperties": "ignore",
  "less.lint.unknownProperties": "ignore"
}
```

#### Stylelint

```json
{
  "rules": {
    "property-no-unknown": [
      true,
      {
        "ignoreSelectors": [":export", ":share"]
      }
    ],
    "property-case": null,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": ["export", "share"]
      }
    ],
    "selector-type-no-unknown": [
      true,
      {
        "ignore": ["default-namespace"]
      }
    ]
  }
}
```

## 配置项 ⚙️

### shouldTransform

- **type:** `(id: string) => boolean`

- **default:** `undefined`

- **description:** 该选项允许你额外指定哪些样式文件应该被转换，而不仅仅是`?export`，用法如下：

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    ViteCSSExportPlugin({
      shouldTransform(id) {
        const include = path.resolve(
          process.cwd(),
          'example/assets/style/share-to-js'
        )
        return path.resolve(id).indexOf(include) > -1
      }
    })
  ]
})
```

### propertyNameTransformer

- **type:** `(key: string) => string`

- **default:** `undefined`

- **description:** 该选项允许你定义一个转换 CSS 属性名称的方法，它并不会处理 additionalData。插件内置了一些方法，用法如下：

```typescript
// vite.config.ts
import {
  default as ViteCSSExportPlugin,
  kebabCaseToUpperCamelCase,
  kebabCaseToLowerCamelCase,
  kebabCaseToPascalCase
} from 'vite-plugin-css-export'

export default defineConfig({
  plugins: [
    ViteCSSExportPlugin({
      propertyNameTransformer: kebabCaseToUpperCamelCase
    })
  ]
})
```

### additionalData

- **type:** `SharedCSSData`

- **default:** `{}`

- **description:** 该选项允许你将指定的数据附加到所有的已处理的结果中，我们可以在这里分享一些常用的属性值。

### cssModule

#### cssModule.isGlobalCSSModule

- **type:** `boolean`

- **default:** `false`

- **description:** 是否在全局启用了 CSS module，而不仅仅是在 `.module.[suffix]` 文件中。

#### cssModule.enableExportMerge

- **type:** `boolean`

- **default:** `false`

- **description:** 当值为 true 时, `sharedData` 将会和 CSS module 的内容合并后再导出, 否则只有 `sharedData` 会被导出。它在使用`?inline`时不会生效。

> _`sharedData` 是本插件处理 CSS 内容后的结果_

#### cssModule.sharedDataExportName

- **type:** `string`

- **default:** `'sharedData'`

- **description:** 当 `cssModule.enableExportMerge` 值为 true 时, 修改导出结果中 `sharedData` 的属性名称。它在使用`?inline`时不会生效。
