import browserFetch from "../fetch/browserFetch.ts";
import AuthenticationRequest from "../types/AuthenticationRequest.ts";
import unsafeGetJwtPayload from "../util/unsafeGetJwtPayload.ts";

export default async function fetchCallbackUrl(
  signInUrl: string,
) {
  const _signInUrl = new URL(signInUrl);
  const authenticationRequest = unsafeGetJwtPayload<AuthenticationRequest>(
    _signInUrl.searchParams.get("authentication_request")!,
  );
  const textContent = await (await browserFetch(signInUrl)).text();
  const textContentStart = textContent.substring(
    textContent.indexOf(authenticationRequest.auc) - 1,
  );
  const textContentExact = textContentStart.substring(
    0,
    textContentStart.indexOf('"', 1) + 1,
  );
  return {
    callbackUrl: JSON.parse(textContentExact) as string,
    callbackReferrerUrl: _signInUrl.origin + _signInUrl.pathname,
  };
}
