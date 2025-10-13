# 🐳 Руководство по развертыванию с Docker

Это руководство поможет вам развернуть Gemini Telegram Bot с помощью Docker и Docker Compose.

## 📋 Предварительные требования

Перед началом убедитесь, что у вас установлено:

1. **Docker** (версия 20.10 или выше)
   - [Инструкция по установке Docker](https://docs.docker.com/get-docker/)
   
2. **Docker Compose** (версия 2.0 или выше)
   - [Инструкция по установке Docker Compose](https://docs.docker.com/compose/install/)

Проверить установку можно командами:
```bash
docker --version
docker-compose --version
```

## 🚀 Быстрый старт

### 1. Подготовка переменных окружения

Создайте файл `.env` в корневой директории проекта:

```bash
# Linux/macOS
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
EOF
```

Или скопируйте из примера (если есть):
```bash
cp .env.example .env
```

Затем отредактируйте `.env` файл и укажите свои токены:

```env
# Telegram Bot Token (получить у @BotFather)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Gemini API Key (получить на https://ai.google.dev/)
GEMINI_API_KEY=AIzaSyABC123DEF456GHI789JKL012MNO345PQR
```

### 2. Запуск бота

#### Вариант 1: С помощью скрипта (рекомендуется)

```bash
./deploy.sh start
```

#### Вариант 2: Напрямую через docker-compose

```bash
docker-compose up -d --build
```

### 3. Проверка статуса

```bash
./deploy.sh status
```

Или:

```bash
docker-compose ps
```

## 📖 Управление ботом

### Интерактивное меню

Запустите скрипт без аргументов для интерактивного меню:

```bash
./deploy.sh
```

Вы увидите меню с опциями:
- Запустить бота
- Остановить бота
- Перезапустить бота
- Просмотреть логи
- Проверить статус
- Обновить бота
- Очистка

### Команды

#### Запуск бота

```bash
./deploy.sh start
```

Или:
```bash
docker-compose up -d --build
```

#### Остановка бота

```bash
./deploy.sh stop
```

Или:
```bash
docker-compose down
```

#### Перезапуск бота

```bash
./deploy.sh restart
```

Или:
```bash
docker-compose restart
```

#### Просмотр логов

```bash
./deploy.sh logs
```

Или:
```bash
docker-compose logs -f
```

Для просмотра последних N строк:
```bash
docker-compose logs --tail=100 -f
```

#### Проверка статуса

```bash
./deploy.sh status
```

Или:
```bash
docker-compose ps
```

#### Обновление бота

```bash
./deploy.sh update
```

Эта команда:
1. Получает последние изменения из git (если репозиторий)
2. Останавливает текущий контейнер
3. Пересобирает Docker образ без кэша
4. Запускает новый контейнер

Или вручную:
```bash
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Очистка ресурсов

```bash
./deploy.sh cleanup
```

Эта команда удаляет:
- Контейнеры
- Volumes
- Неиспользуемые Docker ресурсы

## 🔍 Мониторинг и диагностика

### Просмотр логов в реальном времени

```bash
docker-compose logs -f gemini-bot
```

### Просмотр использования ресурсов

```bash
docker stats gemini-bot
```

### Вход в контейнер для отладки

```bash
docker-compose exec gemini-bot sh
```

### Проверка переменных окружения в контейнере

```bash
docker-compose exec gemini-bot env
```

## ⚙️ Конфигурация

### Настройка ресурсов

По умолчанию в `docker-compose.yml` установлены следующие ограничения:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

Вы можете изменить эти значения в соответствии с вашими потребностями:

```bash
nano docker-compose.yml
```

### Настройка автоматического перезапуска

По умолчанию контейнер настроен на автоматический перезапуск:

```yaml
restart: unless-stopped
```

Доступные опции:
- `no` - не перезапускать автоматически
- `always` - всегда перезапускать
- `on-failure` - перезапускать только при ошибке
- `unless-stopped` - перезапускать, если не остановлен вручную

### Настройка логирования

Логи ограничены по размеру:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

Это означает:
- Максимальный размер одного файла лога: 10 МБ
- Количество ротируемых файлов: 3
- Максимальный общий размер логов: 30 МБ

### Настройка часового пояса

В `docker-compose.yml` установлен часовой пояс:

```yaml
environment:
  - TZ=Europe/Moscow
```

Измените на свой часовой пояс, если необходимо:
```yaml
environment:
  - TZ=America/New_York  # Например, для Нью-Йорка
```

## 🔒 Безопасность

### Защита переменных окружения

1. **Никогда не коммитьте файл `.env` в git**
   
   Убедитесь, что `.env` есть в `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Используйте надежные токены**
   
   Не используйте одни и те же токены для разработки и продакшена.

3. **Ограничьте права доступа к .env**
   
   ```bash
   chmod 600 .env
   ```

### Обновления безопасности

Регулярно обновляйте Docker образ:

```bash
docker-compose pull
docker-compose up -d
```

Или через скрипт:

```bash
./deploy.sh update
```

## 🐛 Решение проблем

### Контейнер не запускается

1. Проверьте логи:
   ```bash
   docker-compose logs gemini-bot
   ```

2. Проверьте, что `.env` файл существует и содержит правильные значения:
   ```bash
   cat .env
   ```

3. Проверьте, что порты не заняты:
   ```bash
   docker-compose ps
   ```

### Ошибка "API key not valid"

1. Проверьте правильность `GEMINI_API_KEY` в файле `.env`
2. Убедитесь, что нет пробелов и кавычек вокруг значения
3. Создайте новый API ключ на [ai.google.dev](https://ai.google.dev/)

### Ошибка "Conflict: terminated by other getUpdates request"

Это означает, что бот уже запущен в другом месте.

Решение:
1. Остановите все экземпляры бота
2. Подождите 1-2 минуты
3. Запустите снова

```bash
docker-compose down
# Подождите 1-2 минуты
docker-compose up -d
```

### Контейнер постоянно перезапускается

1. Проверьте логи для выявления ошибок:
   ```bash
   docker-compose logs --tail=50 gemini-bot
   ```

2. Проверьте использование ресурсов:
   ```bash
   docker stats gemini-bot
   ```

3. Увеличьте лимиты памяти в `docker-compose.yml` если необходимо

### Проблемы с сетью

Если бот не может подключиться к Telegram или Gemini API:

1. Проверьте сетевое подключение:
   ```bash
   docker-compose exec gemini-bot ping -c 3 8.8.8.8
   ```

2. Проверьте DNS:
   ```bash
   docker-compose exec gemini-bot nslookup api.telegram.org
   ```

3. Если используете прокси, настройте его в `docker-compose.yml`:
   ```yaml
   environment:
     - HTTP_PROXY=http://proxy.example.com:8080
     - HTTPS_PROXY=http://proxy.example.com:8080
   ```

## 📊 Производительность

### Мониторинг использования ресурсов

Постоянный мониторинг:
```bash
docker stats gemini-bot
```

Или через скрипт:
```bash
watch -n 1 'docker stats gemini-bot --no-stream'
```

### Оптимизация

1. **Очистка неиспользуемых образов:**
   ```bash
   docker image prune -a
   ```

2. **Очистка volumes:**
   ```bash
   docker volume prune
   ```

3. **Полная очистка системы:**
   ```bash
   docker system prune -a --volumes
   ```

## 🔄 Бэкап и восстановление

### Создание бэкапа конфигурации

```bash
# Создать бэкап .env файла
cp .env .env.backup.$(date +%Y%m%d)

# Создать архив проекта
tar -czf gemini-bot-backup-$(date +%Y%m%d).tar.gz \
  .env \
  docker-compose.yml \
  Dockerfile \
  index.js \
  package.json \
  package-lock.json
```

### Восстановление из бэкапа

```bash
# Распаковать архив
tar -xzf gemini-bot-backup-YYYYMMDD.tar.gz

# Восстановить .env
cp .env.backup.YYYYMMDD .env

# Перезапустить бота
./deploy.sh restart
```

## 🚀 Развертывание на сервере

### На VPS/Dedicated сервере

1. Установите Docker и Docker Compose
2. Клонируйте репозиторий:
   ```bash
   git clone <your-repo-url>
   cd gemini-bot
   ```
3. Настройте `.env` файл
4. Запустите:
   ```bash
   ./deploy.sh start
   ```

### Автозапуск при перезагрузке сервера

Docker Compose с `restart: unless-stopped` автоматически запускает контейнер при загрузке системы.

Убедитесь, что Docker настроен на автозапуск:
```bash
sudo systemctl enable docker
```

### Настройка systemd service (опционально)

Создайте systemd service для дополнительного контроля:

```bash
sudo nano /etc/systemd/system/gemini-bot.service
```

Содержимое:
```ini
[Unit]
Description=Gemini Telegram Bot
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/gemini-bot
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Активируйте service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable gemini-bot
sudo systemctl start gemini-bot
```

## 📝 Дополнительные команды

### Просмотр информации о контейнере

```bash
docker inspect gemini-bot
```

### Экспорт и импорт образа

Экспорт:
```bash
docker save -o gemini-bot-image.tar gemini-bot_gemini-bot
```

Импорт:
```bash
docker load -i gemini-bot-image.tar
```

### Создание снапшота контейнера

```bash
docker commit gemini-bot gemini-bot-snapshot:$(date +%Y%m%d)
```

## 🔗 Полезные ссылки

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)

## 💡 Советы

1. **Регулярно проверяйте логи** для выявления проблем
2. **Обновляйте зависимости** регулярно для безопасности
3. **Делайте бэкапы** конфигурации и данных
4. **Мониторьте использование ресурсов** для оптимизации
5. **Используйте `.env` файл** для хранения секретов, не добавляйте их в код

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи: `./deploy.sh logs`
2. Проверьте статус: `./deploy.sh status`
3. Перезапустите бота: `./deploy.sh restart`
4. Изучите раздел "Решение проблем" выше
5. Проверьте Issues в репозитории проекта

---

**Удачи в использовании бота! 🚀**
