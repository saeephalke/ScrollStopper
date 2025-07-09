let scrollSites = new Set();
const triggeredTabs = new Set(); //the set of triggered tabs
let activeStartTime = null; //timer
let activeHost = null; //the current host
const COOLDOWN = 10 * 60 * 1000;
let lastRedirectTime = new Map();


function setActiveState(host) {
  chrome.storage.session.set({
    activeHost: host,
    activeStartTime: Date.now()
  });
}

function clearActiveState() {
  chrome.storage.session.remove(["activeHost", "activeStartTime"]);
}

function getActiveState(callback) {
  chrome.storage.session.get(["activeHost", "activeStartTime"], callback);
}


//generate a filter from an array of sites
function generateUrlFilter(){
  return{
    url: Array.from(scrollSites).map(site => ({
      urlMatches: `^https://${site}/.*`
    })),
    frameId: 0
  };
}

function initialize() {
  chrome.storage.local.get(["scrollSites"], (result) => {
    const sites = result.scrollSites || [];
    scrollSites = new Set(sites);
    updateNavigationListeners();
  });

  chrome.storage.session.get(["activeHost", "activeStartTime"], (result) =>{
    if(result.activeHost & result.ArrayactiveStartTime){
      const now = Date.now();
      const duration = now - result.activeStartTime;

      if(duration >= 5000 && duration < 2 * 60 * 60 * 1000){
        saveTime(result.activeHost, duration);
      }

      activeHost = result.activeHost;
      activeStartTime = now;

      chrome.storage.session.set({
        activeHost,
        activeStartTime,
      });
    }
  });
}


//does nativgation between tabs
function handleNavigation(details) {
  
  saveAndClearActiveTime();

  const url = new URL(details.url);
  const host = url.hostname;

  if(!scrollSites.has(host)) return;
  if (details.frameId !== 0) return;
  
  const now = Date.now();
  const last = lastRedirectTime.get(host) || 0;
  if(last != 0 && now - last < COOLDOWN) return;

  lastRedirectTime.set(host, now);
  chrome.storage.session.set({
    lastRedirectTime: Object.fromEntries(lastRedirectTime)
  });

  redirectIndexHTML();
  activeStartTime = now;
  activeHost = host;

  chrome.storage.session.set({
    activeHost,
    activeStartTime,
  });

}

function redirectIndexHTML(){
  const index = chrome.runtime.getURL("index.html");
  chrome.tabs.query({}, function(tabs) {
    const existing = tabs.find(tab => tab.url && tab.url.startsWith(index));
    if(existing){
      chrome.tabs.update(existing.id, { active: true });
    } else {
      chrome.tabs.create({ url: index });
    }
  })
}


// Track when tab is switched
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab.url) return;
    const host = new URL(tab.url).hostname;

    if (scrollSites.has(host)) {
      if (host !== activeHost) {
        activeStartTime = Date.now();
        activeHost = host;
        chrome.storage.session.set({
          activeHost,
          activeStartTime,
        });
      }
    } else {
        saveAndClearActiveTime();
    }
  });
});

// Track when tab is updated (e.g., URL change in same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url || changeInfo.status !== "complete") return;
  const host = new URL(tab.url).hostname;

  if (scrollSites.has(host)) {
    if (host !== activeHost) {
      activeStartTime = Date.now();
      activeHost = host;
      chrome.storage.session.set({
        activeHost,
        activeStartTime,
      });
    }
  } else {
    saveAndClearActiveTime();
  }
});
//saves the time to chrome local storage
function saveTime(host, duration) {
  chrome.storage.local.get(["siteTimes"], (result) => {
    const old = result.siteTimes || {};
    const updated = { ...old, [host]: (old[host] || 0) + duration };
    chrome.storage.local.set({ siteTimes: updated });
  });
}


//update navigation listeners
function updateNavigationListeners(){
  const filter = generateUrlFilter();
  //remove old ones
  chrome.webNavigation.onCompleted.removeListener(handleNavigation);
  chrome.webNavigation.onHistoryStateUpdated.removeListener(handleNavigation);

  //add new ones
  chrome.webNavigation.onCompleted.addListener(handleNavigation, filter);
  chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation, filter);
}

function saveAndClearActiveTime() {
  if (activeHost != null && activeStartTime != null) {
    const now = Date.now();
    const duration = now - activeStartTime;
    if (duration >= 5000 && duration < 2 * 60 * 60 * 1000) {
      saveTime(activeHost, duration);
    }
    activeHost = null;
    activeStartTime = null;
    chrome.storage.session.remove(["activeHost", "activeStartTime"]);
  }
}

// Listen for changes to scrollSites and update
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.scrollSites) {
    const newSites = changes.scrollSites.newValue || [];
    scrollSites = new Set(newSites);
    updateNavigationListeners();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SITE_TIMES") {
    chrome.storage.local.get(["siteTimes"], (result) => {
      sendResponse({ siteTimes: result.siteTimes || {} });
    });
    return true; // Required for async sendResponse
  }
});


initialize();

chrome.storage.session.get(["activeHost", "activeStartTime"], (result) => {
  if (result.activeHost && result.activeStartTime) {
    activeHost = result.activeHost;
    activeStartTime = result.activeStartTime;
  }
});

chrome.storage.session.get(["lastRedirectTime"], (result) => {
  if (result.lastRedirectTime) {
    lastRedirectTime = new Map(Object.entries(result.lastRedirectTime).map(([k, v]) => [k, Number(v)]));
  }
});