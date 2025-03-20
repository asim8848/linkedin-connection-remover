// LinkedIn Connection Remover - Continuous Mode
console.log("LinkedIn Connection Remover v2.0: Loaded");
console.log("URL:", window.location.href);

// Keep track of total connections removed across page reloads
let totalConnectionsRemoved = parseInt(localStorage.getItem('linkedinConnectionsRemoved') || '0');
let preventReload = false;
let isPaused = false;
let isRunning = false;
let stopRequested = false;
window.stopRemovalRequested = false;
window.linkedinRemovalStopped = false; // Add this variable with the others at the top
// Make these variables available to the popup
window.linkedinSessionRemoved = 0;
window.linkedinRemovalRunning = false;
window.linkedinRemovalPaused = false;

// Toggle pause state
function togglePause() {
  // Don't allow toggling pause if we're stopped
  if (window.linkedinRemovalStopped || window.stopRemovalRequested) {
    return isPaused;
  }
  
  isPaused = !isPaused;
  window.linkedinRemovalPaused = isPaused;
  console.log(isPaused ? 'Process paused' : 'Process resumed');
  return isPaused;
}

function startRemovingLinkedInConnections() {
  console.log("Starting continuous connection removal");
  isRunning = true;
  window.linkedinRemovalRunning = true;
  
  console.log(`Total connections removed so far: ${totalConnectionsRemoved}`);

  const processedConnections = new Set(); // Store IDs of processed connections
  let connections = [];
  let index = 0;
  let retryCount = 0;
  const MAX_RETRIES = 3;
  let removedCount = 0;
  let noActivityCounter = 0;
  const MAX_NO_ACTIVITY = 5;
  const DELAY_BETWEEN_CONNECTIONS = 1200; // 1.2 seconds between connections
  
  // For more aggressive speed, set this to true
  const TURBO_MODE = window.LINKEDIN_REMOVER_TURBO === true;
  
  const timings = TURBO_MODE ? {
    dropdownWait: 400,  // ms to wait for dropdown
    dialogWait: 400,    // ms to wait for confirmation dialog
    retryDelay: 300     // ms to wait before retry
  } : {
    dropdownWait: 700,  // ms to wait for dropdown
    dialogWait: 700,    // ms to wait for confirmation dialog
    retryDelay: 500     // ms to wait before retry
  };

  // Function to find all available connections
  function findConnections() {
    let foundConnections = document.querySelectorAll('div.mn-connection-card');
    
    if (foundConnections.length === 0) {
      foundConnections = document.querySelectorAll('.mn-connections-summary__card');
    }
    
    if (foundConnections.length === 0) {
      foundConnections = document.querySelectorAll('li.mn-connection-card');
    }
    
    if (foundConnections.length === 0) {
      foundConnections = document.querySelectorAll('[class*="connection"]');
    }
    
    return foundConnections;
  }

  // Initial connection search
  connections = findConnections();
  console.log(`Found ${connections.length} connections initially`);
  
  if (connections.length === 0) {
    console.error("No connections found! Please check the page structure manually.");
    isRunning = false;
    window.linkedinRemovalRunning = false;
    try {
      chrome.runtime.sendMessage({ action: "removalComplete" });
    } catch (e) {
      console.log("Could not send completion message");
    }
    return;
  }

  // Function to attempt to load more connections by scrolling
  function loadMoreConnections() {
      if (stopRequested || window.stopRemovalRequested) {
    console.log("Stop requested. Terminating process.");
    isRunning = false;
    window.linkedinRemovalRunning = false;
    try {
      chrome.runtime.sendMessage({ action: "removalStopped" });
    } catch (e) {
      console.log("Could not send stop message");
    }
    return;
  }
    if (isPaused) {
      console.log("Process paused. Waiting to resume...");
      setTimeout(loadMoreConnections, 1000);
      return;
    }
    
    console.log("Attempting to load more connections...");
    
    // Scroll down
    window.scrollTo(0, document.body.scrollHeight);
    
    // Check after a delay if we have more connections
    setTimeout(() => {
      const newConnections = findConnections();
      
      if (newConnections.length > connections.length) {
        console.log(`Loaded ${newConnections.length - connections.length} new connections`);
        connections = newConnections;
        noActivityCounter = 0;
        removeNextConnection();
      } else {
        noActivityCounter++;
        
        if (noActivityCounter >= MAX_NO_ACTIVITY) {
          console.log("No new connections after multiple attempts");
          
          // Check if we actually removed any connections in this session
          if (removedCount > 0) {
            console.log("Connections were removed. Reloading page to continue...");
            // Save the current total before reloading
            totalConnectionsRemoved += removedCount;
            localStorage.setItem('linkedinConnectionsRemoved', totalConnectionsRemoved.toString());
            
            // Only reload if we haven't disabled it
            if (!preventReload) {
              console.log("Reloading page in 3 seconds...");
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            } else {
              console.log("Page reload prevented. Process complete.");
              isRunning = false;
              window.linkedinRemovalRunning = false;
              try {
                chrome.runtime.sendMessage({ action: "removalComplete" });
              } catch (e) {
                console.log("Could not send completion message");
              }
            }
          } else {
            console.log("No connections were removed. Process may be complete.");
            isRunning = false;
            window.linkedinRemovalRunning = false;
            try {
              chrome.runtime.sendMessage({ action: "removalComplete" });
            } catch (e) {
              console.log("Could not send completion message");
            }
          }
        } else {
          console.log(`No new connections loaded. Trying again (${noActivityCounter}/${MAX_NO_ACTIVITY})...`);
          setTimeout(loadMoreConnections, 2000);
        }
      }
    }, 2000);
  }

  function removeNextConnection() {
    // Check if stop requested
  if (stopRequested || window.stopRemovalRequested) {
    console.log("Stop requested. Terminating process.");
    isRunning = false;
    window.linkedinRemovalRunning = false;
    window.linkedinRemovalStopped = true; // Add this
    try {
      chrome.runtime.sendMessage({ action: "removalStopped" });
    } catch (e) {
      console.log("Could not send stop message");
    }
    return;
  }

  // Check if paused
  if (isPaused) {
    console.log("Process paused. Waiting to resume...");
    setTimeout(removeNextConnection, 1000);
    return;
  }
    
    // Refresh connections list in case DOM has changed
    if (index % 5 === 0) {
      connections = findConnections();
    }
    
    // Check if we've processed all visible connections
    if (index >= connections.length) {
      console.log(`Processed all ${connections.length} visible connections`);
      console.log(`Removed ${removedCount} connections in this batch`);
      
      // Try to load more connections
      loadMoreConnections();
      return;
    }

    // For LinkedIn, always process the first connection
    // This is because when a connection is removed, LinkedIn shifts all others up
    const connection = connections[0];
    console.log(`Processing connection ${index + 1} of ${connections.length}`);

    // Get a unique identifier for this connection
    const connectionName = connection.querySelector('.artdeco-entity-lockup__title')?.textContent?.trim() || '';
    const connectionId = connectionName || connection.dataset.id || connection.id;
    
    if (connectionId && processedConnections.has(connectionId)) {
      console.log(`Already processed connection "${connectionId}", skipping`);
      index++;
      setTimeout(removeNextConnection, 200); // Fast-forward
      return;
    }
    
    // Add to processed set if we have an ID
    if (connectionId) {
      processedConnections.add(connectionId);
      console.log(`Processing: "${connectionId}"`);
    }

    // Scroll the connection into view if needed
    const rect = connection.getBoundingClientRect();
    if (rect.bottom > window.innerHeight || rect.top < 0) {
      connection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        processCurrentConnection();
      }, 500);
    } else {
      processCurrentConnection();
    }
    
    function processCurrentConnection() {
      // Check pause again
      if (isPaused) {
        console.log("Process paused. Waiting to resume...");
        setTimeout(removeNextConnection, 1000);
        return;
      }
      
      // Try to find the dropdown trigger button using multiple selectors
      let menuButton = connection.querySelector('button.artdeco-dropdown__trigger');
      
      if (!menuButton) {
        menuButton = connection.querySelector('[class*="dropdown__trigger"]');
      }
      
      if (!menuButton) {
        menuButton = connection.querySelector('button[aria-label*="actions"]');
      }
      
      if (!menuButton) {
        const buttons = connection.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.querySelector('svg[aria-label*="More"]') || 
              btn.textContent.includes('...') ||
              (btn.getAttribute('aria-label') && 
               btn.getAttribute('aria-label').toLowerCase().includes('more'))) {
            menuButton = btn;
            break;
          }
        }
      }
      
      if (!menuButton) {
        console.log("Menu button not found, skipping connection");
        index++;
        retryCount = 0;
        setTimeout(removeNextConnection, DELAY_BETWEEN_CONNECTIONS);
        return;
      }

      // Click the menu button to open dropdown
      console.log("Clicking dropdown menu button...");
      menuButton.click();
      
      // Wait for the dropdown to be populated
      setTimeout(() => {
        // Check pause again
        if (isPaused) {
          console.log("Process paused. Waiting to resume...");
          document.body.click(); // Close dropdown if open
          setTimeout(removeNextConnection, 1000);
          return;
        }
        
        const dropdownContents = document.querySelectorAll('.artdeco-dropdown__content--is-open');
        
        if (dropdownContents.length === 0) {
          console.log("No dropdown found, retrying...");
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(removeNextConnection, timings.retryDelay);
          } else {
            console.log("Max retries reached, skipping connection");
            index++;
            retryCount = 0;
            setTimeout(removeNextConnection, DELAY_BETWEEN_CONNECTIONS);
          }
          return;
        }
        
        console.log("Dropdown is now populated");
        
        // Find the "Remove connection" option in any open dropdown
        let removeButton = null;
        
        for (const dropdown of dropdownContents) {
          // Try to find buttons or menu items with "remove connection" text
          const items = dropdown.querySelectorAll('button, a, [role="menuitem"]');
          console.log(`Found ${items.length} dropdown items`);
          
          for (const item of items) {
            const text = item.textContent.trim().toLowerCase();
            
            if (text.includes('remove connection') || text === 'remove') {
              removeButton = item;
              break;
            }
          }
          
          if (removeButton) break;
        }
        
        if (!removeButton) {
          console.log("Remove button not found in dropdown");
          document.body.click(); // Close dropdown
          
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying (${retryCount}/${MAX_RETRIES})...`);
            setTimeout(removeNextConnection, timings.retryDelay);
          } else {
            console.log("Max retries reached, skipping connection");
            index++;
            retryCount = 0;
            setTimeout(removeNextConnection, DELAY_BETWEEN_CONNECTIONS);
          }
          return;
        }
        
        // Click the remove connection button
        console.log(`Clicking "Remove connection" button...`);
        removeButton.click();
        
        // Wait for the confirmation dialog
        setTimeout(() => {
          // Check pause again
          if (isPaused) {
            console.log("Process paused. Waiting to resume...");
            setTimeout(removeNextConnection, 1000);
            return;
          }
          
          // Look for confirmation dialog with multiple approaches
          let confirmDialog = document.querySelector('[role="alertdialog"]');
          
          if (!confirmDialog) {
            confirmDialog = document.querySelector('.artdeco-modal--layer-confirmation');
          }
          
          if (!confirmDialog) {
            confirmDialog = document.querySelector('[data-test-modal]');
          }
          
          if (!confirmDialog) {
            const allDialogs = document.querySelectorAll('.artdeco-modal');
            // Find the one that mentions "Remove Connection"
            for (const dialog of allDialogs) {
              if (dialog.textContent.includes('Remove Connection') || 
                  dialog.textContent.includes('as a connection') ||
                  dialog.textContent.includes('won\'t be notified')) {
                confirmDialog = dialog;
                break;
              }
            }
          }
          
          if (!confirmDialog) {
            console.log("Confirmation dialog not found, moving to next connection");
            index++;
            retryCount = 0;
            setTimeout(removeNextConnection, DELAY_BETWEEN_CONNECTIONS);
            return;
          }
          
          console.log("Found confirmation dialog");
          
          // Find the confirm button
          let confirmButton = confirmDialog.querySelector('[data-test-dialog-primary-btn]');
          
          if (!confirmButton) {
            confirmButton = confirmDialog.querySelector('.artdeco-button--primary');
          }
          
          if (!confirmButton) {
            // Find any button that says "Remove"
            const buttons = confirmDialog.querySelectorAll('button');
            for (const btn of buttons) {
              if (btn.textContent.trim().toLowerCase() === 'remove') {
                confirmButton = btn;
                break;
              }
            }
          }
          
          if (!confirmButton) {
            console.log("Confirmation button not found, moving to next connection");
            index++;
            retryCount = 0;
            setTimeout(removeNextConnection, DELAY_BETWEEN_CONNECTIONS);
            return;
          }
          
          // Click the confirm button
          console.log("Clicking confirmation button");
          confirmButton.click();
          removedCount++;
          totalConnectionsRemoved++;
          
          // Update local storage with the current total
          localStorage.setItem('linkedinConnectionsRemoved', totalConnectionsRemoved.toString());
          
          // Make the session count available to the popup
          window.linkedinSessionRemoved = removedCount;
          
          console.log(`Successfully removed connection ${index + 1}, total removed: ${removedCount} (All time: ${totalConnectionsRemoved})`);
          
          // Update popup with stats
          try {
            chrome.runtime.sendMessage({
              action: "updateStats", 
              total: totalConnectionsRemoved,
              session: removedCount
            });
          } catch (e) {
            // Ignore errors when sending message
            console.log("Could not send stats update to popup");
          }
          
          // Move to next connection - index stays at 0 because LinkedIn shifts connections up
          retryCount = 0;
          setTimeout(removeNextConnection, DELAY_BETWEEN_CONNECTIONS);
        }, timings.dialogWait);
      }, timings.dropdownWait);
    }
  }

  // Start the process
  removeNextConnection();
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRemoving") {
    startRemovingLinkedInConnections();
    return true;
  }
  return false;
});