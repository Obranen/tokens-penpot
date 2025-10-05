import fs from 'fs'

const filePath = 'tokens/tokens.json' // путь к твоему файлу

// читаем JSON
const raw = fs.readFileSync(filePath, 'utf-8')
const tokens = JSON.parse(raw)

// регулярка для поиска ссылок вида {red-500}
const refRegex = /^\{([a-z0-9-]+)\}$/i

// рекурсивная функция
function fixReferences(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (obj[key].$value && typeof obj[key].$value === 'string') {
        const match = obj[key].$value.match(refRegex)
        if (match) {
          // если ссылка без "globals."
          if (!match[1].startsWith('globals.')) {
            obj[key].$value = `{globals.${match[1]}}`
          }
        }
      }
      fixReferences(obj[key])
    }
  }
}

fixReferences(tokens)

// перезаписываем файл
fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2), 'utf-8')

console.log('✅ Все ссылки поправлены!')