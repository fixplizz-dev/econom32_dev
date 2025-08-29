# 🚀 Руководство по портативности проекта

Этот проект полностью портативный - все данные хранятся внутри папки проекта.

## 📦 Что делает проект портативным

- **Локальные данные**: Все данные Docker контейнеров хранятся в `./data/`
- **Относительные пути**: Все конфигурации используют относительные пути
- **Автономность**: Нет зависимости от системных путей или внешних ресурсов
- **Изоляция**: Каждая копия проекта имеет свои данные

## 🔄 Развертывание на новом сервере

### Вариант 1: Копирование всего проекта
```bash
# 1. Скопировать проект
scp -r ./econom32_v1 user@newserver:/opt/

# 2. На новом сервере
cd /opt/econom32_v1

# 3. Запустить автоматическую настройку
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

### Вариант 2: Git + данные отдельно
```bash
# 1. Клонировать репозиторий
git clone <repo-url> econom32_v1
cd econom32_v1

# 2. Скопировать данные
scp -r user@oldserver:/opt/econom32_v1/data/ ./

# 3. Запустить
./scripts/dev-setup.sh
```

### Вариант 3: Архив проекта
```bash
# На старом сервере
tar -czf econom32-full.tar.gz econom32_v1/

# На новом сервере
tar -xzf econom32-full.tar.gz
cd econom32_v1
docker-compose up -d
```

## 💾 Резервное копирование

### Полный бэкап проекта
```bash
# Создать архив всего проекта
tar -czf backup-full-$(date +%Y%m%d).tar.gz econom32_v1/

# Создать архив только данных
tar -czf backup-data-$(date +%Y%m%d).tar.gz econom32_v1/data/
```

### Автоматический бэкап через Makefile
```bash
# Создать бэкап данных
make backup

# Посмотреть размер данных
make size
```

### Бэкап базы данных отдельно
```bash
# Экспорт базы данных
docker-compose exec postgres pg_dump -U econom32_user econom32_new > backup-db.sql

# Импорт базы данных
docker-compose exec -T postgres psql -U econom32_user econom32_new < backup-db.sql
```

## 🔧 Управление данными

### Очистка всех данных
```bash
# Остановить контейнеры
docker-compose down

# Очистить данные
rm -rf data/*

# Пересоздать структуру
mkdir -p data/{postgres,redis,minio,clamav,prometheus,grafana}

# Запустить заново
docker-compose up -d
```

### Очистка через скрипты
```bash
# Linux/macOS
./scripts/dev-reset.sh

# Windows
scripts\dev-reset.bat

# Через Makefile
make reset
```

### Миграция данных между версиями
```bash
# 1. Создать бэкап старой версии
tar -czf backup-v1.tar.gz data/

# 2. Обновить код
git pull origin main

# 3. Запустить миграции (если есть)
docker-compose exec backend npm run migrate

# 4. Проверить работоспособность
docker-compose ps
```

## 📊 Мониторинг размера данных

### Размер по сервисам
```bash
# Размер каждого сервиса
du -sh data/*

# Результат:
# 2.1G    data/postgres
# 45M     data/redis
# 1.2G    data/minio
# 890M    data/clamav
# 120M    data/prometheus
# 67M     data/grafana
```

### Общий размер проекта
```bash
# Размер всего проекта
du -sh . --exclude=node_modules

# Размер только данных
du -sh data/
```

### Очистка больших файлов
```bash
# Найти большие файлы в данных
find data/ -type f -size +100M -exec ls -lh {} \;

# Очистить логи Docker
docker system prune -f

# Очистить неиспользуемые образы
docker image prune -f
```

## 🔒 Безопасность при переносе

### Что НЕ переносить в продакшен
- Файлы `.env` с тестовыми паролями
- Тестовые данные в базе
- Debug логи
- Временные файлы

### Что обязательно изменить
```bash
# 1. Сменить пароли в .env
POSTGRES_PASSWORD=новый_сложный_пароль
MINIO_ROOT_PASSWORD=новый_сложный_пароль

# 2. Настроить SSL сертификаты
# 3. Настроить firewall
# 4. Обновить конфигурацию Nginx
```

## 🚀 Автоматизация развертывания

### Скрипт автоматического развертывания
```bash
#!/bin/bash
# deploy.sh

SERVER=$1
PROJECT_PATH="/opt/econom32_v1"

echo "🚀 Развертывание на сервере $SERVER"

# Создать архив
tar -czf deploy.tar.gz --exclude=node_modules --exclude=.git .

# Скопировать на сервер
scp deploy.tar.gz $SERVER:/tmp/

# Развернуть на сервере
ssh $SERVER "
    cd /opt
    sudo tar -xzf /tmp/deploy.tar.gz
    cd $PROJECT_PATH
    sudo ./scripts/dev-setup.sh
    sudo docker-compose up -d
"

echo "✅ Развертывание завершено"
```

### Использование
```bash
chmod +x deploy.sh
./deploy.sh user@production-server
```

## 📋 Чеклист для переноса

- [ ] Создать бэкап текущих данных
- [ ] Скопировать проект на новый сервер
- [ ] Проверить наличие Docker и Docker Compose
- [ ] Запустить скрипт настройки
- [ ] Проверить доступность всех сервисов
- [ ] Обновить DNS записи (если нужно)
- [ ] Настроить SSL сертификаты
- [ ] Проверить работу всех функций
- [ ] Настроить мониторинг и алерты
- [ ] Создать план резервного копирования

---

**Заключение**: Портативная архитектура проекта позволяет легко развертывать и переносить сайт между серверами, обеспечивая максимальную гибкость и простоту управления.