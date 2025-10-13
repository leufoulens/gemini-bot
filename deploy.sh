#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода заголовка
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Gemini Telegram Bot Manager${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Функция для проверки .env файла
check_env() {
    if [ ! -f .env ]; then
        echo -e "${RED}❌ Файл .env не найден!${NC}"
        echo -e "${YELLOW}Создайте файл .env с необходимыми переменными:${NC}"
        echo ""
        echo "TELEGRAM_BOT_TOKEN=your_token_here"
        echo "GEMINI_API_KEY=your_api_key_here"
        echo ""
        return 1
    fi
    
    # Проверка наличия обязательных переменных
    if ! grep -q "TELEGRAM_BOT_TOKEN=" .env || ! grep -q "GEMINI_API_KEY=" .env; then
        echo -e "${RED}❌ В файле .env отсутствуют обязательные переменные!${NC}"
        echo -e "${YELLOW}Убедитесь, что файл .env содержит:${NC}"
        echo "  - TELEGRAM_BOT_TOKEN"
        echo "  - GEMINI_API_KEY"
        return 1
    fi
    
    return 0
}

# Функция для запуска бота
start_bot() {
    echo -e "${GREEN}🚀 Запуск бота...${NC}"
    
    if ! check_env; then
        return 1
    fi
    
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Бот успешно запущен!${NC}"
        echo ""
        echo "Для просмотра логов используйте:"
        echo "  ./deploy.sh logs"
        echo ""
        echo "Или:"
        echo "  docker-compose logs -f"
    else
        echo -e "${RED}❌ Ошибка при запуске бота${NC}"
        return 1
    fi
}

# Функция для остановки бота
stop_bot() {
    echo -e "${YELLOW}⏸️  Остановка бота...${NC}"
    docker-compose down
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Бот остановлен${NC}"
    else
        echo -e "${RED}❌ Ошибка при остановке бота${NC}"
        return 1
    fi
}

# Функция для перезапуска бота
restart_bot() {
    echo -e "${YELLOW}🔄 Перезапуск бота...${NC}"
    docker-compose restart
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Бот перезапущен${NC}"
    else
        echo -e "${RED}❌ Ошибка при перезапуске бота${NC}"
        return 1
    fi
}

# Функция для просмотра логов
show_logs() {
    echo -e "${BLUE}📋 Просмотр логов (Ctrl+C для выхода)...${NC}"
    echo ""
    docker-compose logs -f
}

# Функция для проверки статуса
show_status() {
    echo -e "${BLUE}📊 Статус контейнеров:${NC}"
    echo ""
    docker-compose ps
    echo ""
    
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Бот работает${NC}"
    else
        echo -e "${RED}❌ Бот остановлен${NC}"
    fi
}

# Функция для обновления бота
update_bot() {
    echo -e "${BLUE}🔄 Обновление бота...${NC}"
    
    # Проверяем, есть ли изменения в git
    if [ -d .git ]; then
        echo "Получение последних изменений из репозитория..."
        git pull
    fi
    
    echo "Пересборка Docker образа..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Бот успешно обновлен!${NC}"
    else
        echo -e "${RED}❌ Ошибка при обновлении бота${NC}"
        return 1
    fi
}

# Функция для очистки
cleanup() {
    echo -e "${YELLOW}🧹 Очистка Docker ресурсов...${NC}"
    docker-compose down -v
    docker system prune -f
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Очистка завершена${NC}"
    else
        echo -e "${RED}❌ Ошибка при очистке${NC}"
        return 1
    fi
}

# Интерактивное меню
show_menu() {
    print_header
    echo "Выберите действие:"
    echo ""
    echo "  1) Запустить бота"
    echo "  2) Остановить бота"
    echo "  3) Перезапустить бота"
    echo "  4) Просмотреть логи"
    echo "  5) Проверить статус"
    echo "  6) Обновить бота"
    echo "  7) Очистка (удаление контейнеров и volumes)"
    echo "  8) Выход"
    echo ""
    read -p "Введите номер (1-8): " choice
    
    case $choice in
        1) start_bot ;;
        2) stop_bot ;;
        3) restart_bot ;;
        4) show_logs ;;
        5) show_status ;;
        6) update_bot ;;
        7) cleanup ;;
        8) exit 0 ;;
        *) 
            echo -e "${RED}❌ Неверный выбор${NC}"
            exit 1
            ;;
    esac
}

# Основная логика
main() {
    # Проверка наличия Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker не установлен!${NC}"
        echo "Установите Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Проверка наличия docker-compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose не установлен!${NC}"
        echo "Установите Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Если аргументы не переданы, показываем меню
    if [ $# -eq 0 ]; then
        show_menu
        exit 0
    fi
    
    # Обработка аргументов командной строки
    case "$1" in
        start)
            print_header
            start_bot
            ;;
        stop)
            print_header
            stop_bot
            ;;
        restart)
            print_header
            restart_bot
            ;;
        logs)
            print_header
            show_logs
            ;;
        status)
            print_header
            show_status
            ;;
        update)
            print_header
            update_bot
            ;;
        cleanup)
            print_header
            cleanup
            ;;
        *)
            print_header
            echo -e "${RED}❌ Неизвестная команда: $1${NC}"
            echo ""
            echo "Использование:"
            echo "  ./deploy.sh [команда]"
            echo ""
            echo "Доступные команды:"
            echo "  start    - Запустить бота"
            echo "  stop     - Остановить бота"
            echo "  restart  - Перезапустить бота"
            echo "  logs     - Просмотреть логи"
            echo "  status   - Проверить статус"
            echo "  update   - Обновить бота"
            echo "  cleanup  - Очистка Docker ресурсов"
            echo ""
            echo "Без аргументов запускается интерактивное меню"
            exit 1
            ;;
    esac
}

# Запуск
main "$@"
