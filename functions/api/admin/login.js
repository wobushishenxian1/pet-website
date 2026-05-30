import { createSession, sessionCookie } from "../../_shared/auth.js";
import { fail, ok, parseBody } from "../../_shared/utils.js";

export async function onRequestPost(context) {
  let payload;

  try {
    payload = await parseBody(context.request);
  } catch (error) {
    return fail(error.message, 400);
  }

  const password = String(payload.password || "");
  if (!password || password !== context.env.ADMIN_PASSWORD) {
    return fail("管理员密码不正确", 401);
  }

  const token = await createSession(context.env.SESSION_SECRET || "");
  return ok(
    { loggedIn: true },
    200,
    { "Set-Cookie": sessionCookie(token) }
  );
}
