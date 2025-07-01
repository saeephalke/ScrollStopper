const triggeredTabs = new Set(); //the set of triggered tabs
const redirectURL = chrome.runtime.getURL("index.html"); //redirct url for when tab changes
const scrollSites = [
  "www.instagram.com",
  "www.youtube.com",
  "www.tiktok.com",
]; //sites to look out for (give any suggestions for other sites!!)

let activeStartTime = null; //timer
let activeHost = null; //the current host

//grabs the UserID or creates on if doesn't exist
chrome.storage.local.get(["scrollStopperUserID"], (result) => {
  if(!result.scrollStopperUserID) {
    const id = crypto.randomUUID();
    chrome.storage.local.set({ scrollStopperUserID : id}, ()=> {
      console.log("new userID generated");
    });
  } else {
    console.log("Existing userID");
  }
})



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

//when a tab changes, then count the time
function handleTabChange(details) {
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
    { urlMatches: "^https://www.tiktok.com/.*" }
  ],
  frameId: 0
};

chrome.webNavigation.onCompleted.addListener(handleNavigation, urlFilter);
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation, urlFilter);
chrome.tabs.onActivated.addListener(handleTabChange);
