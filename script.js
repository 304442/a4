function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;

  const defaultUiConfig = { /* ... same as your last full script.js ... */ };
  // ... (rest of the state properties: plannerTitle, uiConfig, currentWeek, etc. - same as your last full script.js) ...
  // Make sure all your default data (schedule, tasks, workoutPlan etc.) is correctly initialized here or in init()

  // For brevity, I'm assuming the rest of the state and default data is identical to the "full script.js" you confirmed earlier.
  // Only the editInline function and supporting logic will be shown if it changed. The rest remains the same.
  // PASTE THE FULL SCRIPT.JS YOU HAD, THEN REPLACE/ADD THE editInline FUNCTION BELOW.

  // ---- START OF SECTION TO REPLACE/UPDATE IN YOUR FULL SCRIPT.JS ----
  // (Keep existing state properties and other methods from the previously approved full script.js)

  return {
    // ... ALL YOUR OTHER STATE AND METHODS FROM THE PREVIOUSLY APPROVED FULL SCRIPT.JS ...
    // e.g., plannerTitle: defaultUiConfig.plannerTitle, init(), updateValue(), etc.

    editInline(event, type, index, defaultValue) {
        const element = event.currentTarget;
        // Check if already editing this element or if element is not valid
        if (!element || element.classList.contains('editing-active-js')) return;

        element.classList.add('editing-active-js'); // Mark that JS is handling edit

        // Determine initial value for the input field
        let initialInputValue = '';
        if (defaultValue !== undefined && defaultValue !== null) {
            initialInputValue = String(defaultValue);
        } else if (element.dataset.originalValue) {
            initialInputValue = element.dataset.originalValue;
        } else {
            // For elements with x-text, their innerText should be the current value
            // However, x-text might render complex structures if the bound value is an object/array
            // For simple text, innerText is fine.
            initialInputValue = element.innerText;
        }

        // Store original children to restore them if edit is cancelled or no change occurs
        const originalChildren = Array.from(element.childNodes);
        // Temporarily hide original children instead of element.innerHTML = ''
        originalChildren.forEach(child => {
            if (child.style) child.dataset.originalDisplay = child.style.display; // Store original display
            child.style.display = 'none';
        });


        const isTextarea = ['mealIngredients', 'groceryCategoryItems'].includes(type);
        const input = document.createElement(isTextarea ? 'textarea' : 'input');
        input.type = 'text';
        input.value = initialInputValue;
        input.className = isTextarea ? 'inline-edit-textarea' : 'inline-edit-input';
        // For single-line inputs in table cells, CSS now forces height: 3mm and line-height: 3mm

        element.appendChild(input); // Append input as a new child
        input.focus();
        input.select();

        const finishEdit = (shouldSaveChanges) => {
            if (!element.contains(input)) return; // Already cleaned up

            const newValue = input.value;
            input.remove(); // Remove the input field

            // Restore visibility of original children
            originalChildren.forEach(child => {
                 if (child.style) child.style.display = child.dataset.originalDisplay || ''; // Restore original display
                 delete child.dataset.originalDisplay;
            });

            element.classList.remove('editing-active-js');

            if (shouldSaveChanges) {
                // Compare trimmed value for change detection, but pass potentially untrimmed to updateValue if needed
                if (newValue.trim() !== initialInputValue.trim()) {
                    this.updateValue(type, index, newValue); // updateValue should handle trimming if appropriate for the type
                }
                // If no change, original content is already visible.
                // If changed, Alpine's reactivity (from x-text on 'element' or its children) will update the display.
            } else {
                // Cancelled: original content is already visible. No state change.
            }
            // Trigger save if needed (handled by updateValue or interval save)
        };

        const blurHandler = () => {
            // Use a microtask or very short timeout to allow other click events (e.g. on a button) to fire first
            Promise.resolve().then(() => {
                if (document.body.contains(input)) { // Check if input still exists
                    finishEdit(true); // Assume save on blur
                }
            });
        };

        const keydownHandler = (e) => {
            if (e.key === 'Enter' && !(isTextarea && e.shiftKey)) {
                e.preventDefault();
                input.removeEventListener('blur', blurHandler); // Prevent blur from also firing
                finishEdit(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                input.removeEventListener('blur', blurHandler);
                finishEdit(false);
            }
        };

        input.addEventListener('blur', blurHandler);
        input.addEventListener('keydown', keydownHandler);
    }

    // ... ALL YOUR OTHER STATE AND METHODS FROM THE PREVIOUSLY APPROVED FULL SCRIPT.JS ...
    // e.g., updateValue(), saveData(), calculateScores(), etc.
  };
}
