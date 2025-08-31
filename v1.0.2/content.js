// Content script for shift-click emulation
(function () {
  let isEnabled = false;
  let currentIndicator = null;

  // Store references to the handler functions
  const clickHandler = function (event) {
    if (!isEnabled) return;

    // Skip if this is already a shift-click or our synthetic event
    if (event.shiftKey || event.isSynthetic) return;

    // Prevent the original event
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Show visual feedback
    const rect = document.documentElement.getBoundingClientRect();
    const x = event.clientX - rect.left + window.scrollX;
    const y = event.clientY - rect.top + window.scrollY;
    showClickIndicator(x, y);

    // Create new event with shift key pressed
    const target = event.target;
    const newEvent = new MouseEvent(event.type, {
      bubbles: true,
      cancelable: true,
      view: event.view,
      detail: event.detail,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: true, // Force shift key to be true
      metaKey: event.metaKey,
      button: event.button,
      buttons: event.buttons,
      relatedTarget: event.relatedTarget,
    });

    // Mark as synthetic to avoid re-processing
    Object.defineProperty(newEvent, "isSynthetic", { value: true });

    // Dispatch the new event immediately
    setTimeout(() => {
      target.dispatchEvent(newEvent);
    }, 10);
  };

  const touchHandler = function (event) {
    if (!isEnabled) return;

    // Convert touch to mouse event
    const touch = event.touches[0] || event.changedTouches[0];
    if (!touch) return;

    // Skip if this is our synthetic event
    if (event.isSynthetic) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Show visual feedback
    const rect = document.documentElement.getBoundingClientRect();
    const x = touch.clientX - rect.left + window.scrollX;
    const y = touch.clientY - rect.top + window.scrollY;
    showClickIndicator(x, y);

    // Create mouse event with shift key
    const target = event.target;
    const mouseEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      ctrlKey: false,
      altKey: false,
      shiftKey: true, // Force shift key
      metaKey: false,
      button: 0,
      buttons: 1,
    });

    // Mark as synthetic
    Object.defineProperty(mouseEvent, "isSynthetic", { value: true });

    // Dispatch immediately
    setTimeout(() => {
      target.dispatchEvent(mouseEvent);
    }, 10);
  };

  // Create click indicator (remove any existing one first)
  function showClickIndicator(x, y) {
    // Remove existing indicator
    if (currentIndicator && currentIndicator.parentNode) {
      currentIndicator.parentNode.removeChild(currentIndicator);
    }

    const indicator = document.createElement("div");
    indicator.className = "shift-click-indicator";
    indicator.style.left = x - 15 + "px";
    indicator.style.top = y - 15 + "px";

    document.body.appendChild(indicator);
    currentIndicator = indicator;

    // Animate and remove
    setTimeout(() => {
      indicator.classList.add("fade-out");
    }, 10);

    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
        if (currentIndicator === indicator) {
          currentIndicator = null;
        }
      }
    }, 600);
  }

  // Add or remove event listeners based on enabled state
  function updateEventListeners() {
    if (isEnabled) {
      // Add listeners with useCapture=true to catch events early
      document.addEventListener("click", clickHandler, true);
      document.addEventListener("mousedown", clickHandler, true);
      document.addEventListener("touchstart", touchHandler, true);
      document.addEventListener("touchend", touchHandler, true);
      console.log("Shift-click mode enabled");
    } else {
      // Remove listeners
      document.removeEventListener("click", clickHandler, true);
      document.removeEventListener("mousedown", clickHandler, true);
      document.removeEventListener("touchstart", touchHandler, true);
      document.removeEventListener("touchend", touchHandler, true);

      // Clean up any existing indicator
      if (currentIndicator && currentIndicator.parentNode) {
        currentIndicator.parentNode.removeChild(currentIndicator);
        currentIndicator = null;
      }
      console.log("Shift-click mode disabled");
    }
  }

  // Initialize from storage
  chrome.storage.local.get(["shiftClickEnabled"]).then((result) => {
    isEnabled = result.shiftClickEnabled || false;
    updateEventListeners();
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.action === "toggleShiftClick") {
      isEnabled = request.enabled;
      updateEventListeners();
      sendResponse({ success: true });
    }
  });

  // Add passive listeners initially (they check isEnabled internally)
  document.addEventListener("click", clickHandler, true);
  document.addEventListener("mousedown", clickHandler, true);
  document.addEventListener("touchstart", touchHandler, true);
  document.addEventListener("touchend", touchHandler, true);
})();
