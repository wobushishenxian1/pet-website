export const STATUS_VALUES = ["pending", "confirmed", "arrived", "completed", "cancelled"];

export const STATUS_LABELS = {
  pending: "待确认",
  confirmed: "已确认",
  arrived: "已到店",
  completed: "已完成",
  cancelled: "已取消"
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

export function ok(data, status = 200, headers = {}) {
  return json({ ok: true, data }, status, headers);
}

export function fail(error, status = 400) {
  return json({ ok: false, error }, status);
}

export async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("请求体格式不正确");
  }
}

export function getTimeSlots() {
  const slots = [];
  for (let hour = 10; hour <= 20; hour += 1) {
    const start = String(hour).padStart(2, "0") + ":00";
    const end = String(hour + 1).padStart(2, "0") + ":00";
    slots.push({
      value: start,
      label: start + "-" + end
    });
  }
  return slots;
}

export function getTodayInShanghai() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function nowIso() {
  return new Date().toISOString();
}

export function isValidPhone(phone) {
  return /^1\d{10}$/.test(String(phone || "").trim());
}

export function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export function isDateTodayOrFuture(value) {
  return value >= getTodayInShanghai();
}

export function isValidTimeSlot(value) {
  return getTimeSlots().some((slot) => slot.value === value);
}

export function formatBooking(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    petType: row.pet_type,
    serviceType: row.service_type,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    appointmentTimeLabel: timeLabel(row.appointment_time),
    message: row.message || "",
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    adminNote: row.admin_note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function timeLabel(value) {
  const hour = Number(String(value || "").split(":")[0]);
  if (Number.isNaN(hour)) {
    return value;
  }
  return value + "-" + String(hour + 1).padStart(2, "0") + ":00";
}

export function randomId(prefix = "bk") {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return prefix + "_" + token;
}

export function sanitizeBookingInput(payload) {
  const input = {
    name: String(payload.name || "").trim(),
    phone: String(payload.phone || "").trim(),
    petType: String(payload.petType || "").trim(),
    serviceType: String(payload.serviceType || "").trim(),
    appointmentDate: String(payload.appointmentDate || "").trim(),
    appointmentTime: String(payload.appointmentTime || "").trim(),
    message: String(payload.message || "").trim().slice(0, 1000)
  };

  if (!input.name) {
    throw new Error("请填写姓名");
  }

  if (!isValidPhone(input.phone)) {
    throw new Error("请输入正确的中国大陆手机号");
  }

  if (!input.petType) {
    throw new Error("请选择宠物类型");
  }

  if (!input.serviceType) {
    throw new Error("请选择预约项目");
  }

  if (!isValidDateString(input.appointmentDate)) {
    throw new Error("预约日期格式不正确");
  }

  if (!isDateTodayOrFuture(input.appointmentDate)) {
    throw new Error("不能预约过去的日期");
  }

  if (!isValidTimeSlot(input.appointmentTime)) {
    throw new Error("预约时间不在营业时段内");
  }

  return input;
}
