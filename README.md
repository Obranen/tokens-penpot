### Установка

1. `npm i` установка
2. `npm run tokens` запускает последовательно fix-references, style-dictionary, fix-variables генерирует переменные в папку tokens/build/tailwind-variables.css.
3. `npm run dev` запуск проекта

#### Настройка Tailwind CSS

1. Открываем файл globals.css и добавляем сгенерированные токены из файлов tailwind-variables.css

```css
@import '../../tokens/build/tailwind-variables.css';
@import 'tailwindcss';
```

#### Таблица соотношения токенов Penpot и переменных в Tailwind 

| Tokens | Token-classes | TW-Namespace | TW-classes |
| :--- | :--- | :--- |:--- |
| Border Radius | radius | --radius-* | rounded-2xl |
| Color | color | --color-* | bg-red-500, text-sky-300 |
| Dimensions | axis | - | - |
| Font Family | font-family | --font-* | font-sans, font-serif, font-roboto |
| Font Size | font-size | --text-* | text-base |
| Font Weight | font-weight | --font-weight-* | font-normal, font-bold |
| Letter Spacing | letter-spacing | --tracking-* | tracking-normal |
| Number | line-height | --spacing-* | leading-6 |
| Opacity | opacity | --opacity-* | opacity-50 |
| Rotation | rotation | rotate (fix) | rotate-45 |
| Sizing | size, min-size, max-size | --breakpoint-* , --container-* | (sm, max-sm), (min-w-24, max-w-24) |
| Spacing | gap, padding | --spacing-* | gap-4, pt-6 |
| Stroke Width | stroke-width | --border-width-* | border-2 |
| Text Case | text-case | 1* case (fix) | uppercase, lowercase, capitalize |
| Text Decoration | text-decoration | 2* decoration (fix) | underline, line-through, no-underline |

https://tailwindcss.com/docs/theme #свойства tailwind переменных

1*. 
```css
@utility case-light {
  text-transform: var(--case-light);
}
```

2*. 
```css
@utility decoration-light {
  text-decoration-line: var(--decoration-light);
}
```

#### Описание

1. `node fix-references.js` исправляет ссылки в файле tokens.json, добавляя в value (globals.) и убирая имя папок из сета первого уровня.
2. `node fix-variables.js` создает переменные нужного вида для tailwindCSS v4 в файле tailwind-variables.css
3. Созданные в tokens/build/ обработанные fix-references и style-dictionary:
`globals-variables.css` примитивные токены
`semantic-variables.css` семантические токены

##### Используются плагины:
"@tokens-studio/sd-transforms": "^2.0.1",
"style-dictionary": "^5.0.4",
в фреймворке NextJS
