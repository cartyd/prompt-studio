# Analytics Queries

Phase 1 analytics implementation tracking:
- User logins
- Framework page views
- Prompt generation
- Prompt saves

## Quick Stats

### Total events by type
```sql
SELECT eventType, COUNT(*) as count
FROM Event
GROUP BY eventType
ORDER BY count DESC;
```

### Daily active users
```sql
SELECT DATE(createdAt) as date, COUNT(DISTINCT userId) as users
FROM Event
WHERE eventType = 'login'
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

### Most popular frameworks
```sql
SELECT 
  json_extract(metadata, '$.frameworkId') as framework,
  COUNT(*) as views
FROM Event
WHERE eventType = 'framework_view'
GROUP BY framework
ORDER BY views DESC;
```

### Prompt generation vs save rate
```sql
SELECT 
  SUM(CASE WHEN eventType = 'prompt_generate' THEN 1 ELSE 0 END) as generated,
  SUM(CASE WHEN eventType = 'prompt_save' THEN 1 ELSE 0 END) as saved,
  ROUND(
    100.0 * SUM(CASE WHEN eventType = 'prompt_save' THEN 1 ELSE 0 END) / 
    NULLIF(SUM(CASE WHEN eventType = 'prompt_generate' THEN 1 ELSE 0 END), 0),
    2
  ) as save_rate_percent
FROM Event;
```

## User Behavior

### Events by user
```sql
SELECT 
  u.email,
  COUNT(*) as total_events,
  SUM(CASE WHEN e.eventType = 'login' THEN 1 ELSE 0 END) as logins,
  SUM(CASE WHEN e.eventType = 'framework_view' THEN 1 ELSE 0 END) as framework_views,
  SUM(CASE WHEN e.eventType = 'prompt_generate' THEN 1 ELSE 0 END) as prompts_generated,
  SUM(CASE WHEN e.eventType = 'prompt_save' THEN 1 ELSE 0 END) as prompts_saved
FROM Event e
LEFT JOIN User u ON e.userId = u.id
WHERE e.userId IS NOT NULL
GROUP BY e.userId
ORDER BY total_events DESC;
```

### Recent activity (last 50 events)
```sql
SELECT 
  datetime(e.createdAt) as time,
  u.email,
  e.eventType,
  e.metadata
FROM Event e
LEFT JOIN User u ON e.userId = u.id
ORDER BY e.createdAt DESC
LIMIT 50;
```

### User engagement by subscription tier
```sql
SELECT 
  u.subscriptionTier,
  COUNT(DISTINCT e.userId) as active_users,
  COUNT(*) as total_events,
  ROUND(1.0 * COUNT(*) / COUNT(DISTINCT e.userId), 2) as avg_events_per_user
FROM Event e
JOIN User u ON e.userId = u.id
GROUP BY u.subscriptionTier;
```

## Time-based Analysis

### Events by hour of day
```sql
SELECT 
  strftime('%H', createdAt) as hour,
  COUNT(*) as events
FROM Event
GROUP BY hour
ORDER BY hour;
```

### Events by day of week
```sql
SELECT 
  CASE CAST(strftime('%w', createdAt) AS INTEGER)
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_of_week,
  COUNT(*) as events
FROM Event
GROUP BY strftime('%w', createdAt)
ORDER BY strftime('%w', createdAt);
```

## Framework Analysis

### Framework popularity with names
```sql
SELECT 
  json_extract(metadata, '$.frameworkId') as framework_id,
  json_extract(metadata, '$.frameworkName') as framework_name,
  COUNT(*) as views
FROM Event
WHERE eventType = 'framework_view'
  AND metadata IS NOT NULL
GROUP BY framework_id
ORDER BY views DESC;
```

### Framework usage by subscription tier
```sql
SELECT 
  u.subscriptionTier,
  json_extract(e.metadata, '$.frameworkId') as framework,
  COUNT(*) as views
FROM Event e
JOIN User u ON e.userId = u.id
WHERE e.eventType = 'framework_view'
GROUP BY u.subscriptionTier, framework
ORDER BY u.subscriptionTier, views DESC;
```

## Export Data

### Export all events to CSV
```bash
sqlite3 -csv -header prisma/dev.db \
  "SELECT 
    datetime(e.createdAt) as timestamp,
    u.email as user_email,
    u.subscriptionTier,
    e.eventType,
    e.metadata
   FROM Event e
   LEFT JOIN User u ON e.userId = u.id
   ORDER BY e.createdAt DESC;" > events_export.csv
```

## Tips

1. **Test queries first**: Always test queries on a copy of your database
2. **Use indexes**: The Event table has indexes on userId, eventType, and createdAt
3. **JSON metadata**: Use `json_extract(metadata, '$.key')` to access metadata fields
4. **Date formatting**: SQLite uses `strftime()` for date formatting
5. **Null safety**: Use `NULLIF()` and `COALESCE()` to handle null values
