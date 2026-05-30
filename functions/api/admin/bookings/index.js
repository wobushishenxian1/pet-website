import { requireAdmin } from "../../../_shared/auth.js";
import { fail, formatBooking, ok, STATUS_VALUES } from "../../../_shared/utils.js";

export async function onRequestGet(context) {
  const authError = await requireAdmin(context.request, context.env);
  if (authError) {
    return authError;
  }

  const url = new URL(context.request.url);
  const status = url.searchParams.get("status") || "all";

  if (status !== "all" && !STATUS_VALUES.includes(status)) {
    return fail("筛选状态不合法", 400);
  }

  const query = status === "all"
    ? `SELECT * FROM bookings ORDER BY created_at DESC`
    : `SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC`;

  const statement = context.env.DB.prepare(query);
  const rows = status === "all"
    ? await statement.all()
    : await statement.bind(status).all();

  return ok({
    bookings: (rows.results || []).map(formatBooking)
  });
}
