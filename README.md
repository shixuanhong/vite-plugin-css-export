# vite-plugin-css-export 🥰

[中文](https://github.com/shixuanhong/vite-plugin-css-export/blob/main/README_zh-CN.md) | [English](https://github.com/shixuanhong/vite-plugin-css-export/blob/main/README.md)

**Export variables from CSS to JS, and support nested rules.**

<p align="left">
  <a href="https://npmjs.com/package/vite-plugin-css-export"><img src="https://img.shields.io/npm/v/vite-plugin-css-export" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/vite-plugin-css-export" alt="node compatibility"></a>
  <a href="https://www.npmjs.com/package/vite"><img src="https://img.shields.io/npm/dependency-version/vite-plugin-css-export/peer/vite" alt="vite compatibility"></a>
</p>

This plugin allows you to use a pseudo-class called `:export` in CSS, and properties in this pseudo-class will be exported to JavaScript.

Besides that, with the help of Vite, we can use `:export` in .scss, .sass, .less, .styl and .stylus files.

[How to use css pre-processors in Vite](https://vitejs.dev/guide/features.html#css-pre-processors)

## Install ❤️

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

## Usage 💡

### Quick Start

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
// if you use in Typescript. wildcard module declarations
// env.d.ts
/// <reference types="vite-plugin-css-export/client" />

// if you want IntelliSense
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

Use the suffix `?export`.

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

### CSS Pre-processor

If you are using CSS pre-processor then you can use nested rules.

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

When used with CSS module, some simple configuration is required. By default, the exported results will not include CSS module related content (except what's in `:export`) .

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

// alias for :export
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
//     "base-button": "_base-button_1k9w3_5"
// }

// when enableExportMerge is false
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

### Note ⚠

If the plugin is used with CSS module, please replace `:export` with `:share` to avoid unknown conflicts with `:export` provided by CSS module.

> In fact you can still use `:export`, which won't cause a runtime error, `:share` is an alias for `:export`.

Please do not type the following characters in property names:

```bash

"/", "~", ">", "<", "[", "]", "(", ")", ".", "#", "@", ":", "*"
```

Because this plugin is applied after `vite:css`, all parsing actions are based on the result returned by `vite:css`. When you type the above characters, there are some characters that the plugin cannot give correct warning/error message, for example: `@`

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
/** unable to track the error @menu */
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
  // menu is missing
  menuItem: {
    bgColor: "#1d243a",
    color: "#fff"
  }
}
```

### Lint

You may get some warnings from the editor or Stylelint, you can disable related rules.

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

## Options ⚙️

### shouldTransform

- **type:** `(id: string) => boolean`

- **default:** `undefined`

- **description:** This option allows you to additionally specify which style files should be transformed, not just `?export`. Usage:

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

- **description:** The option allows you to define a method for transforming CSS property names, but doesn`t transform additionalData. The plugin has some built-in methods. Usage:

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

- **description:** The option allows you to append data to all processed results, we can share some common variables here.

### cssModule

#### cssModule.isGlobalCSSModule

- **type:** `boolean`

- **default:** `false`

- **description:** Whether the CSS module is used globally, not just in the `.module.[suffix]` file.

#### cssModule.enableExportMerge

- **type:** `boolean`

- **default:** `false`

- **description:** When value is true, `sharedData` will be merged with the result of CSS module, otherwise only `sharedData` will be exported. It won't work when using `?inline`

> _`sharedData` is the parsed result of the plugin._

#### cssModule.sharedDataExportName

- **type:** `string`

- **default:** `'sharedData'`

- **description:** When `cssModule.enableExportMerge` is true, modify the property name of `sharedData` in the merged result. It won't work when using `?inline`
