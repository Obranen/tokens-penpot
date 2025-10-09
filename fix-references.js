import fs from 'fs'

const filePath = 'tokens/tokens.json' // путь к твоему файлу

// читаем JSON
const raw = fs.readFileSync(filePath, 'utf-8')
const tokens = JSON.parse(raw)

// ИСПРАВЛЕННОЕ регулярное выражение для поиска ссылок
const refRegex = /^\{([a-z0-9-.]+)\}$/i

// Регулярное выражение для поиска ключей, содержащих слеш (например, "theme/light")
// Оно ищет любой текст до первого слеша и сам слеш: "theme/"
const setPrefixRegex = /^[a-z0-9-]+[\\/]/i

// ---

/**
 * Вспомогательная функция для исправления имени набора токенов
 * с "theme/light" на "light" и т.п., чтобы Style Dictionary
 * правильно использовал его в token.path[0].
 * @param {string} key Исходный ключ набора токенов
 * @returns {string} Исправленный ключ
 */
function fixSetKey(key) {
  // Удаляем все до первого слеша (включая сам слеш)
  const fixedKey = key.replace(setPrefixRegex, '')
  return fixedKey
}

// ---

// Вспомогательная функция для обработки одной строки-ссылки
function processReferenceString(value) {
  const match = value.match(refRegex)

  if (match) {
    const tokenPath = match[1] // Путь без скобок, например, "font-roboto"

    // если ссылка без "globals." и не является простой строкой
    // (мы предполагаем, что все базовые токены находятся в "globals")
    if (!tokenPath.startsWith('globals.')) {
      // Модифицируем $value, добавляя "globals."
      return `{globals.${tokenPath}}`
    }
  }
  // Возвращаем исходное значение, если оно не является ссылкой или уже исправлено
  return value
}

// ---

// рекурсивная функция
function fixReferences(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // !!! БЛОК ДЛЯ ИСПРАВЛЕНИЯ КЛЮЧЕЙ С НАЗВАНИЕМ НАБОРА ТОКЕНОВ !!!
      // Проверяем, содержит ли ключ слеш (/)
      if (key.match(setPrefixRegex)) {
        const fixedKey = fixSetKey(key)

        // 1. Создаем новый объект под исправленным ключом
        obj[fixedKey] = obj[key]

        // 2. Удаляем старый ключ
        delete obj[key]

        // 3. Рекурсивно вызываем функцию для ИСПРАВЛЕННОГО объекта,
        //    чтобы продолжить обработку его содержимого.
        fixReferences(obj[fixedKey])

        // Переходим к следующей итерации, чтобы не пытаться
        // рекурсивно обработать уже удаленный старый ключ.
        continue
      }
      // !!! КОНЕЦ БЛОКА ИСПРАВЛЕНИЯ КЛЮЧЕЙ !!!

      // 1. Обработка, когда $value является СТРОКОЙ
      if (obj[key].$value && typeof obj[key].$value === 'string') {
        obj[key].$value = processReferenceString(obj[key].$value)
      }

      // 2. Обработка, когда $value является МАССИВОМ (например, для fontFamilies)
      else if (Array.isArray(obj[key].$value)) {
        // Проходимся по всем элементам массива
        obj[key].$value = obj[key].$value.map((item) => {
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

console.log(
  '✅ Все ссылки поправлены, включая ссылки в массивах! Имена наборов токенов со слешем исправлены.'
)
