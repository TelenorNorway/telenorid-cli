import browserApiFetch from "../fetch/browserApiFetch.ts";

const START = 'access_token:"';

export default async function fetchAccessToken(
  url: string,
) {
  const text = await (await browserApiFetch(url)).text();
  const startIndex = text.indexOf(START);
  const endIndex = text.indexOf('"', startIndex + START.length + 1);
  return text.substring(startIndex + START.length, endIndex);
}
