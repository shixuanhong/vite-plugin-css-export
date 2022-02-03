# vite-plugin-css-export 🥰

**A Vite plugin for sharing variables between Javascript and CSS.**

<p style="text-align:left">
  <a href="https://npmjs.com/package/vite-plugin-css-export"><img src="https://img.shields.io/npm/v/vite-plugin-css-export" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/vite-plugin-css-export" alt="node compatibility"></a>
</p>

This plugin allows you to use a pseudo-class called `:export` in CSS, and properties in this pseudo-class will be exported to Javascript.

Besides that, with the help of Vite, we can use `:export` in .scss, .sass, .less, .styl and .stylus files.

[How to use css preprocessors in Vite](https://vitejs.dev/guide/features.html#css-pre-processors)

> **Notice:**
> If the plugin is used with CSS Module, please replace `:export` with `:share` to avoid conflicts with `:export` provided by CSS Module. `:share` is an alias for `:export`.

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
import ViteCSSExportPlugin from "vite-plugin-css-export";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [ViteCSSExportPlugin()],
});
```

```typescript
// if you use in Typescript
// env.d.ts
/// <reference types="vite-plugin-css-export/client" />
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

Use the suffix `?export`.

```typescript
// main.ts
import cssResult from './assets/style/example.css?export'

console.log(cssResult);

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

### CSS Preprocessor

If you are using CSS preprocessor then you can use nested rules.

``` scss
// .scss
:root {
  --font-color: #333;
}

$menuItemBgColor: #1d243a;

:export {
  fontColor: var(--font-color);
  fontSize: 14px;
  button {
    bgColor: #462dd3;
    color: #fff;
  }
  menu {
    menuItem {
      bgColor: $menuItemBgColor;
      color: #fff;
    }
  }
}
```

``` less
// .less
:root {
  --font-color: #333;
}

@menuItemBgColor: #1d243a;

:export {
  fontColor: var(--font-color);
  fontSize: 14px;

  button {
    bgColor: #462dd3;
    color: #fff;
  }

  menu {
    menuItem {
      bgColor: @menuItemBgColor;
      color: #fff;
    }
  }
}
```

``` stylus
// .styl
:root 
  --font-color: #333

menuItemBgColor = #1d243a

:export 
  fontColor: var(--font-color)
  fontSize: 14px

  button 
    bgColor: #462dd3
    color: #fff
  
  menu 
    menuItem 
      bgColor: menuItemBgColor
      color: #fff
```

### CSS Module

``` typescript
// vite.config.ts
import ViteCSSExportPlugin from "vite-plugin-css-export";
import { defineConfig } from "vite";

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

``` scss
// example.module.scss
:root {
  --font-color: #333;
}

$menuItemBgColor: #1d243a;

.base-button {
  background-color: transparent;
}

:share {
  fontColor: var(--font-color);
  fontSize: 14px;

  button {
    bgColor: #462dd3;
    color: #fff;
  }

  menu {
    menuItem {
      bgColor: $menuItemBgColor;
      color: #fff;
    }
  }
}

// conflict
:export {
  fontColor: var(--font-color);
  fontSize: 14px;
}
```

``` typescript
// main.ts
import cssModuleResult from './assets/style/example.module.scss?export'

console.log(cssModuleResult)

//output
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

### Lint

You may get some warnings from the editor or Stylelint, you can disable related rules.

#### VS Code

``` json
{
  "css.lint.unknownProperties": "ignore",
  "scss.lint.unknownProperties": "ignore",
  "less.lint.unknownProperties": "ignore",
  //...
}

```

#### Stylelint

``` json
{
  "rules": {
    "property-no-unknown": null,
    "selector-pseudo-class-no-unknown": [true, {
      "ignorePseudoClasses": ["export", "share"]
    }]
  }
}
```

## Options ⚙️

### propertyFilter

TODO

### propertyTransform

TODO

### additionalData

TODO

### cssModule

#### cssModule.isGlobalCSSModule

* **type:** `boolean | undefined`

* **default:** `false`

* **description:** Whether the CSS Module is used globally, not just in the `.module.[suffix]` file.

#### cssModule.enableExportMerge

* **type:** `boolean | undefined`

* **default:** `false`

* **description:** When value is true, `sharedData` will be merged with the result of CSS Module, otherwise only `sharedData` will be exported.

> *`sharedData` is the parsed result of the plugin.*

#### cssModule.sharedDataExportName

* **type:** `string | undefined`

* **default:** `'sharedData'`

* **description:** When `cssModule.enableExportMerge` is true, modify the property name of `sharedData` in the merged result.
