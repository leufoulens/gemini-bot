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

// Хранилище чат-сессий с Gemini
const chatSessions = new Map();

// Хранилище настроек чата для каждого пользователя
const chatConfigs = new Map();

console.log('🤖 Бот запущен и готов к работе!');

// Функция показа главного меню
function showMainMenu(chatId) {
  const keyboard = {
    keyboard: [
      [{ text: '💬 Чат с Gemini' }],
      [{ text: '🔍 Анализ изображений' }, { text: '🎨 Редактирование' }],
      [{ text: '🖼️ Генерация изображений' }, { text: '🎬 Генерация видео' }],
      [{ text: '🎥 Видео из фото' }],
      [{ text: '❓ Помощь' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
  
  const welcomeMessage = `
👋 **ГЛАВНОЕ МЕНЮ**

Я — Gemini AI бот для работы с изображениями и видео.

🔹 **Что я умею:**
• 💬 Вести беседу с настраиваемым AI
• 🔍 Анализировать изображения и текст
• 🎨 Редактировать изображения по промпту
• 🖼️ Создавать изображения из текста
• 🎬 Генерировать видео из текста
• 🎥 Создавать видео из фото

📝 **Выберите режим работы** используя кнопки ниже:
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { 
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
}

// Функция показа клавиатуры режима
function showModeKeyboard(chatId) {
  const keyboard = {
    keyboard: [
      [{ text: '🏠 Вернуться в меню' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
  
  return keyboard;
}

// Функция получения текста помощи
function getHelpMessage() {
  return `
🆘 **ПОМОЩЬ**

💬 **ЧАТ С GEMINI:**
Используйте кнопку "💬 Чат с Gemini" для открытия меню настройки чата.

Доступные настройки:
• 🤖 **Модель**: Gemini 2.5 Pro или Flash
• 🌡️ **Температура**: Низкая (точность) / Средняя / Высокая (креативность)
• 📊 **Длина ответов**: Короткие / Средние / Длинные / Очень длинные
• 💭 **Режим размышлений**: Включен / Выключен (только для Flash)

В режиме чата модель запоминает контекст всего разговора.

---

🔍 **АНАЛИЗ ИЗОБРАЖЕНИЙ:**
Отправьте изображение с подписью для анализа.

Примеры:
• "Опиши это изображение"
• "Извлеки текст с картинки"
• "Что ты видишь на фото?"

---

🎨 **РЕДАКТИРОВАНИЕ:**
Отправьте фото + инструкции по редактированию.

Примеры:
• "Замени синий диван на коричневый кожаный"
• "Добавь вязаную шляпу на голову кота"
• "Измени фон на пляжный пейзаж"

---

🖼️ **ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЙ:**
Отправьте текстовое описание желаемого изображения.

Примеры:
• "Нарисуй закат на море с парусником"
• "Создай изображение кота в космосе"
• "Футуристический город ночью"

---

🎬 **ГЕНЕРАЦИЯ ВИДЕО:**
Отправьте текстовое описание видео (10-60 сек генерация).

Примеры:
• "Водопад в тропическом лесу"
• "Машина едет по горной дороге на закате"
• "Полет над облаками"

---

🎥 **ВИДЕО ИЗ ФОТО:**
Отправьте фото + описание желаемого движения.

Примеры:
• "Добавь движение облаков и волн"
• "Оживи эту сцену с плавным движением камеры"

---

💡 **Совет:** Чем точнее промпт, тем лучше результат!
  `;
}

// Команда /start
bot.onText(/^\/start$/, (msg) => {
  const chatId = msg.chat.id;
  showMainMenu(chatId);
});

// Команда /help
bot.onText(/^\/help$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, getHelpMessage(), { 
    reply_markup: showModeKeyboard(chatId),
    parse_mode: 'Markdown'
  });
});

// Команда /edit - включить режим редактирования
bot.onText(/^\/edit$/, (msg) => {
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
  `, { reply_markup: showModeKeyboard(chatId) });
});

// Команда /analyze - включить режим анализа
bot.onText(/^\/analyze$/, (msg) => {
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
  `, { reply_markup: showModeKeyboard(chatId) });
});

// Команда /gen - включить режим генерации изображений
bot.onText(/^\/gen(?:\s+(.+))?$/, async (msg, match) => {
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
    `, { reply_markup: showModeKeyboard(chatId) });
  }
});

// Команда /genvideo - генерация видео из текстового промпта
bot.onText(/^\/genvideo(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const prompt = match[1]; // Текст после команды
  
  if (prompt) {
    // Если промпт указан сразу в команде
    await processVideoGeneration(chatId, prompt);
  } else {
    // Если промпт не указан, переходим в режим ожидания
    const session = userSessions.get(chatId) || {};
    session.mode = 'genvideo';
    session.timestamp = Date.now();
    userSessions.set(chatId, session);
    
    bot.sendMessage(chatId, `
🎬 **РЕЖИМ ГЕНЕРАЦИИ ВИДЕО АКТИВИРОВАН**

Теперь отправьте текстовое описание видео, которое вы хотите создать.

Примеры промптов:
• "Водопад в тропическом лесу с птицами"
• "Машина едет по горной дороге на закате"
• "Полет над облаками в золотой час"
• "Кот играет с красным мячиком на траве"
• "Город ночью с мерцающими огнями"

💡 Советы для лучшего результата:
✅ Описывайте движение и действия
✅ Указывайте детали сцены
✅ Добавляйте описание освещения и атмосферы
✅ Упоминайте кинематографические эффекты

⏱️ Генерация видео занимает 10-60 секунд. Пожалуйста, подождите!

Или используйте: /genvideo <описание> для быстрой генерации
    `, { reply_markup: showModeKeyboard(chatId) });
  }
});

// Команда /genvideofrompicture - генерация видео из изображения
bot.onText(/^\/genvideofrompicture$/, (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId) || {};
  session.mode = 'genvideofrompicture';
  session.timestamp = Date.now();
  userSessions.set(chatId, session);
  
  bot.sendMessage(chatId, `
🎥 **РЕЖИМ ГЕНЕРАЦИИ ВИДЕО ИЗ ФОТО АКТИВИРОВАН**

Теперь отправьте изображение с описанием желаемого движения или анимации.

Примеры промптов:
• "Добавь движение облаков и волн"
• "Оживи эту сцену с плавным движением камеры слева направо"
• "Добавь эффект кинематографического zoom in"
• "Создай эффект параллакса с движением на фоне"
• "Добавь легкое покачивание камеры как в документальном кино"

💡 Советы:
✅ Опишите, какое движение вы хотите видеть
✅ Укажите направление движения камеры
✅ Добавьте описание атмосферы и стиля
✅ Можно указать кинематографические приемы

⏱️ Генерация видео занимает 10-60 секунд. Пожалуйста, подождите!
  `, { reply_markup: showModeKeyboard(chatId) });
});

// Команда /clear
bot.onText(/^\/clear$/, (msg) => {
  const chatId = msg.chat.id;
  userSessions.delete(chatId);
  bot.sendMessage(chatId, '✅ История очищена!');
  showMainMenu(chatId);
});

// Команда /chat - показать меню настроек чата
bot.onText(/^\/chat$/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Инициализируем настройки по умолчанию, если их нет
    if (!chatConfigs.has(chatId)) {
      chatConfigs.set(chatId, getDefaultChatConfig());
    }
    
    // Показываем меню настроек
    await showChatConfigMenu(chatId);
    
  } catch (error) {
    console.error('❌ Ошибка при открытии меню настроек:', error);
    bot.sendMessage(chatId, '❌ Ошибка при открытии меню настроек. Попробуйте еще раз.');
  }
});

// Обработка callback-запросов (кнопки)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  try {
    // Отвечаем на callback для снятия "загрузки" кнопки
    await bot.answerCallbackQuery(query.id);
    
    if (data === 'end_chat') {
      // Закрываем чат-сессию (на случай если этот callback все еще используется)
      chatSessions.delete(chatId);
      
      // Удаляем inline-кнопку и отправляем сообщение о закрытии чата
      await bot.editMessageText(
        '✅ Чат закрыт. История разговора удалена.\n\nИспользуйте /chat, чтобы начать новый чат.',
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
      
      console.log(`✅ Чат закрыт для пользователя ${chatId}`);
      
    } else if (data === 'start_chat') {
      // Запуск чата с выбранными настройками
      await startChatWithConfig(chatId, query.message.message_id);
      
    } else if (data.startsWith('config_')) {
      // Обработка изменения настроек
      await handleConfigChange(chatId, data, query.message.message_id);
      
    }
  } catch (error) {
    console.error('❌ Ошибка при обработке callback:', error);
    await bot.answerCallbackQuery(query.id, {
      text: '❌ Произошла ошибка',
      show_alert: false
    });
  }
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
      } else if (mode === 'genvideofrompicture') {
        await processVideoGenerationFromImage(chatId, base64Image, caption, photo.file_unique_id);
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
      
      let modeText;
      if (mode === 'edit') {
        modeText = '🎨 Изображение получено! Теперь отправьте инструкции по редактированию.\n\nНапример:\n• "Замени фон на пляж"\n• "Добавь шляпу на голову"';
      } else if (mode === 'genvideofrompicture') {
        modeText = '🎥 Изображение получено! Теперь отправьте описание желаемого движения.\n\nНапример:\n• "Добавь движение облаков"\n• "Оживи сцену с плавным движением камеры"';
      } else {
        modeText = '📸 Изображение получено! Теперь отправьте ваш вопрос или промпт.\n\nНапример:\n• "Опиши это изображение"\n• "Что ты видишь?"';
      }
      
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
    const text = msg.text;
    
    // Обработка кнопок главного меню
    if (text === '💬 Чат с Gemini') {
      // Инициализируем настройки по умолчанию, если их нет
      if (!chatConfigs.has(chatId)) {
        chatConfigs.set(chatId, getDefaultChatConfig());
      }
      await showChatConfigMenu(chatId);
      return;
    }
    
    if (text === '🔍 Анализ изображений') {
      const session = userSessions.get(chatId) || {};
      session.mode = 'analyze';
      session.timestamp = Date.now();
      userSessions.set(chatId, session);
      
      await bot.sendMessage(chatId, `
🔍 **РЕЖИМ АНАЛИЗА АКТИВИРОВАН**

Теперь я буду анализировать и описывать ваши изображения.

📸 Отправьте изображение с подписью:
• "Опиши это изображение"
• "Извлеки текст с картинки"
• "Что ты видишь на фото?"
• "Определи объекты"
      `, { reply_markup: showModeKeyboard(chatId) });
      return;
    }
    
    if (text === '🎨 Редактирование') {
      const session = userSessions.get(chatId) || {};
      session.mode = 'edit';
      session.timestamp = Date.now();
      userSessions.set(chatId, session);
      
      await bot.sendMessage(chatId, `
🎨 **РЕЖИМ РЕДАКТИРОВАНИЯ АКТИВИРОВАН**

Теперь отправьте изображение с инструкциями по редактированию.

Примеры промптов:
• "Замени фон на горный пейзаж"
• "Добавь солнечные очки на лицо"
• "Измени цвет машины на красный"
• "Сделай изображение черно-белым"
      `, { reply_markup: showModeKeyboard(chatId) });
      return;
    }
    
    if (text === '🖼️ Генерация изображений') {
      const session = userSessions.get(chatId) || {};
      session.mode = 'generate';
      session.timestamp = Date.now();
      userSessions.set(chatId, session);
      
      await bot.sendMessage(chatId, `
🖼️ **РЕЖИМ ГЕНЕРАЦИИ ИЗОБРАЖЕНИЙ АКТИВИРОВАН**

Теперь отправьте текстовое описание изображения, которое вы хотите создать.

Примеры промптов:
• "Нарисуй закат на море с парусником"
• "Создай изображение кота в космосе"
• "Футуристический город ночью, неоновые огни"
• "Милый робот с букетом цветов, акварельный стиль"
      `, { reply_markup: showModeKeyboard(chatId) });
      return;
    }
    
    if (text === '🎬 Генерация видео') {
      const session = userSessions.get(chatId) || {};
      session.mode = 'genvideo';
      session.timestamp = Date.now();
      userSessions.set(chatId, session);
      
      await bot.sendMessage(chatId, `
🎬 **РЕЖИМ ГЕНЕРАЦИИ ВИДЕО АКТИВИРОВАН**

Теперь отправьте текстовое описание видео, которое вы хотите создать.

Примеры промптов:
• "Водопад в тропическом лесу с птицами"
• "Машина едет по горной дороге на закате"
• "Полет над облаками в золотой час"
• "Кот играет с красным мячиком на траве"

⏱️ Генерация видео занимает 10-60 секунд. Пожалуйста, подождите!
      `, { reply_markup: showModeKeyboard(chatId) });
      return;
    }
    
    if (text === '🎥 Видео из фото') {
      const session = userSessions.get(chatId) || {};
      session.mode = 'genvideofrompicture';
      session.timestamp = Date.now();
      userSessions.set(chatId, session);
      
      await bot.sendMessage(chatId, `
🎥 **РЕЖИМ ГЕНЕРАЦИИ ВИДЕО ИЗ ФОТО АКТИВИРОВАН**

Теперь отправьте изображение с описанием желаемого движения или анимации.

Примеры промптов:
• "Добавь движение облаков и волн"
• "Оживи эту сцену с плавным движением камеры слева направо"
• "Добавь эффект кинематографического zoom in"
• "Создай эффект параллакса с движением на фоне"

⏱️ Генерация видео занимает 10-60 секунд. Пожалуйста, подождите!
      `, { reply_markup: showModeKeyboard(chatId) });
      return;
    }
    
    if (text === '❓ Помощь') {
      await bot.sendMessage(chatId, getHelpMessage(), { 
        reply_markup: showModeKeyboard(chatId),
        parse_mode: 'Markdown'
      });
      return;
    }
    
    if (text === '🏠 Вернуться в меню') {
      // Очищаем сессию пользователя
      userSessions.delete(chatId);
      showMainMenu(chatId);
      return;
    }
    
    // Проверяем, нажата ли кнопка "Окончить чат"
    if (text === '❌ Окончить чат') {
      const chatSession = chatSessions.get(chatId);
      if (chatSession) {
        // Закрываем чат-сессию
        chatSessions.delete(chatId);
        
        // Возвращаем в главное меню
        await bot.sendMessage(chatId, '✅ Чат закрыт. История разговора удалена.');
        showMainMenu(chatId);
        
        console.log(`✅ Чат закрыт для пользователя ${chatId} через кнопку клавиатуры`);
        return;
      }
    }
    
    // Проверяем, есть ли активная чат-сессия
    const chatSession = chatSessions.get(chatId);
    if (chatSession) {
      await processChatMessage(chatId, text);
      return;
    }
    
    const userSession = userSessions.get(chatId);
    
    // Если пользователь в режиме генерации изображений и нет сохраненного изображения
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
    
    // Если пользователь в режиме генерации видео и нет сохраненного изображения
    if (userSession && userSession.mode === 'genvideo' && !userSession.imageData) {
      const prompt = msg.text;
      await processVideoGeneration(chatId, prompt);
      
      // Сохраняем режим после генерации
      userSessions.set(chatId, {
        mode: 'genvideo',
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
      } else if (mode === 'genvideofrompicture') {
        await processVideoGenerationFromImage(
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

// Функция получения настроек по умолчанию
function getDefaultChatConfig() {
  return {
    model: 'gemini-2.5-pro',
    temperature: 0.7,
    maxOutputTokens: 2048,
    thinkingEnabled: true,
    systemInstruction: null
  };
}

// Функция генерации текста с текущими настройками
function getConfigText(config) {
  const modelName = config.model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash';
  
  let tempText;
  if (config.temperature <= 0.3) {
    tempText = '❄️ Низкая (точные ответы)';
  } else if (config.temperature <= 0.7) {
    tempText = '🌤️ Средняя (сбалансировано)';
  } else {
    tempText = '🔥 Высокая (креативные ответы)';
  }
  
  let tokensText;
  if (config.maxOutputTokens <= 1024) {
    tokensText = '📝 Короткие (1024)';
  } else if (config.maxOutputTokens <= 2048) {
    tokensText = '📄 Средние (2048)';
  } else if (config.maxOutputTokens <= 4096) {
    tokensText = '📚 Длинные (4096)';
  } else {
    tokensText = '📖 Очень длинные (8192)';
  }
  
  const thinkingText = config.thinkingEnabled ? '🧠 Включен' : '⚡ Выключен';
  
  return `
⚙️ **НАСТРОЙКИ ЧАТА**

🤖 **Модель**: ${modelName}
🌡️ **Температура**: ${tempText}
📊 **Длина ответа**: ${tokensText}
💭 **Режим размышлений**: ${thinkingText}
${config.systemInstruction ? `\n📋 **Системная инструкция**: Установлена` : ''}

💡 Настройте параметры чата с помощью кнопок ниже, затем нажмите "Начать чат".
  `;
}

// Функция генерации клавиатуры настроек
function getChatConfigKeyboard(config) {
  const modelEmoji = config.model === 'gemini-2.5-pro' ? '🎓' : '⚡';
  
  let tempEmoji;
  if (config.temperature <= 0.3) tempEmoji = '❄️';
  else if (config.temperature <= 0.7) tempEmoji = '🌤️';
  else tempEmoji = '🔥';
  
  const thinkingEmoji = config.thinkingEnabled ? '🧠' : '⚡';
  
  return {
    inline_keyboard: [
      [
        { text: `${modelEmoji} Модель`, callback_data: 'config_model' }
      ],
      [
        { text: `${tempEmoji} Температура`, callback_data: 'config_temperature' }
      ],
      [
        { text: `📊 Длина ответа`, callback_data: 'config_tokens' }
      ],
      [
        { text: `${thinkingEmoji} Размышления`, callback_data: 'config_thinking' }
      ],
      [
        { text: '✅ Начать чат', callback_data: 'start_chat' }
      ]
    ]
  };
}

// Функция показа меню настроек
async function showChatConfigMenu(chatId, messageId = null) {
  const config = chatConfigs.get(chatId) || getDefaultChatConfig();
  const text = getConfigText(config);
  const keyboard = getChatConfigKeyboard(config);
  
  if (messageId) {
    // Обновляем существующее сообщение
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } else {
    // Отправляем новое сообщение
    await bot.sendMessage(chatId, text, {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  }
}

// Функция обработки изменения настроек
async function handleConfigChange(chatId, data, messageId) {
  const config = chatConfigs.get(chatId) || getDefaultChatConfig();
  
  if (data === 'config_model') {
    // Переключаем модель
    config.model = config.model === 'gemini-2.5-pro' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
    
  } else if (data === 'config_temperature') {
    // Переключаем температуру: 0.2 -> 0.7 -> 1.2 -> 0.2
    if (config.temperature <= 0.3) {
      config.temperature = 0.7;
    } else if (config.temperature <= 0.7) {
      config.temperature = 1.2;
    } else {
      config.temperature = 0.2;
    }
    
  } else if (data === 'config_tokens') {
    // Переключаем количество токенов: 1024 -> 2048 -> 4096 -> 8192 -> 1024
    if (config.maxOutputTokens <= 1024) {
      config.maxOutputTokens = 2048;
    } else if (config.maxOutputTokens <= 2048) {
      config.maxOutputTokens = 4096;
    } else if (config.maxOutputTokens <= 4096) {
      config.maxOutputTokens = 8192;
    } else {
      config.maxOutputTokens = 1024;
    }
    
  } else if (data === 'config_thinking') {
    // Переключаем режим размышлений
    config.thinkingEnabled = !config.thinkingEnabled;
  }
  
  // Сохраняем обновленную конфигурацию
  chatConfigs.set(chatId, config);
  
  // Обновляем меню настроек
  await showChatConfigMenu(chatId, messageId);
}

// Функция запуска чата с выбранными настройками
async function startChatWithConfig(chatId, configMessageId) {
  try {
    const config = chatConfigs.get(chatId) || getDefaultChatConfig();
    
    console.log(`💬 Запуск чата для пользователя ${chatId} с настройками:`, config);
    
    // Создаем конфигурацию для Gemini
    const chatConfig = {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    };
    
    // Добавляем настройку размышлений только для flash модели
    if (config.model === 'gemini-2.5-flash') {
      chatConfig.thinkingConfig = {
        thinkingBudget: config.thinkingEnabled ? undefined : 0
      };
    }
    
    // Создаем чат-сессию
    const chatOptions = {
      model: config.model,
      history: []
    };
    
    if (chatConfig) {
      chatOptions.config = chatConfig;
    }
    
    if (config.systemInstruction) {
      chatOptions.systemInstruction = config.systemInstruction;
    }
    
    const chat = ai.chats.create(chatOptions);
    
    // Сохраняем чат-сессию
    chatSessions.set(chatId, {
      chat: chat,
      config: config,
      timestamp: Date.now()
    });
    
    // Удаляем сообщение с настройками
    try {
      await bot.deleteMessage(chatId, configMessageId);
    } catch (e) {
      // Игнорируем ошибку, если не удалось удалить
    }
    
    // Создаем постоянную клавиатуру с кнопкой "Окончить чат"
    const keyboard = {
      keyboard: [
        [{ text: '❌ Окончить чат' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };
    
    const modelName = config.model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash';
    
    await bot.sendMessage(chatId, `
💬 **ЧАТ ОТКРЫТ**

🤖 Модель: **${modelName}**
🌡️ Температура: **${config.temperature}**
📊 Макс. токенов: **${config.maxOutputTokens}**
${config.model === 'gemini-2.5-flash' ? `💭 Размышления: **${config.thinkingEnabled ? 'Вкл' : 'Выкл'}**\n` : ''}
Теперь вы можете общаться с моделью. Я буду помнить контекст всего нашего разговора.

Просто отправляйте сообщения, и я буду на них отвечать!

💡 Чтобы закончить чат, нажмите кнопку на клавиатуре ниже.
    `, { reply_markup: keyboard });
    
    console.log(`✅ Чат успешно открыт для пользователя ${chatId}`);
    
  } catch (error) {
    console.error('❌ Ошибка при запуске чата:', error);
    bot.sendMessage(chatId, `❌ Ошибка при запуске чата:\n\n${error.message}\n\nПопробуйте еще раз с помощью /chat`);
  }
}

// Функция обработки сообщения в чате с Gemini 2.5 Pro
async function processChatMessage(chatId, message) {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const chatSession = chatSessions.get(chatId);
    if (!chatSession) {
      bot.sendMessage(chatId, '⚠️ Чат-сессия не найдена. Используйте /chat, чтобы начать новый чат.');
      return;
    }
    
    console.log(`💬 Получено сообщение в чате от пользователя ${chatId}: ${message}`);
    
    // Отправляем сообщение в чат и получаем ответ
    const response = await chatSession.chat.sendMessage({
      message: message
    });
    
    console.log('✅ Ответ от Gemini получен');
    
    // Извлекаем текст из ответа
    let resultText = '';
    
    if (response.text) {
      resultText = response.text;
    } else if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        resultText = candidate.content.parts.map(p => p.text).join('');
      }
    }
    
    console.log('📝 Длина ответа:', resultText?.length || 0);
    
    if (resultText && resultText.trim()) {
      // Разбиваем длинные сообщения на части (Telegram ограничение 4096 символов)
      const maxLength = 4000;
      if (resultText.length > maxLength) {
        const chunks = resultText.match(new RegExp(`.{1,${maxLength}}`, 'g'));
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk);
        }
      } else {
        await bot.sendMessage(chatId, resultText);
      }
    } else {
      console.log('⚠️ Пустой ответ от Gemini');
      bot.sendMessage(chatId, '⚠️ Gemini не смог ответить на ваше сообщение. Попробуйте переформулировать вопрос.');
    }
    
    // Обновляем timestamp сессии
    chatSession.timestamp = Date.now();
    chatSessions.set(chatId, chatSession);
    
  } catch (error) {
    console.error('❌ Ошибка при обработке сообщения в чате:');
    console.error('Тип ошибки:', error.constructor.name);
    console.error('Сообщение:', error.message);
    console.error('Полная ошибка:', error);
    
    let errorMessage = '❌ Ошибка при обработке сообщения.\n\n';
    
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

// Функция генерации видео из текстового промпта
async function processVideoGeneration(chatId, prompt) {
  let tempVideoPath = null;
  let statusMessage = null;
  
  try {
    await bot.sendChatAction(chatId, 'upload_video');
    
    statusMessage = await bot.sendMessage(chatId, '🎬 Генерирую видео с помощью Veo 3...\n⏳ Это может занять 10-60 секунд, пожалуйста подождите...');
    
    console.log('🎬 Начинаем генерацию видео');
    console.log('📝 Промпт:', prompt);
    
    // Отправляем запрос к Gemini для генерации видео
    let operation = await ai.models.generateVideos({
      model: 'veo-3.0-fast-generate-001', // Используем fast модель для более быстрой генерации
      prompt: prompt,
    });
    
    console.log('✅ Операция создана, начинаем polling...');
    
    // Polling операции до завершения
    let pollCount = 0;
    const maxPolls = 60; // Максимум 10 минут (60 * 10 секунд)
    
    while (!operation.done && pollCount < maxPolls) {
      console.log(`⏳ Ожидание генерации видео... (попытка ${pollCount + 1}/${maxPolls})`);
      
      // Обновляем статус каждые 3 попытки
      if (pollCount % 3 === 0 && pollCount > 0) {
        try {
          await bot.editMessageText(
            `🎬 Генерирую видео с помощью Veo 3...\n⏳ Прогресс: ${pollCount * 10} секунд...`,
            {
              chat_id: chatId,
              message_id: statusMessage.message_id
            }
          );
        } catch (e) {
          // Игнорируем ошибки при редактировании сообщения
        }
      }
      
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Ждем 10 секунд
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      pollCount++;
    }
    
    if (!operation.done) {
      console.log('⚠️ Превышено время ожидания генерации видео');
      try {
        await bot.editMessageText(
          '⚠️ Генерация видео занимает больше времени, чем ожидалось. Попробуйте упростить промпт или попробовать позже.',
          {
            chat_id: chatId,
            message_id: statusMessage.message_id
          }
        );
      } catch (e) {
        bot.sendMessage(chatId, '⚠️ Генерация видео занимает больше времени, чем ожидалось. Попробуйте упростить промпт или попробовать позже.');
      }
      return;
    }
    
    console.log('✅ Видео готово, скачиваем...');
    
    try {
      await bot.editMessageText(
        '🎬 Видео готово! Скачиваю и отправляю...',
        {
          chat_id: chatId,
          message_id: statusMessage.message_id
        }
      );
    } catch (e) {
      // Игнорируем ошибки при редактировании сообщения
    }
    
    // Получаем сгенерированное видео
    const generatedVideo = operation.response.generatedVideos[0];
    
    console.log('📝 Информация о видео:', JSON.stringify({
      hasVideo: !!generatedVideo.video,
      videoUri: generatedVideo.video?.uri,
      videoName: generatedVideo.video?.name,
    }, null, 2));
    
    // Скачиваем видео в временный файл
    tempVideoPath = path.join(process.cwd(), `temp_video_${chatId}_${Date.now()}.mp4`);
    
    console.log('📥 Скачиваем видео...');
    
    // Проверяем, есть ли URI для прямого скачивания
    if (generatedVideo.video.uri) {
      // Используем прямую ссылку для скачивания через axios
      console.log('🔗 Скачиваем по URI:', generatedVideo.video.uri);
      const videoResponse = await axios.get(generatedVideo.video.uri, {
        responseType: 'arraybuffer',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      fs.writeFileSync(tempVideoPath, videoResponse.data);
      console.log(`✅ Видео скачано через URI, размер: ${Math.round(videoResponse.data.length / 1024)} KB`);
    } else {
      // Используем метод SDK
      await ai.files.download({
        file: generatedVideo.video,
        downloadPath: tempVideoPath,
      });
      
      // Ждем, пока файл полностью запишется
      let fileExists = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 секунд максимум
      
      while (!fileExists && attempts < maxAttempts) {
        if (fs.existsSync(tempVideoPath)) {
          // Проверяем, что файл имеет размер > 0
          const stats = fs.statSync(tempVideoPath);
          if (stats.size > 0) {
            fileExists = true;
            console.log(`✅ Файл скачан через SDK, размер: ${Math.round(stats.size / 1024)} KB`);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      if (!fileExists) {
        throw new Error('Не удалось скачать видео файл');
      }
    }
    
    // Проверяем размер файла
    const stats = fs.statSync(tempVideoPath);
    console.log(`📊 Финальный размер файла: ${Math.round(stats.size / 1024)} KB (${stats.size} bytes)`);
    
    if (stats.size < 1000) {
      throw new Error(`Видео файл слишком маленький: ${stats.size} bytes. Возможно, файл поврежден или не загрузился полностью.`);
    }
    
    console.log('📤 Отправляем видео пользователю');
    
    // Отправляем видео пользователю через Buffer
    const videoBuffer = fs.readFileSync(tempVideoPath);
    await bot.sendVideo(chatId, videoBuffer, {
      caption: '✨ Видео сгенерировано с помощью Veo 3!',
      contentType: 'video/mp4'
    });
    
    console.log('✅ Видео успешно отправлено');
    
    // Удаляем статусное сообщение
    try {
      await bot.deleteMessage(chatId, statusMessage.message_id);
    } catch (e) {
      // Игнорируем ошибки при удалении сообщения
    }
    
  } catch (error) {
    console.error('❌ Ошибка при генерации видео:');
    console.error('Тип ошибки:', error.constructor.name);
    console.error('Сообщение:', error.message);
    console.error('Полная ошибка:', error);
    
    let errorMessage = '❌ Ошибка при генерации видео.\n\n';
    
    if (error.message) {
      errorMessage += `Детали: ${error.message}`;
    }
    
    // Специфичные ошибки API
    if (error.message && error.message.includes('API key')) {
      errorMessage += '\n\n💡 Проверьте правильность API ключа Gemini в файле .env';
    } else if (error.message && error.message.includes('quota')) {
      errorMessage += '\n\n💡 Превышен лимит запросов API. Попробуйте позже.';
    } else if (error.message && error.message.includes('model')) {
      errorMessage += '\n\n💡 Модель Veo 3 может быть недоступна.\nПроверьте доступность на ai.google.dev';
    } else if (error.message && error.message.includes('permission')) {
      errorMessage += '\n\n💡 Проверьте права доступа вашего API ключа.';
    } else if (error.message && error.message.includes('SAFETY')) {
      errorMessage += '\n\n💡 Запрос заблокирован фильтром безопасности. Попробуйте другой промпт.';
    }
    
    errorMessage += '\n\n💡 Попробуйте упростить запрос или изменить формулировку.';
    
    bot.sendMessage(chatId, errorMessage);
  } finally {
    // Всегда удаляем временный файл, если он был создан
    if (tempVideoPath && fs.existsSync(tempVideoPath)) {
      try {
        fs.unlinkSync(tempVideoPath);
        console.log('🗑️ Временный файл удален');
      } catch (e) {
        console.error('⚠️ Не удалось удалить временный файл:', e.message);
      }
    }
  }
}

// Функция генерации видео из изображения с промптом
async function processVideoGenerationFromImage(chatId, base64Image, prompt, imageId) {
  let tempVideoPath = null;
  let statusMessage = null;
  
  try {
    await bot.sendChatAction(chatId, 'upload_video');
    
    statusMessage = await bot.sendMessage(chatId, '🎥 Генерирую видео из изображения с помощью Veo 3...\n⏳ Это может занять 10-60 секунд, пожалуйста подождите...');
    
    console.log('🎥 Начинаем генерацию видео из изображения');
    console.log('📝 Промпт:', prompt);
    console.log('🖼️ Размер изображения (base64):', base64Image.length, 'символов');
    
    // SDK не работает с изображениями для Veo, используем прямой REST API
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-fast-generate-001:predictLongRunning';
    
    const requestBody = {
      instances: [{
        prompt: prompt,
        image: {
          bytesBase64Encoded: base64Image,
          mimeType: 'image/jpeg'
        }
      }]
    };
    
    console.log('📤 Отправляем запрос через REST API...');
    
    // Отправляем запрос напрямую через REST API
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Запрос отправлен, получен operation:', response.data.name);
    
    // Создаем operation объект для polling
    let operation = {
      name: response.data.name,
      done: false
    };
    
    console.log('✅ Операция создана, начинаем polling...');
    
    // Polling операции до завершения через REST API
    let pollCount = 0;
    const maxPolls = 60; // Максимум 10 минут (60 * 10 секунд)
    const operationUrl = `https://generativelanguage.googleapis.com/v1beta/${operation.name}`;
    
    while (!operation.done && pollCount < maxPolls) {
      console.log(`⏳ Ожидание генерации видео... (попытка ${pollCount + 1}/${maxPolls})`);
      
      // Обновляем статус каждые 3 попытки
      if (pollCount % 3 === 0 && pollCount > 0) {
        try {
          await bot.editMessageText(
            `🎥 Генерирую видео из изображения...\n⏳ Прогресс: ${pollCount * 10} секунд...`,
            {
              chat_id: chatId,
              message_id: statusMessage.message_id
            }
          );
        } catch (e) {
          // Игнорируем ошибки при редактировании сообщения
        }
      }
      
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Ждем 10 секунд
      
      // Проверяем статус операции через REST API
      const statusResponse = await axios.get(operationUrl, {
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY
        }
      });
      
      operation = statusResponse.data;
      pollCount++;
    }
    
    if (!operation.done) {
      console.log('⚠️ Превышено время ожидания генерации видео');
      try {
        await bot.editMessageText(
          '⚠️ Генерация видео занимает больше времени, чем ожидалось. Попробуйте упростить промпт или попробовать позже.',
          {
            chat_id: chatId,
            message_id: statusMessage.message_id
          }
        );
      } catch (e) {
        bot.sendMessage(chatId, '⚠️ Генерация видео занимает больше времени, чем ожидалось. Попробуйте упростить промпт или попробовать позже.');
      }
      return;
    }
    
    console.log('✅ Видео готово, скачиваем...');
    
    try {
      await bot.editMessageText(
        '🎥 Видео готово! Скачиваю и отправляю...',
        {
          chat_id: chatId,
          message_id: statusMessage.message_id
        }
      );
    } catch (e) {
      // Игнорируем ошибки при редактировании сообщения
    }
    
    // Получаем сгенерированное видео из REST API ответа
    // Формат: operation.response.generateVideoResponse.generatedSamples[0]
    const generateVideoResponse = operation.response?.generateVideoResponse;
    
    if (!generateVideoResponse || !generateVideoResponse.generatedSamples || generateVideoResponse.generatedSamples.length === 0) {
      throw new Error('Не удалось получить видео из ответа API');
    }
    
    const generatedSample = generateVideoResponse.generatedSamples[0];
    const videoUri = generatedSample.video?.uri;
    
    console.log('📝 Информация о видео:', JSON.stringify({
      hasVideo: !!generatedSample.video,
      videoUri: videoUri,
    }, null, 2));
    
    if (!videoUri) {
      throw new Error('Видео URI отсутствует в ответе');
    }
    
    // Скачиваем видео в временный файл
    tempVideoPath = path.join(process.cwd(), `temp_video_from_img_${chatId}_${Date.now()}.mp4`);
    
    console.log('📥 Скачиваем видео...');
    console.log('🔗 Скачиваем по URI:', videoUri);
    
    // Скачиваем видео напрямую по URI
    const videoResponse = await axios.get(videoUri, {
      responseType: 'arraybuffer',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    fs.writeFileSync(tempVideoPath, videoResponse.data);
    console.log(`✅ Видео скачано, размер: ${Math.round(videoResponse.data.length / 1024)} KB`);
    
    // Проверяем размер файла
    const stats = fs.statSync(tempVideoPath);
    console.log(`📊 Финальный размер файла: ${Math.round(stats.size / 1024)} KB (${stats.size} bytes)`);
    
    if (stats.size < 1000) {
      throw new Error(`Видео файл слишком маленький: ${stats.size} bytes. Возможно, файл поврежден или не загрузился полностью.`);
    }
    
    console.log('📤 Отправляем видео пользователю');
    
    // Отправляем видео пользователю через Buffer
    const videoBuffer = fs.readFileSync(tempVideoPath);
    await bot.sendVideo(chatId, videoBuffer, {
      caption: '✨ Видео сгенерировано из изображения с помощью Veo 3!',
      contentType: 'video/mp4'
    });
    
    console.log('✅ Видео успешно отправлено');
    
    // Удаляем статусное сообщение
    try {
      await bot.deleteMessage(chatId, statusMessage.message_id);
    } catch (e) {
      // Игнорируем ошибки при удалении сообщения
    }
    
  } catch (error) {
    console.error('❌ Ошибка при генерации видео из изображения:');
    console.error('Тип ошибки:', error.constructor.name);
    console.error('Сообщение:', error.message);
    console.error('Полная ошибка:', error);
    
    let errorMessage = '❌ Ошибка при генерации видео из изображения.\n\n';
    
    if (error.message) {
      errorMessage += `Детали: ${error.message}`;
    }
    
    // Специфичные ошибки API
    if (error.message && error.message.includes('API key')) {
      errorMessage += '\n\n💡 Проверьте правильность API ключа Gemini в файле .env';
    } else if (error.message && error.message.includes('quota')) {
      errorMessage += '\n\n💡 Превышен лимит запросов API. Попробуйте позже.';
    } else if (error.message && error.message.includes('model')) {
      errorMessage += '\n\n💡 Модель Veo 3 может быть недоступна.\nПроверьте доступность на ai.google.dev';
    } else if (error.message && error.message.includes('permission')) {
      errorMessage += '\n\n💡 Проверьте права доступа вашего API ключа.';
    } else if (error.message && error.message.includes('SAFETY')) {
      errorMessage += '\n\n💡 Запрос заблокирован фильтром безопасности. Попробуйте другой промпт.';
    }
    
    errorMessage += '\n\n💡 Попробуйте упростить запрос или использовать другое изображение.';
    
    bot.sendMessage(chatId, errorMessage);
  } finally {
    // Всегда удаляем временный файл, если он был создан
    if (tempVideoPath && fs.existsSync(tempVideoPath)) {
      try {
        fs.unlinkSync(tempVideoPath);
        console.log('🗑️ Временный файл удален');
      } catch (e) {
        console.error('⚠️ Не удалось удалить временный файл:', e.message);
      }
    }
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
  
  // Очистка пользовательских сессий
  for (const [chatId, session] of userSessions.entries()) {
    if (now - session.timestamp > timeout) {
      userSessions.delete(chatId);
      console.log(`🗑️ Удалена старая сессия пользователя ${chatId}`);
    }
  }
  
  // Очистка чат-сессий
  for (const [chatId, chatSession] of chatSessions.entries()) {
    if (now - chatSession.timestamp > timeout) {
      chatSessions.delete(chatId);
      console.log(`🗑️ Удалена старая чат-сессия пользователя ${chatId}`);
    }
  }
}, 30 * 60 * 1000);


