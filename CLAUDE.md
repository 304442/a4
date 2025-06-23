# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an A4-sized weekly planner web application designed for both digital use and printing. It uses Svelte 5 for reactivity and PocketBase as the backend database.

## Technology Stack

- **Frontend**: Svelte 5 (compiled with Vite)
- **Backend**: PocketBase (included as `pocketbase.umd.js`)
- **Languages**: JavaScript/Svelte, CSS
- **Build system**: Vite for production builds
- **External Dependencies**:
  - Svelte 5 with runes for reactivity
  - PocketBase JavaScript SDK for backend communication
  - Aladhan API for prayer times
  - OpenStreetMap Nominatim API for location services

## Deployment

The application has two deployment environments:
- **Production (main branch)**: https://a4.48d1.cc
- **Development (dev branch)**: https://dev.a4.48d1.cc

Deployment happens automatically when pushing to GitHub:
- **VPS auto-build**: The VPS monitors the repository and automatically builds the Svelte app on push
- **Build process**: Runs `npm install` and `npm run build` in the project directory
- **Docker Compose** handles:
  - **Caddy**: Reverse proxy handling routing
  - **PocketBase**: Backend served at `/_/*` routes
  - **Static files**: Frontend served at root

Note: The dev branch builds automatically take ~1 minute after pushing

## Application Access

### Production Environment
- **Main application**: https://a4.48d1.cc
- **PocketBase Admin UI**: https://a4.48d1.cc/_/
- **PocketBase API**: https://a4.48d1.cc/api/*

### Development Environment
- **Dev application**: https://dev.a4.48d1.cc
- **PocketBase Admin UI**: https://dev.a4.48d1.cc/_/
- **PocketBase API**: https://dev.a4.48d1.cc/api/*

## Key Architecture

The application follows an offline-first architecture with localStorage for immediate persistence and PocketBase for cloud sync.

### Source Files
- `index.html` - HTML entry point (loads PocketBase SDK from CDN)
- `src/` - Source code directory
  - `App.svelte` - Main application component
  - `main.js` - Application entry point
  - `app.css` - A4-optimized styling including setup notification styles
  - `lib/store.svelte.js` - Svelte 5 store with all application logic using runes
  - `components/` - Individual Svelte components for each section
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite build configuration

### Production Build
- VPS automatically runs `npm install` and `npm run build` on push
- Build output is served directly by the VPS
- No build artifacts are committed to the repository

### Data Flow
1. User input → Svelte 5 reactive state (using $state runes)
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
All state is managed within the Svelte store using $state runes. Key state properties in `store.svelte.js`:
- `currentWeek` - ISO week format (YYYY-Www)
- `currentTemplateId` - Currently active template
- `pendingSync` - Queue for offline changes
- Various data objects (schedule, tasks, workouts, etc.)
- All reactive state uses Svelte 5's $state() rune

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

### Latest Changes (2024)
- Reordered task columns: Priority now appears before Task description
- Removed parentheses from week date range displays
- Unified section formatting: All sections now have consistent headers without bullets
- Replaced S/M column headers with 📊/🎯 emojis
- Added CSS variables for color management and maintainability
- Code reduction: Consolidated duplicate functions and simplified logic
- All dropdowns now have consistent light blue background

### Task Management
- Task numbers are auto-generated (not editable)
- Priority is a dropdown (A, B, C, D)
- Tag is a dropdown (Personal, Work)
- Column order: # → ⭐ → Task → 🏷️ → Start → Due → Delay → Done → ✓
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
- 📊 for Score
- 🎯 for Max score
- 🔥 for Streak (in schedule table)
- Text-only headers for Start, Due, Done, Delay

## Common Tasks

### Database Setup
When the application starts and detects no database is initialized:
1. A notification appears: "Database not initialized"
2. User clicks "Setup" button to open the setup modal
3. The setup modal (`SetupModal.svelte`) provides:
   - Complete help documentation with PocketBase schema reference
   - Default collections schema (templates and planners)
   - Default template with complete weekly structure
   - Validation tools for collections and seed data
   - Multiple setup options: Full Setup, Schema Only, Seed Only
   - Progress tracking and detailed logging
   - Password visibility toggle for database credentials

### Setup Modal Features
The setup modal is a Svelte component that:
- Uses step-by-step wizard interface
- Tests PocketBase connection before proceeding
- Authenticates admin user
- Creates collections with proper schema
- Seeds database with default template
- Shows real-time progress during setup operations
- Handles errors gracefully with user feedback
- Can be opened by setting `plannerStore.showSetupModal = true`

**IMPORTANT**: The collections schema and seed data in `SetupModal.svelte` must perfectly match:
- The validation rules in `validateCollections()` and `validateSeeds()`
- The help documentation shown in the modal
- The field properties documented in the PocketBase Schema Reference
- All fields must include: `name`, `type`, `required`, `presentable`
- JSON fields must have `maxSize` limits
- Text fields should have `min`/`max` lengths where appropriate
- The week_id pattern must be: `^\\d{4}-W(0[1-9]|[1-4]\\d|5[0-3])$`

### Adding a new data section
1. Add data structure to template defaults in `SetupModal.svelte` (getDefaultTemplate function)
2. Add corresponding state property in `store.svelte.js` using $state()
3. Create new Svelte component in `src/components/`
4. Import and add component to `App.svelte`
5. Update save/load functions to include new data
6. Add to PocketBase schema if persistent storage needed

### Modifying calculations
Point calculations and scoring logic are in the `calculateScores()` method in `store.svelte.js`.

### Changing prayer time calculation
Prayer times use the Islamic Society of North America (ISNA) method. Modify calculation parameters in the `fetchPrayerTimes()` method in `store.svelte.js`.

## Complete Feature List

### Schedule Section
- Time column (18mm, left-aligned) - shows section names (QIYAM, FAJR, etc.)
- Day column (20mm, left-aligned) - shows activity prefixes
- Activities organized by categories (prayer times, time blocks, ALLDAY, TOTAL)
- Daily value inputs (0-9 or 0-99 based on max)
- Automatic score calculation and progress bar
- Streak tracking with 🔥 emoji
- Color-coded progress bars (red/yellow/green)

### Tasks Section
- 15 task rows by default
- Priority dropdown (A/B/C/D) with ⭐ header
- Tag dropdown (Personal/Work) with 🏷️ header  
- Date fields for Start/Due/Done
- Automatic delay calculation with color coding
- Completion checkbox with ✓
- Column order: # → ⭐ → Task → 🏷️ → Start → Due → Delay → Done → ✓

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
- Single line with inline inputs
- Comma-separated format
- No bullet points

### Financial Section
- Single line format: name: £value (account)
- Comma-separated items
- No bullet points

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

## File Structure

```
/
├── src/                # Source code directory
│   ├── App.svelte      # Main application component
│   ├── app.css         # All styling including print styles
│   ├── main.js         # Application entry point
│   ├── vite-env.d.ts   # TypeScript declarations
│   ├── lib/
│   │   └── store.svelte.js  # Svelte store with application logic
│   └── components/     # Individual UI components
│       ├── Header.svelte
│       ├── ScheduleTable.svelte
│       ├── TasksSection.svelte
│       ├── SetupModal.svelte
│       └── ... (other components)
├── index.html          # HTML entry point (references /src/main.js)
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite build configuration
├── svelte.config.js    # Svelte configuration
├── jsconfig.json       # JavaScript configuration
├── CLAUDE.md           # This documentation file
└── .gitignore          # Git ignore file
```

## Key Functions and Methods

### In store.svelte.js (PlannerStore class):
- `init()` - Application initialization
- `checkDatabaseInitialized()` - Verifies PocketBase setup
- `loadWeek(isoWeek)` - Loads data for a specific week
- `saveData()` - Saves to localStorage and syncs to PocketBase
- `calculateScores()` - Updates all scores and streaks
- `fetchPrayerTimes()` - Gets prayer times from API
- `syncPendingData()` - Retries failed sync operations
- `updateTaskField(task, field, value)` - Updates task field and saves
- `updateTaskDate(task, field, value)` - Updates task date, recalculates delay, and saves
- `toggleSelector(event, type)` - Simplified selector toggle logic
- All state managed with Svelte 5 $state() runes

### In SetupModal.svelte:
- `closeModal()` - Closes the setup interface
- `testConnection()` - Tests PocketBase connection
- `authenticateAdmin()` - Logs in as admin
- `createCollections()` - Creates database collections
- `seedDatabase()` - Seeds initial data
- `getTemplatesSchema()` - Returns templates collection schema
- `getPlannersSchema()` - Returns planners collection schema
- `getDefaultTemplate()` - Returns default template data

## Important Implementation Details

1. **Offline-First**: All data saves to localStorage first, then syncs to PocketBase when online
2. **ID Generation**: Uses `id_${Date.now()}_${counter}` pattern for unique IDs
3. **Week Format**: ISO 8601 week format (YYYY-Www, e.g., "2024-W15")
4. **Date Format**: Dates stored as YYYY-MM-DD, displayed as MM/DD
5. **Score Calculation**: Real-time calculation based on daily inputs
6. **Streak Tracking**: Counts consecutive days with activity
7. **Sync Queue**: Failed syncs stored in `pendingSync` array for retry
8. **Constants**: Timing values defined as constants at top of store.svelte.js:
   - `SAVE_DEBOUNCE_MS`: 500ms debounce for save operations
   - `SAVE_ERROR_TIMEOUT_MS`: 3000ms timeout for error messages
   - `SAVE_TIMEOUT_MS`: 5000ms general save timeout
   - `AUTO_SAVE_INTERVAL_MS`: 30000ms auto-save interval
   - `GEOLOCATION_MAX_AGE_MS`: 60000ms max age for geolocation
   - `NOTIFICATION_TIMEOUT_MS`: 3000ms notification display time

## Development & Building

### Development
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
# VPS automatically builds and serves the application
# No manual deployment steps required
```

### Key Differences from Alpine.js Version
1. **Reactivity**: Uses Svelte 5 $state runes instead of Alpine.js x-data
2. **Components**: Modular Svelte components instead of inline HTML
3. **Build Step**: Requires compilation with Vite
4. **State Management**: Centralized store with reactive class instance
5. **Performance**: Compiled components with minimal runtime overhead


## Common Issues and Solutions

1. **Database not initialized**: Click "Setup" button in notification
2. **Sync failures**: Check network connection, data auto-retries
3. **Prayer times not loading**: Check location permissions or select city manually
4. **Print layout issues**: Use Chrome/Edge for best print results
5. **Build errors**: Ensure Svelte 5 (svelte@next) is installed