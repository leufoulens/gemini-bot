import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

console.log('🧪 Тестирование Gemini API...\n');

// Тест 1: Простой текстовый запрос
async function testTextGeneration() {
  console.log('📝 Тест 1: Генерация текста');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ответь одним словом: работает?'
    });
    
    console.log('✅ Текстовая генерация работает!');
    console.log('Ответ:', response.text);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Ошибка текстовой генерации:', error.message);
    console.log('');
    return false;
  }
}

// Тест 2: Проверка API ключа
async function testAPIKey() {
  console.log('🔑 Тест 2: Проверка API ключа');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ API ключ не найден в .env файле');
    console.log('💡 Добавьте GEMINI_API_KEY в .env файл');
    console.log('');
    return false;
  }
  
  if (apiKey === 'your_gemini_api_key_here') {
    console.error('❌ API ключ не настроен (используется значение по умолчанию)');
    console.log('💡 Замените значение в .env на реальный ключ');
    console.log('');
    return false;
  }
  
  if (!apiKey.startsWith('AIza')) {
    console.warn('⚠️  API ключ имеет необычный формат (обычно начинается с AIza)');
  }
  
  console.log('✅ API ключ найден:', apiKey.substring(0, 10) + '...');
  console.log('');
  return true;
}

// Тест 3: Проверка модели
async function testModelAccess() {
  console.log('🤖 Тест 3: Доступ к модели gemini-2.5-flash');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Привет!'
    });
    
    if (response && response.text) {
      console.log('✅ Модель gemini-2.5-flash доступна!');
      console.log('');
      return true;
    } else {
      console.error('❌ Модель вернула пустой ответ');
      console.log('');
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка доступа к модели:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('💡 Проблема с API ключом. Проверьте его на ai.google.dev');
    } else if (error.message.includes('model')) {
      console.log('💡 Модель недоступна. Попробуйте другую версию.');
    } else if (error.message.includes('quota')) {
      console.log('💡 Превышена квота API. Попробуйте позже или обновите план.');
    }
    
    console.log('');
    return false;
  }
}

// Тест 4: Проверка структуры ответа
async function testResponseStructure() {
  console.log('📦 Тест 4: Структура ответа API');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Скажи "тест"'
    });
    
    console.log('Доступные поля в response:');
    console.log('- response.text:', typeof response.text, '→', response.text ? '✅' : '❌');
    console.log('- response.candidates:', typeof response.candidates, '→', response.candidates ? '✅' : '❌');
    
    if (response.candidates && response.candidates[0]) {
      console.log('- response.candidates[0].content:', typeof response.candidates[0].content);
    }
    
    console.log('');
    console.log('✅ Структура ответа проверена');
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.log('');
    return false;
  }
}

// Тест 5: Проверка работы с изображениями (симуляция)
async function testImageSupport() {
  console.log('🖼️  Тест 5: Поддержка изображений');
  console.log('ℹ️  Для полного теста нужно реальное изображение');
  console.log('ℹ️  Проверяем только структуру запроса...');
  
  // Создаем минимальное тестовое изображение (1x1 белый пиксель PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Опиши это изображение' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: testImageBase64
              }
            }
          ]
        }
      ]
    });
    
    if (response && (response.text || (response.candidates && response.candidates[0]))) {
      console.log('✅ API поддерживает обработку изображений!');
      console.log('Ответ на тестовое изображение:', response.text?.substring(0, 100) || 'получен');
    } else {
      console.log('⚠️  API ответил, но структура ответа необычная');
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Ошибка при обработке изображения:', error.message);
    console.log('');
    return false;
  }
}

// Запуск всех тестов
async function runAllTests() {
  console.log('═══════════════════════════════════════');
  console.log('   ТЕСТИРОВАНИЕ GEMINI API');
  console.log('═══════════════════════════════════════\n');
  
  const results = {
    apiKey: await testAPIKey(),
    textGeneration: await testTextGeneration(),
    modelAccess: await testModelAccess(),
    responseStructure: await testResponseStructure(),
    imageSupport: await testImageSupport()
  };
  
  console.log('═══════════════════════════════════════');
  console.log('         РЕЗУЛЬТАТЫ ТЕСТОВ');
  console.log('═══════════════════════════════════════\n');
  
  console.log('API ключ:                ', results.apiKey ? '✅ OK' : '❌ FAIL');
  console.log('Генерация текста:        ', results.textGeneration ? '✅ OK' : '❌ FAIL');
  console.log('Доступ к модели:         ', results.modelAccess ? '✅ OK' : '❌ FAIL');
  console.log('Структура ответа:        ', results.responseStructure ? '✅ OK' : '❌ FAIL');
  console.log('Поддержка изображений:   ', results.imageSupport ? '✅ OK' : '❌ FAIL');
  
  console.log('\n═══════════════════════════════════════\n');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
    console.log('✅ Gemini API готов к использованию');
    console.log('🚀 Можете запускать бота: npm start\n');
  } else {
    console.log('⚠️  НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ');
    console.log('📖 Смотрите TROUBLESHOOTING.md для решения проблем\n');
    process.exit(1);
  }
}

// Запуск
runAllTests().catch(error => {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
  process.exit(1);
});


