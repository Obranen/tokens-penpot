import fs from 'fs'
import path from 'path'

// Читаемые файлы
const THEME_FILES_TO_READ = {
  semantic: 'tokens/build/semantic-variables.css',
}

const OUTPUT_FILE = 'tokens/build/tailwind-variables.css'

// Карта единиц
const UNIT_MAP = {
  rotate: 'deg',
  translate: 'rem',
  gap: 'rem',
  spacing: 'rem',
  size: 'rem',
  width: 'rem',
  height: 'rem',
}

// Карта утилит
const UTILITY_MAP = {
  case: 'text-transform',
  decoration: 'text-decoration-line',
  'line-clamp': '-webkit-line-clamp',
}

// 🔹 Конвертер px → rem
function pxToRem(value) {
  return value.replace(
    /(-?\d*\.?\d+)px\b/g,
    (_, num) => `${parseFloat(num) / 16}rem`
  )
}

function fixCssVariables() {
  const allAliases = []
  const allUtilities = []
  let success = true

  for (const [, filePath] of Object.entries(THEME_FILES_TO_READ)) {
    try {
      const fullPath = path.resolve(filePath)
      const cssContent = fs.readFileSync(fullPath, 'utf8')
      const lines = cssContent.split('\n')

      for (const line of lines) {
        const match = line.match(
          /^(\s*)(--[^:]+):\s*([^;]+);(\s*(\/\*.*\*\/))?/
        )
        if (match) {
          const oldVarName = match[2]
          let value = match[3].trim()

          // 🔸 Преобразование px → rem перед дальнейшими шагами
          if (value.includes('px')) {
            value = pxToRem(value)
          }

          const fullVarName = oldVarName.substring(2)
          const parts = fullVarName.split('-')

          let finalName = fullVarName
          let variantSuffix = ''

          if (parts.length > 1) {
            variantSuffix = parts[0].toLowerCase()
            finalName = parts.slice(1).join('-')
          }

          const isNumeric = /^-?\d+(\.\d+)?$/.test(value)
          if (isNumeric) {
            for (const [prefix, unit] of Object.entries(UNIT_MAP)) {
              if (finalName.includes(prefix)) {
                value += unit
                break
              }
            }
          }

          const newAliasName = variantSuffix
            ? `--${finalName}-${variantSuffix}`
            : `--${finalName}`

          const aliasLine = `  ${newAliasName}: ${value};`
          allAliases.push(aliasLine)

          let utilityKey = Object.keys(UTILITY_MAP).find((key) =>
            finalName.startsWith(key)
          )

          if (utilityKey && variantSuffix) {
            const utilityProperty = UTILITY_MAP[utilityKey]
            const utilityName = `${finalName}-${variantSuffix}`
            const utilityBlock = `@utility ${utilityName} {
  ${utilityProperty}: var(${newAliasName});
}`

            if (!allUtilities.includes(utilityBlock)) {
              allUtilities.push(utilityBlock)
            }
          }
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

  let outputContent =
    '/* Сгенерировано fix-variables.js для Tailwind v4 @theme и @utility */\n\n'

  outputContent += `@theme {\n`
  const uniqueAndSortedAliases = [...new Set(allAliases)].sort()
  outputContent += uniqueAndSortedAliases.join('\n')
  outputContent += `\n}\n\n`
  outputContent += allUtilities.join('\n\n')

  try {
    const outputFullPath = path.resolve(OUTPUT_FILE)
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
