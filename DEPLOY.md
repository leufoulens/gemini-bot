# 🚀 Руководство по деплою

Инструкции по развертыванию Gemini Telegram Bot на сервере с использованием Docker.

---

## 📋 Предварительные требования

### На сервере должны быть установлены:

1. **Docker** (версия 20.10+)
   ```bash
   docker --version
   ```

2. **Docker Compose** (версия 2.0+)
   ```bash
   docker-compose --version
   ```

### Если Docker не установлен:

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**После установки перелогиньтесь или выполните:**
```bash
newgrp docker
```

---

## 🔧 Настройка проекта

### 1. Клонирование на сервер

```bash
# SSH в ваш сервер
ssh user@your-server.com

# Клонирование репозитория (или загрузка файлов)
git clone <your-repo-url> gemini-bot
cd gemini-bot

# Или загрузка через SCP
# scp -r /local/path/gemini-bot user@server:/path/to/
```

### 2. Настройка переменных окружения

```bash
# Создайте .env файл
nano .env
```

**Содержимое .env:**
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

**Сохраните:** `Ctrl+X`, затем `Y`, затем `Enter`

### 3. Проверка файловой структуры

```bash
ls -la
```

Должны быть:
- ✅ Dockerfile
- ✅ docker-compose.yml
- ✅ .env
- ✅ .dockerignore
- ✅ index.js
- ✅ package.json

---

## 🐳 Деплой с Docker Compose (Рекомендуется)

### Запуск бота

```bash
# Сборка и запуск в фоновом режиме
docker-compose up -d --build
```

### Проверка статуса

```bash
# Просмотр запущенных контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Просмотр последних 100 строк
docker-compose logs --tail=100
```

### Остановка бота

```bash
# Остановка
docker-compose stop

# Остановка и удаление контейнера
docker-compose down

# Остановка с удалением образов
docker-compose down --rmi all
```

### Перезапуск бота

```bash
# Перезапуск
docker-compose restart

# Пересборка и перезапуск
docker-compose up -d --build
```

### Обновление кода

```bash
# 1. Получите обновления
git pull  # или загрузите новые файлы

# 2. Пересоберите и перезапустите
docker-compose up -d --build
```

---

## 🐳 Деплой с обычным Docker

### Сборка образа

```bash
docker build -t gemini-telegram-bot:latest .
```

### Запуск контейнера

```bash
docker run -d \
  --name gemini-bot \
  --restart unless-stopped \
  --env-file .env \
  --memory="512m" \
  --cpus="1.0" \
  gemini-telegram-bot:latest
```

### Управление контейнером

```bash
# Просмотр логов
docker logs -f gemini-bot

# Остановка
docker stop gemini-bot

# Запуск
docker start gemini-bot

# Перезапуск
docker restart gemini-bot

# Удаление
docker rm -f gemini-bot

# Просмотр статистики
docker stats gemini-bot
```

---

## 📊 Мониторинг

### Просмотр логов в реальном времени

```bash
docker-compose logs -f gemini-bot
```

### Проверка использования ресурсов

```bash
docker stats gemini-telegram-bot
```

### Проверка здоровья контейнера

```bash
docker inspect --format='{{.State.Health.Status}}' gemini-telegram-bot
```

### Вход в контейнер (для отладки)

```bash
docker exec -it gemini-telegram-bot sh
```

---

## 🔄 Автоматический перезапуск

Контейнер настроен с политикой `restart: unless-stopped`, что означает:

- ✅ Автоматический перезапуск при падении
- ✅ Перезапуск после перезагрузки сервера
- ❌ Не перезапускается, если остановлен вручную

---

## 🔐 Безопасность

### 1. Защита .env файла

```bash
# Установите правильные права доступа
chmod 600 .env
```

### 2. Firewall

```bash
# Docker не требует открытия портов для Telegram бота
# Убедитесь, что исходящие соединения разрешены
```

### 3. Обновления

```bash
# Регулярно обновляйте базовый образ
docker-compose pull
docker-compose up -d --build
```

---

## 📈 Production настройки

### 1. Ограничение ресурсов

Уже настроено в `docker-compose.yml`:
- CPU: до 1 ядра
- RAM: до 512 MB

### 2. Логирование

Логи ограничены:
- Максимальный размер файла: 10 MB
- Количество файлов: 3
- Итого: до 30 MB логов

### 3. Мониторинг логов

```bash
# Установка размера ротации логов
docker-compose down
# Отредактируйте docker-compose.yml если нужно
docker-compose up -d
```

---

## 🔧 Решение проблем

### Проблема: Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs

# Проверьте .env файл
cat .env

# Проверьте синтаксис docker-compose.yml
docker-compose config
```

### Проблема: Бот не отвечает

```bash
# Проверьте логи
docker-compose logs -f

# Проверьте healthcheck
docker inspect --format='{{.State.Health.Status}}' gemini-telegram-bot

# Перезапустите
docker-compose restart
```

### Проблема: Нехватка памяти

```bash
# Увеличьте лимит в docker-compose.yml
# Затем:
docker-compose up -d --force-recreate
```

### Проблема: Контейнер постоянно перезапускается

```bash
# Проверьте логи на ошибки
docker-compose logs --tail=100

# Возможные причины:
# 1. Неверные API ключи в .env
# 2. Ошибка в коде
# 3. Нехватка ресурсов
```

---

## 📦 Резервное копирование

### Сохранение логов

```bash
docker-compose logs > backup-logs-$(date +%Y%m%d).txt
```

### Резервное копирование .env

```bash
cp .env .env.backup
```

---

## 🚀 CI/CD Integration

### GitHub Actions пример

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/gemini-bot
            git pull
            docker-compose up -d --build
```

---

## 📊 Полезные команды

### Просмотр всех контейнеров

```bash
docker ps -a
```

### Очистка неиспользуемых ресурсов

```bash
# Удаление остановленных контейнеров
docker container prune

# Удаление неиспользуемых образов
docker image prune -a

# Полная очистка
docker system prune -a --volumes
```

### Экспорт образа

```bash
# Сохранение образа в файл
docker save gemini-telegram-bot:latest | gzip > gemini-bot.tar.gz

# Загрузка образа на другом сервере
docker load < gemini-bot.tar.gz
```

---

## 🌐 Деплой на разных платформах

### Docker Hub

```bash
# Тегирование
docker tag gemini-telegram-bot:latest yourusername/gemini-bot:latest

# Публикация
docker push yourusername/gemini-bot:latest

# Использование на другом сервере
docker pull yourusername/gemini-bot:latest
docker run -d --env-file .env yourusername/gemini-bot:latest
```

### Использование с Docker Swarm

```bash
# Инициализация Swarm
docker swarm init

# Деплой стека
docker stack deploy -c docker-compose.yml gemini-bot

# Масштабирование
docker service scale gemini-bot_gemini-bot=3
```

---

## ✅ Чеклист перед деплоем

- [ ] Docker установлен на сервере
- [ ] Docker Compose установлен
- [ ] Файлы проекта загружены на сервер
- [ ] .env файл создан и заполнен
- [ ] .env имеет права 600
- [ ] Dockerfile присутствует
- [ ] docker-compose.yml присутствует
- [ ] Протестированы API ключи локально
- [ ] Firewall настроен (исходящие соединения)
- [ ] План мониторинга подготовлен

---

## 🎉 Готово!

После выполнения всех шагов ваш бот будет работать 24/7 на сервере.

**Проверка работы:**
1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`
4. Отправьте тестовое изображение

---

**Дополнительная помощь:**
- Docker документация: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Telegram Bot API: https://core.telegram.org/bots/api



