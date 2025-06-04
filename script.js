// ADD THIS SCRIPT AFTER YOUR MAIN script.js TO FIX COLUMN WIDTH ISSUE
// This overrides the template's getTaskColumnStyle function

document.addEventListener('DOMContentLoaded', function() {
    // Wait for Alpine.js to be ready
    setTimeout(() => {
        // Force inject CSS to override any template styles
        const style = document.createElement('style');
        style.id = 'column-width-override';
        style.textContent = `
            /* BULLETPROOF TASK TABLE COLUMN OVERRIDE */
            .task-table {
                table-layout: fixed !important;
                width: 200mm !important;
            }
            
            /* FORCE EXACT COLUMN WIDTHS - OVERRIDE ALL TEMPLATE STYLES */
            .task-table th:nth-child(1), .task-table td:nth-child(1) { 
                width: 6mm !important; 
                max-width: 6mm !important;
                min-width: 6mm !important;
            }
            
            .task-table th:nth-child(2), .task-table td:nth-child(2) { 
                width: 6mm !important; 
                max-width: 6mm !important;
                min-width: 6mm !important;
            }
            
            .task-table th:nth-child(3), .task-table td:nth-child(3) { 
                width: 4mm !important; /* NARROW TAG COLUMN */
                max-width: 4mm !important;
                min-width: 4mm !important;
            }
            
            .task-table th:nth-child(4), .task-table td:nth-child(4) { 
                width: 147mm !important; /* WIDE DESCRIPTION COLUMN */
                max-width: 147mm !important;
                min-width: 147mm !important;
                text-align: left !important;
                padding-left: 1mm !important;
            }
            
            .task-table th:nth-child(5), .task-table td:nth-child(5) { 
                width: 8mm !important; 
                max-width: 8mm !important;
                min-width: 8mm !important;
            }
            
            .task-table th:nth-child(6), .task-table td:nth-child(6) { 
                width: 8mm !important; 
                max-width: 8mm !important;
                min-width: 8mm !important;
            }
            
            .task-table th:nth-child(7), .task-table td:nth-child(7) { 
                width: 8mm !important; 
                max-width: 8mm !important;
                min-width: 8mm !important;
            }
            
            .task-table th:nth-child(8), .task-table td:nth-child(8) { 
                width: 6mm !important; 
                max-width: 6mm !important;
                min-width: 6mm !important;
            }
            
            .task-table th:nth-child(9), .task-table td:nth-child(9) { 
                width: 4mm !important; 
                max-width: 4mm !important;
                min-width: 4mm !important;
            }
            
            /* DISABLE ANY INLINE STYLES FROM JAVASCRIPT */
            .task-table th[style*="width"], .task-table td[style*="width"] {
                width: unset !important;
            }
            
            /* FINAL OVERRIDE FOR SPECIFIC COLUMNS */
            .task-table th:nth-child(3)[style], .task-table td:nth-child(3)[style] { 
                width: 4mm !important; 
                max-width: 4mm !important;
            }
            
            .task-table th:nth-child(4)[style], .task-table td:nth-child(4)[style] { 
                width: 147mm !important; 
                max-width: 147mm !important;
                text-align: left !important;
            }
        `;
        
        // Remove any existing override styles
        const existingStyle = document.getElementById('column-width-override');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Inject the styles
        document.head.appendChild(style);
        
        // Override the getTaskColumnStyle function if it exists
        if (window.Alpine && window.Alpine.store) {
            // Try to find and override the Alpine.js component
            const observer = new MutationObserver(() => {
                const plannerElement = document.querySelector('[x-data]');
                if (plannerElement && plannerElement._x_dataStack) {
                    const data = plannerElement._x_dataStack[0];
                    if (data && typeof data.getTaskColumnStyle === 'function') {
                        // Override the function with our fixed widths
                        data.getTaskColumnStyle = function(i) {
                            const customWidths = [
                                'width: 6mm !important; max-width: 6mm !important; text-align: center;',     // № column
                                'width: 6mm !important; max-width: 6mm !important; text-align: center;',     // 🔥 column  
                                'width: 4mm !important; max-width: 4mm !important; text-align: center;',     // 🏷️ column (NARROW)
                                'width: 147mm !important; max-width: 147mm !important; text-align: left; padding-left: 1mm;', // ✏️ Task description (WIDE)
                                'width: 8mm !important; max-width: 8mm !important; text-align: center;',     // 📅 column
                                'width: 8mm !important; max-width: 8mm !important; text-align: center;',     // 🎯 column
                                'width: 8mm !important; max-width: 8mm !important; text-align: center;',     // ✅ column
                                'width: 6mm !important; max-width: 6mm !important; text-align: center;',     // ⏰ column
                                'width: 4mm !important; max-width: 4mm !important; text-align: center;'      // ✓ column
                            ];
                            
                            return customWidths[i] || 'text-align: left;';
                        };
                        
                        console.log('✅ Column width override applied successfully');
                        observer.disconnect();
                    }
                }
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Stop observing after 5 seconds
            setTimeout(() => observer.disconnect(), 5000);
        }
        
        // Also force re-apply styles periodically to ensure they stick
        const forceReapply = () => {
            const taskTable = document.querySelector('.task-table');
            if (taskTable) {
                // Force table layout
                taskTable.style.tableLayout = 'fixed';
                taskTable.style.width = '200mm';
                
                // Force column widths
                const columns = taskTable.querySelectorAll('th, td');
                columns.forEach((col, index) => {
                    const colIndex = (index % 9) + 1; // Get column position (1-9)
                    
                    switch (colIndex) {
                        case 1: // №
                        case 2: // 🔥
                            col.style.width = '6mm';
                            col.style.maxWidth = '6mm';
                            col.style.minWidth = '6mm';
                            break;
                        case 3: // 🏷️ (NARROW)
                        case 9: // ✓
                            col.style.width = '4mm';
                            col.style.maxWidth = '4mm';
                            col.style.minWidth = '4mm';
                            break;
                        case 4: // ✏️ Task description (WIDE)
                            col.style.width = '147mm';
                            col.style.maxWidth = '147mm';
                            col.style.minWidth = '147mm';
                            col.style.textAlign = 'left';
                            col.style.paddingLeft = '1mm';
                            break;
                        case 5: // 📅
                        case 6: // 🎯
                        case 7: // ✅
                            col.style.width = '8mm';
                            col.style.maxWidth = '8mm';
                            col.style.minWidth = '8mm';
                            break;
                        case 8: // ⏰
                            col.style.width = '6mm';
                            col.style.maxWidth = '6mm';
                            col.style.minWidth = '6mm';
                            break;
                    }
                });
                
                console.log('🔧 Column widths force-applied via JavaScript');
            }
        };
        
        // Apply immediately and then periodically
        forceReapply();
        setInterval(forceReapply, 2000); // Re-apply every 2 seconds
        
        console.log('🚀 Column width override script loaded');
    }, 1000);
});

// Also add a global style injection for insurance
const globalStyle = document.createElement('style');
globalStyle.innerHTML = `
    /* GLOBAL OVERRIDE - HIGHEST PRIORITY */
    .task-table { table-layout: fixed !important; width: 200mm !important; }
    .task-table th:nth-child(3), .task-table td:nth-child(3) { width: 4mm !important; max-width: 4mm !important; }
    .task-table th:nth-child(4), .task-table td:nth-child(4) { width: 147mm !important; max-width: 147mm !important; text-align: left !important; }
`;
document.head.appendChild(globalStyle);
