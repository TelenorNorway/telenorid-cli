import fetchAccessToken from "../requests/fetchAccessToken.ts";
import fetchAuthorizationCallbackUrl from "../requests/fetchAuthorizationCallbackUrl.ts";
import fetchCallbackUrl from "../requests/fetchCallbackUrl.ts";
import fetchLocation from "../requests/fetchLocation.ts";
import fetchNextComponents from "../requests/fetchNextComponents.ts";
import fetchNextNounceValue from "../requests/fetchNextNounceValue.ts";
import unsafeGetJwtPayload from "../util/unsafeGetJwtPayload.ts";

export enum Task {
  Start,
  End,
  Update,
  Completed,
  Failed,
}

export type ReportTask = {
  type: Task.Start | Task.Update | Task.Failed | Task.Completed;
  text: string;
} | { type: Task.End };

const OTP_REGEX = /^[0-9]+$/;

/**
 * A function that signs onto Telenor ID using the OAuth2
 * protocol.
 *
 * @param origin The origin endpoint to use when getting
 *               the JWT. For example
 *               `https://test.telenor.no`.
 * @param phoneNumber The phone number the caller wants to
 *                    sign in with. Must be in the format
 *                    of 'xxxxxxxx'.
 */
export default async function signInAndGetJwt(
  origin: string,
  phoneNumber: string,
  /**
   * A function that prompts the caller for an OTP code,
   * must be in the format of 'xxxxxx'.
   *
   * @param invalid Whether the previous code provided was
   *                invalid.
   * @return The OTP code.
   */
  getOtp: (error?: Error) => string | Promise<string>,
  /**
   * A function that prompts the caller for a password.
   *
   * @param invalid Whether the previous password provided
   *                was invalid.
   * @return The provided password.
   */
  getPassword: (error?: Error) => string | Promise<string>,
  /**
   * An optional function that will be called to update the
   * caller on what exactly is going on within the sign in.
   */
  reportTask?: (reportedTask: ReportTask) => unknown,
): Promise<Record<"accessToken" | "issuer", string>> {
  // #region Get final url
  await reportTask?.({ type: Task.Start, text: "Preparing authentication" });

  let _ = new URL("/login", origin).href;
  _ = await fetchLocation(origin, _);
  _ = await fetchLocation(origin, _);
  _ = await fetchLocation(origin, _);
  _ = await fetchLocation(origin, _);
  _ = await fetchLocation(origin, _);
  {
    const { callbackUrl, callbackReferrerUrl } = await fetchCallbackUrl(_);
    _ = callbackUrl;
    origin = callbackReferrerUrl;
  }
  _ = await fetchLocation(origin, _);
  _ = await fetchLocation(origin, _);
  _ = await fetchLocation(origin, _);
  _ = await fetchLocation(
    undefined,
    new URL("/account/login", _).href,
    "POST",
    "application/x-www-form-urlencoded",
    `loginHint=${phoneNumber}&requestUrlEncoded=${
      new URL(_).searchParams.get("requestUrlEncoded")
    }`,
  );
  _ = await fetchLocation(undefined, _);
  _ = await fetchLocation(undefined, _);

  let nounce = await fetchNextNounceValue(_);
  _ = new URL("/v2/api/next", _).href;

  await reportTask?.({ type: Task.End });
  // #endregion

  const encodedUsername = encodeURIComponent(
    "+47 " + phoneNumber.substring(0, 3) + " " +
      phoneNumber.substring(3, 5) + " " + phoneNumber.substring(5),
  );

  // #region username
  {
    const { newNounce } = await fetchNextComponents(
      _,
      `username=${encodedUsername}&stay_signed_in=true&passkey=false&nounce=${nounce}`,
    );
    nounce = newNounce!;
  }
  // #endregion

  let error: Error | undefined = undefined;

  // #region otp

  while (true) {
    const code = await getOtp(error);
    if (code.length !== 6 || !OTP_REGEX.test(code)) {
      error = new Error("Code must 6 numbers(0-9) long");
      reportTask?.({
        type: Task.Failed,
        text: "Code must 6 numbers(0-9) long",
      });
      continue;
    }
    try {
      reportTask?.({ type: Task.Start, text: "Checking..." });
      const { newNounce } = await fetchNextComponents(
        _,
        `pin=${code}&nounce=${nounce}`,
      );
      nounce = newNounce!;
      reportTask?.({ type: Task.End });
      break;
    } catch (err) {
      reportTask?.({ type: Task.Failed, text: err.message });
      error = err;
    }
  }
  error = undefined;

  // #endregion

  // #region password

  while (true) {
    const password = encodeURIComponent(await getPassword(error));
    try {
      reportTask?.({ type: Task.Start, text: "Checking..." });
      const { components, newNounce } = await fetchNextComponents(
        _,
        `phone-disabled=${encodedUsername}&password=${password}&nounce=${nounce}&phone=${encodedUsername}`,
      );
      nounce = newNounce!;
      reportTask?.({ type: Task.End });
      origin = new URL(_).origin;
      // deno-lint-ignore no-explicit-any
      _ = Object.values<any>(
        // deno-lint-ignore no-explicit-any
        (components as any).onload?.elementHooksMap || {},
      )[0]?.[0]?.data?.location;
      break;
    } catch (err) {
      reportTask?.({ type: Task.Failed, text: err.message });
      error = err;
    }
  }
  error = undefined;

  // #endregion

  if (_ === undefined) {
    throw new Error("Something went wrong!");
  }

  // #region get authentication token
  await reportTask?.({ type: Task.Start, text: "Signing in" });
  {
    const _temp = await fetchLocation(origin, _);
    origin = new URL(_).origin;
    _ = _temp;
  }
  {
    const _temp = await fetchLocation(origin, _);
    origin = new URL(_).origin;
    _ = _temp;
  }
  {
    const _temp = await fetchAuthorizationCallbackUrl(_);
    origin = new URL(_).origin;
    _ = _temp;
  }
  {
    const _temp = await fetchLocation(undefined, _);
    origin = new URL(_).origin;
    _ = _temp;
  }
  // #endregion

  const accessToken = await fetchAccessToken(_);
  const issuer = unsafeGetJwtPayload<{ iss: string }>(accessToken).iss;
  await reportTask?.({
    type: Task.Completed,
    text: "Signed into " + issuer,
  });
  return { accessToken, issuer };
}
