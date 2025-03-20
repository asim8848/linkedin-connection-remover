chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Connection Remover extension installed');
  
  // Set default settings if not already set
  chrome.storage.local.get(['linkedinRemovedStats'], function(result) {
    if (!result.linkedinRemovedStats) {
      chrome.storage.local.set({
        linkedinRemovedStats: {
          totalRemoved: 0,
          lastRemoval: null,
          history: []
        }
      });
    }
  });
});

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "removalsCompleted") {
    console.log(`Removed ${message.count} connections`);
    updateStats(message.count);
  } else if (message.action === "updateStats" || message.action === "removalComplete") {
    // Forward to popup if active
    chrome.runtime.sendMessage(message);
  }
  return true;
});

// Update stored stats
function updateStats(count) {
  chrome.storage.local.get(['linkedinRemovedStats'], function(result) {
    const stats = result.linkedinRemovedStats || {
      totalRemoved: 0,
      lastRemoval: null,
      history: []
    };
    
    stats.totalRemoved += count;
    stats.lastRemoval = new Date().toISOString();
    stats.history.push({
      date: new Date().toISOString(),
      count: count
    });
    
    // Keep only last 10 history items
    if (stats.history.length > 10) {
      stats.history = stats.history.slice(-10);
    }
    
    chrome.storage.local.set({linkedinRemovedStats: stats});
  });
}