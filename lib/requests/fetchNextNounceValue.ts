import browserFetch from "../fetch/browserFetch.ts";

const start = '"id":"nounce","label":"","type":"text","value":"';

export default async function fetchNextNounceValue(
  signInUrl: string,
) {
  const textContent = await (await browserFetch(signInUrl)).text();
  const textContentStart = textContent.substring(
    textContent.indexOf(start) + start.length,
  );
  return textContentStart.substring(
    0,
    textContentStart.indexOf('"', 0),
  );
}
