import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

dotenv.config();

// Инициализация Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Инициализация Telegram бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Хранилище пользовательских данных
const userSessions = new Map();

console.log('🤖 Бот запущен и готов к работе!');

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
👋 Добро пожаловать!

Я — Gemini AI бот для работы с изображениями.

🔹 Что я умею:
• 🔍 Анализировать изображения
• 💬 Отвечать на вопросы по изображениям
• 📝 Извлекать текст из изображений (OCR)
• 🎨 **РЕДАКТИРОВАТЬ изображения по промпту**
• ✨ **ГЕНЕРИРОВАТЬ новые элементы на фото**
• 🖼️ **СОЗДАВАТЬ изображения из текста**

📝 Режимы работы:

**1️⃣ АНАЛИЗ (по умолчанию):**
Отправьте фото + подпись с вопросом
Пример: "Опиши это изображение"

**2️⃣ РЕДАКТИРОВАНИЕ:**
Отправьте /edit, затем фото + инструкции
Примеры:
• "Замени фон на пляж"
• "Добавь шляпу на голову кота"
• "Измени цвет дивана на красный"

**3️⃣ ГЕНЕРАЦИЯ:**
Отправьте /gen <описание> или /gen + текст
Примеры:
• "Нарисуй закат на море"
• "Кот в космосе"
• "Футуристический город"

Команды:
/start - Показать это сообщение
/help - Помощь
/edit - Режим редактирования изображений 🎨
/gen - Генерация изображений из текста 🖼️
/analyze - Режим анализа (по умолчанию)
/clear - Очистить историю

Попробуйте отправить изображение! 📸
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
🆘 Помощь

📊 ТРИ РЕЖИМА РАБОТЫ:

🔍 **РЕЖИМ АНАЛИЗА** (по умолчанию):
Отправьте изображение с подписью, и я его проанализирую.

Примеры:
• "Опиши это изображение"
• "Извлеки текст с картинки"
• "Что ты видишь на фото?"
• "Определи эмоции людей"

🎨 **РЕЖИМ РЕДАКТИРОВАНИЯ**:
1. Отправьте команду /edit
2. Отправьте фото + инструкции по редактированию

Примеры редактирования:
• "Замени синий диван на коричневый кожаный"
• "Добавь вязаную шляпу на голову кота"
• "Измени фон на пляжный пейзаж"
• "Сделай изображение в стиле винтаж"

🖼️ **РЕЖИМ ГЕНЕРАЦИИ**:
1. Отправьте команду /gen
2. Отправьте текстовое описание желаемого изображения

Примеры генерации:
• "Нарисуй закат на море с парусником"
• "Создай изображение кота в космосе"
• "Футуристический город ночью"
• "Милый робот с цветами"

📝 **Советы:**
✅ Будьте конкретны в описании
✅ Указывайте стиль: "в стиле акварели", "фотореалистично"
✅ Описывайте детали: цвета, настроение, композицию

💡 Совет: Чем точнее промпт, тем лучше результат!
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Команда /edit - включить режим редактирования
bot.onText(/\/edit/, (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId) || {};
  session.mode = 'edit';
  session.timestamp = Date.now();
  userSessions.set(chatId, session);
  
  bot.sendMessage(chatId, `
🎨 **РЕЖИМ РЕДАКТИРОВАНИЯ АКТИВИРОВАН**

Теперь отправьте изображение с инструкциями по редактированию.

Примеры промптов:
• "Замени фон на горный пейзаж"
• "Добавь солнечные очки на лицо"
• "Измени цвет машины на красный"
• "Сделай изображение черно-белым"

💡 Для лучшего результата:
✅ Будьте конкретны
✅ Указывайте детали
✅ Просите сохранить стиль и композицию

Чтобы вернуться к анализу: /analyze
  `);
});

// Команда /analyze - включить режим анализа
bot.onText(/\/analyze/, (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId) || {};
  session.mode = 'analyze';
  session.timestamp = Date.now();
  userSessions.set(chatId, session);
  
  bot.sendMessage(chatId, `
🔍 **РЕЖИМ АНАЛИЗА АКТИВИРОВАН**

Теперь я буду анализировать и описывать ваши изображения.

Примеры промптов:
• "Опиши это изображение"
• "Извлеки текст с картинки"
• "Что ты видишь на фото?"
• "Определи объекты"

Чтобы перейти к редактированию: /edit
  `);
});

// Команда /gen - включить режим генерации изображений
bot.onText(/\/gen(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const prompt = match[1]; // Текст после команды
  
  if (prompt) {
    // Если промпт указан сразу в команде
    await processImageGeneration(chatId, prompt);
  } else {
    // Если промпт не указан, переходим в режим ожидания
    const session = userSessions.get(chatId) || {};
    session.mode = 'generate';
    session.timestamp = Date.now();
    userSessions.set(chatId, session);
    
    bot.sendMessage(chatId, `
🖼️ **РЕЖИМ ГЕНЕРАЦИИ АКТИВИРОВАН**

Теперь отправьте текстовое описание изображения, которое вы хотите создать.

Примеры промптов:
• "Нарисуй закат на море с парусником"
• "Создай изображение кота в космосе"
• "Футуристический город ночью, неоновые огни"
• "Милый робот с букетом цветов, акварельный стиль"

💡 Советы:
✅ Описывайте детали и атмосферу
✅ Указывайте стиль (реализм, арт, акварель и т.д.)
✅ Упоминайте цвета и композицию

Или используйте: /gen <описание> для быстрой генерации

Чтобы вернуться к анализу: /analyze
    `);
  }
});

// Команда /clear
bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  userSessions.delete(chatId);
  bot.sendMessage(chatId, '✅ История очищена! Режим сброшен на анализ.');
});

// Обработка изображений
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Показываем, что бот работает
    await bot.sendChatAction(chatId, 'typing');
    
    // Получаем изображение высокого качества
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;
    
    // Получаем файл
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    
    // Скачиваем изображение
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);
    const base64Image = imageBuffer.toString('base64');
    
    // Получаем или создаем сессию пользователя
    const session = userSessions.get(chatId) || {};
    const mode = session.mode || 'analyze'; // По умолчанию режим анализа
    
    // Получаем промпт из подписи или сохраняем изображение для следующего сообщения
    const caption = msg.caption || '';
    
    if (caption) {
      // Если есть подпись, сразу обрабатываем
      if (mode === 'edit') {
        await processImageEdit(chatId, base64Image, caption, photo.file_unique_id);
      } else {
        await processImageWithPrompt(chatId, base64Image, caption, photo.file_unique_id);
      }
    } else {
      // Сохраняем изображение и ждем промпт
      userSessions.set(chatId, {
        imageData: base64Image,
        imageId: photo.file_unique_id,
        mode: mode,
        timestamp: Date.now()
      });
      
      const modeText = mode === 'edit' 
        ? '🎨 Изображение получено! Теперь отправьте инструкции по редактированию.\n\nНапример:\n• "Замени фон на пляж"\n• "Добавь шляпу на голову"'
        : '📸 Изображение получено! Теперь отправьте ваш вопрос или промпт.\n\nНапример:\n• "Опиши это изображение"\n• "Что ты видишь?"';
      
      bot.sendMessage(chatId, modeText);
    }
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error);
    bot.sendMessage(
      chatId, 
      '❌ Произошла ошибка при обработке изображения. Попробуйте еще раз.'
    );
  }
});

// Обработка текстовых сообщений
bot.on('message', async (msg) => {
  // Игнорируем команды и сообщения с фото
  if (msg.text && !msg.text.startsWith('/') && !msg.photo) {
    const chatId = msg.chat.id;
    const userSession = userSessions.get(chatId);
    
    // Если пользователь в режиме генерации и нет сохраненного изображения
    if (userSession && userSession.mode === 'generate' && !userSession.imageData) {
      const prompt = msg.text;
      await processImageGeneration(chatId, prompt);
      
      // Сохраняем режим после генерации
      userSessions.set(chatId, {
        mode: 'generate',
        timestamp: Date.now()
      });
      return;
    }
    
    // Если есть сохраненное изображение
    if (userSession && userSession.imageData) {
      const prompt = msg.text;
      const mode = userSession.mode || 'analyze';
      
      // Обрабатываем в зависимости от режима
      if (mode === 'edit') {
        await processImageEdit(
          chatId, 
          userSession.imageData, 
          prompt, 
          userSession.imageId
        );
      } else {
        await processImageWithPrompt(
          chatId, 
          userSession.imageData, 
          prompt, 
          userSession.imageId
        );
      }
      
      // Очищаем imageData, но сохраняем режим
      const currentMode = userSession.mode;
      userSessions.set(chatId, {
        mode: currentMode,
        timestamp: Date.now()
      });
    }
  }
});

// Функция обработки изображения с промптом
async function processImageWithPrompt(chatId, base64Image, prompt, imageId) {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    bot.sendMessage(chatId, '🔄 Анализирую изображение с помощью Gemini AI...');
    
    // Определяем MIME тип (по умолчанию JPEG)
    const mimeType = 'image/jpeg';
    
    // Отправляем запрос к Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    
    console.log('✅ Ответ от Gemini получен');
    
    // Извлекаем текст из ответа
    let resultText = '';
    
    // Пробуем разные способы получения текста
    if (response.text) {
      resultText = response.text;
    } else if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        resultText = candidate.content.parts.map(p => p.text).join('');
      }
    }
    
    console.log('📝 Длина результата:', resultText?.length || 0);
    
    if (resultText && resultText.trim()) {
      // Разбиваем длинные сообщения на части (Telegram ограничение 4096 символов)
      const maxLength = 4000;
      if (resultText.length > maxLength) {
        const chunks = resultText.match(new RegExp(`.{1,${maxLength}}`, 'g'));
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk);
        }
      } else {
        await bot.sendMessage(chatId, `✨ Результат анализа:\n\n${resultText}`);
      }
    } else {
      console.log('⚠️ Пустой ответ от Gemini. Полный response:', JSON.stringify(response, null, 2));
      bot.sendMessage(chatId, '⚠️ Gemini не смог обработать изображение. Попробуйте другое изображение или промпт.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при обращении к Gemini AI:');
    console.error('Тип ошибки:', error.constructor.name);
    console.error('Сообщение:', error.message);
    console.error('Полная ошибка:', error);
    
    let errorMessage = '❌ Ошибка при обработке запроса.\n\n';
    
    if (error.message) {
      errorMessage += `Детали: ${error.message}`;
    }
    
    // Специфичные ошибки API
    if (error.message && error.message.includes('API key')) {
      errorMessage += '\n\n💡 Проверьте правильность API ключа Gemini в файле .env';
    } else if (error.message && error.message.includes('quota')) {
      errorMessage += '\n\n💡 Превышен лимит запросов API. Попробуйте позже.';
    } else if (error.message && error.message.includes('model')) {
      errorMessage += '\n\n💡 Проблема с моделью. Проверьте название модели в коде.';
    } else if (error.message && error.message.includes('permission')) {
      errorMessage += '\n\n💡 Проверьте права доступа вашего API ключа.';
    }
    
    bot.sendMessage(chatId, errorMessage);
  }
}

// Функция редактирования изображения с промптом
async function processImageEdit(chatId, base64Image, prompt, imageId) {
  try {
    await bot.sendChatAction(chatId, 'upload_photo');
    
    bot.sendMessage(chatId, '🎨 Редактирую изображение с помощью Gemini AI...\n⏳ Это может занять 10-30 секунд...');
    
    // Определяем MIME тип (по умолчанию JPEG)
    const mimeType = 'image/jpeg';
    
    console.log('🎨 Начинаем редактирование изображения');
    console.log('📝 Промпт:', prompt);
    
    // Отправляем запрос к Gemini для редактирования изображения
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Модель для генерации/редактирования изображений
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.7,
      }
    });
    
    console.log('✅ Ответ от Gemini получен');
    
    // Ищем отредактированное изображение в ответе
    let editedImageBase64 = null;
    let textResponse = '';
    
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            editedImageBase64 = part.inlineData.data;
            console.log('🖼️ Изображение найдено в ответе');
          }
          if (part.text) {
            textResponse = part.text;
          }
        }
      }
    }
    
    if (editedImageBase64) {
      // Преобразуем base64 обратно в Buffer
      const editedImageBuffer = Buffer.from(editedImageBase64, 'base64');
      
      console.log('📤 Отправляем отредактированное изображение');
      
      // Отправляем отредактированное изображение пользователю
      await bot.sendPhoto(chatId, editedImageBuffer, {
        caption: textResponse ? `✨ Готово!\n\n${textResponse}` : '✨ Изображение отредактировано!'
      });
      
      console.log('✅ Изображение успешно отправлено');
    } else {
      console.log('⚠️ Изображение не найдено в ответе');
      
      if (textResponse) {
        bot.sendMessage(chatId, `ℹ️ Gemini ответил:\n\n${textResponse}\n\n⚠️ Но не вернул отредактированное изображение.`);
      } else {
        bot.sendMessage(chatId, '⚠️ Gemini не смог отредактировать изображение. Попробуйте:\n\n• Более конкретный промпт\n• Другое изображение\n• Упростить запрос');
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при редактировании изображения:');
    console.error('Тип ошибки:', error.constructor.name);
    console.error('Сообщение:', error.message);
    console.error('Полная ошибка:', error);
    
    let errorMessage = '❌ Ошибка при редактировании изображения.\n\n';
    
    if (error.message) {
      errorMessage += `Детали: ${error.message}`;
    }
    
    // Специфичные ошибки API
    if (error.message && error.message.includes('API key')) {
      errorMessage += '\n\n💡 Проверьте правильность API ключа Gemini в файле .env';
    } else if (error.message && error.message.includes('quota')) {
      errorMessage += '\n\n💡 Превышен лимит запросов API. Попробуйте позже.';
    } else if (error.message && error.message.includes('model')) {
      errorMessage += '\n\n💡 Модель gemini-2.5-flash-image может быть недоступна.\nПроверьте доступность на ai.google.dev';
    } else if (error.message && error.message.includes('permission')) {
      errorMessage += '\n\n💡 Проверьте права доступа вашего API ключа.';
    } else if (error.message && error.message.includes('SAFETY')) {
      errorMessage += '\n\n💡 Запрос заблокирован фильтром безопасности. Попробуйте другой промпт.';
    }
    
    errorMessage += '\n\n💡 Попробуйте упростить запрос или использовать другое изображение.';
    
    bot.sendMessage(chatId, errorMessage);
  }
}

// Функция генерации изображения из текстового промпта
async function processImageGeneration(chatId, prompt) {
  try {
    await bot.sendChatAction(chatId, 'upload_photo');
    
    bot.sendMessage(chatId, '🖼️ Генерирую изображение с помощью Gemini AI...\n⏳ Это может занять 10-30 секунд...');
    
    console.log('🖼️ Начинаем генерацию изображения');
    console.log('📝 Промпт:', prompt);
    
    // Отправляем запрос к Gemini для генерации изображения
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Модель для генерации изображений
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        temperature: 0.8, // Более высокая температура для креативности
      }
    });
    
    console.log('✅ Ответ от Gemini получен');
    
    // Ищем сгенерированное изображение в ответе
    let generatedImageBase64 = null;
    let textResponse = '';
    
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            generatedImageBase64 = part.inlineData.data;
            console.log('🖼️ Изображение найдено в ответе');
          }
          if (part.text) {
            textResponse = part.text;
          }
        }
      }
    }
    
    if (generatedImageBase64) {
      // Преобразуем base64 обратно в Buffer
      const generatedImageBuffer = Buffer.from(generatedImageBase64, 'base64');
      
      console.log('📤 Отправляем сгенерированное изображение');
      
      // Отправляем сгенерированное изображение пользователю
      await bot.sendPhoto(chatId, generatedImageBuffer, {
        caption: textResponse ? `✨ Готово!\n\n${textResponse}` : '✨ Изображение сгенерировано!'
      });
      
      console.log('✅ Изображение успешно отправлено');
    } else {
      console.log('⚠️ Изображение не найдено в ответе');
      
      if (textResponse) {
        bot.sendMessage(chatId, `ℹ️ Gemini ответил:\n\n${textResponse}\n\n⚠️ Но не вернул сгенерированное изображение.`);
      } else {
        bot.sendMessage(chatId, '⚠️ Gemini не смог сгенерировать изображение. Попробуйте:\n\n• Более детальный промпт\n• Упростить описание\n• Изменить формулировку\n\n💡 Совет: Опишите конкретную сцену, стиль, цвета и настроение.');
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при генерации изображения:');
    console.error('Тип ошибки:', error.constructor.name);
    console.error('Сообщение:', error.message);
    console.error('Полная ошибка:', error);
    
    let errorMessage = '❌ Ошибка при генерации изображения.\n\n';
    
    if (error.message) {
      errorMessage += `Детали: ${error.message}`;
    }
    
    // Специфичные ошибки API
    if (error.message && error.message.includes('API key')) {
      errorMessage += '\n\n💡 Проверьте правильность API ключа Gemini в файле .env';
    } else if (error.message && error.message.includes('quota')) {
      errorMessage += '\n\n💡 Превышен лимит запросов API. Попробуйте позже.';
    } else if (error.message && error.message.includes('model')) {
      errorMessage += '\n\n💡 Модель gemini-2.5-flash-image может быть недоступна.\nПроверьте доступность на ai.google.dev';
    } else if (error.message && error.message.includes('permission')) {
      errorMessage += '\n\n💡 Проверьте права доступа вашего API ключа.';
    } else if (error.message && error.message.includes('SAFETY')) {
      errorMessage += '\n\n💡 Запрос заблокирован фильтром безопасности. Попробуйте другой промпт.';
    }
    
    errorMessage += '\n\n💡 Попробуйте упростить запрос или изменить формулировку.';
    
    bot.sendMessage(chatId, errorMessage);
  }
}

// Обработка ошибок polling
bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error.code, error.message);
});

// Очистка старых сессий (каждые 30 минут)
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 минут
  
  for (const [chatId, session] of userSessions.entries()) {
    if (now - session.timestamp > timeout) {
      userSessions.delete(chatId);
    }
  }
}, 30 * 60 * 1000);

