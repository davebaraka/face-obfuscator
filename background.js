/*
Modify 'access-control-allow-origin' header in order to bypass CORS protocol
Allows to read and modify images downloaded from other origins
*/
chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    let cors = false;

    for (let i = 0; i < details.responseHeaders.length; i++) {
      if (details.responseHeaders[i].name.toLowerCase() === "access-control-allow-origin") {
        details.responseHeaders[i].value = "*";
        cors = true;
        break;
      }
    }

    if (!cors) {
      details.responseHeaders.push({
        name: "Access-Control-Allow-Origin",
        value: "*",
      });
    }

    return { responseHeaders: details.responseHeaders };
  },

  {
    urls: ["<all_urls>"],
    types: ["image"],
  },

  ["blocking", "responseHeaders", "extraHeaders"]
);
