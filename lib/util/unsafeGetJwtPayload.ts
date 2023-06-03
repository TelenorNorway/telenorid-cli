export default function unsafeGetJwtPayload<T>(jwt: string): T {
  return JSON.parse(atob(
    jwt.replace(/^[^\.]*\.|\.[^\.]*$/g, "").replaceAll("_", "/").replaceAll(
      "-",
      "+",
    ),
  ));
}
