#!/bin/bash
set -e

# Configuration
SERVER="root@45.55.131.181"
APP_DIR="/var/www/prompt-studio"
REMOTE_DB="$APP_DIR/prisma/prisma/data/prod.db"
LOCAL_TEMP_DB="/tmp/prod-analytics-$(date +%Y%m%d-%H%M%S).db"

echo "📊 Fetching production analytics from $SERVER..."
echo ""

# Download the production database
echo "⬇️  Downloading production database..."
scp $SERVER:$REMOTE_DB $LOCAL_TEMP_DB

echo "✅ Database downloaded to $LOCAL_TEMP_DB"
echo ""
echo "📈 Analytics Summary:"
echo "===================="
echo ""

# Run analytics queries on the downloaded database
sqlite3 $LOCAL_TEMP_DB <<'SQL'
.mode column
.headers on

-- Total Events
SELECT '=== TOTAL EVENTS ===' as '';
SELECT COUNT(*) as total_events FROM Event;
SELECT '';

-- Events by Type
SELECT '=== EVENTS BY TYPE ===' as '';
SELECT 
  eventType,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Event), 2) as percentage
FROM Event
GROUP BY eventType
ORDER BY count DESC;
SELECT '';

-- Device Type Distribution
SELECT '=== DEVICE TYPE DISTRIBUTION ===' as '';
SELECT 
  deviceType,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Event WHERE deviceType IS NOT NULL), 2) as percentage
FROM Event
WHERE deviceType IS NOT NULL
GROUP BY deviceType
ORDER BY count DESC;
SELECT '';

-- Top Countries
SELECT '=== TOP 10 COUNTRIES ===' as '';
SELECT 
  country,
  COUNT(*) as visits
FROM Event
WHERE country IS NOT NULL
GROUP BY country
ORDER BY visits DESC
LIMIT 10;
SELECT '';

-- Top Browsers
SELECT '=== TOP 10 BROWSERS ===' as '';
SELECT 
  browser,
  COUNT(*) as count
FROM Event
WHERE browser IS NOT NULL
GROUP BY browser
ORDER BY count DESC
LIMIT 10;
SELECT '';

-- Operating Systems
SELECT '=== OPERATING SYSTEMS ===' as '';
SELECT 
  os,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Event WHERE os IS NOT NULL), 2) as percentage
FROM Event
WHERE os IS NOT NULL
GROUP BY os
ORDER BY count DESC;
SELECT '';

-- Recent Activity (Last 7 Days)
SELECT '=== ACTIVITY LAST 7 DAYS ===' as '';
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as events
FROM Event
WHERE createdAt >= date('now', '-7 days')
GROUP BY date
ORDER BY date DESC;
SELECT '';

-- Unique Users
SELECT '=== USER STATS ===' as '';
SELECT 
  COUNT(DISTINCT userId) as unique_users,
  COUNT(*) as total_events,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT userId), 2) as avg_events_per_user
FROM Event
WHERE userId IS NOT NULL;
SELECT '';

-- Conversion Funnel
SELECT '=== CONVERSION FUNNEL ===' as '';
SELECT 
  SUM(CASE WHEN eventType = 'framework_view' THEN 1 ELSE 0 END) as framework_views,
  SUM(CASE WHEN eventType = 'prompt_generate' THEN 1 ELSE 0 END) as prompt_generates,
  SUM(CASE WHEN eventType = 'prompt_save' THEN 1 ELSE 0 END) as prompt_saves,
  ROUND(
    SUM(CASE WHEN eventType = 'prompt_save' THEN 1 ELSE 0 END) * 100.0 / 
    NULLIF(SUM(CASE WHEN eventType = 'framework_view' THEN 1 ELSE 0 END), 0), 
    2
  ) as conversion_rate_percent
FROM Event;

SQL

echo ""
echo "===================="
echo ""
echo "💡 Options:"
echo "  1. Keep temp database: $LOCAL_TEMP_DB"
echo "  2. Open in Prisma Studio (local)"
echo "  3. Delete temp database"
echo ""
read -p "Choose an option (1/2/3): " choice

case $choice in
  1)
    echo "📁 Database saved at: $LOCAL_TEMP_DB"
    ;;
  2)
    echo "🚀 Opening Prisma Studio with production data..."
    echo "   Visit http://localhost:5555 in your browser"
    echo "   Press Ctrl+C to stop Prisma Studio"
    echo ""
    # Temporarily update DATABASE_URL and run Prisma Studio
    DATABASE_URL="file:$LOCAL_TEMP_DB" npx prisma studio
    ;;
  3)
    rm $LOCAL_TEMP_DB
    echo "🗑️  Temp database deleted"
    ;;
  *)
    echo "📁 Database saved at: $LOCAL_TEMP_DB"
    ;;
esac
