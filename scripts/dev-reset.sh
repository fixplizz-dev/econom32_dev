#!/bin/bash

# Скрипт для полной очистки и пересоздания окружения

echo "🔄 Полная очистка и пересоздание окружения..."

# Остановка и удаление всех контейнеров и данных
docker-compose down -v --remove-orphans

# Удаление образов (опционально)
read -p "Удалить также Docker образы? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down --rmi all
fi

# Очистка локальных данных
echo "🗑️ Очистка локальных данных..."
rm -rf data/*
echo "📁 Пересоздание структуры папок..."
mkdir -p data/{postgres,redis,minio,clamav,prometheus,grafana}

echo "✅ Окружение очищено."
echo ""
echo "🚀 Для повторной настройки запустите: ./scripts/dev-setup.sh"