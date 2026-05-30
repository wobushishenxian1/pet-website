import { fail, getTimeSlots, ok, isDateTodayOrFuture, isValidDateString } from "../_shared/utils.js";

export async function onRequestGet(context) {
  const date = context.request.url ? new URL(context.request.url).searchParams.get("date") || "" : "";

  if (!isValidDateString(date)) {
    return fail("请提供正确的预约日期", 400);
  }

  if (!isDateTodayOrFuture(date)) {
    return fail("不能查询过去的日期", 400);
  }

  const rows = await context.env.DB.prepare(
    `SELECT appointment_time
     FROM bookings
     WHERE appointment_date = ?
       AND status != 'cancelled'`
  ).bind(date).all();

  const booked = new Set((rows.results || []).map((row) => row.appointment_time));
  const slots = getTimeSlots().map((slot) => ({
    ...slot,
    available: !booked.has(slot.value)
  }));

  return ok({
    date,
    slots
  });
}
