#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Проверка установки Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен!"
        echo "Установите Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose не установлен!"
        echo "Установите Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker и Docker Compose установлены"
}

# Проверка .env файла
check_env() {
    if [ ! -f .env ]; then
        print_error "Файл .env не найден!"
        print_info "Создание .env из .env.example..."
        
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Отредактируйте .env файл с вашими ключами:"
            echo "  nano .env"
            exit 1
        else
            print_error ".env.example не найден!"
            exit 1
        fi
    fi
    
    # Проверка содержимого .env
    if grep -q "your_telegram_bot_token_here" .env || grep -q "your_gemini_api_key_here" .env; then
        print_error ".env содержит значения по умолчанию!"
        print_warning "Отредактируйте .env файл с реальными ключами:"
        echo "  nano .env"
        exit 1
    fi
    
    print_success "Файл .env настроен"
}

# Запуск бота
start_bot() {
    print_info "Запуск Gemini Telegram Bot..."
    
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        print_success "Бот успешно запущен!"
        print_info "Просмотр логов: docker-compose logs -f"
    else
        print_error "Ошибка при запуске бота"
        exit 1
    fi
}

# Остановка бота
stop_bot() {
    print_info "Остановка бота..."
    docker-compose stop
    print_success "Бот остановлен"
}

# Перезапуск бота
restart_bot() {
    print_info "Перезапуск бота..."
    docker-compose restart
    print_success "Бот перезапущен"
}

# Просмотр логов
view_logs() {
    print_info "Просмотр логов (Ctrl+C для выхода)..."
    docker-compose logs -f
}

# Просмотр статуса
status() {
    print_info "Статус контейнеров:"
    docker-compose ps
    
    echo ""
    print_info "Использование ресурсов:"
    docker stats --no-stream gemini-telegram-bot 2>/dev/null || echo "Контейнер не запущен"
}

# Обновление бота
update_bot() {
    print_info "Обновление бота..."
    
    # Если используется git
    if [ -d .git ]; then
        print_info "Получение обновлений из git..."
        git pull
    fi
    
    print_info "Пересборка и перезапуск..."
    docker-compose up -d --build
    
    print_success "Бот обновлен!"
}

# Полное удаление
cleanup() {
    print_warning "Это удалит все контейнеры и образы!"
    read -p "Продолжить? (y/N): " confirm
    
    if [[ $confirm == [yY] ]]; then
        print_info "Удаление контейнеров и образов..."
        docker-compose down --rmi all --volumes
        print_success "Очистка завершена"
    else
        print_info "Отменено"
    fi
}

# Резервное копирование логов
backup_logs() {
    BACKUP_FILE="logs-backup-$(date +%Y%m%d-%H%M%S).txt"
    print_info "Создание резервной копии логов..."
    docker-compose logs > "$BACKUP_FILE"
    print_success "Логи сохранены в $BACKUP_FILE"
}

# Главное меню
show_menu() {
    echo ""
    echo "=================================="
    echo "🤖 Gemini Telegram Bot - Управление"
    echo "=================================="
    echo "1. 🚀 Запустить бота"
    echo "2. ⏸️  Остановить бота"
    echo "3. 🔄 Перезапустить бота"
    echo "4. 📊 Статус"
    echo "5. 📜 Просмотр логов"
    echo "6. 🔼 Обновить бота"
    echo "7. 💾 Резервное копирование логов"
    echo "8. 🗑️  Полная очистка"
    echo "9. ❌ Выход"
    echo "=================================="
}

# Главная функция
main() {
    clear
    echo "🤖 Gemini Telegram Bot - Deploy Script"
    echo ""
    
    # Проверки
    check_docker
    check_env
    
    # Если передан параметр командной строки
    if [ $# -gt 0 ]; then
        case "$1" in
            start)
                start_bot
                ;;
            stop)
                stop_bot
                ;;
            restart)
                restart_bot
                ;;
            logs)
                view_logs
                ;;
            status)
                status
                ;;
            update)
                update_bot
                ;;
            backup)
                backup_logs
                ;;
            cleanup)
                cleanup
                ;;
            *)
                echo "Использование: $0 {start|stop|restart|logs|status|update|backup|cleanup}"
                exit 1
                ;;
        esac
        exit 0
    fi
    
    # Интерактивное меню
    while true; do
        show_menu
        read -p "Выберите действие (1-9): " choice
        
        case $choice in
            1)
                start_bot
                ;;
            2)
                stop_bot
                ;;
            3)
                restart_bot
                ;;
            4)
                status
                ;;
            5)
                view_logs
                ;;
            6)
                update_bot
                ;;
            7)
                backup_logs
                ;;
            8)
                cleanup
                ;;
            9)
                print_info "До свидания!"
                exit 0
                ;;
            *)
                print_error "Неверный выбор!"
                ;;
        esac
        
        echo ""
        read -p "Нажмите Enter для продолжения..."
    done
}

# Запуск
main "$@"



