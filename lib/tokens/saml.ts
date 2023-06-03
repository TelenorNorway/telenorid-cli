export default async function getSamlAssertionToken(
  issuer: string,
  accessToken: string,
): Promise<string> {
  return await (await fetch(new URL("/api/saml/v1", issuer).href, {
    headers: { authorization: "Bearer " + accessToken },
  })).text();
}
