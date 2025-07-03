let scrollSites = new Set();
const triggeredTabs = new Set(); //the set of triggered tabs
const redirectURL = chrome.runtime.getURL("index.html"); //redirct url for when tab changes

//generate a filter from an array of sites
function generateUrlFilter(sites){
  return{
    url: Array.from(scrollSites).map(site => ({
      urlMatches: `^https://${site}/.*`
    })),
    frameId: 0
  };
}
let activeStartTime = null; //timer
let activeHost = null; //the current host

function initialize() {
  chrome.storage.local.get(["scrollSites"], (result) => {
    const sites = result.scrollSites || [];
    scrollSites = new Set(sites);
    updateNavigationListeners();
  });
}


//does nativgation between tabs
function handleNavigation(details) {
  console.log("handleNavigation triggered:", details.url);
  if(details.frameId !== 0 ) return; //to avoid background triggers (main frame)
  
  const url = new URL(details.url);
  const host = url.hostname;

  if(!scrollSites.has(host)) return;
  if(triggeredTabs.has(details.tabId)) return;
 
  triggeredTabs.add(details.tabId);
  chrome.tabs.create({ url: redirectURL });

  activeStartTime = Date.now();
  activeHost = host;

}

//when a tab changes, then count the time
function handleTabChange(details) {
  console.log("handleTabChange triggered:", details.url);
  chrome.tabs.get(details.tabId, (tab) => {
    if(!tab.url) return;

    const host = new URL(tab.url).hostname; //get current host name

    if(scrollSites.has(host)) { //if currently underhost start tracking
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


//update navigation listeners
function updateNavigationListeners(){
  filter = generateUrlFilter();
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


initialize();
chrome.tabs.onActivated.addListener(handleTabChange);
