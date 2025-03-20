document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const turboBtn = document.getElementById('turboBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const stopBtn = document.getElementById('stopBtn');
  const status = document.getElementById('status');
  const totalRemoved = document.getElementById('totalRemoved');
  const sessionRemoved = document.getElementById('sessionRemoved');
  const openConnections = document.getElementById('openConnections');
  
  const pauseIcon = pauseBtn.querySelector('.icon');
  
  let isRunning = false;
  let isPaused = false;

  // Get the removal stats and process state
  function updateStats() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: function() {
            return {
              total: localStorage.getItem('linkedinConnectionsRemoved') || '0',
              current: window.linkedinSessionRemoved || '0',
              isRunning: window.linkedinRemovalRunning || false,
              isPaused: window.linkedinRemovalPaused || false,
              isStopped: window.linkedinRemovalStopped || false
            };
          }
        }, function(results) {
          if (results && results[0] && results[0].result) {
            totalRemoved.textContent = results[0].result.total;
            sessionRemoved.textContent = results[0].result.current;
            
            // Update button states
            isRunning = results[0].result.isRunning;
            isPaused = results[0].result.isPaused;
            const isStopped = results[0].result.isStopped;
            
            // Handle stopped state explicitly
            if (isStopped) {
              isRunning = false;
              isPaused = false;
              
              // Reset the stopped flag in the content script
              chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: function() {
                  window.linkedinRemovalStopped = false;
                }
              });
            }
            
            updateButtonStates();
          }
        });
      } else {
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
      }
    });
  }
  
  // Update button states based on current status
  function updateButtonStates() {
    if (isRunning) {
      startBtn.disabled = true;
      turboBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      
      if (isPaused) {
        pauseBtn.innerHTML = '<span class="icon icon-resume"></span>Resume';
        status.textContent = 'Process paused';
      } else {
        pauseBtn.innerHTML = '<span class="icon icon-pause"></span>Pause';
        status.textContent = 'Removing connections...';
      }
    } else {
      startBtn.disabled = false;
      turboBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
      pauseBtn.innerHTML = '<span class="icon icon-pause"></span>Pause';
      
      if (status.textContent !== 'Counter reset to 0' && 
          !status.textContent.includes('Error') &&
          status.textContent !== 'Please navigate to LinkedIn first' &&
          status.textContent !== 'Removal process stopped' &&
          status.textContent !== 'Completed removing connections') {
        status.textContent = 'Ready to remove connections';
      }
    }
  }
  
  // Initial stats update
  updateStats();
  
  // Poll for updates every 2 seconds to keep the UI in sync
  const statsInterval = setInterval(updateStats, 2000);

  // Start normal removal
  startBtn.addEventListener('click', function() {
    startRemoval(false);
  });
  
  // Start turbo removal
  turboBtn.addEventListener('click', function() {
    if (confirm('Turbo mode may trigger LinkedIn security measures. Continue?')) {
      startRemoval(true);
    }
  });
  
  // Pause/Resume removal
  pauseBtn.addEventListener('click', function() {
    togglePause();
  });

  // Reset the counter
  resetBtn.addEventListener('click', function() {
    if (confirm('Reset the connection removal counter to zero?')) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0] || !tabs[0].url) return;
        
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: function() {
            localStorage.setItem('linkedinConnectionsRemoved', '0');
            window.linkedinSessionRemoved = 0;
            return true;
          }
        }, function() {
          totalRemoved.textContent = '0';
          sessionRemoved.textContent = '0';
          status.textContent = 'Counter reset to 0';
        });
      });
    }
  });
  
  // Stop removal
  stopBtn.addEventListener('click', function() {
    stopRemoval();
  });

  // Open LinkedIn connections page
  openConnections.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://www.linkedin.com/mynetwork/invite-connect/connections/'
    });
  });

  function startRemoval(turboMode) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      if (!currentTab || !currentTab.url || !currentTab.url.includes('linkedin.com')) {
        status.textContent = 'Please navigate to LinkedIn first';
        return;
      }
      
      status.textContent = 'Removing connections...';
      
      // Update UI immediately for better responsiveness
      isRunning = true;
      isPaused = false;
      updateButtonStates();
      
      chrome.scripting.executeScript({
        target: {tabId: currentTab.id},
        function: function(turbo) {
          // Reset state flags
          window.linkedinRemovalRunning = true;
          window.linkedinRemovalPaused = false;
          window.linkedinRemovalStopped = false;
          window.stopRemovalRequested = false;
          
          // Set turbo flag if requested
          window.LINKEDIN_REMOVER_TURBO = turbo;
          
          // This will trigger the function if it exists in the page context
          if (typeof startRemovingLinkedInConnections === 'function') {
            startRemovingLinkedInConnections();
            return true;
          } else {
            console.error('Connection remover function not found');
            return false;
          }
        },
        args: [turboMode]
      }, function(results) {
        if (!results || !results[0] || !results[0].result) {
          status.textContent = 'Error: Could not start removal process';
          isRunning = false;
          updateButtonStates();
        }
      });
    });
  }
  
  function togglePause() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0] || !tabs[0].url || !tabs[0].url.includes('linkedin.com')) {
        status.textContent = 'Please navigate to LinkedIn first';
        return;
      }
      
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: function() {
          if (typeof togglePause === 'function') {
            const newState = togglePause();
            return newState;
          }
          return false;
        }
      }, function(results) {
        if (results && results[0] && results[0].result !== undefined) {
          isPaused = results[0].result;
          
          // Update button text with icons
          if (isPaused) {
            pauseBtn.innerHTML = '<span class="icon icon-resume"></span>Resume';
            status.textContent = 'Process paused';
          } else {
            pauseBtn.innerHTML = '<span class="icon icon-pause"></span>Pause';
            status.textContent = 'Process resumed';
          }
        }
      });
    });
  }
  
  function stopRemoval() {
    if (!isRunning) return;
    
    if (confirm('Stop the removal process?')) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0] || !tabs[0].url) return;
        
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: function() {
            window.linkedinRemovalRunning = false;
            window.linkedinRemovalPaused = false;
            window.linkedinRemovalStopped = true;
            window.stopRemovalRequested = true;
            
            // Attempt to notify that removal has stopped
            try {
              chrome.runtime.sendMessage({ 
                action: "removalStopped"
              });
            } catch (e) {}
            
            return true;
          }
        }, function(results) {
          if (results && results[0] && results[0].result) {
            isRunning = false;
            isPaused = false;
            status.textContent = 'Removal process stopped';
            updateButtonStates();
          }
        });
      });
    }
  }
  
  // Listen for status updates from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateStats") {
      totalRemoved.textContent = message.total.toString();
      sessionRemoved.textContent = message.session.toString();
    } else if (message.action === "removalComplete" || message.action === "removalStopped") {
      status.textContent = message.action === "removalComplete" ? 
                          'Completed removing connections' : 
                          'Removal process stopped';
      isRunning = false;
      isPaused = false;
      updateButtonStates();
    }
  });
  
  // Clean up when popup closes
  window.addEventListener('unload', function() {
    clearInterval(statsInterval);
  });
});