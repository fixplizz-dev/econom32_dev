#!/bin/bash

# Скрипт для настройки SSL сертификатов Let's Encrypt
# Использовать только в продакшене!

set -e

DOMAIN="econom32.ru"
EMAIL="admin@econom32.ru"

echo "🔒 Настройка SSL сертификатов для домена: $DOMAIN"

# Проверка, что мы в продакшене
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  ВНИМАНИЕ: Этот скрипт предназначен только для продакшена!"
    echo "Установите NODE_ENV=production для продолжения"
    exit 1
fi

# Создание директорий для сертификатов
mkdir -p ./data/certbot/conf
mkdir -p ./data/certbot/www

# Временная конфигурация Nginx для получения сертификата
echo "📝 Создание временной конфигурации Nginx..."
cat > ./docker/nginx/conf.d/temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

# Перезапуск Nginx
echo "🔄 Перезапуск Nginx..."
docker-compose restart nginx

# Получение сертификата
echo "📜 Получение SSL сертификата..."
docker run --rm \
    -v ./data/certbot/conf:/etc/letsencrypt \
    -v ./data/certbot/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Активация SSL конфигурации
echo "🔧 Активация SSL конфигурации..."
rm ./docker/nginx/conf.d/temp.conf
sed -i 's/^# //' ./docker/nginx/conf.d/ssl.conf

# Обновление docker-compose для certbot
echo "📦 Добавление certbot в docker-compose..."
cat >> docker-compose.yml << EOF

  certbot:
    image: certbot/certbot
    container_name: \${COMPOSE_PROJECT_NAME}_certbot
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    command: renew --quiet
    depends_on:
      - nginx
EOF

# Настройка автообновления сертификатов
echo "⏰ Настройка автообновления сертификатов..."
cat > ./scripts/renew-ssl.sh << 'EOF'
#!/bin/bash
docker-compose run --rm certbot renew --quiet
docker-compose restart nginx
EOF

chmod +x ./scripts/renew-ssl.sh

# Добавление в crontab (нужно выполнить вручную)
echo "📅 Для автообновления сертификатов добавьте в crontab:"
echo "0 12 * * * /path/to/project/scripts/renew-ssl.sh"

# Финальный перезапуск
echo "🚀 Финальный перезапуск сервисов..."
docker-compose restart nginx

echo "✅ SSL сертификаты успешно настроены!"
echo "🔗 Сайт доступен по адресу: https://$DOMAIN"