"use client";

import React, { useEffect, useRef, useState } from "react";

export const DEFAULT_MARITES_IMAGE_URL = "https://images.palengke.es/jobs/support-agent.png";
export const MARITES_IDLE_HIDE_DELAY_MS = 30000;

export const defaultMaritesTopics = [
  { value: "concern", label: "Concern" },
  { value: "question", label: "Question" },
  { value: "suggestion", label: "Suggestion" },
  { value: "issue", label: "Issue or improvement" },
  { value: "feedback", label: "Feedback" },
];

export const defaultMaritesWantedCategories = [
  { value: "job_offer", label: "Job offer" },
  { value: "room_rent", label: "Room rent" },
  { value: "lending", label: "Lending" },
  { value: "meetup", label: "Make friends" },
  { value: "tour", label: "Tour" },
  { value: "clothes", label: "Clothes" },
  { value: "foods", label: "Foods" },
  { value: "sari_sari", label: "Sari-sari store" },
  { value: "service", label: "Services" },
];

const bubblePositionStorageKey = "palengke_support_bubble_position";
const dragThreshold = 6;
const defaultBubbleSize = { width: 58, height: 58 };

const blockingOverlaySelector = [
  '[role="dialog"]',
  '.modal-backdrop',
  '.post-modal-backdrop',
  '.filter-wizard-backdrop',
  '.guide-modal-backdrop',
  '.guide-help-backdrop',
  '.warning-modal-backdrop',
  '.visitor-tutorial-overlay',
  '.feedback-backdrop',
  '.feedback-popup',
  '.apply-modal-backdrop',
  '.cv-choice-backdrop',
  '.map-modal-backdrop',
].join(',');

function isVisibleElement(element) {
  if (!(element instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 8 && rect.height > 8;
}

function hasBlockingOverlay(contactRoot) {
  if (typeof document === 'undefined') return false;
  return Array.from(document.querySelectorAll(blockingOverlaySelector)).some((element) => !contactRoot?.contains(element) && isVisibleElement(element));
}


const denseContentSelector = [
  'article',
  '[class*="listing-card"]',
  '[class*="product-card"]',
  '[class*="room-card"]',
  '[class*="home-card"]',
  '[class*="job-card"]',
  '[class*="guide-card"]',
  '[class*="wanted-card"]',
  '[class*="review-card"]',
  '[class*="tool-ad-card"]',
  '[data-marites-avoid-floating]',
].join(',');

function hasDenseContentUnderBubble(contactRoot) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  if ((window.innerWidth || 0) > 760) return false;
  const viewportWidth = Math.max(window.innerWidth || 0, 320);
  const viewportHeight = Math.max(window.innerHeight || 0, 480);
  const points = [
    [64, viewportHeight - 160],
    [Math.min(160, viewportWidth * 0.42), viewportHeight - 160],
    [viewportWidth - 64, viewportHeight - 160],
    [64, viewportHeight - 230],
  ];
  return points.some(([x, y]) =>
    document.elementsFromPoint(x, y).some((element) => {
      if (!(element instanceof Element)) return false;
      if (contactRoot?.contains(element)) return false;
      const match = element.closest(denseContentSelector);
      return Boolean(match && !contactRoot?.contains(match));
    }),
  );
}

const h = React.createElement;

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getBubbleBounds(width = defaultBubbleSize.width, height = defaultBubbleSize.height) {
  const viewportWidth = Math.max(window.innerWidth || 0, 320);
  const viewportHeight = Math.max(window.innerHeight || 0, 480);
  const isMobile = viewportWidth <= 760;
  const margin = isMobile ? 12 : 22;
  const bottomReserve = isMobile ? 104 : 22;
  const minX = margin;
  const maxX = Math.max(minX, viewportWidth - width - margin);
  const minY = margin;
  const maxY = Math.max(minY, viewportHeight - height - bottomReserve);

  return {
    defaultY: maxY,
    leftX: minX,
    margin,
    maxX,
    maxY,
    minX,
    minY,
    rightX: maxX,
    viewportHeight,
    viewportWidth,
  };
}

function readStoredPosition() {
  try {
    const stored = window.localStorage.getItem(bubblePositionStorageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if ((parsed.side === "left" || parsed.side === "right") && typeof parsed.y === "number") {
      return { side: parsed.side, y: parsed.y };
    }
  } catch {
    return null;
  }
  return null;
}

function saveStoredPosition(position) {
  try {
    window.localStorage.setItem(
      bubblePositionStorageKey,
      JSON.stringify({
        side: position.side,
        y: position.y,
      }),
    );
  } catch {
    // Local storage is only a convenience. The bubble still works without it.
  }
}

function getSnappedPosition(rawX, rawY, width, height) {
  const bounds = getBubbleBounds(width, height);
  const clampedX = clamp(rawX, bounds.minX, bounds.maxX);
  const side = clampedX + width / 2 < bounds.viewportWidth / 2 ? "left" : "right";
  return {
    x: side === "left" ? bounds.leftX : bounds.rightX,
    y: clamp(rawY, bounds.minY, bounds.maxY),
    side,
    ready: true,
  };
}

function icon(name, size = 16) {
  const common = {
    "aria-hidden": "true",
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    width: size,
  };
  switch (name) {
    case "mail":
      return h("svg", common, h("rect", { x: 3, y: 5, width: 18, height: 14, rx: 2, key: "box" }), h("path", { d: "m3 7 9 6 9-6", key: "flap" }));
    case "message":
      return h("svg", common, h("path", { d: "M21 12a8 8 0 0 1-8 8H8l-5 3 1.8-5.4A8 8 0 1 1 21 12Z", key: "bubble" }));
    case "send":
      return h("svg", common, h("path", { d: "m22 2-7 20-4-9-9-4 20-7Z", key: "send" }), h("path", { d: "M22 2 11 13", key: "line" }));
    case "shield":
      return h("svg", common, h("path", { d: "M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z", key: "shield" }), h("path", { d: "m9 12 2 2 4-5", key: "check" }));
    case "x":
      return h("svg", common, h("path", { d: "M18 6 6 18", key: "a" }), h("path", { d: "m6 6 12 12", key: "b" }));
    default:
      return null;
  }
}

function resolvePath(path, basePath, suffix) {
  if (path) return path;
  return `${basePath.replace(/\/$/, "")}/${suffix}`;
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
  if (!response.ok) {
    const detail = data?.detail || data?.message || text || "Request failed";
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg || item.message || String(item)).join(", ") : detail);
  }
  return data;
}

export function PalengkeMaritesBubble({
  apiBasePath = "/api/marites",
  className = "",
  imageUrl = DEFAULT_MARITES_IMAGE_URL,
  initialView = "support",
  onWantedPosted,
  postJson = defaultPostJson,
  renderCityInput,
  supportPath,
  topics = defaultMaritesTopics,
  wantedCategories = defaultMaritesWantedCategories,
  wantedPath,
} = {}) {
  const bubbleRef = useRef(null);
  const dragRef = useRef(null);
  const ignoreClickRef = useRef(false);
  const idleHideTimerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBlockedByOverlay, setIsBlockedByOverlay] = useState(false);
  const [isHiddenByDenseContent, setIsHiddenByDenseContent] = useState(false);
  const [position, setPosition] = useState({ x: 22, y: 0, side: "left", ready: false });
  const [activeView, setActiveView] = useState(initialView === "wanted" ? "wanted" : "support");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [topic, setTopic] = useState("feedback");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({ kind: "idle", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wantedCategory, setWantedCategory] = useState("service");
  const [wantedTitle, setWantedTitle] = useState("");
  const [wantedDescription, setWantedDescription] = useState("");
  const [wantedCity, setWantedCity] = useState("");
  const [wantedPriceAmount, setWantedPriceAmount] = useState("");
  const [wantedContactEmail, setWantedContactEmail] = useState("");
  const [wantedContactPhone, setWantedContactPhone] = useState("");
  const [wantedContactSocialUrl, setWantedContactSocialUrl] = useState("");
  const [wantedStatus, setWantedStatus] = useState({ kind: "idle", text: "" });
  const [isPostingWanted, setIsPostingWanted] = useState(false);

  useEffect(() => {
    const rect = bubbleRef.current?.getBoundingClientRect();
    const bounds = getBubbleBounds(rect?.width, rect?.height);
    const stored = readStoredPosition();
    const isMobile = bounds.viewportWidth <= 760;
    const storedY = typeof stored?.y === "number" ? stored.y : bounds.defaultY;
    const safeStoredY = storedY < bounds.viewportHeight * (isMobile ? 0.82 : 0.58) ? bounds.defaultY : storedY;
    const side = stored?.side ?? "left";
    setPosition({
      x: side === "left" ? bounds.leftX : bounds.rightX,
      y: clamp(safeStoredY, bounds.minY, bounds.maxY),
      side,
      ready: true,
    });
  }, []);

  useEffect(() => {
    function handleResize() {
      setPosition((current) => {
        if (!current.ready) return current;
        const rect = bubbleRef.current?.getBoundingClientRect();
        const bounds = getBubbleBounds(rect?.width, rect?.height);
        const nextPosition = {
          x: current.side === "left" ? bounds.leftX : bounds.rightX,
          y: clamp(current.y, bounds.minY, bounds.maxY),
          side: current.side,
          ready: true,
        };
        saveStoredPosition(nextPosition);
        return nextPosition;
      });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const contactRoot = bubbleRef.current?.closest('.anonymous-contact');
    function updateOverlayState() {
      setIsBlockedByOverlay(hasBlockingOverlay(contactRoot));
    }
    updateOverlayState();
    const observer = new MutationObserver(updateOverlayState);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    window.addEventListener('resize', updateOverlayState);
    const interval = window.setInterval(updateOverlayState, 1000);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateOverlayState);
      window.clearInterval(interval);
    };
  }, []);


  useEffect(() => {
    const contactRoot = bubbleRef.current?.closest('.anonymous-contact');
    function updateDenseContentState() {
      setIsHiddenByDenseContent(!isOpen && hasDenseContentUnderBubble(contactRoot));
    }
    updateDenseContentState();
    const observer = new MutationObserver(updateDenseContentState);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    window.addEventListener('scroll', updateDenseContentState, { passive: true });
    window.addEventListener('resize', updateDenseContentState);
    const interval = window.setInterval(updateDenseContentState, 1200);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateDenseContentState);
      window.removeEventListener('resize', updateDenseContentState);
      window.clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (idleHideTimerRef.current !== null) {
      window.clearTimeout(idleHideTimerRef.current);
      idleHideTimerRef.current = null;
    }
    if (isDismissed || isOpen) return undefined;
    idleHideTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsDismissed(true);
    }, MARITES_IDLE_HIDE_DELAY_MS);
    return () => {
      if (idleHideTimerRef.current !== null) {
        window.clearTimeout(idleHideTimerRef.current);
        idleHideTimerRef.current = null;
      }
    };
  }, [isDismissed, isOpen]);

  useEffect(() => {
    if (!isDragging) return undefined;
    function handleWindowPointerMove(event) {
      if (moveDrag(event.pointerId, event.clientX, event.clientY)) event.preventDefault();
    }
    function handleWindowPointerUp(event) {
      if (finishDragAt(event.pointerId, event.clientX, event.clientY)) event.preventDefault();
    }
    function handleWindowMouseMove(event) {
      const drag = dragRef.current;
      if (drag && moveDrag(drag.pointerId, event.clientX, event.clientY)) event.preventDefault();
    }
    function handleWindowMouseUp(event) {
      const drag = dragRef.current;
      if (drag && finishDragAt(drag.pointerId, event.clientX, event.clientY)) event.preventDefault();
    }
    window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp, { passive: false });
    window.addEventListener("pointercancel", handleWindowPointerUp, { passive: false });
    window.addEventListener("mousemove", handleWindowMouseMove, { passive: false });
    window.addEventListener("mouseup", handleWindowMouseUp, { passive: false });
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isDragging]);

  async function submitTicket(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ kind: "idle", text: "" });
    try {
      const ticket = await postJson(resolvePath(supportPath, apiBasePath, "support"), {
        email,
        display_name: displayName.trim() ? displayName : null,
        topic,
        message,
      });
      setMessage("");
      setDisplayName("");
      setTopic("feedback");
      setStatus({ kind: "ok", text: ticket?.reference ? `Ticket ${ticket.reference} created. Admins can now review it.` : "Message sent to Marites." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Could not create ticket" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitWantedPost(event) {
    event.preventDefault();
    setWantedStatus({ kind: "idle", text: "" });
    if (!wantedContactEmail.trim() && !wantedContactPhone.trim() && !wantedContactSocialUrl.trim()) {
      setWantedStatus({ kind: "error", text: "Add an email, phone, or social link so people can contact you." });
      return;
    }
    setIsPostingWanted(true);
    try {
      const post = await postJson(resolvePath(wantedPath, apiBasePath, "wanted"), {
        category: wantedCategory,
        title: wantedTitle,
        description: wantedDescription,
        city: wantedCity.trim() || undefined,
        price_amount: wantedPriceAmount ? Number(wantedPriceAmount) : undefined,
        currency: "EUR",
        contact_email: wantedContactEmail.trim() || undefined,
        contact_phone: wantedContactPhone.trim() || undefined,
        contact_social_url: wantedContactSocialUrl.trim() || undefined,
      });
      setWantedTitle("");
      setWantedDescription("");
      setWantedCity("");
      setWantedPriceAmount("");
      setWantedContactEmail("");
      setWantedContactPhone("");
      setWantedContactSocialUrl("");
      setWantedCategory("service");
      setWantedStatus({ kind: "ok", text: post?.title ? `"${post.title}" is now on the Marites board.` : "Posted on the Palengke Marites board." });
      onWantedPosted?.(post);
    } catch (error) {
      setWantedStatus({ kind: "error", text: error instanceof Error ? error.message : "Could not post what you are looking for" });
    } finally {
      setIsPostingWanted(false);
    }
  }

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      dragged: false,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      target: event.currentTarget,
      width: rect.width,
    };
    setIsDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable in some embedded browsers.
    }
  }

  function moveDrag(pointerId, clientX, clientY) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return false;
    const deltaX = clientX - drag.startX;
    const deltaY = clientY - drag.startY;
    if (!drag.dragged && Math.hypot(deltaX, deltaY) < dragThreshold) return false;

    drag.dragged = true;
    const bounds = getBubbleBounds(drag.width, drag.height);
    const nextX = clamp(clientX - drag.offsetX, bounds.minX, bounds.maxX);
    const nextY = clamp(clientY - drag.offsetY, bounds.minY, bounds.maxY);
    const side = nextX + drag.width / 2 < bounds.viewportWidth / 2 ? "left" : "right";
    setPosition({ x: nextX, y: nextY, side, ready: true });
    return true;
  }

  function finishDragAt(pointerId, clientX, clientY) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return false;
    setIsDragging(false);
    dragRef.current = null;
    try {
      drag.target.releasePointerCapture(pointerId);
    } catch {
      // Already released.
    }
    if (!drag.dragged) return false;

    ignoreClickRef.current = true;
    window.setTimeout(() => {
      ignoreClickRef.current = false;
    }, 0);
    const nextPosition = getSnappedPosition(clientX - drag.offsetX, clientY - drag.offsetY, drag.width, drag.height);
    setPosition(nextPosition);
    saveStoredPosition(nextPosition);
    return true;
  }

  function handlePointerMove(event) {
    if (moveDrag(event.pointerId, event.clientX, event.clientY)) event.preventDefault();
  }

  function finishDrag(event) {
    if (finishDragAt(event.pointerId, event.clientX, event.clientY)) event.preventDefault();
  }

  function resetIdleHideTimer() {
    if (isDismissed || isOpen) return;
    if (idleHideTimerRef.current !== null) window.clearTimeout(idleHideTimerRef.current);
    idleHideTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsDismissed(true);
    }, MARITES_IDLE_HIDE_DELAY_MS);
  }

  function handleBubbleClick() {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    setIsOpen((current) => !current);
  }

  function hideBubbleUntilRefresh() {
    if (idleHideTimerRef.current !== null) {
      window.clearTimeout(idleHideTimerRef.current);
      idleHideTimerRef.current = null;
    }
    setIsOpen(false);
    setIsDismissed(true);
  }

  if (isDismissed || isBlockedByOverlay || isHiddenByDenseContent) return null;

  const contactClasses = classNames(
    "anonymous-contact",
    className,
    isOpen && "anonymous-contact--open",
    isDragging && "anonymous-contact--dragging",
    position.ready && "anonymous-contact--ready",
    position.side === "right" ? "anonymous-contact--right" : "anonymous-contact--left",
    position.y < 340 && "anonymous-contact--panel-below",
  );
  const contactStyle = {
    "--support-bubble-x": `${position.x}px`,
    "--support-bubble-y": `${position.y}px`,
  };

  const cityInput = renderCityInput
    ? renderCityInput({
        value: wantedCity,
        onChange: setWantedCity,
        inputProps: {
          maxLength: 120,
          placeholder: "City, community, or street",
        },
      })
    : h("input", {
        value: wantedCity,
        onChange: (event) => setWantedCity(event.target.value),
        maxLength: 120,
        placeholder: "City, community, or street",
      });

  return h(
    "div",
    {
      className: contactClasses,
      style: contactStyle,
      onFocusCapture: resetIdleHideTimer,
      onPointerDown: resetIdleHideTimer,
      onPointerEnter: resetIdleHideTimer,
    },
    isOpen
      ? h(
          "section",
          { className: "anonymous-contact__panel", "aria-label": "Marites" },
          h(
            "div",
            { className: "anonymous-contact__header" },
            h("img", { src: imageUrl, alt: "Palengke support agent", draggable: false }),
            h("div", null, h("span", null, "Palengke Marites"), h("h2", null, "Marites")),
            h("button", { type: "button", onClick: () => setIsOpen(false), "aria-label": "Close Marites" }, icon("x", 18)),
          ),
          h(
            "div",
            { className: "anonymous-contact__tabs", role: "tablist", "aria-label": "Marites options" },
            h("button", { type: "button", className: activeView === "support" ? "active" : "", onClick: () => setActiveView("support"), role: "tab", "aria-selected": activeView === "support" }, "Message"),
            h("button", { type: "button", className: activeView === "wanted" ? "active" : "", onClick: () => setActiveView("wanted"), role: "tab", "aria-selected": activeView === "wanted" }, "Looking for"),
          ),
          activeView === "support"
            ? h(
                React.Fragment,
                null,
                h(
                  "div",
                  { className: "anonymous-contact__intro" },
                  h("p", null, "Contact Marites anonymously for concerns, questions, suggestions, or feedback about the app."),
                  h(
                    "div",
                    null,
                    h("span", null, icon("message", 14), "Share freely"),
                    h("span", null, icon("shield", 14), "No login needed"),
                    h("span", null, icon("mail", 14), "Email required for replies"),
                  ),
                ),
                h(
                  "form",
                  { className: "anonymous-contact__form", onSubmit: submitTicket },
                  h("label", null, "Email", h("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), placeholder: "you@example.com", required: true })),
                  h("label", null, "Name ", h("span", null, "optional"), h("input", { value: displayName, onChange: (event) => setDisplayName(event.target.value), maxLength: 120, placeholder: "Leave blank to stay anonymous" })),
                  h(
                    "label",
                    null,
                    "Topic",
                    h(
                      "select",
                      { value: topic, onChange: (event) => setTopic(event.target.value) },
                      topics.map((item) => h("option", { value: item.value, key: item.value }, item.label)),
                    ),
                  ),
                  h(
                    "label",
                    null,
                    "Message",
                    h("textarea", {
                      value: message,
                      onChange: (event) => setMessage(event.target.value),
                      maxLength: 1200,
                      minLength: 8,
                      placeholder: "Tell us what happened, what you need, or what we can improve.",
                      required: true,
                    }),
                  ),
                  status.text ? h("p", { className: `anonymous-contact__status anonymous-contact__status--${status.kind}` }, status.text) : null,
                  h("button", { type: "submit", disabled: isSubmitting }, icon("send", 16), isSubmitting ? "Sending..." : "Create ticket"),
                ),
              )
            : h(
                React.Fragment,
                null,
                h("div", { className: "anonymous-contact__intro" }, h("p", null, "Post what you are looking for. No sign-in required, but add an email, phone, or social link so people can contact you.")),
                h(
                  "form",
                  { className: "anonymous-contact__form", onSubmit: submitWantedPost },
                  h(
                    "label",
                    null,
                    "Category",
                    h(
                      "select",
                      { value: wantedCategory, onChange: (event) => setWantedCategory(event.target.value) },
                      wantedCategories.map((item) => h("option", { value: item.value, key: item.value }, item.label)),
                    ),
                  ),
                  h("label", null, "Title", h("input", { value: wantedTitle, onChange: (event) => setWantedTitle(event.target.value), maxLength: 180, placeholder: "What are you looking for?", required: true })),
                  h("label", null, "City", cityInput),
                  h("label", null, "Budget ", h("span", null, "optional"), h("input", { type: "number", min: 0, step: "0.01", inputMode: "decimal", value: wantedPriceAmount, onChange: (event) => setWantedPriceAmount(event.target.value), placeholder: "EUR" })),
                  h("label", null, "Contact email", h("input", { type: "email", value: wantedContactEmail, onChange: (event) => setWantedContactEmail(event.target.value), placeholder: "you@example.com" })),
                  h("label", null, "Contact phone", h("input", { type: "tel", value: wantedContactPhone, onChange: (event) => setWantedContactPhone(event.target.value), placeholder: "+34..." })),
                  h("label", null, "Social link", h("input", { type: "url", value: wantedContactSocialUrl, onChange: (event) => setWantedContactSocialUrl(event.target.value), placeholder: "https://facebook.com/..." })),
                  h(
                    "label",
                    null,
                    "Description",
                    h("textarea", {
                      value: wantedDescription,
                      onChange: (event) => setWantedDescription(event.target.value),
                      maxLength: 2000,
                      minLength: 10,
                      placeholder: "Add details so sellers or kababayan know exactly what you need.",
                      required: true,
                    }),
                  ),
                  wantedStatus.text ? h("p", { className: `anonymous-contact__status anonymous-contact__status--${wantedStatus.kind}` }, wantedStatus.text) : null,
                  h("button", { type: "submit", disabled: isPostingWanted }, icon("send", 16), isPostingWanted ? "Posting..." : "Post looking for"),
                ),
              ),
        )
      : null,
    h(
      "div",
      { className: "anonymous-contact__bubble-shell" },
      h(
        "button",
        {
          className: "anonymous-contact__bubble",
          type: "button",
          onClick: handleBubbleClick,
          onPointerCancel: finishDrag,
          onPointerDown: handlePointerDown,
          onPointerMove: handlePointerMove,
          onPointerUp: finishDrag,
          "aria-expanded": isOpen,
          "aria-label": "Open Marites",
          ref: bubbleRef,
        },
        h("img", { src: imageUrl, alt: "", draggable: false }),
      ),
      h("button", { className: "anonymous-contact__bubble-close", type: "button", onClick: hideBubbleUntilRefresh, "aria-label": "Hide Marites until refresh" }, icon("x", 10)),
    ),
  );
}

export const AnonymousContactBubble = PalengkeMaritesBubble;
export const MaritesBubble = PalengkeMaritesBubble;
