# Home Page Sections Admin Interface Requirements

## Overview
The new EventsPage features a Netflix-style interface with multiple horizontal sections. Each section displays relevant events horizontally. This document outlines the requirements for a future admin interface to manage these sections.

## Current Sections
The home page now includes the following sections:

### Time-Based Sections
1. **Last Minute Deals** (`lastMinute`)
   - Shows events with `is_last_minute` flag
   - Icon: LocalOffer
   - Always shows first when available

2. **Today** (`today`)
   - Shows events happening today
   - Icon: Today
   - Filtered by current date

3. **This Week** (`thisWeek`)
   - Shows events happening in the current week
   - Icon: DateRange
   - Filtered by current week range

4. **This Month** (`thisMonth`)
   - Shows events happening in the current month
   - Icon: CalendarMonth
   - Filtered by current month range

### Personalized Sections
5. **Recommended for You** (`recommended`)
   - Shows recommended events based on user preferences
   - Icon: Recommend
   - Currently uses popularity sorting (placeholder for ML recommendations)

6. **Near You** (`nearYou`)
   - Shows events near user's location
   - Icon: LocationOn
   - Only shown if geolocation is available
   - Filtered by distance from user location

### Category-Based Sections
7. **Dynamic Category Sections**
   - One section per event category
   - Uses category name as title
   - Shows events filtered by specific category
   - Generated dynamically based on available categories

## Admin Interface Requirements

### Section Management Table
Create an admin interface with the following features:

#### Table Columns:
- **Section Name**: Display name of the section
- **Type**: Time-based | Personalized | Category
- **Status**: Active | Inactive
- **Order**: Numeric position in display order
- **Icon**: Icon selection
- **Limit**: Number of events to show (default: 12)
- **Actions**: Edit | Delete | Move Up/Down

#### Section Configuration Fields:
- **Display Name**: Editable title for each language
- **Description**: Optional description for admin reference
- **Active Status**: Toggle to show/hide section
- **Display Order**: Drag-and-drop reordering
- **Icon Selection**: Dropdown with Material-UI icons
- **Event Limit**: Number of events to display (1-24)
- **Filter Criteria**: Advanced filtering options

### Predefined Section Types

#### Time-Based Sections
- Checkbox list to activate/deactivate:
  - [ ] Last Minute Deals
  - [ ] Today
  - [ ] This Week
  - [ ] This Month
- Custom time ranges (future enhancement)

#### Personalized Sections
- [ ] Recommended for You (requires ML implementation)
- [ ] Near You (requires geolocation)
- [ ] Recently Viewed (requires user tracking)
- [ ] Similar to Favorites (requires user data)

#### Category Sections
- Dynamic list based on available categories
- Toggle to show/hide each category section
- Option to group multiple categories into single section

### Advanced Configuration

#### Section Visibility Rules
- **User Type**: Anonymous | Authenticated | Premium
- **Location**: Show only if user location available
- **Device**: Mobile | Desktop | All
- **Time**: Show only during certain hours/days

#### Display Options
- **Layout**: Horizontal scroll | Grid | List
- **Card Size**: Small | Medium | Large
- **Show "View All" Button**: Yes/No
- **Animation**: Fade in | Slide in | None

### Implementation Notes

#### Database Schema (Suggested)
```sql
CREATE TABLE home_page_sections (
    id SERIAL PRIMARY KEY,
    section_key VARCHAR(50) UNIQUE NOT NULL,
    section_type VARCHAR(20) NOT NULL, -- 'time', 'personalized', 'category'
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    icon_name VARCHAR(50),
    event_limit INTEGER DEFAULT 12,
    visibility_rules JSONB DEFAULT '{}',
    display_options JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE section_translations (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES home_page_sections(id),
    language_code VARCHAR(5) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(section_id, language_code)
);
```

#### API Endpoints (Suggested)
- `GET /api/admin/home-sections` - List all sections with config
- `POST /api/admin/home-sections` - Create new section
- `PUT /api/admin/home-sections/:id` - Update section config
- `DELETE /api/admin/home-sections/:id` - Remove section
- `POST /api/admin/home-sections/reorder` - Update display order

#### Client Integration
The EventsPage component would need to be updated to:
1. Fetch section configuration from API
2. Render sections based on admin settings
3. Respect visibility rules and display options
4. Handle dynamic section ordering

## Migration Strategy

### Phase 1: Current Implementation
- Hard-coded sections as implemented
- All sections active by default
- Fixed display order

### Phase 2: Basic Admin Interface
- Simple toggle for each predefined section
- Basic ordering with drag-and-drop
- Translation management

### Phase 3: Advanced Configuration
- Custom sections creation
- Advanced visibility rules
- A/B testing capabilities
- Analytics integration

### Phase 4: Machine Learning
- Intelligent recommendations
- Dynamic section ordering based on user behavior
- Personalized section visibility

## Technical Considerations

### Performance
- Cache section configurations
- Lazy load sections as user scrolls
- Optimize API calls for multiple sections

### User Experience
- Smooth scrolling animations
- Loading skeletons for each section
- Error handling for failed section loads

### Analytics
- Track section engagement
- Monitor click-through rates
- A/B test different section orders

### Accessibility
- Keyboard navigation for horizontal scrolling
- Screen reader support
- Focus management

## Future Enhancements

### Smart Sections
- **Trending**: Events with high engagement
- **Weather-Based**: Outdoor events based on weather
- **Social**: Events attended by user's friends
- **Seasonal**: Holiday and seasonal events

### Business Intelligence
- Section performance analytics
- Revenue attribution per section
- User engagement heatmaps
- Conversion tracking

This admin interface will provide complete control over the home page experience while maintaining the flexibility to experiment with different layouts and section combinations.
