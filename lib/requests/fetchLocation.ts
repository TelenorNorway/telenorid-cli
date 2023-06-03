import browserFetch from "../fetch/browserFetch.ts";

export default async function fetchLocation(
  referrer: string | undefined,
  url: string,
  method = "GET",
  contentType?: string,
  body?: string,
) {
  const response = await browserFetch(
    url,
    {
      headers: !!body && contentType
        ? { "content-type": contentType }
        : undefined,
      referrer,
      referrerPolicy: "strict-origin-when-cross-origin",
      method,
      mode: "cors",
      credentials: "include",
      redirect: "manual",
      body,
    },
  );
  return new URL(response.headers.get("location")!, url).href;
}
