const triggeredTabs = new Set(); //the set of triggered tabs
const redirectURL = chrome.runtime.getURL("index.html"); //redirct url for when tab changes
const scrollSites = [
  "www.instagram.com",
  "www.youtube.com",
  "www.tiktok.com",
  "www.facebook.com"
]; //sites to look out for (give any suggestions for other sites!!)

let activeStartTime = null; //timer
let activeHost = null; //the current host

//does nativgation between tabs
function handleNavigation(details) {
  console.log("handleNavigation triggered:", details.url);
  if(details.frameId !== 0 ) return; //to avoid background triggers (main frame)
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

//when a tab changes, then count the time
function handleTabChange(details) {
  console.log("handleTabChange triggered:", details.url);
  chrome.tabs.get(details.tabId, (tab) => {
    if(!tab.url) return;

    const host = new URL(tab.url).hostname; //get current host name

    if(scrollSites.includes(host)) { //if currently underhost start tracking
      if(host != activeHost) {
        activeStartTime = Date.now(); //start timer
        activeHost = host; //set a host
      }
    } else { //otherwise when change
      if(activeStartTime && activeHost) { //if these variables aren't null
        const duration = Date.now() - activeStartTime; //get the duration
        saveTime(activeHost, duration); //save the same
        activeStartTime = null; //set them to null
        activeHost = null;
      }
    }
  });
}

//saves the time to chrome local storage
function saveTime(host, duration) {
  chrome.storage.local.get(["siteTimes"], (result) => {
    const siteTimes = result.siteTimes || {};
    siteTimes[host] = (siteTimes[host] || 0) + duration;
    chrome.storage.local.set({ siteTimes }, () => {
    });
  });
}

//this filter is used so that redirects only happen based on these sites
const urlFilter = {
  url: [
    { urlMatches: "^https://www.instagram.com/.*" },
    { urlMatches: "^https://www.youtube.com/.*" },
    { urlMatches: "^https://www.tiktok.com/.*" },
    { urlMatches: "^https://www.facebook.com/.*"}
  ],
  frameId: 0
};

chrome.webNavigation.onCompleted.addListener(handleNavigation, urlFilter);
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation, urlFilter);
chrome.tabs.onActivated.addListener(handleTabChange);
