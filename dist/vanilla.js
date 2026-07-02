export const DEFAULT_MARITES_IMAGE_URL = "https://images.palengke.es/jobs/support-agent.png";
export const MARITES_IDLE_HIDE_DELAY_MS = 30000;

const topics = [
  ["concern", "Concern"],
  ["question", "Question"],
  ["suggestion", "Suggestion"],
  ["issue", "Issue or improvement"],
  ["feedback", "Feedback"],
];

const categories = [
  ["job_offer", "Job offer"],
  ["room_rent", "Room rent"],
  ["lending", "Lending"],
  ["meetup", "Make friends"],
  ["tour", "Tour"],
  ["clothes", "Clothes"],
  ["foods", "Foods"],
  ["sari_sari", "Sari-sari store"],
  ["service", "Services"],
];

function optionHtml(items, selectedValue = "") {
  return items.map(([value, label]) => `<option value="${value}"${value === selectedValue ? " selected" : ""}>${label}</option>`).join("");
}

function icon(name, size = 16) {
  const common = `aria-hidden="true" fill="none" height="${size}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="${size}"`;
  if (name === "x") return `<svg ${common}><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
  if (name === "mail") return `<svg ${common}><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>`;
  if (name === "message") return `<svg ${common}><path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.8-5.4A8 8 0 1 1 21 12Z"></path></svg>`;
  if (name === "send") return `<svg ${common}><path d="m22 2-7 20-4-9-9-4 20-7Z"></path><path d="M22 2 11 13"></path></svg>`;
  if (name === "shield") return `<svg ${common}><path d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z"></path><path d="m9 12 2 2 4-5"></path></svg>`;
  return "";
}

function getBubbleBounds(width = 58, height = 58) {
  const viewportWidth = Math.max(window.innerWidth || 0, 320);
  const viewportHeight = Math.max(window.innerHeight || 0, 480);
  const isMobile = viewportWidth <= 760;
  const margin = isMobile ? 12 : 22;
  const bottomReserve = isMobile ? 86 : 22;
  const minX = margin;
  const maxX = Math.max(minX, viewportWidth - width - margin);
  const minY = margin;
  const maxY = Math.max(minY, viewportHeight - height - bottomReserve);
  return { defaultY: maxY, leftX: minX, maxX, maxY, minX, minY, rightX: maxX, viewportWidth };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function defaultPostJson(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) throw new Error(data?.detail || data?.message || text || "Request failed");
  return data;
}

export function mountPalengkeMarites({
  apiBasePath = "/api/marites",
  container = document.body,
  imageUrl = DEFAULT_MARITES_IMAGE_URL,
  postJson = defaultPostJson,
  supportPath = "",
  wantedPath = "",
} = {}) {
  if (!container || document.getElementById("palengke-marites")) return null;

  const supportEndpoint = supportPath || `${apiBasePath.replace(/\/$/, "")}/support`;
  const wantedEndpoint = wantedPath || `${apiBasePath.replace(/\/$/, "")}/wanted`;
  const bubble = document.createElement("div");
  bubble.id = "palengke-marites";
  bubble.className = "anonymous-contact anonymous-contact--left";
  bubble.innerHTML = `
    <section class="anonymous-contact__panel" aria-label="Marites" hidden>
      <div class="anonymous-contact__header">
        <img src="${imageUrl}" alt="Palengke support agent" draggable="false">
        <div><span>Palengke Marites</span><h2>Marites</h2></div>
        <button type="button" class="anonymous-contact__panel-close" aria-label="Close Marites">${icon("x", 18)}</button>
      </div>
      <div class="anonymous-contact__tabs" role="tablist" aria-label="Marites options">
        <button type="button" class="active" data-marites-view="support" role="tab" aria-selected="true">Message</button>
        <button type="button" data-marites-view="wanted" role="tab" aria-selected="false">Looking for</button>
      </div>
      <div data-marites-panel="support">
        <div class="anonymous-contact__intro">
          <p>Contact Marites anonymously for concerns, questions, suggestions, or feedback about the app.</p>
          <div><span>${icon("message", 14)} Share freely</span><span>${icon("shield", 14)} No login needed</span><span>${icon("mail", 14)} Email required for replies</span></div>
        </div>
        <form class="anonymous-contact__form" data-marites-form="support">
          <label>Email<input name="email" type="email" placeholder="you@example.com" required></label>
          <label>Name <span>optional</span><input name="display_name" maxlength="120" placeholder="Leave blank to stay anonymous"></label>
          <label>Topic<select name="topic">${optionHtml(topics, "feedback")}</select></label>
          <label>Message<textarea name="message" maxlength="1200" minlength="8" placeholder="Tell us what happened, what you need, or what we can improve." required></textarea></label>
          <p class="anonymous-contact__status" data-marites-status="support" hidden></p>
          <button type="submit">${icon("send", 16)} Create ticket</button>
        </form>
      </div>
      <div data-marites-panel="wanted" hidden>
        <div class="anonymous-contact__intro"><p>Post what you are looking for. No sign-in required, but add an email, phone, or social link so people can contact you.</p></div>
        <form class="anonymous-contact__form" data-marites-form="wanted">
          <label>Category<select name="category">${optionHtml(categories, "service")}</select></label>
          <label>Title<input name="title" maxlength="180" placeholder="What are you looking for?" required></label>
          <label>City<input name="city" maxlength="120" placeholder="City, community, or street"></label>
          <label>Budget <span>optional</span><input name="price_amount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="EUR"></label>
          <label>Contact email<input name="contact_email" type="email" placeholder="you@example.com"></label>
          <label>Contact phone<input name="contact_phone" type="tel" placeholder="+34..."></label>
          <label>Social link<input name="contact_social_url" type="url" placeholder="https://facebook.com/..."></label>
          <label>Description<textarea name="description" maxlength="2000" minlength="10" placeholder="Add details so sellers or kababayan know exactly what you need." required></textarea></label>
          <p class="anonymous-contact__status" data-marites-status="wanted" hidden></p>
          <button type="submit">${icon("send", 16)} Post looking for</button>
        </form>
      </div>
    </section>
    <div class="anonymous-contact__bubble-shell">
      <button class="anonymous-contact__bubble" type="button" aria-expanded="false" aria-label="Open Marites"><img src="${imageUrl}" alt="" draggable="false"></button>
      <button class="anonymous-contact__bubble-close" type="button" aria-label="Hide Marites until refresh">${icon("x", 10)}</button>
    </div>`;

  container.appendChild(bubble);

  const launcher = bubble.querySelector(".anonymous-contact__bubble");
  const panel = bubble.querySelector(".anonymous-contact__panel");
  const close = bubble.querySelector(".anonymous-contact__panel-close");
  const dismiss = bubble.querySelector(".anonymous-contact__bubble-close");
  const stored = JSON.parse(window.localStorage.getItem("palengke_support_bubble_position") || "null");
  let side = stored?.side === "right" ? "right" : "left";
  let y = typeof stored?.y === "number" ? stored.y : getBubbleBounds().defaultY;
  let dragging = null;
  let ignoreClick = false;
  let idleTimer = null;

  function applyPosition(nextSide = side, nextY = y) {
    const bounds = getBubbleBounds();
    side = nextSide === "right" ? "right" : "left";
    y = clamp(nextY, bounds.minY, bounds.maxY);
    bubble.style.setProperty("--support-bubble-x", `${side === "left" ? bounds.leftX : bounds.rightX}px`);
    bubble.style.setProperty("--support-bubble-y", `${y}px`);
    bubble.classList.toggle("anonymous-contact--right", side === "right");
    bubble.classList.toggle("anonymous-contact--left", side !== "right");
    bubble.classList.toggle("anonymous-contact--panel-below", y < 340);
    bubble.classList.add("anonymous-contact--ready");
    window.localStorage.setItem("palengke_support_bubble_position", JSON.stringify({ side, y }));
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", open ? "true" : "false");
    bubble.classList.toggle("anonymous-contact--open", open);
    resetIdleTimer();
  }

  function resetIdleTimer() {
    window.clearTimeout(idleTimer);
    if (!bubble.classList.contains("anonymous-contact--open")) {
      idleTimer = window.setTimeout(() => bubble.remove(), MARITES_IDLE_HIDE_DELAY_MS);
    }
  }

  function setStatus(kind, text, target) {
    const node = bubble.querySelector(`[data-marites-status="${target}"]`);
    node.hidden = false;
    node.className = `anonymous-contact__status anonymous-contact__status--${kind}`;
    node.textContent = text;
  }

  applyPosition(side, y);
  resetIdleTimer();
  window.addEventListener("resize", () => applyPosition(side, y));
  bubble.addEventListener("focusin", resetIdleTimer);
  bubble.addEventListener("pointerdown", resetIdleTimer);
  bubble.addEventListener("pointerenter", resetIdleTimer);

  launcher.addEventListener("click", () => {
    if (ignoreClick) {
      ignoreClick = false;
      return;
    }
    setOpen(panel.hidden);
  });
  close.addEventListener("click", () => setOpen(false));
  dismiss.addEventListener("click", () => {
    window.clearTimeout(idleTimer);
    bubble.remove();
  });

  launcher.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = launcher.getBoundingClientRect();
    dragging = { startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, width: rect.width, height: rect.height, moved: false };
    launcher.setPointerCapture?.(event.pointerId);
  });
  launcher.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - dragging.startX;
    const dy = event.clientY - dragging.startY;
    if (!dragging.moved && Math.hypot(dx, dy) < 6) return;
    dragging.moved = true;
    const bounds = getBubbleBounds(dragging.width, dragging.height);
    const x = clamp(event.clientX - dragging.offsetX, bounds.minX, bounds.maxX);
    y = clamp(event.clientY - dragging.offsetY, bounds.minY, bounds.maxY);
    side = x + dragging.width / 2 < bounds.viewportWidth / 2 ? "left" : "right";
    bubble.style.setProperty("--support-bubble-x", `${x}px`);
    bubble.style.setProperty("--support-bubble-y", `${y}px`);
    event.preventDefault();
  });
  launcher.addEventListener("pointerup", () => {
    if (!dragging) return;
    const moved = dragging.moved;
    dragging = null;
    if (moved) {
      ignoreClick = true;
      setTimeout(() => {
        ignoreClick = false;
      }, 0);
      applyPosition(side, y);
    }
  });

  bubble.querySelectorAll("[data-marites-view]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const view = tab.dataset.maritesView;
      bubble.querySelectorAll("[data-marites-view]").forEach((node) => {
        node.classList.toggle("active", node === tab);
        node.setAttribute("aria-selected", node === tab ? "true" : "false");
      });
      bubble.querySelectorAll("[data-marites-panel]").forEach((node) => {
        node.hidden = node.dataset.maritesPanel !== view;
      });
    });
  });

  bubble.querySelector('[data-marites-form="support"]').addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const ticket = await postJson(supportEndpoint, payload);
      form.reset();
      setStatus("ok", ticket?.reference ? `Ticket ${ticket.reference} created. Admins can now review it.` : "Message sent to Marites.", "support");
    } catch (error) {
      setStatus("error", error instanceof Error ? error.message : "Could not create ticket", "support");
    } finally {
      submit.disabled = false;
    }
  });

  bubble.querySelector('[data-marites-form="wanted"]').addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      if (!payload.contact_email && !payload.contact_phone && !payload.contact_social_url) {
        setStatus("error", "Add an email, phone, or social link so people can contact you.", "wanted");
        return;
      }
      const post = await postJson(wantedEndpoint, payload);
      form.reset();
      setStatus("ok", post?.title ? `"${post.title}" is now on the Marites board.` : "Posted on the Palengke Marites board.", "wanted");
    } catch (error) {
      setStatus("error", error instanceof Error ? error.message : "Could not post what you are looking for", "wanted");
    } finally {
      submit.disabled = false;
    }
  });

  return {
    destroy() {
      window.clearTimeout(idleTimer);
      bubble.remove();
    },
    element: bubble,
    open() {
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
  };
}
