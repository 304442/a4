# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an A4-sized weekly planner web application designed for both digital use and printing. It uses Alpine.js for reactivity and PocketBase as the backend database.

## Technology Stack

- **Frontend**: Alpine.js v3.x (included as `alpinejs.min.js`)
- **Backend**: PocketBase
- **Languages**: HTML, CSS, vanilla JavaScript
- **No build system**: Files run directly in browser

## Deployment

When you push to this git repository, it automatically deploys to a VPS via Docker Compose with:
- **Caddy**: Reverse proxy handling routing
- **PocketBase**: Backend served at `/_/*` routes
- **Static files**: Frontend served at root

## Application Access

- **Main application**: https://a4.48d1.cc
- **PocketBase Admin UI**: https://a4.48d1.cc/_/
- **PocketBase API**: https://a4.48d1.cc/api/*

## Key Architecture

The application follows an offline-first architecture with localStorage for immediate persistence and PocketBase for cloud sync.

### Main Files
- `index.html` - Main planner interface with integrated setup modal
- `script.js` - Alpine.js component with all application logic (plannerApp function) including database setup
- `styles.css` - A4-optimized styling (210mm × 297mm) including setup modal styles

### Data Flow
1. User input → Alpine.js reactive state
2. State changes → localStorage (immediate)
3. localStorage → PocketBase sync (when online)
4. Failed syncs → Pending queue with retry

### PocketBase Collections
- **templates**: Planner structure definitions (JSON)
  - Fields: name, description, is_default, version, structure
  - Default template: "complete-weekly-v5" (247 points system)
- **planners**: Weekly planner data for each user/week
  - Fields: week_id, template_id, title, city, prayer_times, schedule_data, tasks_data, workout_data, meals_data, grocery_data, measurements_data, financials_data
  - All data fields are JSON type

## Development Guidelines

### State Management
All state is managed within the Alpine.js component. Key state properties:
- `weekId` - ISO week format (YYYY-Www)
- `templateId` - Currently active template
- `pendingSyncs` - Queue for offline changes
- Various data objects (schedule, tasks, workouts, etc.)

### ID Generation
Use timestamp-based IDs: `Date.now().toString()`

### Data Persistence Pattern
```javascript
// 1. Update state
this.someData = newValue;

// 2. Save to localStorage
this.saveToLocalStorage();

// 3. Sync to PocketBase
await this.syncToPocketbase();
```

### Error Handling
Always implement graceful degradation for offline scenarios. The app should remain fully functional without PocketBase connection.

## Recent Updates & UI Features

### Task Management
- Task numbers are auto-generated (not editable)
- Priority is a dropdown (A, B, C, D)
- Tag is a dropdown (Personal, Work)
- Column order: # → Task → ⭐ → 🏷️ → Start → Due → Done → Delay → ✓
- Date columns show clear text headers without emojis

### Styling
- Input fields have light blue background (#e6f7ff) for visibility
- All table cells have borders (1px solid #e2e8f0)
- Date input fields fill entire column width
- No placeholders in input fields for cleaner look
- Mobile view shows full A4 size (no auto-scaling)

### Icons & Emojis
- ⭐ for Priority
- 🏷️ for Tag  
- 🔥 for Streak (in schedule table)
- Text-only headers for Start, Due, Done, Delay

## Common Tasks

### Database Setup
When the application starts and detects no database is initialized, it automatically shows a setup modal. The setup includes:
- Default collections schema (templates and planners)
- Default template with complete weekly structure
- All configuration is now integrated in `script.js`

### Adding a new data section
1. Add data structure to template defaults in `script.js` (getDefaultSeeds function)
2. Add corresponding state property in `script.js`
3. Add UI section in `index.html`
4. Update save/load functions to include new data
5. Add to PocketBase schema if persistent storage needed

### Modifying calculations
Point calculations and scoring logic are in the `calculateScheduleTotals()` and related methods in `script.js`.

### Changing prayer time calculation
Prayer times use the Islamic Society of North America (ISNA) method. Modify calculation parameters in the `fetchPrayerTimes()` method.

## Complete Feature List

### Schedule Section
- Activities organized by categories (TOTAL, category names)
- Daily value inputs (0-9 or 0-99 based on max)
- Automatic score calculation and progress bar
- Streak tracking with 🔥 emoji
- Color-coded progress bars (red/yellow/green)

### Tasks Section
- 10 task rows by default
- Priority dropdown (A/B/C/D) with ⭐ header
- Tag dropdown (Personal/Work) with 🏷️ header  
- Date fields for Start/Due/Done
- Automatic delay calculation with color coding
- Completion checkbox with ✓

### Workout Section
- 3-column layout for different days
- Exercise format: prefix + name (e.g., "BB: Bench Press")
- Weight (kg), Sets × Reps inputs
- Placeholder values from template

### Meals Section
- Simple name: ingredients format
- List display

### Grocery Section
- Categories with items
- List format

### Body Measurements
- Grid layout with measurement inputs
- No labels (assumes user knows what they're tracking)

### Financial Section
- Inline format: name: £value (account)
- Comma-separated items

### Visual Design
- A4 page size (210mm × 297mm) maintained on all devices
- Monospace font throughout
- Light blue (#e6f7ff) background for input fields
- Table borders (1px solid #e2e8f0)
- Alternating row colors in tables
- Fixed column widths for consistency

### Navigation
- Week selector dropdown
- City selector for prayer times
- Save status indicator (Saving.../Saved/Error!)
- Offline/sync pending indicator

## Testing Approach

No formal testing framework is used. Test manually by:
1. Testing offline functionality (disconnect network)
2. Testing sync recovery (reconnect network)
3. Testing data persistence across page reloads
4. Testing print layout in browser print preview