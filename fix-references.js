import fs from 'fs'

const filePath = 'tokens/tokens.json' // путь к твоему файлу

// читаем JSON
const raw = fs.readFileSync(filePath, 'utf-8')
const tokens = JSON.parse(raw)

// ИСПРАВЛЕННОЕ регулярное выражение для поиска ссылок
// Добавлена точка (.) в разрешенные символы: [a-z0-9-.]
const refRegex = /^\{([a-z0-9-.]+)\}$/i 

// рекурсивная функция
function fixReferences(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (obj[key].$value && typeof obj[key].$value === 'string') {
        const value = obj[key].$value
        const match = value.match(refRegex)
        
        if (match) {
          const tokenPath = match[1] // Путь без скобок, например, "color.red.500"
          
          // если ссылка без "globals."
          if (!tokenPath.startsWith('globals.')) {
            // Модифицируем $value, добавляя "globals."
            obj[key].$value = `{globals.${tokenPath}}`
          }
        }
      }
      // Рекурсивный вызов обеспечивает обработку любой глубины
      fixReferences(obj[key])
    }
  }
}

fixReferences(tokens)

// перезаписываем файл
fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2), 'utf-8')

console.log('✅ Все ссылки поправлены!')