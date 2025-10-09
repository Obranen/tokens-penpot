### Установка

1. `npm i` установка
2. `npm run tokens` запускает последовательно fix-references, style-dictionary, fix-variables генерирует переменные в папку tokens/build/tailwind-variables.css.
3. `npm run dev` запуск проекта

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
