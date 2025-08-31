// Popup script for the extension
document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggle");
  const status = document.getElementById("status");

  // Get current state from storage
  const result = await chrome.storage.local.get(["shiftClickEnabled"]);
  const isEnabled = result.shiftClickEnabled || false;

  // Update UI
  updateUI(isEnabled);

  // Add click handler
  toggle.addEventListener("click", async () => {
    const newState = !toggle.classList.contains("active");
    await chrome.storage.local.set({ shiftClickEnabled: newState });

    // Send message to content script
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab) {
      chrome.tabs
        .sendMessage(tab.id, {
          action: "toggleShiftClick",
          enabled: newState,
        })
        .catch(() => {
          // Ignore errors if content script isn't ready
        });
    }

    updateUI(newState);
  });

  function updateUI(enabled) {
    if (enabled) {
      toggle.classList.add("active");
      status.classList.remove("inactive");
      status.classList.add("active");
      status.textContent = "✓ Shift-click mode ON";
    } else {
      toggle.classList.remove("active");
      status.classList.remove("active");
      status.classList.add("inactive");
      status.textContent = "○ Shift-click mode OFF";
    }
  }
});
