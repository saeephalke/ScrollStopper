const triggeredTabs = new Set();
const redirectURL = chrome.runtime.getURL("index.html");

function handleNavigation(details) {
  if (triggeredTabs.has(details.tabId)) return;

  triggeredTabs.add(details.tabId);
  chrome.tabs.create({ url: redirectURL });

}

const urlFilter = {
  url: [
    { urlMatches: "https://www.instagram.com/.*" },
    { urlMatches: "https://www.youtube.com/shorts/.*" },
    { urlMatches: "https://www.tiktok.com/.*" }
  ],
  frameId: 0
};

chrome.webNavigation.onCompleted.addListener(handleNavigation, urlFilter);
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation, urlFilter);
