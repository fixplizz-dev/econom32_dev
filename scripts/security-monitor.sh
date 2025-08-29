#!/bin/bash

# Скрипт мониторинга безопасности
# Анализирует логи и отправляет алерты при подозрительной активности

LOG_DIR="./docker/nginx/logs"
SECURITY_LOG="$LOG_DIR/security.log"
ACCESS_LOG="$LOG_DIR/access.log"
ERROR_LOG="$LOG_DIR/error.log"
ALERT_EMAIL="admin@econom32.ru"

# Функция отправки алерта
send_alert() {
    local subject="$1"
    local message="$2"

    echo "🚨 SECURITY ALERT: $subject"
    echo "$message"

    # В продакшене здесь будет отправка email
    # echo "$message" | mail -s "$subject" "$ALERT_EMAIL"

    # Логирование алерта
    echo "$(date): $subject - $message" >> ./data/security-alerts.log
}

# Проверка на подозрительные IP
check_suspicious_ips() {
    echo "🔍 Проверка подозрительных IP адресов..."

    # IP с большим количеством 4xx ошибок
    suspicious_ips=$(awk '$9 ~ /^4/ {print $1}' "$ACCESS_LOG" | sort | uniq -c | sort -nr | head -10)

    if [ -n "$suspicious_ips" ]; then
        send_alert "Подозрительные IP адреса" "IP с большим количеством 4xx ошибок:\n$suspicious_ips"
    fi
}

# Проверка на SQL инъекции
check_sql_injection() {
    echo "🔍 Проверка на SQL инъекции..."

    sql_patterns="(union|select|insert|update|delete|drop|create|alter|exec|script)"
    sql_attempts=$(grep -iE "$sql_patterns" "$ACCESS_LOG" | tail -20)

    if [ -n "$sql_attempts" ]; then
        send_alert "Попытки SQL инъекций" "Обнаружены подозрительные SQL запросы:\n$sql_attempts"
    fi
}

# Проверка на XSS атаки
check_xss_attacks() {
    echo "🔍 Проверка на XSS атаки..."

    xss_patterns="(<script|javascript:|onload=|onerror=|alert\(|document\.)"
    xss_attempts=$(grep -iE "$xss_patterns" "$ACCESS_LOG" | tail -20)

    if [ -n "$xss_attempts" ]; then
        send_alert "Попытки XSS атак" "Обнаружены подозрительные XSS запросы:\n$xss_attempts"
    fi
}

# Проверка на сканирование портов
check_port_scanning() {
    echo "🔍 Проверка на сканирование портов..."

    # IP с большим количеством разных URL за короткое время
    port_scan=$(awk '{print $1}' "$ACCESS_LOG" | sort | uniq -c | sort -nr | awk '$1 > 100 {print $2, $1}')

    if [ -n "$port_scan" ]; then
        send_alert "Возможное сканирование портов" "IP с подозрительно высокой активностью:\n$port_scan"
    fi
}

# Проверка на брутфорс атаки
check_brute_force() {
    echo "🔍 Проверка на брутфорс атаки..."

    # Множественные попытки входа в админку
    brute_force=$(grep "/admin" "$ACCESS_LOG" | awk '{print $1}' | sort | uniq -c | sort -nr | awk '$1 > 20 {print $2, $1}')

    if [ -n "$brute_force" ]; then
        send_alert "Возможная брутфорс атака" "IP с множественными попытками входа в админку:\n$brute_force"
    fi
}

# Проверка размера логов
check_log_size() {
    echo "📊 Проверка размера логов..."

    for log_file in "$ACCESS_LOG" "$ERROR_LOG" "$SECURITY_LOG"; do
        if [ -f "$log_file" ]; then
            size=$(du -h "$log_file" | cut -f1)
            echo "Размер $log_file: $size"

            # Если лог больше 100MB, отправляем предупреждение
            size_mb=$(du -m "$log_file" | cut -f1)
            if [ "$size_mb" -gt 100 ]; then
                send_alert "Большой размер лога" "Лог файл $log_file достиг размера ${size}MB"
            fi
        fi
    done
}

# Ротация логов
rotate_logs() {
    echo "🔄 Ротация логов..."

    for log_file in "$ACCESS_LOG" "$ERROR_LOG" "$SECURITY_LOG"; do
        if [ -f "$log_file" ]; then
            size_mb=$(du -m "$log_file" | cut -f1)
            if [ "$size_mb" -gt 50 ]; then
                timestamp=$(date +%Y%m%d_%H%M%S)
                mv "$log_file" "${log_file}.${timestamp}"
                touch "$log_file"
                echo "Лог $log_file ротирован"
            fi
        fi
    done

    # Перезапуск Nginx для создания новых логов
    docker-compose restart nginx
}

# Основная функция
main() {
    echo "🛡️  Запуск мониторинга безопасности $(date)"

    # Создание директории для логов если не существует
    mkdir -p "$LOG_DIR"
    mkdir -p "./data"

    # Проверки безопасности
    check_suspicious_ips
    check_sql_injection
    check_xss_attacks
    check_port_scanning
    check_brute_force
    check_log_size

    # Ротация логов при необходимости
    rotate_logs

    echo "✅ Мониторинг безопасности завершен"
}

# Запуск
main "$@"