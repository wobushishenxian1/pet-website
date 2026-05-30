import { requireAdmin } from "../../../_shared/auth.js";
import {
  fail,
  formatBooking,
  nowIso,
  ok,
  STATUS_VALUES
} from "../../../_shared/utils.js";

async function getBookingById(db, id) {
  return db.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(id).first();
}

export async function onRequestGet(context) {
  const authError = await requireAdmin(context.request, context.env);
  if (authError) {
    return authError;
  }

  const booking = await getBookingById(context.env.DB, context.params.id);
  if (!booking) {
    return fail("预约单不存在", 404);
  }

  return ok({
    booking: formatBooking(booking)
  });
}

export async function onRequestPatch(context) {
  const authError = await requireAdmin(context.request, context.env);
  if (authError) {
    return authError;
  }

  const existing = await getBookingById(context.env.DB, context.params.id);
  if (!existing) {
    return fail("预约单不存在", 404);
  }

  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return fail("请求体格式不正确", 400);
  }

  const status = String(payload.status || "").trim();
  const adminNote = String(payload.adminNote || "").trim().slice(0, 1000);

  if (!STATUS_VALUES.includes(status)) {
    return fail("状态不合法", 400);
  }

  try {
    const updated = await context.env.DB.prepare(
      `UPDATE bookings
       SET status = ?, admin_note = ?, updated_at = ?
       WHERE id = ?
       RETURNING *`
    ).bind(status, adminNote, nowIso(), context.params.id).first();

    return ok({
      booking: formatBooking(updated)
    });
  } catch (error) {
    if (String(error.message || "").toLowerCase().includes("unique")) {
      return fail("当前时段已被其他有效预约占用，无法恢复为有效状态", 409);
    }

    return fail("更新预约单失败", 500);
  }
}
