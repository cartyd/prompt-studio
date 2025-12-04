# Analytics Queries Guide

This document provides examples of how to query your analytics data to gain insights about your users.

## Database Schema

The `Event` table now includes the following fields:

- **Traffic Source Fields**:
  - `userAgent` - Full user agent string
  - `deviceType` - Categorized as: 'mobile', 'tablet', 'desktop', 'bot', 'unknown'
  - `browser` - Browser name and version (e.g., "Chrome 120.0.0.0")
  - `os` - Operating system (e.g., "macOS 10.15.7", "iOS 17.0")

- **Geographic Fields**:
  - `ipAddress` - User's IP address
  - `country` - Country code (e.g., 'US', 'GB', 'CA')
  - `region` - State/province
  - `city` - City name

- **Other Fields**:
  - `id`, `userId`, `eventType`, `metadata`, `createdAt`

## Example Queries

### Traffic Source Analysis

#### Device Type Distribution
```sql
SELECT 
  deviceType,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Event), 2) as percentage
FROM Event
WHERE deviceType IS NOT NULL
GROUP BY deviceType
ORDER BY count DESC;
```

#### Top Browsers
```sql
SELECT 
  browser,
  COUNT(*) as count
FROM Event
WHERE browser IS NOT NULL
GROUP BY browser
ORDER BY count DESC
LIMIT 10;
```

#### Operating System Distribution
```sql
SELECT 
  os,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Event WHERE os IS NOT NULL), 2) as percentage
FROM Event
WHERE os IS NOT NULL
GROUP BY os
ORDER BY count DESC;
```

#### Mobile vs Desktop Traffic by Event Type
```sql
SELECT 
  eventType,
  deviceType,
  COUNT(*) as count
FROM Event
WHERE deviceType IN ('mobile', 'desktop')
GROUP BY eventType, deviceType
ORDER BY eventType, count DESC;
```

### Geographic Analysis

#### Top Countries
```sql
SELECT 
  country,
  COUNT(*) as visits
FROM Event
WHERE country IS NOT NULL
GROUP BY country
ORDER BY visits DESC
LIMIT 20;
```

#### Geographic Distribution by Event Type
```sql
SELECT 
  eventType,
  country,
  COUNT(*) as count
FROM Event
WHERE country IS NOT NULL
GROUP BY eventType, country
ORDER BY count DESC
LIMIT 20;
```

#### Regional Breakdown (for specific country)
```sql
SELECT 
  region,
  city,
  COUNT(*) as count
FROM Event
WHERE country = 'US'
  AND region IS NOT NULL
GROUP BY region, city
ORDER BY count DESC
LIMIT 20;
```

### User Behavior Analysis

#### Login Activity by Device Type
```sql
SELECT 
  deviceType,
  COUNT(*) as login_count,
  COUNT(DISTINCT userId) as unique_users
FROM Event
WHERE eventType = 'login'
  AND deviceType IS NOT NULL
GROUP BY deviceType
ORDER BY login_count DESC;
```

#### Framework Popularity by Device Type
```sql
SELECT 
  deviceType,
  json_extract(metadata, '$.frameworkId') as framework,
  COUNT(*) as views
FROM Event
WHERE eventType = 'framework_view'
  AND deviceType IS NOT NULL
  AND metadata IS NOT NULL
GROUP BY deviceType, framework
ORDER BY views DESC;
```

#### Conversion Funnel by Device
```sql
SELECT 
  deviceType,
  SUM(CASE WHEN eventType = 'framework_view' THEN 1 ELSE 0 END) as views,
  SUM(CASE WHEN eventType = 'prompt_generate' THEN 1 ELSE 0 END) as generates,
  SUM(CASE WHEN eventType = 'prompt_save' THEN 1 ELSE 0 END) as saves,
  ROUND(
    SUM(CASE WHEN eventType = 'prompt_save' THEN 1 ELSE 0 END) * 100.0 / 
    NULLIF(SUM(CASE WHEN eventType = 'framework_view' THEN 1 ELSE 0 END), 0), 
    2
  ) as conversion_rate
FROM Event
WHERE deviceType IS NOT NULL
GROUP BY deviceType
ORDER BY views DESC;
```

### Time-Based Analysis

#### Daily Traffic by Device Type
```sql
SELECT 
  DATE(createdAt) as date,
  deviceType,
  COUNT(*) as events
FROM Event
WHERE createdAt >= date('now', '-30 days')
  AND deviceType IS NOT NULL
GROUP BY date, deviceType
ORDER BY date DESC, events DESC;
```

#### Peak Usage Hours by Device Type
```sql
SELECT 
  strftime('%H', createdAt) as hour,
  deviceType,
  COUNT(*) as events
FROM Event
WHERE deviceType IS NOT NULL
GROUP BY hour, deviceType
ORDER BY hour, events DESC;
```

### Bot Detection

#### Bot Traffic Analysis
```sql
SELECT 
  deviceType,
  eventType,
  COUNT(*) as count
FROM Event
WHERE deviceType = 'bot'
GROUP BY deviceType, eventType
ORDER BY count DESC;
```

## Using Prisma

You can also query this data using Prisma:

```typescript
// Get device type distribution
const deviceStats = await prisma.event.groupBy({
  by: ['deviceType'],
  _count: true,
  where: {
    deviceType: { not: null }
  }
});

// Get top countries
const countryStats = await prisma.event.groupBy({
  by: ['country'],
  _count: true,
  where: {
    country: { not: null }
  },
  orderBy: {
    _count: {
      country: 'desc'
    }
  },
  take: 10
});

// Get mobile vs desktop conversion rates
const conversionByDevice = await prisma.$queryRaw`
  SELECT 
    deviceType,
    SUM(CASE WHEN eventType = 'prompt_save' THEN 1 ELSE 0 END) * 100.0 / 
    NULLIF(SUM(CASE WHEN eventType = 'framework_view' THEN 1 ELSE 0 END), 0) as conversion_rate
  FROM Event
  WHERE deviceType IN ('mobile', 'desktop')
  GROUP BY deviceType
`;
```

## Privacy Considerations

- IP addresses are stored for geolocation but should be treated as sensitive data
- Consider implementing IP address anonymization or deletion policies
- Ensure compliance with GDPR, CCPA, and other privacy regulations
- Consider adding a privacy policy that discloses data collection practices

## Next Steps

Consider building:
1. **Analytics Dashboard** - Visualize this data in the UI
2. **Automated Reports** - Email weekly/monthly summaries
3. **Real-time Monitoring** - Track traffic patterns as they happen
4. **A/B Testing Framework** - Test different experiences for mobile vs desktop
5. **Geographic Targeting** - Customize content based on user location
