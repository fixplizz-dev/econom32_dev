#!/bin/bash

# Скрипт для настройки локального окружения разработки

echo "🚀 Настройка локального окружения для модернизации econom32.ru"

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker Desktop."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен."
    exit 1
fi

# Создание .env файла если его нет
if [ ! -f .env ]; then
    echo "📝 Создание .env файла..."
    cp .env.example .env
    echo "✅ Файл .env создан. Отредактируйте его при необходимости."
fi

# Создание необходимых директорий для данных
echo "📁 Создание директорий для данных..."
mkdir -p docker/ssl
mkdir -p docker/nginx/logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/minio
mkdir -p data/clamav
mkdir -p data/prometheus
mkdir -p data/grafana
echo "✅ Все папки для данных созданы в ./data/"

# Запуск сервисов
echo "🐳 Запуск Docker сервисов..."
docker-compose up -d

# Ожидание запуска PostgreSQL
echo "⏳ Ожидание запуска PostgreSQL..."
sleep 10

# Проверка статуса сервисов
echo "📊 Проверка статуса сервисов..."
docker-compose ps

echo ""
echo "🎉 Локальное окружение готово!"
echo ""
echo "📋 Доступные сервисы:"
echo "   • PostgreSQL: localhost:5432"
echo "   • Redis: localhost:6379"
echo "   • MinIO: http://localhost:9001 (admin: econom32_minio / econom32_minio_password)"
echo "   • Adminer: http://localhost:8080"
echo "   • Prometheus: http://localhost:9090"
echo "   • Grafana: http://localhost:3000 (admin / admin123)"
echo "   • Nginx: http://localhost:80"
echo ""
echo "🔧 Следующие шаги:"
echo "   1. Настройте подключение к старой MySQL базе в .env"
echo "   2. Запустите миграцию данных: npm run migrate"
echo "   3. Запустите приложение: npm run dev"
echo ""