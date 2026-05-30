import { fail, formatBooking, nowIso, ok, parseBody, randomId, sanitizeBookingInput } from "../_shared/utils.js";

export async function onRequestPost(context) {
  let payload;

  try {
    payload = sanitizeBookingInput(await parseBody(context.request));
  } catch (error) {
    return fail(error.message, 400);
  }

  const timestamp = nowIso();
  const id = randomId();

  try {
    const row = await context.env.DB.prepare(
      `INSERT INTO bookings (
        id,
        name,
        phone,
        pet_type,
        service_type,
        appointment_date,
        appointment_time,
        message,
        status,
        admin_note,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', ?, ?)
      RETURNING *`
    ).bind(
      id,
      payload.name,
      payload.phone,
      payload.petType,
      payload.serviceType,
      payload.appointmentDate,
      payload.appointmentTime,
      payload.message,
      timestamp,
      timestamp
    ).first();

    return ok({
      booking: formatBooking(row)
    }, 201);
  } catch (error) {
    if (String(error.message || "").toLowerCase().includes("unique")) {
      return fail("这个时段已经被预约，请重新选择时间", 409);
    }

    return fail("预约提交失败，请稍后再试", 500);
  }
}
