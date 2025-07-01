const triggeredTabs = new Set();
const redirectURL = chrome.runtime.getURL("index.html");
const scrollSites = [
  "www.instagram.com",
  "www.youtube.com",
  "www.tiktok.com",
];

let activeStartTime = null; //timer
let activeHost = null; //the current host

function handleNavigation(details) {
  if (triggeredTabs.has(details.tabId)) return; //don't trigger if tab was visited
  
  const url = new URL(details.url);
  const host = url.hostname;

  if(scrollSites.includes(host)){
    triggeredTabs.add(details.tabId); //add tab to not be triggered
    chrome.tabs.create({ url: redirectURL }); //redirct
    activeStartTime = Date.now();
    activeHost = host;
  }

}

function handleTabChange(details) {
  chrome.tabs.get(details.tabId, (tab) => {
    if(!tab.url) return;

    const host = new URL(tab.url).hostname;

    if(scrollSites.includes(host)) {
      if(host != activeHost) {
        activeStartTime = Date.now();
        activeHost = host;
      }
    } else {
      if(activeStartTime && activeHost) {
        const duration = Date.now() - activeStartTime;
        saveTime(activeHost, duration);
        activeStartTime = null;
        activeHost = null;
      }
    }
  });
}

function saveTime(host, duration) {
  chrome.storage.local.get(["siteTimes"], (result) => {
    const siteTimes = result.siteTimes || {};
    siteTimes[host] = (siteTimes[host] || 0) + duration;
    chrome.storage.local.set({ siteTimes }, () => {
    });
  });
}

const urlFilter = {
  url: [
    { urlMatches: "https://www.instagram.com/.*" },
    { urlMatches: "https://www.youtube.com/.*" },
    { urlMatches: "https://www.tiktok.com/.*" }
  ],
  frameId: 0
};

chrome.webNavigation.onCompleted.addListener(handleNavigation, urlFilter);
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation, urlFilter);
chrome.tabs.onActivated.addListener(handleTabChange);
