import browserApiFetch from "../fetch/browserApiFetch.ts";
import rand from "../util/rand.ts";

export type Component = {
  componentName: string;
  hooks: Record<string, unknown>;
  id: string;
  targetContainerId: string;
  type?: string;
  value?: string;
};

export type Components = {
  components: {
    cleanUrl: boolean;
    errors: { message: string }[];
    components?: Component[];
    appendComponents?: Component[];
    replaceComponents?: Component[];
    customPayloadData: Record<string, unknown>;
    lsid: string;
    newSession: boolean;
  };
  nounce?: string;
};

export default async function fetchNextComponents(
  url: string,
  content: string,
) {
  const now = Date.now();
  const _url = new URL(url);
  const data = await (await browserApiFetch(
    url,
    {
      method: "POST",
      referrer: _url.origin + _url.pathname,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "X-SIGNIN-TELENORID-COM-CSRF-PROTECTION": "tid",
      },
      body: `${content}&pointerType=mouse&isTrusted=true&relativeX=${
        rand(150, 400)
      }&relativeY=${
        rand(25, 125)
      }&elementHeight=48&elementWidth=312&pageWasRenderedTimestamp=${
        now - 30
      }&currentInteractionStartTimestamp=${
        now - 20
      }&newStateHasArrivedTimestamp=${
        now - 10
      }&currentInteractionEndTimestamp=${now}&clientTimeZoneOffset=-120&clientTimeZone=Europe%2FOslo`,
    },
  )).json() as Components["components"];
  if (data.errors) {
    throw new Error(
      data.errors?.[0]?.message || data.appendComponents?.find((component) =>
        component.componentName === "TextComponent"
      )?.value || "Something went wrong",
    );
  }
  return {
    components: data,
    newNounce: data.components?.find((component) => component.id === "nounce")
      ?.value,
  };
}
