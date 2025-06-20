// Setup Modal - All-in-one file for A4 Planner database setup
// This file contains JavaScript, CSS, and HTML for the setup modal

(function() {
  // Inject CSS styles
  const styles = `
    /* Setup Modal Styles */
    .setup-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .setup-modal-content {
      background: white;
      border-radius: 8px;
      width: 100%;
      max-width: 1400px;
      height: 90vh;
      max-height: 800px;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .setup-container {
      padding: 6px;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.1;
      color: #333;
    }

    .setup-container h2 {
      font-size: 12px;
      font-weight: 500;
      margin: 6px 0 3px 0;
      color: #555;
    }

    .setup-container button {
      padding: 3px 6px;
      background: #007bff;
      color: white;
      border: 0;
      border-radius: 2px;
      cursor: pointer;
      font-size: 10px;
      margin: 1px;
    }

    .setup-container button:disabled {
      background: #ccc;
    }

    .setup-container button:hover:not(:disabled) {
      background: #0056b3;
    }

    .setup-danger {
      background: #6c757d !important;
    }

    .setup-pass-toggle {
      position: absolute;
      right: 2px;
      top: 1px;
      padding: 1px 4px !important;
      font-size: 8px !important;
      background: #f8f9fa !important;
      color: #333 !important;
      border: 1px solid #ddd !important;
      z-index: 10;
    }

    .setup-pass-toggle:hover {
      background: #e9ecef !important;
    }

    .setup-row {
      display: flex;
      gap: 4px;
      margin: 3px 0;
      justify-content: center;
    }

    .setup-col {
      flex: 1;
    }

    .setup-editor {
      width: 100%;
      min-height: 150px;
      font-family: monospace;
      font-size: 10px;
      border: 1px solid #ccc;
      border-radius: 2px;
      padding: 3px;
      resize: vertical;
    }

    .setup-editor:focus {
      outline: none;
      border-color: #007bff;
    }

    .setup-container input {
      width: 100%;
      padding: 2px;
      border: 1px solid #ccc;
      border-radius: 2px;
      font-size: 10px;
    }

    .setup-container input:focus {
      outline: none;
      border-color: #007bff;
    }

    #setup-pass {
      padding-right: 25px;
    }

    .setup-container label {
      display: block;
      font-weight: 500;
      font-size: 9px;
      margin-bottom: 1px;
    }

    .setup-status {
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 9px;
      margin-top: 2px;
    }

    .setup-valid {
      background: #d4edda;
      color: #155724;
    }

    .setup-invalid {
      background: #f8d7da;
      color: #721c24;
    }

    .setup-warning {
      background: #fff3cd;
      color: #856404;
    }

    .setup-stats {
      display: flex;
      gap: 8px;
      padding: 3px;
      background: #e9ecef;
      border-radius: 2px;
      margin: 3px 0;
      font-size: 9px;
    }

    .setup-stat {
      text-align: center;
    }

    .setup-stat-val {
      font-weight: bold;
      font-size: 11px;
      display: block;
    }

    .setup-output {
      margin-top: 4px;
      padding: 3px;
      background: #222;
      color: #eee;
      border-radius: 2px;
      font-family: monospace;
      font-size: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .setup-output .le {
      color: #ff6b6b;
    }

    .setup-output .ls {
      color: #51cf66;
    }

    .setup-output .lw {
      color: #ffd43b;
    }

    .setup-output .li {
      color: #74c0fc;
    }

    .setup-progress {
      width: 100%;
      height: 2px;
      background: #e9ecef;
      border-radius: 1px;
      margin: 2px 0;
    }

    .setup-progress-fill {
      height: 100%;
      background: #007bff;
      transition: width 0.3s;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .setup-modal-content {
        max-width: 100%;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
      }
      
      .setup-row {
        flex-direction: column;
      }
      
      .setup-col {
        width: 100%;
      }
    }

    @media print {
      .setup-modal-overlay {
        display: none !important;
      }
    }
  `;

  // Inject styles into document
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // HTML template
  const modalHTML = `
    <div x-show="showSetupModal" 
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100"
         x-transition:leave-end="opacity-0"
         class="setup-modal-overlay">
      <div class="setup-modal-content"
           x-transition:enter="transition ease-out duration-200"
           x-transition:enter-start="opacity-0 scale-95"
           x-transition:enter-end="opacity-100 scale-100"
           x-transition:leave="transition ease-in duration-150"
           x-transition:leave-start="opacity-100 scale-100"
           x-transition:leave-end="opacity-0 scale-95">
        <div class="setup-container">
          <div class="setup-stats">
            <div class="setup-stat"><span class="setup-stat-val" x-text="setupStats.collections">0</span>Collections</div>
            <div class="setup-stat"><span class="setup-stat-val" x-text="setupStats.fields">0</span>Fields</div>
            <div class="setup-stat"><span class="setup-stat-val" x-text="setupStats.seeds">0</span>Seeds</div>
            <div class="setup-stat"><span class="setup-stat-val" x-text="setupStats.health">❓</span>Health</div>
          </div>
          
          <div class="setup-progress"><div class="setup-progress-fill" :style="\`width: \${setupProgress}%\`"></div></div>
          
          <div class="setup-row">
            <div class="setup-col">
              <label for="setup-url">PocketBase URL:</label>
              <input id="setup-url" x-model="setupConfig.url" placeholder="http://localhost:8090">
            </div>
            <div class="setup-col">
              <label for="setup-email">Admin Email:</label>
              <input id="setup-email" x-model="setupConfig.email">
            </div>
            <div class="setup-col">
              <label for="setup-pass">Password:</label>
              <div style="position:relative;">
                <input id="setup-pass" :type="setupShowPassword ? 'text' : 'password'" x-model="setupConfig.password">
                <button type="button" @click="setupShowPassword = !setupShowPassword" class="setup-pass-toggle" x-text="setupShowPassword ? '🙈' : '👁️'"></button>
              </div>
            </div>
          </div>
          
          <div class="setup-row">
            <button @click="validateSetup" :disabled="!setupButtonsEnabled.validate">✅ Validate</button>
            <button @click="runFullSetup" :disabled="!setupButtonsEnabled.setup">🚀 Full Setup</button>
            <button @click="runSchemaOnly" :disabled="!setupButtonsEnabled.schema">📋 Schema Only</button>
            <button @click="runSeedOnly" :disabled="!setupButtonsEnabled.seed">🌱 Seed Only</button>
            <button @click="showSetupHelp = true">📚 Help & Docs</button>
          </div>
          
          <div class="setup-row">
            <button @click="resetSetup" class="setup-danger">🗑️ Reset</button>
          </div>
          
          <div class="setup-row">
            <div class="setup-col">
              <h2>📋 Collections Schema</h2>
              <textarea x-model="setupCollections" class="setup-editor" placeholder="Collections JSON..." @input="validateCollections"></textarea>
              <div class="setup-status" :class="setupValidation.collections.valid ? 'setup-valid' : 'setup-invalid'" x-text="setupValidation.collections.message">Ready</div>
            </div>
            <div class="setup-col">
              <h2>🌱 Seed Data</h2>
              <textarea x-model="setupSeeds" class="setup-editor" placeholder="Seed data JSON..." @input="validateSeeds"></textarea>
              <div class="setup-status" :class="setupValidation.seeds.valid ? 'setup-valid' : 'setup-invalid'" x-text="setupValidation.seeds.message">Ready</div>
            </div>
          </div>
          
          <div id="setup-out" class="setup-output"></div>
        </div>
      </div>
    </div>

    <!-- Help Modal -->
    <div x-show="showSetupHelp" 
         @click.self="showSetupHelp = false"
         style="display:none;position:fixed;z-index:11000;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.5);"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100">
      <div style="background:white;margin:2% auto;padding:15px;width:95%;max-width:1200px;border-radius:3px;max-height:90vh;overflow-y:auto;font-size:10px;"
           x-transition:enter="transition ease-out duration-200"
           x-transition:enter-start="opacity-0 scale-95"
           x-transition:enter-end="opacity-100 scale-100">
        <button @click="showSetupHelp = false" style="float:right;background:#f8f9fa;border:1px solid #dee2e6;padding:5px 10px;cursor:pointer;border-radius:3px;">✕ Close</button>
        <h1 style="font-size:16px;margin-bottom:10px;">📚 PocketBase Schema Reference</h1>
        
        <h2 style="font-size:14px;margin-top:15px;">🔧 Field Types & Properties</h2>
        
        <h3 style="font-size:12px;margin-top:10px;">Text Fields</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "name": "title",
  "type": "text",
  "required": true,
  "presentable": true,
  "min": 1,                // Minimum length
  "max": 100,              // Maximum length
  "pattern": "^[A-Z].*"    // Regex pattern
}
        </pre>

        <h3 style="font-size:12px;margin-top:10px;">Number Fields</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "name": "age",
  "type": "number",
  "required": false,
  "presentable": false,
  "min": 0,                // Minimum value
  "max": 150,              // Maximum value
  "noDecimal": true        // Integer only
}
        </pre>

        <h3 style="font-size:12px;margin-top:10px;">Boolean Fields</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "name": "is_active",
  "type": "bool",
  "required": false,
  "presentable": false
}
        </pre>

        <h3 style="font-size:12px;margin-top:10px;">JSON Fields</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "name": "metadata",
  "type": "json",
  "required": false,
  "presentable": false,
  "maxSize": 2097152       // Max size in bytes (2MB)
}
        </pre>

        <h3 style="font-size:12px;margin-top:10px;">Relation Fields</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "name": "template_id",
  "type": "relation",
  "required": true,
  "presentable": true,
  "collectionId": "xyz123",     // Target collection ID
  "cascadeDelete": false,       // Delete this when related deleted
  "minSelect": 1,               // Minimum selections
  "maxSelect": 1,               // Maximum selections (1 = single)
  "displayFields": ["name"]     // Fields to show in UI
}
        </pre>

        <h2 style="font-size:14px;margin-top:15px;">📋 Collection Properties</h2>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "name": "planners",              // Collection name (a-z, 0-9, _)
  "type": "base",                  // "base" or "auth"
  "listRule": "",                  // API rules (see below)
  "viewRule": "",
  "createRule": "",
  "updateRule": "",
  "deleteRule": "",
  "indexes": [                     // SQL indexes for performance
    "CREATE INDEX idx_week ON planners (week_id)"
  ],
  "fields": [...]                  // Array of field definitions
}
        </pre>

        <h2 style="font-size:14px;margin-top:15px;">🔒 API Rules</h2>
        <p style="margin:5px 0;">Rules control who can access records via API. Common patterns:</p>
        
        <h3 style="font-size:12px;margin-top:10px;">Public Access</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "listRule": "",          // Empty string = public access
  "viewRule": "",          // Anyone can read
  "createRule": null,      // null = admin only
  "updateRule": null,      // No public updates
  "deleteRule": null       // No public deletes
}
        </pre>

        <h3 style="font-size:12px;margin-top:10px;">Authenticated Users</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "listRule": "@request.auth.id != ''",    // Any logged in user
  "viewRule": "@request.auth.id != ''",    
  "createRule": "@request.auth.id != ''",  
  "updateRule": "@request.auth.id != ''",  
  "deleteRule": "@request.auth.id != ''"   
}
        </pre>

        <h3 style="font-size:12px;margin-top:10px;">Owner Only Access</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
{
  "listRule": "user = @request.auth.id",     // List own records only
  "viewRule": "user = @request.auth.id",     // View own records only
  "createRule": "@request.auth.id != ''",    // Any auth user can create
  "updateRule": "user = @request.auth.id",   // Update own records only
  "deleteRule": "user = @request.auth.id"    // Delete own records only
}
        </pre>

        <h3 style="font-size:12px;margin-top:10px;">Complex Rule Examples</h3>
        <pre style="background:#f8f8f8;padding:8px;border-radius:3px;margin:5px 0;">
// Public read, authenticated write
{
  "listRule": "",                            // Public can read
  "viewRule": "",                            
  "createRule": "@request.auth.id != ''",    // Must be logged in to create
  "updateRule": "user = @request.auth.id",   // Owner only update
  "deleteRule": "user = @request.auth.id"    // Owner only delete
}

// Public or owner access
{
  "listRule": "public = true || user = @request.auth.id",
  "viewRule": "public = true || user = @request.auth.id",
  "createRule": "@request.auth.id != ''",
  "updateRule": "user = @request.auth.id",
  "deleteRule": "user = @request.auth.id"
}

// Verified users only
{
  "listRule": "@request.auth.verified = true",
  "viewRule": "@request.auth.verified = true",
  "createRule": "@request.auth.verified = true",
  "updateRule": "@request.auth.verified = true && user = @request.auth.id",
  "deleteRule": "@request.auth.verified = true && user = @request.auth.id"
}

// Role-based access
{
  "listRule": "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
  "viewRule": "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
  "createRule": "@request.auth.role = 'editor'",
  "updateRule": "@request.auth.role = 'admin' || user = @request.auth.id",
  "deleteRule": "@request.auth.role = 'admin'"
}
        </pre>

        <h2 style="font-size:14px;margin-top:15px;">❌ CRITICAL ERRORS TO AVOID</h2>
        
        <h3 style="font-size:12px;margin-top:10px;">🚫 NEVER Use These Patterns (DEPRECATED)</h3>
        <pre style="background:#ffebee;padding:8px;border-radius:3px;margin:5px 0;color:#c62828;">
// ❌ WRONG: Nested options structure (old PocketBase version)
{
  "name": "title",
  "type": "text",
  "required": true,
  "options": {              // ❌ DON'T USE "options" wrapper
    "max": 100,
    "min": 1
  }
}

// ❌ WRONG: Schema key instead of fields
{
  "name": "posts",
  "schema": [...]           // ❌ DON'T USE "schema" key
}

// ❌ WRONG: Invalid field names
{
  "name": "field name",     // ❌ No spaces
  "name": "field-name",     // ❌ No hyphens
  "name": "123field",       // ❌ Can't start with number
  "name": "id",             // ❌ Reserved name
}

// ❌ WRONG: Missing required properties
{
  "name": "title"           // ❌ Missing type, required, presentable
}
        </pre>

        <h3 style="font-size:12px;margin-top:10px;">✅ CORRECT Patterns (Current PocketBase)</h3>
        <pre style="background:#e8f5e9;padding:8px;border-radius:3px;margin:5px 0;color:#2e7d32;">
// ✅ CORRECT: Direct properties
{
  "name": "title",
  "type": "text",
  "required": true,
  "presentable": true,
  "max": 100,               // ✅ Direct property
  "min": 1                  // ✅ Direct property
}

// ✅ CORRECT: Fields key
{
  "name": "posts",
  "fields": [...]           // ✅ Use "fields" key
}

// ✅ CORRECT: Valid field names
{
  "name": "field_name",     // ✅ Underscores OK
  "name": "fieldName",      // ✅ camelCase OK
  "name": "field123"        // ✅ Numbers at end OK
}
        </pre>

        <h2 style="font-size:14px;margin-top:15px;">💡 Pro Tips</h2>
        <ul style="margin:5px 0;padding-left:20px;">
          <li>Always include <code>type</code>, <code>required</code>, and <code>presentable</code> for every field</li>
          <li>Use <code>indexes</code> for fields you'll search/filter frequently</li>
          <li>JSON fields are powerful but can't be indexed - use wisely</li>
          <li>Test your API rules thoroughly before production</li>
          <li>Keep field names simple: lowercase, no spaces, underscores OK</li>
          <li>Set reasonable <code>maxSize</code> limits on JSON fields</li>
          <li>Use <code>pattern</code> for email, phone, or custom validation</li>
          <li>Remember: empty string "" = public access, null = admin only</li>
        </ul>

        <h2 style="font-size:14px;margin-top:15px;">🔍 Quick Validation Checklist</h2>
        <ol style="margin:5px 0;padding-left:20px;">
          <li>✓ Every field has: name, type, required, presentable</li>
          <li>✓ Collection has: name, type, fields array</li>
          <li>✓ No "options" wrapper on field properties</li>
          <li>✓ No spaces or hyphens in field names</li>
          <li>✓ API rules are either "", null, or valid expressions</li>
          <li>✓ JSON is valid (no trailing commas, proper quotes)</li>
        </ol>
      </div>
    </div>
  `;

  // Setup functionality
  window.setupModal = {
    // Initialize setup functionality
    init(app) {
      this.app = app;
      
      // Inject HTML into container
      const container = document.getElementById('setup-modal-container');
      if (container) {
        container.innerHTML = modalHTML;
      }
      
      // Setup state variables
      app.showSetupModal = false;
      app.showSetupHelp = false;
      app.setupShowPassword = false;
      app.setupProgress = 0;
      app.setupConfig = {
        url: '/',
        email: 'admin@example.com',
        password: 'unifiedpassword'
      };
      app.setupStats = {
        collections: 0,
        fields: 0,
        seeds: 0,
        health: '❓'
      };
      app.setupButtonsEnabled = {
        validate: true,
        setup: true,
        schema: true,
        seed: true
      };
      app.setupValidation = {
        collections: { valid: true, message: 'Ready' },
        seeds: { valid: true, message: 'Ready' }
      };
      app.setupCollections = '';
      app.setupSeeds = '';

      // Bind all setup methods to the app
      app.initializeSetup = this.initializeSetup.bind(this);
      app.validateSetup = this.validateSetup.bind(this);
      app.runFullSetup = this.runFullSetup.bind(this);
      app.runSchemaOnly = this.runSchemaOnly.bind(this);
      app.runSeedOnly = this.runSeedOnly.bind(this);
      app.resetSetup = this.resetSetup.bind(this);
      app.validateCollections = this.validateCollections.bind(this);
      app.validateSeeds = this.validateSeeds.bind(this);
      app.updateSetupStats = this.updateSetupStats.bind(this);
    },

    initializeSetup() {
      this.app.setupCollections = JSON.stringify(this.getDefaultCollections(), null, 2);
      this.app.setupSeeds = JSON.stringify(this.getDefaultSeeds(), null, 2);
      this.updateSetupStats();
      this.validateCollections();
      this.validateSeeds();
    },

    getDefaultCollections() {
      return [
        {
          name: "templates",
          type: "base",
          fields: [
            { name: "name", type: "text", required: true, presentable: true, min: 1, max: 50 },
            { name: "description", type: "text", required: false, presentable: false, max: 200 },
            { name: "is_default", type: "bool", required: false, presentable: false },
            { name: "version", type: "number", required: false, presentable: false, min: 1, noDecimal: true },
            { name: "structure", type: "json", required: true, presentable: false, maxSize: 5242880 }
          ],
          indexes: ["CREATE UNIQUE INDEX idx_templates_name ON templates (name)"],
          listRule: "",
          viewRule: "",
          createRule: null,
          updateRule: null,
          deleteRule: null
        },
        {
          name: "planners",
          type: "base",
          fields: [
            { name: "week_id", type: "text", required: true, presentable: true, pattern: "^\\\\d{4}-W(0[1-9]|[1-4]\\\\d|5[0-3])$", min: 8, max: 8 },
            { name: "title", type: "text", required: false, presentable: false, max: 100 },
            { name: "city", type: "text", required: false, presentable: false, max: 50 },
            { name: "date_range", type: "text", required: false, presentable: false, max: 20 },
            { name: "prayer_times", type: "json", required: false, presentable: false, maxSize: 2048 },
            { name: "schedule_data", type: "json", required: false, presentable: false, maxSize: 1048576 },
            { name: "tasks_data", type: "json", required: false, presentable: false, maxSize: 524288 },
            { name: "workout_data", type: "json", required: false, presentable: false, maxSize: 262144 },
            { name: "meals_data", type: "json", required: false, presentable: false, maxSize: 131072 },
            { name: "grocery_data", type: "json", required: false, presentable: false, maxSize: 131072 },
            { name: "measurements_data", type: "json", required: false, presentable: false, maxSize: 65536 },
            { name: "financials_data", type: "json", required: false, presentable: false, maxSize: 65536 }
          ],
          indexes: ["CREATE UNIQUE INDEX idx_planners_week_id ON planners (week_id)"],
          listRule: "",
          viewRule: "",
          createRule: "",
          updateRule: "",
          deleteRule: ""
        }
      ];
    },

    getDefaultSeeds() {
      return [
        {
          collection: "templates",
          records: [
            {
              name: "default",
              description: "Default weekly planner template with all sections",
              is_default: true,
              version: 5,
              structure: {
                prayer_times: [
                  { label: "Q", value: "4:30AM" },
                  { label: "F", value: "5:30AM" },
                  { label: "D", value: "12:30PM" },
                  { label: "A", value: "3:45PM" },
                  { label: "M", value: "6:30PM" },
                  { label: "I", value: "8:00PM" }
                ],
                schedule: [
                  {
                    name: "QIYAM",
                    activities: [
                      { name: "DAILY: Wakeup early", max_per_day: 1, max_score: 7 },
                      { name: "DAILY: Qiyam/Tahajjud", max_per_day: 1, max_score: 7 },
                      { name: "DAILY: Nutty Pudding", max_per_day: 1, max_score: 7 }
                    ]
                  },
                  {
                    name: "FAJR",
                    activities: [
                      { name: "DAILY: Fajr prayer", max_per_day: 1, max_score: 7 },
                      { name: "DAILY: Quran - 1 Juz", max_per_day: 1, max_score: 7 },
                      { name: "DAILY: 5min Cold Shower", max_per_day: 1, max_score: 7 }
                    ]
                  },
                  {
                    name: "7AM - 9AM",
                    activities: [
                      { name: "MON/THU: COMMUTE", days: ["mon", "thu"], max_per_day: 1, max_score: 2 },
                      { name: "TUE/WED/FRI: Reading/Study (book/course/skill)", days: ["tue", "wed", "fri"], max_per_day: 1, max_score: 3 },
                      { name: "SAT: Errands, Grocery shopping, Meal prep", days: ["sat"], max_per_day: 3, max_score: 3 },
                      { name: "SUN: House cleaning, laundry", days: ["sun"], max_per_day: 2, max_score: 2 }
                    ]
                  },
                  {
                    name: "9AM - 5PM",
                    activities: [
                      { name: "MON-FRI: Work", days: ["mon", "tue", "wed", "thu", "fri"], max_per_day: 1, max_score: 5 },
                      { name: "DAILY: ZeroInbox (E1, E2, E3, E4, LI, Slack)", max_per_day: 1, max_score: 30 },
                      { name: "SAT/SUN: Nature time / Outdoor Activity / Adventure", days: ["sat", "sun"], max_per_day: 1, max_score: 2 }
                    ]
                  },
                  {
                    name: "DHUHR",
                    activities: [
                      { name: "DAILY: Dhuhr prayer", max_per_day: 1, max_score: 7 },
                      { name: "TUE/WED/FRI: Sun walk (30-45 minutes)", days: ["tue", "wed", "fri"], max_per_day: 1, max_score: 3 },
                      { name: "FRI: £10 Sadaqa", days: ["fri"], max_per_day: 1, max_score: 1 }
                    ]
                  },
                  {
                    name: "ASR",
                    activities: [
                      { name: "DAILY: Asr prayer", max_per_day: 1, max_score: 7 }
                    ]
                  },
                  {
                    name: "5PM - 6:30PM",
                    activities: [
                      { name: "MON/THU: COMMUTE", days: ["mon", "thu"], max_per_day: 1, max_score: 2 },
                      { name: "TUE/WED/FRI: Workout", days: ["tue", "wed", "fri"], max_per_day: 1, max_score: 3 },
                      { name: "TUE/WED/FRI: Third Meal", days: ["tue", "wed", "fri"], max_per_day: 1, max_score: 3 }
                    ]
                  },
                  {
                    name: "6:30PM - ISHA",
                    activities: [
                      { name: "MON/TUE/WED/THU: Personal", days: ["mon", "tue", "wed", "thu"], max_per_day: 1, max_score: 4 },
                      { name: "DAILY: Family/Friends/Date calls(M, WA, Phone)", max_per_day: 1, max_score: 12 },
                      { name: "FRI/SAT/SUN: Family/Friends/Date visits/outings/activities", days: ["fri", "sat", "sun"], max_per_day: 1, max_score: 9 }
                    ]
                  },
                  {
                    name: "MAGHRIB",
                    activities: [
                      { name: "DAILY: Maghrib prayer", max_per_day: 1, max_score: 7 },
                      { name: "DAILY: Super Veggie", max_per_day: 1, max_score: 7 }
                    ]
                  },
                  {
                    name: "ISHA",
                    activities: [
                      { name: "DAILY: Isha prayer", max_per_day: 1, max_score: 7 },
                      { name: "DAILY: Sleep early", max_per_day: 1, max_score: 7 }
                    ]
                  },
                  {
                    name: "ALLDAY",
                    activities: [
                      { name: "DAILY: No Doomscrolling; (FB, YTB, LKDN, & IG)", max_per_day: 4, max_score: 28 },
                      { name: "DAILY: No Fap; (P, & M)", max_per_day: 2, max_score: 14 },
                      { name: "DAILY: No Processed; (Sugar, RefinedFlour, SeedOils, Soda, FastFood)", max_per_day: 5, max_score: 35 },
                      { name: "MON/THU: Fasting", days: ["mon", "thu"], max_per_day: 1, max_score: 2 },
                      { name: "DAILY: Expense Tracker <25", max_per_day: 0, max_score: 0 }
                    ]
                  },
                  {
                    name: "TOTAL",
                    activities: [
                      { name: "DAILY POINTS", max_per_day: 0, max_score: 247 }
                    ]
                  }
                ],
                tasks: {
                  count: 15,
                  fields: ["priority", "tag", "description", "start_date", "expected_date", "actual_date", "completed"]
                },
                workout: [
                  {
                    name: "TUESDAY",
                    exercises: [
                      { name: "Incline Dumbbell Press", default_weight: 30, default_sets: 3, default_reps: 12 },
                      { name: "Barbell Squats", default_weight: 80, default_sets: 3, default_reps: 8 },
                      { name: "DB Chest-Supported Row", default_weight: 25, default_sets: 3, default_reps: 12 },
                      { name: "Leg Curls", default_weight: 40, default_sets: 3, default_reps: 12 },
                      { name: "SS: Incline DB Curls", default_weight: 15, default_sets: 3, default_reps: 12 },
                      { name: "SS: Tricep Extensions", default_weight: 20, default_sets: 3, default_reps: 12 }
                    ]
                  },
                  {
                    name: "WEDNESDAY",
                    exercises: [
                      { name: "Barbell Bench Press", default_weight: 70, default_sets: 3, default_reps: 6 },
                      { name: "Romanian Deadlift", default_weight: 90, default_sets: 3, default_reps: 8 },
                      { name: "Lat Pulldown", default_weight: 60, default_sets: 3, default_reps: 12 },
                      { name: "Walking Lunges", default_weight: 20, default_sets: 3, default_reps: 12 },
                      { name: "SS: Cable Lateral Raises", default_weight: 10, default_sets: 3, default_reps: 15 },
                      { name: "SS: Reverse Crunches", default_weight: 0, default_sets: 3, default_reps: 15 }
                    ]
                  },
                  {
                    name: "FRIDAY",
                    exercises: [
                      { name: "Seated DB Shoulder Press", default_weight: 20, default_sets: 3, default_reps: 12 },
                      { name: "Dumbbell Row", default_weight: 25, default_sets: 3, default_reps: 12 },
                      { name: "Barbell Hip Thrust", default_weight: 100, default_sets: 3, default_reps: 15 },
                      { name: "Leg Extensions", default_weight: 50, default_sets: 3, default_reps: 12 },
                      { name: "Seated Chest Flyes", default_weight: 15, default_sets: 3, default_reps: 12 },
                      { name: "SS: Standing Calf Raises", default_weight: 30, default_sets: 3, default_reps: 20 },
                      { name: "SS: Reverse Cable Flyes", default_weight: 10, default_sets: 3, default_reps: 15 }
                    ]
                  }
                ],
                meals: [
                  {
                    name: "Nutty Pudding",
                    ingredients: "Berries ½c, Cherries 3, Pomegranate Juice 2oz, Macadamia nuts (raw) 45g, Walnuts (raw) 5g, Cocoa 1t, Brazil Nuts ¼, Milk 50-100ml, Chia Seeds 2T, Flax (ground, refr) 1t, Lecithin 1t, Ceylon Cinnamon ½t"
                  },
                  {
                    name: "Super Veggie",
                    ingredients: "Broccoli 250g, Cauliflower 150g, Mushrooms 50g, Garlic 1 clove, Ginger 3g, Cumin 1T, Black Lentils 45g, Hemp Seeds 1T, Apple Cider Vinegar 1T"
                  },
                  {
                    name: "Third Meal",
                    ingredients: "Sweet Potato 350-400g, Protein 100-150g, Grape Tomatoes 12, Avocado ½, Radishes 4, Cilantro ¼c, Lemon 1, Jalapeño (lg) 1, Chili Powder 1t"
                  }
                ],
                grocery: {
                  categories: [
                    {
                      name: "Produce",
                      items: "Broccoli 1.75kg, Cauliflower 1.05kg, Mushrooms 350g, Garlic 1 bulb, Ginger 1pc, Sweet Potato 2.8kg, Grape Tomatoes 84, Avocados (ripe) 4, Radishes 28, Cilantro 2-3 bunch"
                    },
                    {
                      name: "Fruits & Protein",
                      items: "Lemons 7, Jalapeños (lg) 7, Berries 3.5c, Cherries 21, Black Lentils 315g, Protein 1.05kg, Milk (fortified) 1L"
                    }
                  ]
                },
                measurements: [
                  { name: "Weight", placeholder: "75kg" },
                  { name: "Chest", placeholder: "42in" },
                  { name: "Waist", placeholder: "34in" },
                  { name: "Hips", placeholder: "36in" },
                  { name: "Arms", placeholder: "15in" },
                  { name: "Thighs", placeholder: "24in" }
                ],
                financials: [
                  { name: "Rent", placeholder: "850", account: "Cash" },
                  { name: "Allowance", placeholder: "850", account: "Revolut" },
                  { name: "Savings", placeholder: "3800", account: "HSBCUK" }
                ],
                city_default: "London"
              }
            }
          ]
        }
      ];
    },

    updateSetupStats() {
      try {
        const collections = JSON.parse(this.app.setupCollections);
        const seeds = JSON.parse(this.app.setupSeeds);
        
        this.app.setupStats.collections = collections.length;
        this.app.setupStats.fields = collections.reduce((sum, c) => sum + (c.fields?.length || 0), 0);
        this.app.setupStats.seeds = seeds.reduce((sum, s) => sum + (s.records?.length || 0), 0);
      } catch (e) {
        // Keep current stats on parse error
      }
    },

    validateCollections() {
      const result = this.validateJSON(this.app.setupCollections);
      this.app.setupValidation.collections = result;
      this.updateSetupStats();
      return result.valid;
    },

    validateSeeds() {
      const result = this.validateJSON(this.app.setupSeeds);
      this.app.setupValidation.seeds = result;
      this.updateSetupStats();
      return result.valid;
    },

    validateJSON(text) {
      try {
        const data = JSON.parse(text);
        return { valid: true, message: 'Valid JSON', data };
      } catch (e) {
        const match = e.message.match(/position (\d+)/);
        const pos = match ? ` at position ${match[1]}` : '';
        return { valid: false, message: `Invalid JSON${pos}` };
      }
    },

    setupLog(msg, type = 'i') {
      const out = document.getElementById('setup-out');
      const time = new Date().toLocaleTimeString();
      const typeMap = { e: 'le', s: 'ls', w: 'lw', i: 'li' };
      const line = document.createElement('div');
      line.className = typeMap[type] || 'li';
      line.textContent = `[${time}] ${msg}`;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    },

    setSetupProgress(percent, message) {
      this.app.setupProgress = percent;
      if (message) this.setupLog(message, 'i');
    },

    async validateSetup() {
      this.setupLog('Validating configuration...', 'i');
      
      if (!this.validateCollections()) {
        this.setupLog('❌ Collection validation failed', 'e');
        return false;
      }
      
      if (!this.validateSeeds()) {
        this.setupLog('❌ Seed validation failed', 'e');
        return false;
      }
      
      this.setupLog('✅ Validation passed', 's');
      return true;
    },

    async runFullSetup() {
      const out = document.getElementById('setup-out');
      out.innerHTML = '';
      if (await this.runSchemaSetup() && await this.runSeedSetup()) {
        this.setupLog('🎉 Full setup complete!', 's');
        // Close modal and reinitialize
        this.app.showSetupModal = false;
        this.app.init();
      }
    },

    async runSchemaOnly() {
      const out = document.getElementById('setup-out');
      out.innerHTML = '';
      await this.runSchemaSetup();
    },

    async runSeedOnly() {
      const out = document.getElementById('setup-out');
      out.innerHTML = '';
      await this.runSeedSetup();
    },

    async runSchemaSetup() {
      if (!this.validateCollections()) {
        this.setupLog('❌ Collection validation failed', 'e');
        return false;
      }
      
      this.setSetupProgress(20, 'Setting up schema...');
      
      try {
        const setupPb = new PocketBase(this.app.setupConfig.url);
        await setupPb.admins.authWithPassword(this.app.setupConfig.email, this.app.setupConfig.password);
        
        const collections = JSON.parse(this.app.setupCollections);
        
        this.setSetupProgress(40, 'Importing collections...');
        await setupPb.collections.import(collections, false);
        
        // Add template_id relation to planners if both collections exist
        const hasTemplates = collections.find(c => c.name === 'templates');
        const hasPlannersCollection = collections.find(c => c.name === 'planners');
        
        if (hasTemplates && hasPlannersCollection) {
          this.setSetupProgress(70, 'Adding relations...');
          try {
            const templatesCollection = await setupPb.collections.getOne('templates');
            const plannersCollection = await setupPb.collections.getOne('planners');
            
            // Check if template_id field already exists
            const hasTemplateField = plannersCollection.fields.some(f => f.name === 'template_id');
            
            if (!hasTemplateField) {
              const relationField = {
                name: "template_id",
                type: "relation",
                required: true,
                presentable: true,
                collectionId: templatesCollection.id,
                cascadeDelete: false,
                minSelect: 1,
                maxSelect: 1,
                displayFields: ["name", "description"]
              };
              
              const updatedFields = [...plannersCollection.fields];
              updatedFields.splice(1, 0, relationField); // Insert after week_id
              
              await setupPb.collections.update(plannersCollection.id, {
                fields: updatedFields
              });
              
              this.setupLog('✅ Added template_id relation to planners', 's');
            } else {
              this.setupLog('ℹ️ template_id field already exists', 'i');
            }
          } catch (e) {
            this.setupLog(`⚠️ Relation setup warning: ${e.message}`, 'w');
          }
        }
        
        this.setSetupProgress(100, '✅ Schema setup complete');
        this.app.setupStats.health = '✅';
        if (setupPb?.authStore?.isValid) setupPb.authStore.clear();
        return true;
      } catch (e) {
        this.setupLog(`❌ Schema error: ${e.message}`, 'e');
        this.app.setupStats.health = '❌';
        return false;
      }
    },

    async runSeedSetup() {
      if (!this.validateSeeds()) {
        this.setupLog('❌ Seed validation failed', 'e');
        return false;
      }
      
      this.setSetupProgress(10, 'Seeding data...');
      
      try {
        const setupPb = new PocketBase(this.app.setupConfig.url);
        await setupPb.admins.authWithPassword(this.app.setupConfig.email, this.app.setupConfig.password);
        
        const seeds = JSON.parse(this.app.setupSeeds);
        let recordCount = 0;
        
        for (const seed of seeds) {
          if (!seed.collection || !seed.records) {
            this.setupLog(`⚠️ Invalid seed format`, 'w');
            continue;
          }
          
          this.setSetupProgress(30, `Seeding ${seed.collection}...`);
          
          for (const record of seed.records) {
            try {
              await setupPb.collection(seed.collection).create(record);
              recordCount++;
            } catch (e) {
              if (e.status === 400 && e.data?.data?.name?.code === 'validation_not_unique') {
                this.setupLog(`ℹ️ Skipping duplicate: ${record.name || 'record'}`, 'i');
              } else {
                this.setupLog(`⚠️ Seed error: ${e.message}`, 'w');
              }
            }
          }
        }
        
        this.setSetupProgress(100, `✅ Seeded ${recordCount} records`);
        if (setupPb?.authStore?.isValid) setupPb.authStore.clear();
        return true;
      } catch (e) {
        this.setupLog(`❌ Seed error: ${e.message}`, 'e');
        return false;
      }
    },

    resetSetup() {
      if (confirm('Reset all setup fields to defaults?')) {
        const out = document.getElementById('setup-out');
        out.innerHTML = '';
        this.app.setupConfig.url = '/';
        this.app.setupConfig.email = 'admin@example.com';
        this.app.setupConfig.password = 'unifiedpassword';
        this.initializeSetup();
        this.setupLog('🔄 Reset to defaults', 'i');
      }
    }
  };
})();