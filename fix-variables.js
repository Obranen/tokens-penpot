import fs from 'fs'
import path from 'path'

const THEME_FILES_TO_READ = {
  // Файлы для чтения (используются для получения имен переменных)
  variables: 'tokens/build/style-dictionary-variables.css',
}
const OUTPUT_FILE = 'tokens/build/tailwind-variables.css' // Новый файл с директивой @theme

/**
 * Извлекает категорию из CSS-комментария.
 * @param {string} line Строка, содержащая комментарий.
 * @returns {string | null} Категория в нижнем регистре или null, если не найдена.
 */
function extractCategory(line) {
  // Ищем комментарий вида /** category*/ или /* category */
  const match = line.match(
    /\/\*\*\s*([^ *\/]+)\s*\*\/|\/\*\s*([^ *\/]+)\s*\*\//
  )
  if (match) {
    // match[1] для /** category*/, match[2] для /* category */. Берем первый найденный.
    const category = match[1] || match[2]
    // Приводим к нижнему регистру и удаляем пробелы
    return category.trim().toLowerCase()
  }
  return null // Категория не найдена
}

/**
 * Основная функция для чтения переменных CSS, их преобразования и записи в новый файл с директивой @theme.
 */
function fixCssVariables() {
  const allAliases = [] // Единый массив для всех псевдонимов
  let success = true

  for (const [theme, filePath] of Object.entries(THEME_FILES_TO_READ)) {
    try {
      const fullPath = path.resolve(filePath)
      const cssContent = fs.readFileSync(fullPath, 'utf8')
      const lines = cssContent.split('\n')

      for (const line of lines) {
        // Ищем строки с определением CSS-переменной: --lightPrimary: #color; /** comment */
        const match = line.match(
          /^(\s*)(--[^:]+):\s*([^;]+);(\s*(\/\*.*\*\/))?/
        )

        if (match) {
          const oldVarName = match[2] // Например, --xs-bp или --dark-color-primary
          const value = match[3].trim() // Например, 360px (Value)
          const comment = match[4] || '' // Например, /** breakpoint */

          // Извлекаем категорию из комментария
          const category = extractCategory(comment)

          // 1. Убираем префикс -- и префикс темы (e.g. --variables-3xl-3xl -> 3xl-3xl)
          let baseName = oldVarName
            .substring(2) 
            .replace(new RegExp(`^${theme}`, 'i'), '')

          // 2. УДАЛЕНИЕ ПРЕФИКСА РАЗМЕРА ИЛИ ТЕМЫ/ВАРИАНТА:
          if (category) {
            // A. Если категория ИЗВЕСТНА (из комментария), удаляем ПЕРВЫЙ СЕГМЕНТ,
            // который, вероятно, является префиксом размера/варианта.
            if (baseName.includes('-')) {
              const parts = baseName.split('-')
              if (parts.length > 1) {
                // Удаляем первый элемент массива (например, 'xs')
                baseName = parts.slice(1).join('-') // baseName становится 'bp'
              }
            }
          } else {
            // B. Если категория НЕИЗВЕСТНА (нет комментария):
            
            // 2. УНИВЕРСАЛЬНОЕ УДАЛЕНИЕ ПЕРВОГО СЕГМЕНТА (например, 'xs-', 'md-').
            // Ищем любой текст в начале, за которым следует дефис, и удаляем его.
            // Это заменяет длинное перечисление размеров.
            const firstSegmentRegex = /^.+?-/i;
            if (firstSegmentRegex.test(baseName) && baseName.split('-').length > 1) {
                baseName = baseName.replace(firstSegmentRegex, '');
            }
          }
          
          // 3. Расчет суффикса (если есть категория) или префикса (если нет).
          // Если есть категория, она станет суффиксом, иначе - пустой строкой.
          const suffix = category ? `-${category}` : ''; // Добавляем '-' в начале, если есть категория.
          
          // 4. Формируем новое имя: --[fixedName][suffix]
          // Если category есть: --bp-breakpoint. Если category нет: --color-primary ИЛИ --bp
          const newAliasName = `--${baseName}${suffix}` 

          // 5. Создаем строку псевдонима
          const aliasLine = `  ${newAliasName}: ${value};`

          allAliases.push(aliasLine)
        }
      }
      console.log(`✅ Успешно собраны псевдонимы для темы: ${theme}`)
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

  // 5. Запись нового файла
  let outputContent =
    '/* Сгенерировано fix-variables.js для Tailwind v4 @theme */\n\n'

  outputContent += `@theme {\n`
  outputContent += allAliases.join('\n')
  outputContent += `\n}\n`

  try {
    const outputFullPath = path.resolve(OUTPUT_FILE)
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