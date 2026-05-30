import { fail } from "./utils.js";

const COOKIE_NAME = "gw_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function toBase64Url(value) {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value) {
  const padding = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  return atob(value.replaceAll("-", "+").replaceAll("_", "/") + padding);
}

async function sign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSession(secret) {
  const timestamp = String(Date.now());
  const payload = "admin." + timestamp;
  const signature = await sign(secret, payload);
  return toBase64Url(payload + "." + signature);
}

function readCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(name + "="));
  return found ? found.slice(name.length + 1) : "";
}

export async function verifySession(request, secret) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) {
    return false;
  }

  try {
    const decoded = fromBase64Url(token);
    const parts = decoded.split(".");
    if (parts.length !== 3 || parts[0] !== "admin") {
      return false;
    }

    const timestamp = Number(parts[1]);
    if (!Number.isFinite(timestamp) || Date.now() - timestamp > MAX_AGE * 1000) {
      return false;
    }

    const expected = await sign(secret, "admin." + parts[1]);
    return expected === parts[2];
  } catch {
    return false;
  }
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export async function requireAdmin(request, env) {
  const allowed = await verifySession(request, env.SESSION_SECRET || "");
  if (!allowed) {
    return fail("未登录或登录已失效", 401);
  }
  return null;
}
