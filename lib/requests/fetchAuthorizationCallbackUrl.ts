import browserApiFetch from "../fetch/browserApiFetch.ts";

const START = '<meta http-equiv="refresh" content="0;url=';

export default async function fetchAuthorizationCallbackUrl(
  url: string,
) {
  const text = await (await browserApiFetch(url)).text();
  const startIndex = text.indexOf(START);
  const endIndex = text.indexOf('"', startIndex + START.length + 1);
  return new URL(
    text.substring(startIndex + START.length, endIndex).replaceAll(
      "&amp;",
      "&",
    ),
    url,
  ).href;
}
