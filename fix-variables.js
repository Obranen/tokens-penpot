import fs from 'fs';
import path from 'path';

const THEME_FILES_TO_READ = {
  // Файлы для чтения (используются для получения имен переменных)
  'light': 'tokens/build/light-tokens.css',
  'dark': 'tokens/build/dark-tokens.css',
};
const OUTPUT_FILE = 'tokens/build/variables.css'; // Новый файл с директивой @theme

/**
 * Преобразует CamelCase (Primary) в Kebab-Case (primary).
 */
function toKebabCase(str) {
  // Находит заглавные буквы (кроме первой) и вставляет перед ними дефис.
  return str.charAt(0).toLowerCase() + str.slice(1).replace(/([A-Z])/g, (g) => `-${g.toLowerCase()}`);
}

/**
 * Основная функция для сбора псевдонимов и записи в блок @theme.
 */
function fixCssVariables() {
    const allAliases = []; // Единый массив для всех псевдонимов
    let success = true;

    for (const [theme, filePath] of Object.entries(THEME_FILES_TO_READ)) {
        try {
            const fullPath = path.resolve(filePath);
            const cssContent = fs.readFileSync(fullPath, 'utf8');
            const lines = cssContent.split('\n');

            for (const line of lines) {
                // Ищем строки с определением CSS-переменной: --lightPrimary: #color;
                const match = line.match(/^(\s*)(--[^:]+):\s*([^;]+);/);

                if (match) {
                    const oldVarName = match[2]; // --lightPrimary

                    // 1. Убираем префикс темы (lightPrimary -> Primary)
                    const baseName = oldVarName.substring(2).replace(new RegExp(`^${theme}`, 'i'), ''); 
                    
                    // 2. Формируем имя токена: Primary -> primary
                    const kebabName = toKebabCase(baseName);
                    
                    // 3. Формируем **желаемое** имя переменной: --color-primary-light 
                    // МЫ УБРАЛИ "tw-"
                    const newAliasName = `--color-${kebabName}-${theme}`; 
                    
                    // 4. Создаем строку псевдонима
                    const aliasLine = `  ${newAliasName}: var(${oldVarName});`;
                    
                    allAliases.push(aliasLine);
                }
            }
            console.log(`✅ Успешно собраны псевдонимы для темы: ${theme}`);

        } catch (error) {
            if (error.code === 'ENOENT') {
                 console.warn(`⚠️ Файл темы не найден, пропуск: ${filePath}`);
            } else {
                 console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
                 success = false;
            }
        }
    }

    if (!success) return;

    // 2. Создание содержимого нового файла CSS с директивой @theme
    let outputContent = "/* Сгенерировано fix-variables.js для Tailwind v4 @theme */\n\n";
    
    outputContent += `@theme {\n`;
    outputContent += allAliases.join('\n');
    outputContent += `\n}\n`;

    // 3. Запись нового файла
    try {
        const outputFullPath = path.resolve(OUTPUT_FILE);
        fs.mkdirSync(path.dirname(outputFullPath), { recursive: true });
        
        fs.writeFileSync(outputFullPath, outputContent, 'utf8');
        console.log(`\n🎉 Успешно создан новый файл с псевдонимами (@theme): ${OUTPUT_FILE}`);
    } catch (error) {
        console.error(`❌ Ошибка при записи файла ${OUTPUT_FILE}:`, error.message);
    }
}

fixCssVariables();