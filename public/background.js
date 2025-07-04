let scrollSites = new Set();
const triggeredTabs = new Set(); //the set of triggered tabs
const redirectURL = chrome.runtime.getURL("index.html"); //redirct url for when tab changes
let activeStartTime = null; //timer
let activeHost = null; //the current host
const COOLDOWN = 10 * 60 * 1000;
const lastRedirectTime = new Map();


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
}


//does nativgation between tabs
function handleNavigation(details) {
  
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

  chrome.tabs.create({ url: redirectURL });
  activeStartTime = now;
  activeHost = host;

  chrome.storage.session.set({
    activeHost,
    activeStartTime,
  });

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
        activeStartTime = null;
        activeHost = null;
        chrome.storage.session.remove(["activeHost", "activeStartTime"]);
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
      activeStartTime = null;
      activeHost = null;
      chrome.storage.session.remove(["activeHost", "activeStartTime"]);
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
    console.log(`[Restore] Resumed tracking ${activeHost} from ${new Date(activeStartTime)}`);
  }
});

chrome.storage.session.get(["lastRedirectTime"], (result) => {
  if (result.lastRedirectTime) {
    lastRedirectTime = new Map(Object.entries(result.lastRedirectTime).map(([k, v]) => [k, Number(v)]));
  }
});

chrome.alarms.create("periodicTimeSave", { periodInMinutes: 0.1 }); // every 6 seconds

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodicTimeSave") {
    console.log("[Alarm] Fired");
    if (activeStartTime && activeHost) {
      const duration = Date.now() - activeStartTime;
      console.log(`[Alarm] Saving ${duration}ms for ${activeHost}`);
      saveTime(activeHost, duration);
      activeStartTime = Date.now(); // reset timer
    }
  }
});
