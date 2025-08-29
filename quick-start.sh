#!/bin/bash

# Быстрый запуск проекта econom32_v1 на новой ВМ
# Автор: AI Assistant
# Дата: 26 августа 2025

set -e

echo "🚀 Быстрый запуск проекта econom32_v1"
echo "======================================"

# Проверка требований
echo "📋 Проверка системных требований..."

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и повторите попытку."
    echo "   Ubuntu: sudo apt update && sudo apt install docker.io docker-compose"
    echo "   CentOS: sudo yum install docker docker-compose"
    exit 1
fi

# Проверка Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен."
    exit 1
fi

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ и повторите попытку."
    echo "   Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

echo "✅ Все требования выполнены"

# Создание .env файла
if [ ! -f .env ]; then
    echo "📝 Создание файла окружения..."
    cp .env.example .env
    echo "⚠️  ВАЖНО: Отредактируйте файл .env перед продолжением!"
    echo "   Особенно измените пароли и секретные ключи для продакшена."
    read -p "Нажмите Enter для продолжения после редактирования .env..."
fi

# Создание необходимых папок
echo "📁 Создание папок для данных..."
mkdir -p data/{postgres,redis,minio,grafana,prometheus,clamav,alertmanager}
mkdir -p docker/{ssl,nginx/logs}

# Установка прав
chmod +x scripts/*.sh
chmod +x Makefile

# Запуск Docker сервисов
echo "🐳 Запуск Docker сервисов..."
docker-compose up -d

# Ожидание запуска PostgreSQL
echo "⏳ Ожидание запуска PostgreSQL (30 секунд)..."
sleep 30

# Восстановление базы данных
if [ -f backup_database.sql ]; then
    echo "💾 Восстановление базы данных из резервной копии..."
    docker-compose exec -T postgres psql -U econom32_user -d econom32_new < backup_database.sql
    echo "✅ База данных восстановлена"
else
    echo "⚠️  Файл backup_database.sql не найден. Создание новой базы..."
    cd backend
    npx prisma db push
    npx prisma db seed
    cd ..
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

echo "📦 Установка зависимостей frontend..."
cd frontend && npm install && cd ..

echo "📦 Установка зависимостей backend..."
cd backend && npm install && cd ..

# Проверка статуса сервисов
echo "📊 Проверка статуса сервисов..."
docker-compose ps

# Проверка подключения к базе данных
echo "🔍 Проверка подключения к базе данных..."
if docker-compose exec -T postgres psql -U econom32_user -d econom32_new -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ База данных доступна"
else
    echo "❌ Проблема с подключением к базе данных"
    exit 1
fi

echo ""
echo "🎉 Проект успешно развернут!"
echo ""
echo "📋 Доступные сервисы:"
echo "   • Frontend:     http://localhost:3001"
echo "   • Backend API:  http://localhost:3002"
echo "   • Admin Panel:  http://localhost:3001/admin"
echo "   • Grafana:      http://localhost:3000 (admin/admin123)"
echo "   • MinIO:        http://localhost:9001"
echo "   • Adminer:      http://localhost:8080"
echo ""
echo "🚀 Для запуска приложения выполните:"
echo "   npm run dev"
echo ""
echo "📚 Подробная документация в файле DEPLOYMENT.md"
echo ""
echo "⚠️  Не забудьте:"
echo "   1. Настроить SSL сертификаты для продакшена"
echo "   2. Изменить пароли по умолчанию"
echo "   3. Настроить домен и DNS"
echo "   4. Включить мониторинг безопасности"
echo ""

# Предложение запуска приложения
read -p "Запустить приложение сейчас? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Запуск приложения..."
    npm run dev
fi