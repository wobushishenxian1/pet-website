import { clearSessionCookie } from "../../_shared/auth.js";
import { ok } from "../../_shared/utils.js";

export async function onRequestPost() {
  return ok(
    { loggedOut: true },
    200,
    { "Set-Cookie": clearSessionCookie() }
  );
}
