import browserFetch from "../fetch/browserFetch.ts";
import AuthenticationRequest from "../types/AuthenticationRequest.ts";
import unsafeGetJwtPayload from "../util/unsafeGetJwtPayload.ts";

export default async function fetchCallbackUrl(
  signInUrl: string,
) {
  let url = new URL(signInUrl);
  let response = await browserFetch(url, { redirect: "manual" });
  let authenticationRequestContent: undefined | string = undefined;
  while (response.status > 300 && response.status < 400) {
    if (url.searchParams.has("authentication_request")) {
      authenticationRequestContent = url.searchParams.get(
        "authentication_request",
      ) || undefined;
    }
    // We don't want to handle 300 response here, but 301+ we do.
    if (!response.headers.has("location")) {
      throw new Error("redirect location not found from " + url);
    }
    url = new URL(response.headers.get("location")!, url);
    response = await browserFetch(url, { redirect: "manual" });
  }

  if (url.searchParams.has("authentication_request")) {
    authenticationRequestContent = url.searchParams.get(
      "authentication_request",
    ) || undefined;
  }

  if (!authenticationRequestContent) {
    throw new Error("Could not get authentication request!");
  }
  const authenticationRequest = unsafeGetJwtPayload<AuthenticationRequest>(
    authenticationRequestContent,
  );

  const textContent = await response.text();
  const textContentStart = textContent.substring(
    textContent.indexOf(authenticationRequest.auc) - 1,
  );
  const textContentExact = textContentStart.substring(
    0,
    textContentStart.indexOf('"', 1) + 1,
  );
  return {
    callbackUrl: JSON.parse(textContentExact) as string,
    callbackReferrerUrl: url.origin + url.pathname,
  };
}
