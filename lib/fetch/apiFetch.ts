import { Cookie, CookieJar, getSetCookies } from "../../deps.ts";

const cookies = new CookieJar();

export default async function apiFetch(
  request: Request | string | URL,
  init?: RequestInit,
) {
  const req = new Request(request, init);
  if (req.credentials !== "omit") {
    req.headers.set("cookie", cookies.getCookieString(req.url));
  }
  const response = await fetch(req);
  for (const cookie of getSetCookies(response.headers)) {
    cookies.setCookie(
      new Cookie({
        creationDate: Date.now(),
        domain: cookie.domain,
        expires: cookie.expires instanceof Date
          ? cookie.expires.getTime()
          : cookie.expires,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        name: cookie.name,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        value: cookie.value,
      }),
      req.url,
    );
  }
  return response;
}

export function getCookie(name: string): string | undefined {
  return cookies.cookies.find((cookie) => cookie.name === name)?.value;
}
