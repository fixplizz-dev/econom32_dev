#!/bin/bash

# Скрипт генерации отчета по безопасности
# Создает ежедневный отчет о состоянии безопасности системы

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_DIR="./reports/security"
REPORT_FILE="$REPORT_DIR/security-report-$REPORT_DATE.html"

# Создание директории для отчетов
mkdir -p "$REPORT_DIR"

# Функция для получения метрик из Prometheus
get_prometheus_metric() {
    local query="$1"
    local prometheus_url="http://localhost:9090"

    curl -s "$prometheus_url/api/v1/query?query=$query" | \
    jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0"
}

# Функция для анализа логов
analyze_logs() {
    local log_file="$1"
    local pattern="$2"
    local description="$3"

    if [ -f "$log_file" ]; then
        local count=$(grep -c "$pattern" "$log_file" 2>/dev/null || echo "0")
        echo "<tr><td>$description</td><td>$count</td></tr>"
    else
        echo "<tr><td>$description</td><td>Лог не найден</td></tr>"
    fi
}

# Начало HTML отчета
cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет по безопасности - $REPORT_DATE</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .critical { background: #fee2e2; border-color: #dc2626; }
        .warning { background: #fef3c7; border-color: #d97706; }
        .success { background: #dcfce7; border-color: #16a34a; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f3f4f6; }
        .metric { font-size: 24px; font-weight: bold; color: #2563eb; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Отчет по безопасности</h1>
        <p>Департамент экономического развития Брянской области</p>
        <p>Дата: $REPORT_DATE</p>
    </div>
EOF

# Общая статистика
echo "📊 Сбор общей статистики..."
TOTAL_REQUESTS=$(get_prometheus_metric 'sum(increase(http_requests_total[24h]))')
FAILED_LOGINS=$(get_prometheus_metric 'sum(increase(failed_login_attempts_total[24h]))')
BLOCKED_IPS=$(get_prometheus_metric 'sum(increase(fail2ban_banned_total[24h]))')
VIRUS_DETECTED=$(get_prometheus_metric 'sum(increase(clamav_virus_detected_total[24h]))')

cat >> "$REPORT_FILE" << EOF
    <div class="section">
        <h2>📈 Общая статистика за 24 часа</h2>
        <table>
            <tr><th>Метрика</th><th>Значение</th></tr>
            <tr><td>Всего HTTP запросов</td><td class="metric">$TOTAL_REQUESTS</td></tr>
            <tr><td>Неудачные попытки входа</td><td class="metric">$FAILED_LOGINS</td></tr>
            <tr><td>Заблокированные IP</td><td class="metric">$BLOCKED_IPS</td></tr>
            <tr><td>Обнаружено вирусов</td><td class="metric">$VIRUS_DETECTED</td></tr>
        </table>
    </div>
EOF

# Анализ безопасности
echo "🔍 Анализ событий безопасности..."
SECURITY_CLASS="success"
SECURITY_STATUS="Безопасность в норме"

if [ "$VIRUS_DETECTED" -gt "0" ] || [ "$FAILED_LOGINS" -gt "50" ]; then
    SECURITY_CLASS="critical"
    SECURITY_STATUS="Обнаружены критические угрозы!"
elif [ "$BLOCKED_IPS" -gt "10" ] || [ "$FAILED_LOGINS" -gt "20" ]; then
    SECURITY_CLASS="warning"
    SECURITY_STATUS="Повышенная активность угроз"
fi

cat >> "$REPORT_FILE" << EOF
    <div class="section $SECURITY_CLASS">
        <h2>🚨 Статус безопасности</h2>
        <p><strong>$SECURITY_STATUS</strong></p>
    </div>

    <div class="section">
        <h2>🔍 Анализ логов безопасности</h2>
        <table>
            <tr><th>Тип события</th><th>Количество</th></tr>
EOF

# Анализ различных типов атак
analyze_logs "./docker/nginx/logs/access.log" "union.*select" "Попытки SQL инъекций" >> "$REPORT_FILE"
analyze_logs "./docker/nginx/logs/access.log" "<script" "Попытки XSS атак" >> "$REPORT_FILE"
analyze_logs "./docker/nginx/logs/access.log" "\.\./" "Попытки обхода директорий" >> "$REPORT_FILE"
analyze_logs "./docker/nginx/logs/access.log" "admin" "Попытки доступа к админке" >> "$REPORT_FILE"
analyze_logs "./docker/nginx/logs/error.log" "limiting requests" "Срабатывания rate limiting" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF
        </table>
    </div>
EOF

# Топ IP адресов
echo "🌐 Анализ IP адресов..."
cat >> "$REPORT_FILE" << EOF
    <div class="section">
        <h2>🌐 Топ IP адресов (последние 24 часа)</h2>
        <table>
            <tr><th>IP адрес</th><th>Количество запросов</th><th>Статус</th></tr>
EOF

if [ -f "./docker/nginx/logs/access.log" ]; then
    awk '{print $1}' ./docker/nginx/logs/access.log | sort | uniq -c | sort -nr | head -10 | while read count ip; do
        status="Нормальный"
        if [ "$count" -gt "1000" ]; then
            status="⚠️ Подозрительный"
        fi
        echo "<tr><td>$ip</td><td>$count</td><td>$status</td></tr>" >> "$REPORT_FILE"
    done
fi

cat >> "$REPORT_FILE" << EOF
        </table>
    </div>
EOF

# Состояние сервисов
echo "🔧 Проверка состояния сервисов..."
cat >> "$REPORT_FILE" << EOF
    <div class="section">
        <h2>🔧 Состояние сервисов безопасности</h2>
        <table>
            <tr><th>Сервис</th><th>Статус</th><th>Время работы</th></tr>
EOF

# Проверка Docker контейнеров
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(nginx|clamav|fail2ban|prometheus)" | while IFS=$'\t' read -r name status; do
    if [[ "$status" == *"Up"* ]]; then
        echo "<tr><td>$name</td><td>✅ Работает</td><td>$status</td></tr>" >> "$REPORT_FILE"
    else
        echo "<tr><td>$name</td><td>❌ Не работает</td><td>$status</td></tr>" >> "$REPORT_FILE"
    fi
done

cat >> "$REPORT_FILE" << EOF
        </table>
    </div>
EOF

# Рекомендации
echo "💡 Генерация рекомендаций..."
cat >> "$REPORT_FILE" << EOF
    <div class="section">
        <h2>💡 Рекомендации</h2>
        <ul>
EOF

if [ "$FAILED_LOGINS" -gt "50" ]; then
    echo "<li>⚠️ Высокое количество неудачных попыток входа. Рекомендуется усилить мониторинг и рассмотреть дополнительные меры защиты.</li>" >> "$REPORT_FILE"
fi

if [ "$VIRUS_DETECTED" -gt "0" ]; then
    echo "<li>🚨 Обнаружены вирусы! Необходимо немедленно проверить все загруженные файлы.</li>" >> "$REPORT_FILE"
fi

if [ "$BLOCKED_IPS" -gt "20" ]; then
    echo "<li>🔒 Большое количество заблокированных IP. Возможна координированная атака.</li>" >> "$REPORT_FILE"
fi

# Всегда добавляем общие рекомендации
cat >> "$REPORT_FILE" << EOF
            <li>🔄 Регулярно обновляйте все компоненты системы</li>
            <li>📊 Мониторьте метрики безопасности в Grafana</li>
            <li>🔐 Проверьте настройки двухфакторной аутентификации</li>
            <li>💾 Убедитесь в работоспособности системы резервного копирования</li>
        </ul>
    </div>
EOF

# Завершение отчета
cat >> "$REPORT_FILE" << EOF
    <div class="section">
        <h2>📞 Контакты</h2>
        <p><strong>Служба безопасности:</strong> security@econom32.ru</p>
        <p><strong>Системный администратор:</strong> admin@econom32.ru</p>
        <p><strong>Техническая поддержка:</strong> support@econom32.ru</p>
    </div>

    <footer style="text-align: center; margin-top: 40px; color: #666;">
        <p>Отчет сгенерирован автоматически $(date)</p>
        <p>Департамент экономического развития Брянской области</p>
    </footer>
</body>
</html>
EOF

echo "✅ Отчет по безопасности создан: $REPORT_FILE"

# Отправка отчета по email (если настроен)
if command -v mail &> /dev/null; then
    echo "📧 Отправка отчета по email..."
    mail -s "Ежедневный отчет по безопасности - $REPORT_DATE" \
         -a "Content-Type: text/html" \
         admin@econom32.ru < "$REPORT_FILE"
fi

# Очистка старых отчетов (старше 30 дней)
find "$REPORT_DIR" -name "security-report-*.html" -mtime +30 -delete

echo "🎉 Генерация отчета завершена!"