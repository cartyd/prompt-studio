# Multi-Select Evaluation Criteria Feature

## Overview
This feature enhances the Tree-of-Thought (ToT) framework by replacing the single textarea field for evaluation criteria with a multi-select checkbox interface. Users can select from predefined criteria options and add custom criteria as needed.

## Key Features

### 1. Default Evaluation Criteria
Eight predefined criteria options are available:
- Accuracy/Correctness
- Clarity/Coherence
- Feasibility/Practicality
- Efficiency/Performance
- Completeness/Thoroughness
- Innovation/Creativity
- Risk/Safety
- Cost/Resource Impact

### 2. Custom Criteria
Users can add custom criteria by clicking "+ Add Custom Criteria" button. The behavior differs based on subscription tier:

**Free Users:**
- Can add and use custom criteria within their session
- Custom criteria are stored in browser localStorage
- Criteria are marked with ⏱️ indicator showing "session only"
- Clear messaging: "Custom criteria available this session only"

**Premium Users:**
- Can add custom criteria and save them for future sessions
- Saved criteria are stored in the database
- Can optionally choose to save new criteria with a checkbox
- Saved criteria are marked with 💾 indicator
- Can delete saved custom criteria with × button
- Clear messaging: "Custom criteria can be saved for future use"

### 3. User Interface
- Clean checkbox-based selection interface
- Shows selected criteria count
- Maximum height with scrolling for long lists
- Hover effects for better UX
- Examples are updated to show criteria as numbered lists

## Technical Implementation

### Database Schema
New `CustomCriteria` model:
```prisma
model CustomCriteria {
  id           String   @id @default(cuid())
  userId       String
  criteriaName String
  createdAt    DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, criteriaName])
}
```

### API Endpoints
- `GET /api/custom-criteria` - Fetch user's saved custom criteria (premium only)
- `POST /api/custom-criteria` - Save new custom criteria (premium only)
- `DELETE /api/custom-criteria/:criteriaName` - Delete saved criteria (premium only)

### Type System Updates
- New field type: `multi-select-criteria`
- `TreeOfThoughtData.criteria` now accepts `string | string[]`
- Framework examples support array format for criteria
- All validator functions updated to handle `Record<string, string | string[]>`

### Frontend Components
- New partial template: `src/views/partials/multi-select-criteria.ejs`
- JavaScript handles:
  - Checkbox state management
  - localStorage for free users
  - API calls for premium users
  - Dynamic rendering of criteria lists
  - Example loading with array support

### Backward Compatibility
The prompt generator handles both formats:
- **Array format**: `['Accuracy', 'Speed', 'Cost']` → `"(1) Accuracy, (2) Speed, (3) Cost"`
- **String format**: `"Accuracy, Speed, Cost"` → preserved as-is

## Testing
Comprehensive test suite in `tests/custom-criteria.test.ts`:
- Database model tests (CRUD operations, constraints, cascading deletes)
- Prompt generation tests (array and string formats)
- All 126 tests pass

## User Experience Flow

### Free User Flow
1. Visit ToT framework form
2. See default criteria checkboxes + session-only custom criteria from localStorage
3. Select desired criteria
4. Click "+ Add Custom Criteria" if needed
5. Add custom text (saved to localStorage automatically)
6. Custom criteria show ⏱️ indicator
7. Generate prompt with selected criteria
8. Custom criteria available until browser session ends

### Premium User Flow
1. Visit ToT framework form
2. See default criteria + previously saved custom criteria (marked with 💾)
3. Select desired criteria
4. Click "+ Add Custom Criteria" if needed
5. Add custom text and optionally check "Save for future sessions"
6. Custom criteria saved to database if checkbox selected
7. Can delete saved criteria with × button
8. Generate prompt with selected criteria
9. Saved criteria available in all future sessions

## Benefits

### Value Proposition
- **Faster workflow**: Select criteria instead of typing
- **Consistency**: Standardized criteria across sessions
- **Discoverability**: Users learn evaluation best practices
- **Flexibility**: Not limited by presets
- **Progressive disclosure**: Simple for beginners, powerful for experts

### Ease of Implementation
- Moderate complexity: ~500 lines of code
- Clean separation of concerns (DB, API, UI, logic)
- Minimal changes to existing code
- Comprehensive test coverage

### User Experience
- Intuitive familiar pattern (checkbox + custom input)
- Clear visual indicators (⏱️ vs 💾)
- Low friction: 90% use presets, 10% add custom
- Non-blocking: Never prevents goal achievement
- Educational: Learn frameworks organically

## Monetization Strategy
Custom criteria creation is **free for all users**, which:
- Preserves core functionality integrity
- Allows users to evaluate the feature fully
- Creates natural upgrade path through usage

**Premium differentiation** via persistence:
- Free: Session-only (localStorage)
- Premium: Permanent database storage, cross-device access

This aligns with best practices:
- Monetize convenience, not capability
- Create stickiness through full feature access
- Upsell on workflow enhancement, not feature restrictions
