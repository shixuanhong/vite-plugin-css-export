# vite-plugin-css-export 🤞

**A Vite plugin for sharing variables between Javascript and CSS.**

<p align="left">
  <a href="https://npmjs.com/package/vite-plugin-css-export"><img src="https://img.shields.io/npm/v/vite-plugin-css-export" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/vite-plugin-css-export" alt="node compatibility"></a>
</p>


This plugin allows you to use a pseudo-class called `:export` in CSS, and properties in this pseudo-class will be exported to Javascript.

Besides that, with the help of Vite, we can use `:export` in .scss, .sass, .less, .styl and .stylus files.

[How to use css preprocessors in Vite](https://vitejs.dev/guide/features.html#css-pre-processors)

## Install 💗

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

## Usage ❤️

```typescript
// vite.config.ts
import ViteCSSExportPlugin from "vite-plugin-css-export";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [ViteCSSExportPlugin()],
});
```

```typescript
// env.d.ts
/// <reference types="vite-plugin-css-export/client" />
```

```css
/* variables.css */
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
// main.ts
import variables from "./assets/style/variables.css?export";

console.log(variables);

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

## Options 💖

TODO
