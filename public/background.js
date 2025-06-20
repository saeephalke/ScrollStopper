chrome.webNavigation.onCompleted.addListener((details) => {
    const url = chrome.runtime.getURL("index.html");
    chrome.tabs.update(details.tabID, { url });
}, {
    url: [
    { urlMatches: "https://www.instagram.com/*" },
    { urlMatches: "https://www.youtube.com/shorts/*" },
    { urlMatches: "https://www.tiktok.com/*" }
  ]
});