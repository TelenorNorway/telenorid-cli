import fetch from "./apiFetch.ts";

const defaultHeaders = Object.entries({
  "accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "en-GB,en-US,en;q=0.9",
  "sec-ch-ua":
    '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "cross-site",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.57",
});

export default async function browserFetch(
  request: Request | string | URL,
  init?: RequestInit,
) {
  const req = new Request(request, init);
  for (const [name, value] of defaultHeaders) {
    req.headers.set(name, value);
  }
  return await fetch(req, init);
}
