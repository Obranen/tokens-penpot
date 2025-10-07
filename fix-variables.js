import fs from 'fs'
import path from 'path'

// УДАЛЕНО: Жестко заданный список VARIANT_PREFIXES_TO_MOVE.
// Теперь логика универсально перемещает первый сегмент переменной, если она содержит дефис.

const THEME_FILES_TO_READ = {
  // Файлы для чтения (используются для получения имен переменных)
  semantic: 'tokens/build/semantic-variables.css',
}
const OUTPUT_FILE = 'tokens/build/tailwind-variables.css' // Новый файл с директивой @theme

/**
 * Карта для автоматического добавления единиц измерения (например, 'deg' для 'rotate').
 * Ключ: часть имени переменной; Значение: единица измерения.
 * Единица добавляется, только если значение является чистым числом.
 */
const UNIT_MAP = {
  'rotate': 'deg',
  // TODO: Добавьте сюда другие единицы, например, 'translate': 'rem'
}

/**
 * Основная функция для чтения переменных CSS, их преобразования и записи в новый файл с директивой @theme.
 */
function fixCssVariables() {
  const allAliases = [] // Единый массив для всех псевдонимов
  let success = true

  for (const [, filePath] of Object.entries(THEME_FILES_TO_READ)) {
    try {
      const fullPath = path.resolve(filePath)
      const cssContent = fs.readFileSync(fullPath, 'utf8')
      const lines = cssContent.split('\n')

      for (const line of lines) {
        // Ищем строки с определением CSS-переменной: --var-name: value; /* optional comment */
        // Регулярное выражение match[2] = имя переменной, match[3] = значение.
        const match = line.match(
          /^(\s*)(--[^:]+):\s*([^;]+);(\s*(\/\*.*\*\/))?/
        )

        if (match) {
          const oldVarName = match[2] // Например, --light-gap-4 или --xs-breakpoint
          
          // Изменяем 'const' на 'let', чтобы можно было изменить значение, добавив 'deg'.
          let value = match[3].trim() 

          // 1. Извлекаем имя переменной без префикса `--`
          const fullVarName = oldVarName.substring(2) // 'light-rotate-90'
          const parts = fullVarName.split('-')
          
          let finalName = fullVarName
          let variantSuffix = '' // Суффикс для варианта (тема, брейкпоинт)

          // 2. УНИВЕРСАЛЬНАЯ ЛОГИКА: Если имя переменной содержит дефис,
          // первый сегмент считается префиксом (вариантом) и перемещается в суффикс.
          if (parts.length > 1) {
            // Первый сегмент - это префикс, который мы хотим переместить.
            variantSuffix = parts[0].toLowerCase() 
            
            // Остальная часть имени
            finalName = parts.slice(1).join('-') // 'rotate-90'
          } else {
            // Переменные без дефисов (например, --opacity50), оставляем как есть.
            finalName = fullVarName
          }

          // 3. ЛОГИКА ЕДИНИЦ ИЗМЕРЕНИЯ (ОБНОВЛЕНО):
          // Добавляем единицу измерения, если значение является чистым числом.
          // Простая регулярка для проверки целых или десятичных чисел, включая отрицательные.
          const isNumeric = /^-?\d+(\.\d+)?$/.test(value);

          if (isNumeric) {
            for (const [prefix, unit] of Object.entries(UNIT_MAP)) {
              if (finalName.includes(prefix)) {
                value += unit
                break
              }
            }
          }
          // ------------------------------------------

          // 4. Формируем новое имя: --[finalName]-[variantSuffix] или --[finalName]
          const newAliasName = variantSuffix
            ? `--${finalName}-${variantSuffix}`
            : `--${finalName}`

          // 5. Создаем строку псевдонима с отступом
          const aliasLine = `  ${newAliasName}: ${value};`

          allAliases.push(aliasLine)
        }
      }
      console.log(`✅ Успешно собраны псевдонимы для файла: ${filePath}`)
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`⚠️ Файл темы не найден, пропуск: ${filePath}`)
      } else {
        console.error(`❌ Ошибка при обработке ${filePath}:`, error.message)
        success = false
      }
    }
  }

  if (!success) return

  // 6. Запись нового файла
  let outputContent =
    '/* Сгенерировано fix-variables.js для Tailwind v4 @theme */\n\n'

  outputContent += `@theme {\n`
  // Используем Set для удаления дубликатов, затем сортируем и объединяем
  const uniqueAndSortedAliases = [...new Set(allAliases)].sort()
  outputContent += uniqueAndSortedAliases.join('\n')
  outputContent += `\n}\n`

  try {
    const outputFullPath = path.resolve(OUTPUT_FILE)
    // Убедимся, что директория существует
    fs.mkdirSync(path.dirname(outputFullPath), { recursive: true })

    fs.writeFileSync(outputFullPath, outputContent, 'utf8')
    console.log(
      `\n🎉 Успешно создан новый файл с псевдонимами (@theme): ${OUTPUT_FILE}`
    )
  } catch (error) {
    console.error(`❌ Ошибка при записи файла ${OUTPUT_FILE}:`, error.message)
  }
}

fixCssVariables()