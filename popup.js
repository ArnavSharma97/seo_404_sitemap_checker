
const check404Button = document.getElementById("check-404");
const resultsDiv = document.getElementById("results");

check404Button.addEventListener("click", async () => {
  resultsDiv.innerHTML = "Fetching sitemap...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const sitemapUrl = await findSitemapUrl(tab.url);

    if (!sitemapUrl) {
      resultsDiv.innerHTML = "No sitemap found.";
      return;
    }

    resultsDiv.innerHTML = "Checking links...";
    const urls = await fetchSitemapUrls(sitemapUrl);
    const notFoundUrls = await check404Links(urls);
    displayResults(notFoundUrls);
  } catch (error) {
    resultsDiv.innerHTML = "Error: " + error.message;
  }
});

async function findSitemapUrl(baseUrl) {
  const possibleSitemapUrls = [
    new URL("sitemap.xml", baseUrl).toString(),
    new URL("sitemap_index.xml", baseUrl).toString(),
  ];

  for (const sitemapUrl of possibleSitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, { method: "HEAD" });

      if (response.ok) {
        return sitemapUrl;
      }
    } catch (error) {
      // Ignore fetch errors and try the next URL
    }
  }

  return null;
}

async function fetchSitemapUrls(sitemapUrl) {
  const response = await fetch(sitemapUrl);
  const sitemapXml = await response.text();
  const urls = Array.from(sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g), match => match[1]);
  return urls;
}

async function check404Links(urls) {
  const notFoundUrls = [];

  for (const url of urls) {
    const response = await fetch(url, { method: "HEAD" });
    if (response.status === 404) {
      notFoundUrls.push(url);
    }
  }
  return notFoundUrls;
}

function displayResults(notFoundUrls) {
  if (notFoundUrls.length === 0) {
    resultsDiv.innerHTML = "No 404 links found!";
    return;
  }

  let resultList = "<ul>";
  for (const url of notFoundUrls) {
    resultList += `<li><a href="${url}" target="_blank">${url}</a></li>`;
  }
  resultList += "</ul>";
  resultsDiv.innerHTML = resultList;
}
