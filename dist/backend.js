export const defaultPalengkeApiUrl = "https://palengke.es/api/backend";

export function normalizeMaritesSupportPayload(payload = {}, { sourceLabel = "" } = {}) {
  const email = String(payload.email || "").trim();
  const message = String(payload.message || "").trim();
  return {
    email,
    display_name: payload.display_name ? String(payload.display_name).trim() : null,
    topic: payload.topic || "feedback",
    message: sourceLabel ? `[${sourceLabel}]\n\n${message}` : message,
  };
}

export function normalizeMaritesWantedPayload(payload = {}, { sourceLabel = "" } = {}) {
  const description = String(payload.description || "").trim();
  return {
    category: payload.category || "service",
    title: String(payload.title || "").trim(),
    description: sourceLabel ? `${description}\n\nPosted from ${sourceLabel}.` : description,
    city: payload.city ? String(payload.city).trim() : undefined,
    price_amount: payload.price_amount === undefined || payload.price_amount === null || payload.price_amount === "" ? undefined : Number(payload.price_amount),
    currency: payload.currency ? String(payload.currency).trim() : "EUR",
    contact_email: payload.contact_email ? String(payload.contact_email).trim() : undefined,
    contact_phone: payload.contact_phone ? String(payload.contact_phone).trim() : undefined,
    contact_social_url: payload.contact_social_url ? String(payload.contact_social_url).trim() : undefined,
  };
}

export async function postToPalengkeApi(path, payload, { fetchImpl = globalThis.fetch, palengkeApiUrl = defaultPalengkeApiUrl, timeoutMs = 10000 } = {}) {
  if (!fetchImpl) {
    throw new Error("fetch is required to post to Palengke API");
  }
  const controller = typeof AbortController === "undefined" ? null : new AbortController();
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetchImpl(`${palengkeApiUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok) {
      const detail = data?.detail || data?.message || text || "Palengke API request failed";
      const error = new Error(Array.isArray(detail) ? detail.map((item) => item.msg || item.message || String(item)).join(", ") : detail);
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function createSupportTicket(payload, options = {}) {
  return postToPalengkeApi("/support/tickets", normalizeMaritesSupportPayload(payload, options), options);
}

export async function createWantedPost(payload, options = {}) {
  return postToPalengkeApi("/wanted-posts", normalizeMaritesWantedPayload(payload, options), options);
}
