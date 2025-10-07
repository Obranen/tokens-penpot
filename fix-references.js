import fs from 'fs'

const filePath = 'tokens/tokens.json' // путь к твоему файлу

// читаем JSON
const raw = fs.readFileSync(filePath, 'utf-8')
const tokens = JSON.parse(raw)

// ИСПРАВЛЕННОЕ регулярное выражение для поиска ссылок
const refRegex = /^\{([a-z0-9-.]+)\}$/i 

// Вспомогательная функция для обработки одной строки-ссылки
function processReferenceString(value) {
    const match = value.match(refRegex)
    
    if (match) {
        const tokenPath = match[1] // Путь без скобок, например, "font-roboto"
        
        // если ссылка без "globals." и не является простой строкой
        if (!tokenPath.startsWith('globals.')) {
            // Модифицируем $value, добавляя "globals."
            return `{globals.${tokenPath}}`
        }
    }
    // Возвращаем исходное значение, если оно не является ссылкой или уже исправлено
    return value
}

// рекурсивная функция
function fixReferences(obj) {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            
            // 1. Обработка, когда $value является СТРОКОЙ
            if (obj[key].$value && typeof obj[key].$value === 'string') {
                obj[key].$value = processReferenceString(obj[key].$value)
            }
            
            // 2. Обработка, когда $value является МАССИВОМ (например, для fontFamilies)
            else if (Array.isArray(obj[key].$value)) {
                // Проходимся по всем элементам массива
                obj[key].$value = obj[key].$value.map(item => {
                    // Обрабатываем только строковые элементы массива
                    if (typeof item === 'string') {
                        return processReferenceString(item)
                    }
                    return item
                })
            }

            // Рекурсивный вызов обеспечивает обработку любой глубины
            fixReferences(obj[key])
        }
    }
}

fixReferences(tokens)

// перезаписываем файл
fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2), 'utf-8')

console.log('✅ Все ссылки поправлены, включая ссылки в массивах!')