console.log("Content script loaded");
const containerId = "stop-scrolling-container";
if (!document.getElementById(containerId)) {
  const iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("index.html");
  iframe.id = containerId;
  iframe.style.position = "fixed";
  iframe.style.top = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "360px";
  iframe.style.height = "500px";
  iframe.style.border = "none";
  iframe.style.zIndex = "999999";
  iframe.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  document.body.appendChild(iframe);
}