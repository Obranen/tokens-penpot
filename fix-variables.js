import fs from 'fs'
import path from 'path'

// УДАЛЕНО: Жестко заданный список VARIANT_PREFIXES_TO_MOVE.
// Теперь логика универсально перемещает первый сегмент переменной, если она содержит дефис.

const THEME_FILES_TO_READ = {
  // Файлы для чтения (используются для получения имен переменных)
  semantic: 'tokens/build/semantic-variables.css',
}
const OUTPUT_FILE = 'tokens/build/tailwind-variables.css' // Новый файл с директивами @theme и @utility

/**
 * Карта для автоматического добавления единиц измерения (например, 'deg' для 'rotate').
 * Ключ: часть имени переменной; Значение: единица измерения.
 * Единица добавляется, только если значение является чистым числом.
 */
const UNIT_MAP = {
  'rotate': 'deg',
  'translate': 'rem', // Добавлено
  'gap': 'rem', // Добавлено
  'spacing': 'rem',
  'size': 'rem',
  'width': 'rem',
  'height': 'rem',
}

/**
 * НОВАЯ КАРТА: Для генерации директив @utility.
 * Ключ: finalName (часть переменной после перемещения префикса);
 * Значение: соответствующее CSS-свойство для утилиты.
 */
const UTILITY_MAP = {
  // text-transform: для 'light-case: lowercase;' -> @utility case-light { text-transform: var(--case-light); }
  'case': 'text-transform', 
  // text-decoration-line: для 'light-decoration: underline;' -> @utility decoration-light { text-decoration-line: var(--decoration-light); }
  'decoration': 'text-decoration-line', 
  // -webkit-line-clamp: для 'light-line-clamp-3: 3;' -> @utility line-clamp-3-light { -webkit-line-clamp: var(--line-clamp-3-light); }
  'line-clamp': '-webkit-line-clamp', 
}

/**
 * Основная функция для чтения переменных CSS, их преобразования и записи в новый файл с директивой @theme.
 */
function fixCssVariables() {
  const allAliases = [] // Единый массив для всех псевдонимов (@theme { --alias: value; })
  const allUtilities = [] // Единый массив для всех блоков @utility
  let success = true

  for (const [, filePath] of Object.entries(THEME_FILES_TO_READ)) {
    try {
      const fullPath = path.resolve(filePath)
      const cssContent = fs.readFileSync(fullPath, 'utf8')
      const lines = cssContent.split('\n')

      for (const line of lines) {
        // Ищем строки с определением CSS-переменной: --var-name: value; /* optional comment */
        const match = line.match(
          /^(\s*)(--[^:]+):\s*([^;]+);(\s*(\/\*.*\*\/))?/
        )

        if (match) {
          const oldVarName = match[2] // Например, --light-gap-4 или --light-rotate-90
          
          let value = match[3].trim() 

          // 1. Извлекаем имя переменной без префикса `--`
          const fullVarName = oldVarName.substring(2) // 'light-rotate-90'
          const parts = fullVarName.split('-')
          
          let finalName = fullVarName
          let variantSuffix = '' // Суффикс для варианта (тема, брейкпоинт)

          // 2. УНИВЕРСАЛЬНАЯ ЛОГИКА: Перемещаем первый сегмент в суффикс, если есть дефис.
          if (parts.length > 1) {
            variantSuffix = parts[0].toLowerCase() 
            finalName = parts.slice(1).join('-') // 'rotate-90' или 'case' или 'decoration'
          } else {
            finalName = fullVarName
          }

          // 3. ЛОГИКА ЕДИНИЦ ИЗМЕРЕНИЯ: Добавляем единицу, если значение является чистым числом.
          const isNumeric = /^-?\d+(\.\d+)?$/.test(value);

          if (isNumeric) {
            for (const [prefix, unit] of Object.entries(UNIT_MAP)) {
              // Проверяем, включает ли finalName префикс (например, 'rotate-90' включает 'rotate')
              if (finalName.includes(prefix)) {
                value += unit
                break
              }
            }
          }
          // ------------------------------------------

          // 4. Формируем новое имя для псевдонима: --[finalName]-[variantSuffix]
          const newAliasName = variantSuffix
            ? `--${finalName}-${variantSuffix}`
            : `--${finalName}`

          // 5. Создаем строку псевдонима с отступом (для @theme)
          const aliasLine = `  ${newAliasName}: ${value};`
          allAliases.push(aliasLine)

          // 6. ГЕНЕРАЦИЯ УТИЛИТЫ
          // Проверяем, начинается ли finalName с ключа из UTILITY_MAP (например, 'decoration' или 'line-clamp')
          let utilityKey = Object.keys(UTILITY_MAP).find(key => finalName.startsWith(key));
          
          if (utilityKey && variantSuffix) {
            const utilityProperty = UTILITY_MAP[utilityKey];

            // Имя утилиты: decoration-light или line-clamp-3-light
            const utilityName = `${finalName}-${variantSuffix}` 
            
            const utilityBlock = 
`@utility ${utilityName} {
  ${utilityProperty}: var(${newAliasName});
}`
            // Добавляем только уникальные утилиты
            if (!allUtilities.includes(utilityBlock)) {
              allUtilities.push(utilityBlock)
            }
          }
          // ------------------------------------------
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

  // 7. Запись нового файла (ОБНОВЛЕНО: включает @theme и @utility)
  let outputContent =
    '/* Сгенерировано fix-variables.js для Tailwind v4 @theme и @utility */\n\n'

  // Блок @theme с переменными-псевдонимами
  outputContent += `@theme {\n`
  // Используем Set для удаления дубликатов, затем сортируем и объединяем
  const uniqueAndSortedAliases = [...new Set(allAliases)].sort()
  outputContent += uniqueAndSortedAliases.join('\n')
  outputContent += `\n}\n\n` // Добавляем два переноса для разделения

  // Блоки @utility
  outputContent += allUtilities.join('\n\n')

  try {
    const outputFullPath = path.resolve(OUTPUT_FILE)
    // Убедимся, что директория существует
    fs.mkdirSync(path.dirname(outputFullPath), { recursive: true })

    fs.writeFileSync(outputFullPath, outputContent, 'utf8')
    console.log(
      `\n🎉 Успешно создан новый файл с токенами (@theme и @utility): ${OUTPUT_FILE}`
    )
  } catch (error) {
    console.error(`❌ Ошибка при записи файла ${OUTPUT_FILE}:`, error.message)
  }
}

fixCssVariables()
