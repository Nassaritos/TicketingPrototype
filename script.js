/* =========================================================
   GEM Ticketing Prototype — Single script.js (EN + AR)
   - Arabic-only UI text/labels/messages (no impact on English)
   - Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) display on Arabic page
   - AM/PM -> صباحًا / مساءً on Arabic page
   - EGP -> جنيه on Arabic page
   - FIX: counters not working on Arabic page (parseInt on Arabic digits)
   ========================================================= */

const IS_AR = (document.documentElement.lang || "").toLowerCase() === "ar";

// ---------- AR DIGITS HELPERS ----------
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EN_DIGITS = "0123456789";

function toArabicDigits(input) {
  return String(input).replace(/\d/g, (d) => AR_DIGITS[d]);
}

// Convert Arabic-Indic digits back to English digits (for parseInt/Number)
function fromArabicDigits(input) {
  const s = String(input);
  let out = "";
  for (const ch of s) {
    const idx = AR_DIGITS.indexOf(ch);
    out += idx >= 0 ? EN_DIGITS[idx] : ch;
  }
  return out;
}

function parseIntSafe(text) {
  const t = fromArabicDigits(text || "").trim();
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : 0;
}

// ---------- AR MONTH/DAY LABELS (calendar label only) ----------
const AR_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
];
const AR_WEEKDAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

// ---------- I18N STRINGS ----------
const I18N = {
  soldOut: IS_AR ? "نفدت التذاكر" : "Sold out",
  selectDate: IS_AR ? "اختر تاريخًا" : "Select a Date",
  dateSoldOut: IS_AR ? "هذا التاريخ ممتلئ. يُرجى اختيار تاريخ آخر." : "This date is sold out. Please select another date.",
  slotSoldOut: IS_AR ? "هذه الفترة ممتلئة. يُرجى اختيار فترة أخرى." : "This time slot is sold out. Please choose another slot.",
  groupSoldOut: IS_AR ? "إحدى الفئات المختارة ممتلئة في هذا التاريخ." : "One or more selected ticket categories are sold out for this date.",
  typeSoldOut: IS_AR ? "أحد أنواع التذاكر المختارة ممتلئ في هذا التاريخ." : "One or more selected ticket types are sold out for this date.",
  badgeEmpty: IS_AR ? "لا توجد تذاكر بعد" : "No tickets yet",
  badgeSelected: (n) =>
    IS_AR ? `تم اختيار ${toArabicDigits(n)} تذكرة` : `${n} ticket${n > 1 ? "s" : ""} selected`,
  prototypeNote: IS_AR
    ? "هذه واجهة تجريبية. الأسعار والتفاصيل المعروضة لغرض التوضيح فقط."
    : "This is a prototype interface. Prices and details shown here are illustrative only.",
  timeLabelEntry: IS_AR ? "الفترة الزمنية للدخول" : "Entry Time",
  timeLabelTour: IS_AR ? "موعد الجولة الإرشادية" : "Tour time",
  timeTitleEntry: IS_AR ? "الفترة الزمنية للدخول" : "Entry Time Slot",
  timeTitleTour: IS_AR ? "موعد الجولة الإرشادية" : "Guided Tour Time",
  seeMore: IS_AR ? "عرض المزيد من المعلومات" : "See more information",
  hideInfo: IS_AR ? "إخفاء المعلومات" : "Hide information",
  maxTicketsMsg: (n) => (IS_AR ? toArabicDigits(n) : String(n)),
};
// ---------- LABEL MAPS (Arabic page only) ----------
const LABELS_AR = {
  groups: {
    Egyptians: "مصريون",
    Arabs: "عرب",
    Expatriates: "مقيمون",
  },
  types: {
    Adult: "بالغ",
    Child: "طفل",
    Student: "طالب",
    Senior: "كبار السن",
    Admission: "دخول",
  },
};

function labelGroup(groupKey) {
  if (!IS_AR) return groupKey;
  return LABELS_AR.groups[groupKey] || groupKey;
}

function labelType(typeKey) {
  if (!IS_AR) return typeKey;
  return LABELS_AR.types[typeKey] || typeKey;
}

// ---------- TIME FORMAT HELPERS (Arabic page only) ----------
function ampmToArabic(s) {
  return s
    .replace(/\bAM\b/g, "صباحًا")
    .replace(/\bPM\b/g, "مساءً");
}

function toArabicTimeLabel(label) {
  // works for:
  // "08:30 AM - 11:00 AM"
  // "10:15 AM"
  if (!IS_AR) return label;
  const withDigits = toArabicDigits(label);
  return ampmToArabic(withDigits);
}

function formatCurrency(amount) {
  if (!IS_AR) return "EGP " + Number(amount || 0).toLocaleString("en-EG");
  // Arabic: "٢٠٠ جنيه"
  const n = Number(amount || 0);
  const formatted = n.toLocaleString("en-EG");
  return `${toArabicDigits(formatted)} جنيه`;
}

function formatISOToDisplayDate(iso) {
  if (!iso) return "—";
  if (!IS_AR) return iso;

  // iso: YYYY-MM-DD
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return iso;

  const dt = new Date(iso);
  dt.setHours(0, 0, 0, 0);

  // Example: الخميس، ٢٥ ديسمبر ٢٠٢٥
  const wd = AR_WEEKDAYS[dt.getDay()];
  return `${wd}، ${toArabicDigits(d)} ${AR_MONTHS[m - 1]} ${toArabicDigits(y)}`;
}

// ---------- TIME SLOTS ----------

// Entry slots for Admission Ticket
const ENTRY_SLOTS_DEFAULT = [
  "08:30 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "01:00 PM - 03:00 PM",
  "03:00 PM - 05:00 PM"
];

// Wed & Sat: extra evening slot
const ENTRY_SLOTS_EXTENDED = [...ENTRY_SLOTS_DEFAULT, "05:00 PM - 08:00 PM"];

// Guided tour *tour times* (NOT entry slots)
const GUIDED_SLOTS_AR = ["10:15 AM", "12:15 PM", "2:15 PM", "4:15 PM"];
const GUIDED_SLOTS_EN = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"];

const prices = {
  admission: {
    Egyptians: { Adult: 200, Child: 100, Student: 100, Senior: 100 },
    Arabs: { Adult: 1450, Child: 730, Student: 730 },
    Expatriates: { Adult: 730, Child: 370, Student: 370 }
  },
  guided: {
    Egyptians: { Adult: 350, Child: 175, Student: 175, Senior: 175 },
    Arabs: { Adult: 1950, Child: 980, Student: 980 },
    Expatriates: { Adult: 980, Child: 500, Student: 500 }
  },
  children: {
    Egyptians: { Admission: 150 },
    Arabs: { Admission: 750 },
    Expatriates: { Admission: 375 }
  }
};

const ADDONS = {
  "gem-discovery": { label: IS_AR ? "لعبة البحث في المتحف المصري الكبير" : "GEM Discovery Challenge", price: 125 },
  "audio-guide": { label: IS_AR ? "الدليل الصوتي" : "Audio guide", price: 200 },
  "mixed-reality": { label: IS_AR ? "تجربة الواقع المختلط" : "Mixed reality experience", price: 350 }
};

// ---------- STATE ----------
const state = {
  tourLanguage: null,
  experience: "galleries",
  ticketType: "admission",
  date: null,
  time: null,

  tickets: {
    Egyptians: { Adult: 0, Child: 0, Student: 0, Senior: 0 },
    Arabs: { Adult: 0, Child: 0, Student: 0 },
    Expatriates: { Adult: 0, Child: 0, Student: 0 }
  },

  cmTickets: { Egyptians: 0, Arabs: 0, Expatriates: 0 },
  addons: { "gem-discovery": 0, "audio-guide": 0, "mixed-reality": 0 },
  promo: { code: null, percent: 0 },

  contact: { name: "", email: "", phone: "", country: "" },
  termsAccepted: false
};

const stepPanels = { 1: "step-2", 2: "step-addons", 3: "step-3", 4: "step-4" };

const goStep3Btn = document.getElementById("go-step-3");
const backTo1Btn = document.getElementById("back-to-1");
const backTo3Btn = document.getElementById("back-to-3");
const backTo2Btn = document.getElementById("back-to-2");

// Track a ticket type waiting for confirmation
let pendingTicketType = null;

// Modal elements
const ticketTypeModal = document.getElementById("ticket-type-modal");
const ticketTypeConfirmBtn = document.getElementById("ticket-type-confirm");
const ticketTypeCancelBtn = document.getElementById("ticket-type-cancel");
const ticketTypeCancelX = document.getElementById("ticket-type-cancel-x");

// =============================
// MAX TICKETS MODAL + HARD CAP
// =============================
const MAX_BASE_TICKETS = 30;

const maxTicketsModal = document.getElementById("max-tickets-modal");
const maxTicketsCancelX = document.getElementById("max-tickets-cancel-x");
const maxTicketsLimitText = document.getElementById("max-tickets-limit-text");

function openMaxTicketsModal() {
  if (maxTicketsLimitText) maxTicketsLimitText.textContent = I18N.maxTicketsMsg(MAX_BASE_TICKETS);
  if (maxTicketsModal) maxTicketsModal.classList.remove("hidden");
}
function closeMaxTicketsModal() {
  if (maxTicketsModal) maxTicketsModal.classList.add("hidden");
}
if (maxTicketsCancelX) maxTicketsCancelX.addEventListener("click", closeMaxTicketsModal);

// click outside closes
if (maxTicketsModal) {
  maxTicketsModal.addEventListener("click", (e) => {
    if (e.target === maxTicketsModal) closeMaxTicketsModal();
  });
}

// ---- bind counters ONCE (prevents "bulk increment") ----
function bindTicketCounterButtonsOnce_() {
  // INC
  document.querySelectorAll(".counter[data-group][data-type] .btn-inc").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const counter = btn.closest(".counter");
      if (!counter) return;

      const group = counter.dataset.group;
      const type = counter.dataset.type;

      // sold-out protection
      if (isCategorySoldOut(state.date, group) || isTicketTypeSoldOut(state.date, group, type)) {
        showSoldOut(IS_AR ? "هذا النوع ممتلئ في هذا التاريخ. اختر نوعًا/تاريخًا آخر." : `${group} – ${type} is sold out for this date. Please choose another type/date.`);
        return;
      }

      // HARD CAP (base tickets only)
      const currentTotal = getBaseTicketCount();
      if (currentTotal >= MAX_BASE_TICKETS) {
        openMaxTicketsModal();
        return;
      }

      const span = counter.querySelector(".count");
      const current = parseIntSafe(span?.textContent || "0");

      // extra safety (never cross max)
      if (currentTotal + 1 > MAX_BASE_TICKETS) {
        openMaxTicketsModal();
        return;
      }

      if (span) span.textContent = IS_AR ? toArabicDigits(current + 1) : String(current + 1);

      syncCountersFromDOM();
      updateCart();
    });
  });

  // DEC
  document.querySelectorAll(".counter[data-group][data-type] .btn-dec").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const counter = btn.closest(".counter");
      if (!counter) return;

      const span = counter.querySelector(".count");
      const current = parseIntSafe(span?.textContent || "0");
      const next = Math.max(0, current - 1);

      if (span) span.textContent = IS_AR ? toArabicDigits(next) : String(next);

      syncCountersFromDOM();
      updateCart();
    });
  });
}

// ---------- SOLD OUT (prototype) ----------
const SOLD_OUT = {
  dates: new Set(["2025-12-28"]),
  entrySlotsByDate: {},
  guidedSlotsByDate: {},
  categoriesByDate: {
    "2025-12-29": {
      admission: new Set([{ group: "Egyptians", type: "Child" }]),
    },
    "2025-12-30": {
      admission: { groupAll: new Set(["Egyptians"]) }
    }
  }
};

function showSoldOut(msg) {
  const el = document.getElementById("soldout-alert");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}
function clearSoldOut() {
  const el = document.getElementById("soldout-alert");
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}
function isDateSoldOut(dateStr) {
  return !!dateStr && SOLD_OUT.dates.has(dateStr);
}
function currentCategorySoldOutSet(dateStr) {
  if (!dateStr) return null;
  const m = SOLD_OUT.categoriesByDate[dateStr];
  if (!m) return null;

  const key =
    state.ticketType === "guided"
      ? (state.tourLanguage === "ar" ? "guided_ar" : state.tourLanguage === "en" ? "guided_en" : null)
      : "admission";

  return key ? (m[key] || null) : null;
}

function isCategorySoldOut(dateStr, groupName) {
  const pack = currentCategorySoldOutSet(dateStr);
  if (!pack) return false;

  if (pack instanceof Set) {
    for (const item of pack) if (typeof item === "string" && item === groupName) return true;
    return false;
  }

  if (pack.groupAll && pack.groupAll.has(groupName)) return true;
  return false;
}

function isTicketTypeSoldOut(dateStr, groupName, typeName) {
  const pack = currentCategorySoldOutSet(dateStr);
  if (!pack) return false;

  if (pack instanceof Set) {
    for (const item of pack) {
      if (item && typeof item === "object" && item.group === groupName && item.type === typeName) return true;
    }
    return false;
  }

  if (pack.groupAll && pack.groupAll.has(groupName)) return true;
  if (!pack.items) return false;

  for (const item of pack.items) {
    if (item && item.group === groupName && item.type === typeName) return true;
  }
  return false;
}

function isSlotSoldOut(dateStr, slotLabel) {
  if (!dateStr || !slotLabel) return false;

  if (state.ticketType === "guided") {
    const obj = SOLD_OUT.guidedSlotsByDate[dateStr];
    if (!obj) return false;
    const lang = state.tourLanguage;
    if (!lang || !obj[lang]) return false;
    return obj[lang].has(slotLabel);
  }

  const set = SOLD_OUT.entrySlotsByDate[dateStr];
  return !!(set && set.has(slotLabel));
}

// true if all possible slots for current mode are sold out on that date
function isFullDaySoldOut(dateStr) {
  if (!dateStr) return false;
  if (isDateSoldOut(dateStr)) return true;

  const slots = (function () {
    if (state.ticketType === "guided") {
      if (state.tourLanguage === "ar") return GUIDED_SLOTS_AR;
      if (state.tourLanguage === "en") return GUIDED_SLOTS_EN;
      return [];
    }
    return isExtendedDay(dateStr) ? ENTRY_SLOTS_EXTENDED : ENTRY_SLOTS_DEFAULT;
  })();

  if (!slots.length) return false;

  return slots.every((s) => {
    if (state.ticketType === "guided") {
      const obj = SOLD_OUT.guidedSlotsByDate[dateStr];
      if (!obj) return false;
      const lang = state.tourLanguage;
      if (!lang || !obj[lang]) return false;
      return obj[lang].has(s);
    } else {
      const set = SOLD_OUT.entrySlotsByDate[dateStr];
      return !!(set && set.has(s));
    }
  });
}

// ---------- MODAL HELPERS ----------
function setTicketTypeRadio(value) {
  document.querySelectorAll('input[name="ticketType"]').forEach((r) => {
    const isThis = r.value === value;
    r.checked = isThis;
    const pill = r.closest(".radio-pill");
    if (pill) pill.classList.toggle("is-active", isThis);
  });
}
function openTicketTypeModal() {
  if (ticketTypeModal) ticketTypeModal.classList.remove("hidden");
}
function closeTicketTypeModal() {
  if (ticketTypeModal) ticketTypeModal.classList.add("hidden");
  pendingTicketType = null;
}

// ---------- HELPERS ----------
function isExtendedDay(isoDate) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const day = d.getDay(); // 0=Sun ... 3=Wed ... 6=Sat
  return day === 3 || day === 6;
}

function getCurrentSlotList() {
  if (state.ticketType === "guided") {
    if (state.tourLanguage === "ar") return GUIDED_SLOTS_AR;
    if (state.tourLanguage === "en") return GUIDED_SLOTS_EN;
    return [];
  }
  return isExtendedDay(state.date) ? ENTRY_SLOTS_EXTENDED : ENTRY_SLOTS_DEFAULT;
}

function renderTimeSlots() {
  const container = document.getElementById("time-slot-group");
  if (!container) return;

  clearSoldOut();

  if (isDateSoldOut(state.date)) {
    container.innerHTML = "";
    container.classList.add("hidden");
    state.time = null;
    showSoldOut(I18N.dateSoldOut);
    updateCart();
    return;
  }

  const slots = getCurrentSlotList();
  container.innerHTML = "";
  state.time = null;

  if (!slots.length) {
    container.classList.add("hidden");
    updateCart();
    return;
  }

  container.classList.remove("hidden");

  slots.forEach((labelRaw) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time-slot";
    btn.dataset.time = labelRaw;

    // Display label
    btn.textContent = toArabicTimeLabel(labelRaw);

    const sold = isSlotSoldOut(state.date, labelRaw);
    if (sold) {
      btn.classList.add("is-soldout");
      btn.disabled = true;
      btn.title = I18N.soldOut;
      btn.setAttribute("aria-label", `${btn.textContent} ${I18N.soldOut}`);
    }

    btn.addEventListener("click", () => {
      if (btn.disabled) {
        showSoldOut(I18N.slotSoldOut);
        return;
      }
      document.querySelectorAll(".time-slot").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      state.time = labelRaw; // keep raw for logic
      clearSoldOut();
      updateCart();
    });

    container.appendChild(btn);
  });
}

function updateCartTimeLabel() {
  const isGuided = state.ticketType === "guided";
  const labelText = isGuided ? I18N.timeLabelTour : I18N.timeLabelEntry;

  const desktopLabel = document.getElementById("cart-time-label");
  if (desktopLabel) desktopLabel.textContent = labelText;

  const mobileLabel = document.getElementById("mobile-cart-time-label");
  if (mobileLabel) mobileLabel.textContent = labelText;
}

function updateTimeSlotTitleAndVisibility() {
  const titleEl = document.getElementById("time-slot-title");
  const wrapperEl = document.getElementById("time-slot-wrapper");
  if (!titleEl || !wrapperEl) return;

  if (state.ticketType === "guided") {
    titleEl.textContent = I18N.timeTitleTour;
    if (!state.tourLanguage) wrapperEl.classList.add("hidden");
    else wrapperEl.classList.remove("hidden");
  } else {
    titleEl.textContent = I18N.timeTitleEntry;
    wrapperEl.classList.remove("hidden");
  }
}

function updateCategoryAvailabilityUI() {
  document.querySelectorAll(".category-tab").forEach((tab) => {
    const group = tab.dataset.groupTab;
    const sold = isCategorySoldOut(state.date, group);

    tab.classList.toggle("is-soldout", sold);
    tab.disabled = false;

    if (sold && tab.classList.contains("is-active")) {
      const firstOk = Array.from(document.querySelectorAll(".category-tab")).find((t) => !t.disabled);
      if (firstOk) firstOk.click();
    }
  });
}

function showBookingSection() {
  const section = document.getElementById("booking-section");
  if (section) section.classList.remove("booking-hidden");
}

function experienceLabel(key) {
  if (!IS_AR) return key === "children" ? "Children’s Museum" : "GEM Galleries";
  return key === "children" ? "متحف الطفل" : "قاعات المتحف";
}

function updateStepPills(activeStep) {
  document.querySelectorAll("[data-step-pill]").forEach((p) => {
    p.classList.toggle("is-active", Number(p.dataset.stepPill) === activeStep);
  });
}

function showStep(step) {
  Object.entries(stepPanels).forEach(([num, id]) => {
    const panel = document.getElementById(id);
    if (panel) panel.classList.toggle("hidden", Number(num) !== step);
  });
  updateStepPills(step);
}

// ---------- TICKETS & TOTALS ----------
function refreshTicketPrices() {
  let priceTable;
  if (state.experience === "children") priceTable = prices.children;
  else priceTable = prices[state.ticketType] || prices.admission;

  document.querySelectorAll(".ticket-price").forEach((el) => {
    const group = el.dataset.group;
    const type = el.dataset.type;

    if (!priceTable || !group || !type) {
      el.textContent = "—";
      return;
    }

    const groupPrices = priceTable[group];
    const value = groupPrices ? groupPrices[type] : null;
    el.textContent = value == null ? "—" : formatCurrency(value);
  });
}

function initTicketState() {
  if (state.experience === "children") {
    state.tickets = {
      Egyptians: { Admission: 0 },
      Arabs: { Admission: 0 },
      Expatriates: { Admission: 0 }
    };
    state.ticketType = "admission";
  } else {
    state.tickets = {
      Egyptians: { Adult: 0, Child: 0, Student: 0, Senior: 0 },
      Arabs: { Adult: 0, Child: 0, Student: 0 },
      Expatriates: { Adult: 0, Child: 0, Student: 0 }
    };
  }
}

function resetTicketCountersUI() {
  document.querySelectorAll(".counter[data-group]").forEach((counter) => {
    const span = counter.querySelector(".count");
    if (span) span.textContent = IS_AR ? "٠" : "0";
  });
}

function updateTicketUIForExperience() {
  const galleriesEl = document.getElementById("ticket-categories-galleries");
  const childrenEl = document.getElementById("ticket-categories-children");
  if (state.experience === "children") {
    if (galleriesEl) galleriesEl.classList.add("hidden");
    if (childrenEl) childrenEl.classList.remove("hidden");
  } else {
    if (galleriesEl) galleriesEl.classList.remove("hidden");
    if (childrenEl) childrenEl.classList.add("hidden");
  }
  resetTicketCountersUI();
  initTicketState();
  syncCountersFromDOM();
}

function computeTotals() {
  syncCMTicketsFromDOM();

  let ticketTotal = 0;
  let addonTotal = 0;
  let count = 0;

  let priceTable;
  if (state.experience === "children") priceTable = prices.children;
  else priceTable = prices[state.ticketType === "guided" ? "guided" : "admission"];

  if (priceTable && state.tickets) {
    for (const [group, groupTickets] of Object.entries(state.tickets)) {
      const groupPrices = priceTable[group];
      if (!groupPrices) continue;

      for (const [type, qty] of Object.entries(groupTickets)) {
        if (!qty) continue;
        const unit = groupPrices[type];
        if (unit == null) continue;

        ticketTotal += qty * unit;
        count += qty;
      }
    }
  }

  // Children’s Museum (add-on)
  if (state.cmTickets) {
    for (const [group, qty] of Object.entries(state.cmTickets)) {
      if (!qty) continue;
      const gp = prices.children[group];
      if (!gp) continue;
      const unit = gp.Admission;
      if (unit == null) continue;

      addonTotal += qty * unit;
    }
  }

  // Other add-ons
  if (state.addons) {
    for (const [id, qty] of Object.entries(state.addons)) {
      if (!qty) continue;
      const def = ADDONS[id];
      if (!def) continue;
      addonTotal += qty * def.price;
    }
  }

  return { ticketTotal, addonTotal, total: ticketTotal + addonTotal, count };
}

function hasAnyAddonsSelected() {
  let any = false;

  document.querySelectorAll(".cm-counter .count").forEach((el) => {
    const v = parseIntSafe(el.textContent);
    if (v > 0) any = true;
  });

  document.querySelectorAll(".addon-counter .count").forEach((el) => {
    const v = parseIntSafe(el.textContent);
    if (v > 0) any = true;
  });

  return any;
}

function getSelectedAddonsSummaryLines() {
  const lines = [];

  // Children's Museum tickets
  document.querySelectorAll(".cm-counter").forEach((counter) => {
    const qtyEl = counter.querySelector(".count");
    if (!qtyEl) return;
    const qty = parseIntSafe(qtyEl.textContent);
    if (!qty) return;

    const group = counter.getAttribute("data-cm-group") || "";
    let label = IS_AR ? "متحف الطفل" : "Children’s Museum";
    if (group) label += IS_AR ? ` – ${group}` : ` – ${group}`;

    lines.push(`${label} × ${IS_AR ? toArabicDigits(qty) : qty}`);
  });

  // Other add-ons
  document.querySelectorAll(".addon-counter").forEach((counter) => {
    const qtyEl = counter.querySelector(".count");
    if (!qtyEl) return;
    const qty = parseIntSafe(qtyEl.textContent);
    if (!qty) return;

    const addonKey = counter.getAttribute("data-addon");
    const def = ADDONS[addonKey] || { label: addonKey || (IS_AR ? "إضافة" : "Add-on") };

    lines.push(`${def.label} × ${IS_AR ? toArabicDigits(qty) : qty}`);
  });

  return lines;
}

// Count ONLY main tickets, not add-ons
function getBaseTicketCount() {
  let total = 0;
  document.querySelectorAll(".counter[data-group]").forEach((counter) => {
    const span = counter.querySelector(".count");
    if (!span) return;
    total += parseIntSafe(span.textContent);
  });
  return total;
}

function getTicketBreakdownText() {
  if (!state.tickets) return "";
  const groupParts = [];

  for (const [group, types] of Object.entries(state.tickets)) {
    const typeParts = [];
    for (const [type, qty] of Object.entries(types)) {
      const n = qty || 0;
      if (!n) continue;

      const gLabel = labelGroup(group);
      const tLabel = labelType(type);

      typeParts.push(IS_AR ? `${tLabel} ${toArabicDigits(n)}` : `${tLabel} ${n}`);
      // group label applied below
    }

    if (typeParts.length) {
      const gLabel = labelGroup(group);
      groupParts.push(IS_AR ? `${gLabel}: ${typeParts.join("، ")}` : `${gLabel}: ${typeParts.join(", ")}`);
    }
  }

  return groupParts.join("\n");
}


function updateCart() {
  const { addonTotal, total } = computeTotals();
  const baseTickets = getBaseTicketCount();

  // Date & Time
  const cartDate = document.getElementById("cart-date");
  const cartTime = document.getElementById("cart-time");

  const displayDate = state.date ? formatISOToDisplayDate(state.date) : "—";
  const displayTime = state.time ? toArabicTimeLabel(state.time) : "—";

  if (cartDate) cartDate.textContent = state.date ? displayDate : "—";
  if (cartTime) cartTime.textContent = state.time ? displayTime : "—";

  const mobileCartDate = document.getElementById("mobile-cart-date");
  const mobileCartTime = document.getElementById("mobile-cart-time");
  if (mobileCartDate) mobileCartDate.textContent = state.date ? displayDate : "—";
  if (mobileCartTime) mobileCartTime.textContent = state.time ? displayTime : "—";

  // Tickets breakdown
  const breakdownText = getTicketBreakdownText();
  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = breakdownText || (IS_AR ? toArabicDigits(baseTickets) : baseTickets);

  const mobileCount = document.getElementById("mobile-cart-count");
  if (mobileCount) mobileCount.textContent = breakdownText || (IS_AR ? toArabicDigits(baseTickets) : baseTickets);

  updateCartTimeLabel();

  // Total (includes add-ons)
  const cartTotal = document.getElementById("cart-total");
  if (cartTotal) cartTotal.textContent = formatCurrency(total);

  const mobileTotal = document.getElementById("mobile-cart-total");
  if (mobileTotal) mobileTotal.textContent = formatCurrency(total);

  // Badge (base tickets only)
  const badge = document.getElementById("cart-badge");
  if (badge) badge.textContent = baseTickets === 0 ? I18N.badgeEmpty : I18N.badgeSelected(baseTickets);

  // SOLD OUT validation gates
  const dateSold = isDateSoldOut(state.date);
  const slotSold = isSlotSoldOut(state.date, state.time);

  let categoryConflict = false;
  if (state.date) {
    for (const group of Object.keys(state.tickets || {})) {
      if (!isCategorySoldOut(state.date, group)) continue;
      const types = state.tickets[group] || {};
      const hasQty = Object.values(types).some((v) => (v || 0) > 0);
      if (hasQty) {
        categoryConflict = true;
        break;
      }
    }
  }

  let typeConflict = false;
  if (!categoryConflict && state.date) {
    for (const [group, types] of Object.entries(state.tickets || {})) {
      for (const [type, qty] of Object.entries(types || {})) {
        if ((qty || 0) <= 0) continue;
        if (isTicketTypeSoldOut(state.date, group, type)) {
          typeConflict = true;
          break;
        }
      }
      if (typeConflict) break;
    }
  }

  // Enable / disable continue
  const go = goStep3Btn;
  if (go) {
    go.disabled =
      !(baseTickets > 0 && state.date && state.time) ||
      dateSold ||
      slotSold ||
      categoryConflict ||
      typeConflict;
  }

  if (dateSold) showSoldOut(I18N.dateSoldOut);
  else if (slotSold) showSoldOut(I18N.slotSoldOut);
  else if (categoryConflict) showSoldOut(I18N.groupSoldOut);
  else if (typeConflict) showSoldOut(I18N.typeSoldOut);
  else clearSoldOut();

  // Add-ons row
  const cartAddonRow = document.getElementById("cart-addon-row");
  const cartAddonAmount = document.getElementById("cart-addon-amount");
  const cartAddonSummary = document.getElementById("cart-addon-summary");

  const mobileAddonContain = document.getElementById("mobile-cart-addons");
  const mobileAddonAmount = document.getElementById("mobile-cart-addon-amount");
  const mobileAddonSummary = document.getElementById("mobile-cart-addon-summary");

  const addonLines = getSelectedAddonsSummaryLines();
  const hasAddons = addonLines.length > 0;
  const summaryText = addonLines.join("\n");

  if (hasAddons) {
    if (cartAddonRow) cartAddonRow.classList.remove("hidden");
    if (cartAddonAmount) cartAddonAmount.textContent = formatCurrency(addonTotal);
    if (cartAddonSummary) cartAddonSummary.textContent = summaryText;

    if (mobileAddonContain) mobileAddonContain.classList.remove("hidden");
    if (mobileAddonAmount) mobileAddonAmount.textContent = formatCurrency(addonTotal);
    if (mobileAddonSummary) mobileAddonSummary.textContent = summaryText;
  } else {
    if (cartAddonRow) cartAddonRow.classList.add("hidden");
    if (cartAddonAmount) cartAddonAmount.textContent = formatCurrency(0);
    if (cartAddonSummary) cartAddonSummary.textContent = "";

    if (mobileAddonContain) mobileAddonContain.classList.add("hidden");
    if (mobileAddonAmount) mobileAddonAmount.textContent = formatCurrency(0);
    if (mobileAddonSummary) mobileAddonSummary.textContent = "";
  }

  // Step 2 (add-ons step) enable/disable "Add to booking"
  const addonsNextBtn = document.getElementById("addons-next");
  if (addonsNextBtn) addonsNextBtn.disabled = !hasAnyAddonsSelected();
}

// ---------- SYNC ----------
function syncCountersFromDOM() {
  document.querySelectorAll(".counter[data-group]").forEach((counter) => {
    const group = counter.dataset.group;
    const type = counter.dataset.type;
    const value = parseIntSafe(counter.querySelector(".count")?.textContent || "0");
    if (state.tickets[group] && state.tickets[group][type] != null) {
      state.tickets[group][type] = value;
    }
  });
}

function syncCMTicketsFromDOM() {
  document.querySelectorAll(".cm-counter").forEach((counter) => {
    const group = counter.dataset.cmGroup;
    const value = parseIntSafe(counter.querySelector(".count")?.textContent || "0");
    if (state.cmTickets[group] != null) state.cmTickets[group] = value;
  });
}

// ---------- STEP 2 SUBTITLE ----------
function updateStep2Subtitle() {
  const el = document.getElementById("step-2-subtitle");
  if (!el) return;
  if (!state.experience) el.textContent = "";
}

// ---------- HERO / NAV ----------
function scrollToBooking() {
  const section = document.getElementById("booking-section");
  if (section) section.scrollIntoView({ behavior: "smooth" });
}

function setExperience(value) {
  state.experience = value;
  updateTicketUIForExperience();
  updateStep2Subtitle();
  refreshTicketPrices();
  updateCart();
}

const navBookBtn = document.getElementById("nav-book-btn");
if (navBookBtn) {
  navBookBtn.addEventListener("click", () => {
    const experiencesSection = document.querySelector(".experiences-home");
    if (experiencesSection) experiencesSection.scrollIntoView({ behavior: "smooth" });
  });
}

const heroGalleriesBtn = document.getElementById("hero-book-galleries");
document.querySelectorAll("[data-book]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const exp = btn.dataset.book;
    setExperience(exp);
    showBookingSection();
    showStep(1);
    scrollToBooking();
  });
});

// ---------- TICKET TYPE / LANGUAGE / TIME ----------
const tourLangGroup = document.getElementById("tour-language-group");

function applySoldOutToTicketRows() {
  const dateStr = state.date;

  document.querySelectorAll(".counter[data-group][data-type]").forEach((counter) => {
    const group = counter.dataset.group;
    const type = counter.dataset.type;

    const soldOut =
      isCategorySoldOut(dateStr, group) ||
      isTicketTypeSoldOut(dateStr, group, type);

    counter.classList.toggle("is-soldout", soldOut);

    if (soldOut) {
      counter.title = I18N.soldOut;
      counter.setAttribute("aria-label", `${group} ${type} ${I18N.soldOut}`);
    } else {
      counter.removeAttribute("title");
      counter.removeAttribute("aria-label");
    }

    const inc = counter.querySelector(".btn-inc");
    const dec = counter.querySelector(".btn-dec");

    if (inc) inc.disabled = soldOut;
    if (dec) dec.disabled = soldOut;
  });
}

function applyTicketTypeChange(newType) {
  clearSoldOut();

  state.ticketType = newType;

  state.tourLanguage = null;
  state.date = null;
  state.time = null;

  initTicketState();
  resetTicketCountersUI();

  state.cmTickets = { Egyptians: 0, Arabs: 0, Expatriates: 0 };
  document.querySelectorAll(".cm-counter .count").forEach((el) => (el.textContent = IS_AR ? "٠" : "0"));

  state.addons = { "gem-discovery": 0, "audio-guide": 0, "mixed-reality": 0 };
  document.querySelectorAll(".addon-counter .count").forEach((el) => (el.textContent = IS_AR ? "٠" : "0"));

  document.querySelectorAll('input[name="tourLanguage"]').forEach((i) => (i.checked = false));
  document.querySelectorAll(".time-slot").forEach((b) => b.classList.remove("is-selected"));

  if (typeof window.resetVisitCalendar === "function") window.resetVisitCalendar();

  if (state.experience === "children") {
    state.ticketType = "admission";
    if (tourLangGroup) tourLangGroup.classList.add("hidden");
  } else if (state.ticketType === "guided") {
    if (tourLangGroup) tourLangGroup.classList.remove("hidden");
  } else {
    if (tourLangGroup) tourLangGroup.classList.add("hidden");
  }

  updateTimeSlotTitleAndVisibility();

  syncCountersFromDOM();
  syncCMTicketsFromDOM();
  renderTimeSlots();
  refreshTicketPrices();
  updateCategoryAvailabilityUI();
  applySoldOutToTicketRows();
  updateCart();

  setTicketTypeRadio(state.ticketType);
  showStep(1);
}

document.querySelectorAll('input[name="ticketType"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;

    const newType = radio.value;
    if (newType === state.ticketType) return;

    pendingTicketType = newType;

    // visually revert until confirm
    setTicketTypeRadio(state.ticketType);
    openTicketTypeModal();
  });
});

if (ticketTypeConfirmBtn) {
  ticketTypeConfirmBtn.addEventListener("click", () => {
    if (!pendingTicketType) {
      closeTicketTypeModal();
      return;
    }
    const newType = pendingTicketType;
    closeTicketTypeModal();
    applyTicketTypeChange(newType);
  });
}

[ticketTypeCancelBtn, ticketTypeCancelX].filter(Boolean).forEach((btn) => {
  btn.addEventListener("click", () => {
    setTicketTypeRadio(state.ticketType);
    closeTicketTypeModal();
  });
});

document.querySelectorAll('input[name="tourLanguage"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    state.tourLanguage = radio.value;

    updateTimeSlotTitleAndVisibility();
    renderTimeSlots();
    updateCategoryAvailabilityUI();
    applySoldOutToTicketRows();
    updateCart();

    if (typeof window.reRenderVisitCalendar === "function") window.reRenderVisitCalendar();
  });
});

// ---------- DATE ----------
const visitDateInput = document.getElementById("visit-date");
if (visitDateInput) {
  visitDateInput.addEventListener("change", (e) => {
    const nextDate = e.target.value || null;

    if (nextDate && isDateSoldOut(nextDate)) {
      state.date = null;
      state.time = null;
      showSoldOut(I18N.dateSoldOut);
      renderTimeSlots();
      updateCategoryAvailabilityUI();
      applySoldOutToTicketRows();
      updateCart();
      return;
    }

    state.date = nextDate;
    state.time = null;

    renderTimeSlots();
    updateCategoryAvailabilityUI();
    applySoldOutToTicketRows();
    updateCart();
  });
}

// ---------- CATEGORY TABS ----------
document.querySelectorAll(".category-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.disabled) {
      showSoldOut(IS_AR ? "هذه الفئة ممتلئة في التاريخ المختار." : "This ticket category is sold out for the selected date.");
      return;
    }
    const group = tab.dataset.groupTab;
    document.querySelectorAll(".category-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
    document.querySelectorAll(".category-panel").forEach((panel) =>
      panel.classList.toggle("is-active", panel.dataset.groupPanel === group)
    );
    clearSoldOut();
  });
});

// ---------- CHILDREN'S MUSEUM COUNTERS (ADD-ON) ----------
document.querySelectorAll(".cm-counter .btn-inc").forEach((btn) => {
  btn.addEventListener("click", () => {
    const counter = btn.closest(".cm-counter");
    const span = counter.querySelector(".count");
    let value = parseIntSafe(span.textContent);
    value += 1;
    span.textContent = IS_AR ? toArabicDigits(value) : String(value);
    syncCMTicketsFromDOM();
    updateCart();
  });
});

document.querySelectorAll(".cm-counter .btn-dec").forEach((btn) => {
  btn.addEventListener("click", () => {
    const counter = btn.closest(".cm-counter");
    const span = counter.querySelector(".count");
    let value = parseIntSafe(span.textContent);
    value = Math.max(0, value - 1);
    span.textContent = IS_AR ? toArabicDigits(value) : String(value);
    syncCMTicketsFromDOM();
    updateCart();
  });
});

// ---------- OTHER ADD-ON COUNTERS ----------
document.querySelectorAll(".addon-counter").forEach((wrapper) => {
  const addonId = wrapper.dataset.addon;
  const inc = wrapper.querySelector(".btn-inc");
  const dec = wrapper.querySelector(".btn-dec");
  const span = wrapper.querySelector(".count");
  if (!addonId || !span) return;

  function setAddon(value) {
    const safe = Math.max(0, value | 0);
    span.textContent = IS_AR ? toArabicDigits(safe) : String(safe);
    state.addons[addonId] = safe;
    updateCart();
  }

  if (inc) {
    inc.addEventListener("click", () => {
      const value = parseIntSafe(span.textContent);
      setAddon(value + 1);
    });
  }
  if (dec) {
    dec.addEventListener("click", () => {
      const value = parseIntSafe(span.textContent);
      setAddon(value - 1);
    });
  }
});

// ---------- STEP NAVIGATION ----------
if (goStep3Btn) {
  goStep3Btn.addEventListener("click", () => {
    if (goStep3Btn.disabled) return;
    showStep(2);
    const panel = document.getElementById(stepPanels[2]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}

const addonsBackBtn = document.getElementById("addons-back");
const addonsNextBtn = document.getElementById("addons-next");

if (addonsBackBtn) {
  addonsBackBtn.addEventListener("click", () => {
    showStep(1);
    const panel = document.getElementById(stepPanels[1]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}
if (addonsNextBtn) {
  addonsNextBtn.addEventListener("click", () => {
    showStep(3);
    const panel = document.getElementById(stepPanels[3]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}

if (backTo1Btn) {
  backTo1Btn.addEventListener("click", () => {
    showStep(1);
    const panel = document.getElementById(stepPanels[1]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}
if (backTo3Btn) {
  backTo3Btn.addEventListener("click", () => {
    showStep(3);
    const panel = document.getElementById(stepPanels[3]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}
if (backTo2Btn) {
  backTo2Btn.addEventListener("click", () => {
    showStep(2);
    const panel = document.getElementById(stepPanels[2]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}

// ---------- DISCOUNTS MODAL ----------
const discountsModal = document.getElementById("discounts-modal");
const openDiscountsBtn = document.getElementById("open-discounts");
if (discountsModal && openDiscountsBtn) {
  openDiscountsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    discountsModal.classList.remove("hidden");
  });
  document.querySelectorAll('[data-close="discounts"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      discountsModal.classList.add("hidden");
    });
  });
}

// ---------- CONTACT & TERMS ----------
function syncContactFromInputs() {
  const nameEl = document.getElementById("contact-name");
  const emailEl = document.getElementById("contact-email");
  const phoneEl = document.getElementById("contact-phone");
  const codeEl = document.getElementById("phone-country-code");
  const countryEl = document.getElementById("contact-country");

  state.contact.name = nameEl ? nameEl.value.trim() : "";
  state.contact.email = emailEl ? emailEl.value.trim() : "";

  const localPhone = phoneEl ? phoneEl.value.trim() : "";
  const dialCode = codeEl ? codeEl.value : "";

  state.contact.phone = dialCode && localPhone ? `${dialCode} ${localPhone}` : localPhone;
  state.contact.country = countryEl ? countryEl.value.trim() : "";
}

function validateContact() {
  syncContactFromInputs();
  let ok = true;

  const showError = (key, visible) => {
    const el = document.querySelector(`[data-error="${key}"]`);
    if (el) el.classList.toggle("hidden", !visible);
  };

  if (!state.contact.name) {
    ok = false;
    showError("name", true);
  } else showError("name", false);

  if (!state.contact.email || !state.contact.email.includes("@")) {
    ok = false;
    showError("email", true);
  } else showError("email", false);

  if (!state.contact.phone) {
    ok = false;
    showError("phone", true);
  } else showError("phone", false);

  return ok;
}

// ---------- TERMS MODAL ----------
const termsModal = document.getElementById("terms-modal");
const termsBody = document.getElementById("terms-body");
const termsAcceptBtn = document.getElementById("terms-accept");
const termsHint = document.getElementById("terms-hint");

// OTP SIMULATION
const CORRECT_OTP = "1234";

const otpModal = document.getElementById("otp-modal");
const otpDigits = otpModal ? Array.from(otpModal.querySelectorAll(".otp-digit")) : [];
const otpError = document.getElementById("otp-error");
const otpConfirm = document.getElementById("otp-confirm");
const otpCancel = document.getElementById("otp-cancel");
const otpClose = document.getElementById("otp-close");

function openTerms() {
  if (!termsModal || !termsBody || !termsAcceptBtn || !termsHint) return;
  termsAcceptBtn.disabled = true;
  termsHint.textContent = IS_AR
    ? "يرجى التمرير حتى نهاية النص لتفعيل زر «أوافق»."
    : "Please scroll to the end of this text to enable the “Accept” button.";
  termsModal.classList.remove("hidden");
  termsBody.scrollTop = 0;
}
if (termsBody && termsAcceptBtn && termsHint) {
  termsBody.addEventListener("scroll", () => {
    const nearBottom = termsBody.scrollTop + termsBody.clientHeight >= termsBody.scrollHeight - 10;
    if (nearBottom) {
      termsAcceptBtn.disabled = false;
      termsHint.textContent = IS_AR
        ? "يمكنك الآن الموافقة على الشروط والأحكام."
        : "You can now accept the Terms & Conditions.";
    }
  });
}
if (termsModal) {
  document.querySelectorAll('[data-close="terms"]').forEach((btn) => {
    btn.addEventListener("click", () => termsModal.classList.add("hidden"));
  });
}

function openOtpModal() {
  if (!otpModal) return;
  otpModal.classList.remove("hidden");
  if (otpError) otpError.classList.add("hidden");
  otpDigits.forEach((i) => {
    i.value = "";
    i.classList.remove("is-invalid");
  });
  if (otpDigits[0]) otpDigits[0].focus();
}
function closeOtpModal() {
  if (!otpModal) return;
  otpModal.classList.add("hidden");
}
function getOtpValue() {
  return otpDigits.map((i) => i.value.trim()).join("");
}
function handleOtpSubmit() {
  const val = getOtpValue();

  if (val.length < 4) {
    if (otpError) {
      otpError.textContent = IS_AR ? "يرجى إدخال الرمز المكوّن من ٤ أرقام." : "Please enter the 4-digit code.";
      otpError.classList.remove("hidden");
    }
    return;
  }
  if (val !== CORRECT_OTP) {
    if (otpError) {
      otpError.textContent = IS_AR ? "الرمز غير صحيح. حاول مرة أخرى." : "The code you entered is incorrect. Please try again.";
      otpError.classList.remove("hidden");
    }
    otpDigits.forEach((i) => i.classList.add("is-invalid"));
    return;
  }

  closeOtpModal();
  openTerms();
}

if (otpConfirm) otpConfirm.addEventListener("click", handleOtpSubmit);
if (otpCancel) otpCancel.addEventListener("click", closeOtpModal);
if (otpClose) otpClose.addEventListener("click", closeOtpModal);

otpDigits.forEach((input, idx) => {
  input.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
    if (e.target.value && idx < otpDigits.length - 1) otpDigits[idx + 1].focus();
    if (otpError) otpError.classList.add("hidden");
    input.classList.remove("is-invalid");
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !e.target.value && idx > 0) otpDigits[idx - 1].focus();
    else if (e.key === "Enter") handleOtpSubmit();
  });
});

const openTermsBtn = document.getElementById("open-terms");
const reopenTermsBtn = document.getElementById("reopen-terms");

if (openTermsBtn) {
  openTermsBtn.addEventListener("click", () => {
    if (!validateContact()) return;
    openOtpModal();
  });
}
if (reopenTermsBtn) {
  reopenTermsBtn.addEventListener("click", () => openTerms());
}

// ---------- SUMMARY / PAYMENT (Arabic-only labels) ----------
function buildSummary() {
  const basic = document.getElementById("summary-basic");
  const container = document.getElementById("summary-tickets");
  if (!basic || !container) return;

  basic.innerHTML = "";
  container.innerHTML = "";

  const { total, count } = computeTotals();

  let finalTotal = total;
  let discountAmount = 0;
  let promoLabel = "";

  if (state.promo && state.promo.percent > 0) {
    discountAmount = Math.round(total * (state.promo.percent / 100));
    finalTotal = total - discountAmount;
    promoLabel = `${state.promo.code} (${IS_AR ? toArabicDigits(state.promo.percent) : state.promo.percent}% ${IS_AR ? "خصم" : "off"})`;
  }

  const items = IS_AR
    ? [
        ["التجربة", experienceLabel(state.experience)],
        [
          "نوع التذكرة",
          state.experience === "children"
            ? "تذكرة دخول"
            : state.ticketType === "admission"
            ? "تذكرة دخول"
            : "تذكرة جولة إرشادية"
        ],
        ["التاريخ والوقت", (state.date ? formatISOToDisplayDate(state.date) : "-") + (state.time ? `، ${toArabicTimeLabel(state.time)}` : "")],
        ["عدد التذاكر", toArabicDigits(count.toString())],
        ["الزائر الرئيسي", state.contact.name || "-"],
        ["البريد الإلكتروني", state.contact.email || "-"],
        ["رقم الهاتف", state.contact.phone || "-"],
        ["الدولة", state.contact.country || "-"]
      ]
    : [
        ["Experience", experienceLabel(state.experience)],
        [
          "Ticket type",
          state.experience === "children"
            ? "Admission ticket"
            : state.ticketType === "admission"
            ? "Admission ticket"
            : "Guided tour ticket"
        ],
        ["Date & time", (state.date || "-") + (state.time ? `, ${state.time}` : "")],
        ["Number of tickets", count.toString()],
        ["Lead visitor", state.contact.name || "-"],
        ["Email", state.contact.email || "-"],
        ["Mobile", state.contact.phone || "-"],
        ["Country", state.contact.country || "-"]
      ];

  if (state.ticketType === "guided" && state.experience !== "children") {
    const langVal = state.tourLanguage === "ar"
      ? (IS_AR ? "جولة إرشادية بالعربية" : "Arabic guided tour")
      : state.tourLanguage === "en"
      ? (IS_AR ? "جولة إرشادية بالإنجليزية" : "English guided tour")
      : "-";

    items.splice(2, 0, [IS_AR ? "لغة الجولة" : "Tour language", langVal]);
  }

  items.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="label">${label}</span><span>${value}</span>`;
    basic.appendChild(li);
  });

  let priceTable = null;
  if (state.experience === "children") priceTable = prices.children;
  else priceTable = prices[state.ticketType === "guided" ? "guided" : "admission"];

  if (priceTable && state.tickets) {
    for (const [group, types] of Object.entries(state.tickets)) {
      const groupPrices = priceTable[group] || {};
      for (const [type, qty] of Object.entries(types)) {
        if (!qty) continue;
        const unit = groupPrices[type] || 0;
        const row = document.createElement("div");
        row.className = "summary-table-row";
row.innerHTML = `<span>${labelGroup(group)} – ${labelType(type)} × ${IS_AR ? toArabicDigits(qty) : qty}</span><span>${formatCurrency(unit * qty)}</span>`;
        container.appendChild(row);
      }
    }
  }

  if (state.cmTickets) {
    for (const [group, qty] of Object.entries(state.cmTickets)) {
      if (!qty) continue;
      const unit = prices.children[group].Admission;
      const row = document.createElement("div");
      row.className = "summary-table-row";
row.innerHTML = `<span>${IS_AR ? "متحف الطفل" : "Children's Museum"} – ${labelGroup(group)} × ${IS_AR ? toArabicDigits(qty) : qty}</span><span>${formatCurrency(unit * qty)}</span>`;
      container.appendChild(row);
    }
  }

  if (state.addons) {
    for (const [id, qty] of Object.entries(state.addons)) {
      if (!qty) continue;
      const def = ADDONS[id];
      if (!def) continue;
      const row = document.createElement("div");
      row.className = "summary-table-row";
      row.innerHTML = `<span>${IS_AR ? "إضافة اختيارية" : "Optional add-on"} – ${def.label} × ${IS_AR ? toArabicDigits(qty) : qty}</span><span>${formatCurrency(def.price * qty)}</span>`;
      container.appendChild(row);
    }
  }

  const subtotalRow = document.createElement("div");
  subtotalRow.className = "summary-table-row";
  subtotalRow.innerHTML = `<span>${IS_AR ? "المجموع الفرعي" : "Subtotal"}</span><span>${formatCurrency(total)}</span>`;
  container.appendChild(subtotalRow);

  if (discountAmount > 0) {
    const discountRow = document.createElement("div");
    discountRow.className = "summary-table-row";
    discountRow.innerHTML = `<span>${IS_AR ? "خصم الكود" : "Promo discount"} – ${promoLabel}</span><span>−${formatCurrency(discountAmount)}</span>`;
    container.appendChild(discountRow);
  }

  const totalRow = document.createElement("div");
  totalRow.className = "summary-table-row total";
  totalRow.innerHTML = `<span>${IS_AR ? "الإجمالي" : "Total amount"}</span><span>${formatCurrency(finalTotal)}</span>`;
  container.appendChild(totalRow);

  const termsFlag = document.getElementById("summary-terms-flag");
  if (termsFlag) {
    termsFlag.textContent = IS_AR
      ? "✔ لقد قرأت ووافقت على الشروط والأحكام."
      : "✔ You have read and accepted the Terms & Conditions.";
  }
}

if (termsAcceptBtn) {
  termsAcceptBtn.addEventListener("click", () => {
    state.termsAccepted = true;
    if (termsModal) termsModal.classList.add("hidden");
    buildSummary();
    showStep(4);
    const panel = document.getElementById(stepPanels[4]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}

// ---------- PROMO CODE ----------
const promoInput = document.getElementById("promo-code");
const promoApply = document.getElementById("promo-apply");
const promoMsg = document.getElementById("promo-message");
const VALID_PROMO = "GEM10";
const PROMO_PERCENT = 10;

if (promoApply && promoInput && promoMsg) {
  promoApply.addEventListener("click", () => {
    const code = promoInput.value.trim().toUpperCase();

    if (!code) {
      state.promo = { code: null, percent: 0 };
      promoMsg.textContent = IS_AR ? "يرجى إدخال كود الخصم." : "Please enter a promo code.";
      promoMsg.classList.add("is-error");
      buildSummary();
      return;
    }

    if (code === VALID_PROMO) {
      state.promo = { code: VALID_PROMO, percent: PROMO_PERCENT };
      promoMsg.textContent = IS_AR
        ? `تم تطبيق الكود: خصم ${toArabicDigits(PROMO_PERCENT)}٪.`
        : `Promo applied: ${PROMO_PERCENT}% discount.`;
      promoMsg.classList.remove("is-error");
      buildSummary();
    } else {
      state.promo = { code: null, percent: 0 };
      promoMsg.textContent = IS_AR ? "كود خصم غير صحيح." : "Invalid promo code.";
      promoMsg.classList.add("is-error");
      buildSummary();
    }
  });
}

const payBtn = document.getElementById("pay-btn");
if (payBtn) {
  payBtn.addEventListener("click", () => {
    alert(IS_AR ? "نسخة تجريبية فقط: سيتم تحويلك لبوابة الدفع." : "Prototype only: this would redirect to the payment gateway.");
  });
}

// ---------- CART SCROLL / MOBILE CART ----------
function scrollToCurrentStep() {
  const bookingSection = document.getElementById("booking-section");
  const bookingVisible = bookingSection && !bookingSection.classList.contains("booking-hidden");

  if (bookingVisible) {
    const visibleId = Object.values(stepPanels).find((id) => {
      const el = document.getElementById(id);
      return el && !el.classList.contains("hidden");
    });
    if (visibleId) {
      document.getElementById(visibleId).scrollIntoView({ behavior: "smooth" });
      return;
    }
  }
  const experiencesSection = document.querySelector(".experiences-home");
  if (experiencesSection) experiencesSection.scrollIntoView({ behavior: "smooth" });
}

const cartScrollBtn = document.getElementById("cart-scroll-btn");
if (cartScrollBtn) cartScrollBtn.addEventListener("click", scrollToCurrentStep);

const cartPanelEl = document.querySelector(".cart-panel");
const mobileCartBtn = document.getElementById("mobile-cart-btn");
const mobileCartCta = document.querySelector("#mobile-cart-btn .mobile-cart-cta");

if (cartPanelEl && mobileCartBtn && mobileCartCta) {
  let mobileCartOpen = false;
  mobileCartBtn.addEventListener("click", () => {
    mobileCartOpen = !mobileCartOpen;
    cartPanelEl.classList.toggle("cart-mobile-visible", mobileCartOpen);
    mobileCartCta.textContent = mobileCartOpen ? (IS_AR ? "إخفاء" : "Hide") : (IS_AR ? "عرض" : "View");
  });
}

// language buttons stub
document.querySelectorAll(".nav-lang").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-lang").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  });
});

// =============================
// IMPORTANT INFORMATION MODAL
// =============================
const infoModal = document.getElementById("info-modal");
const infoOpenBtn = document.getElementById("open-info");
const infoCloseBtns = document.querySelectorAll('[data-close="info"]');
const infoAccept = document.getElementById("info-accept");

if (infoOpenBtn) infoOpenBtn.addEventListener("click", () => infoModal && infoModal.classList.remove("hidden"));
if (heroGalleriesBtn) heroGalleriesBtn.addEventListener("click", () => infoModal && infoModal.classList.remove("hidden"));

infoCloseBtns.forEach((btn) => {
  btn.addEventListener("click", () => infoModal && infoModal.classList.add("hidden"));
});
if (infoAccept) {
  infoAccept.addEventListener("click", () => {
    if (infoModal) infoModal.classList.add("hidden");
    showBookingSection();
    showStep(1);
    scrollToBooking();
  });
}

// ---------- CUSTOM CALENDAR ----------
(function () {
  const hiddenInput = document.getElementById("visit-date");
  const popup = document.getElementById("visit-calendar");
  const textSpan = document.getElementById("visit-date-text");
  const monthLabel = document.getElementById("cal-month-label");
  const grid = document.getElementById("cal-days");
  const btnPrev = document.getElementById("cal-prev");
  const btnNext = document.getElementById("cal-next");
  const displayBtn = document.getElementById("visit-date-display");

  if (!hiddenInput || !popup || !textSpan || !monthLabel || !grid) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let selectedDate = null;

  function formatISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatLabel(date) {
    if (!IS_AR) {
      return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    const wd = AR_WEEKDAYS[date.getDay()];
    const d = toArabicDigits(date.getDate());
    const m = AR_MONTHS[date.getMonth()];
    const y = toArabicDigits(date.getFullYear());
    return `${wd}، ${d} ${m} ${y}`;
  }

  function formatMonthHeader(year, monthIndex) {
    if (!IS_AR) {
      return new Date(year, monthIndex, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
    }
    return `${AR_MONTHS[monthIndex]} ${toArabicDigits(year)}`;
  }

  function sameDay(a, b) {
    return a && b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  window.resetVisitCalendar = function () {
    selectedDate = null;
    hiddenInput.value = "";
    hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));

    textSpan.textContent = I18N.selectDate;
    popup.classList.remove("is-hidden");
    renderCalendar();
  };

  window.reRenderVisitCalendar = function () {
    renderCalendar();
  };

  function renderCalendar() {
    monthLabel.textContent = formatMonthHeader(currentYear, currentMonth);
    grid.innerHTML = "";

    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeek = firstDay.getDay(); // 0 Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < startWeek; i++) {
      const empty = document.createElement("button");
      empty.type = "button";
      empty.className = "cal-day cal-day-empty";
      empty.disabled = true;
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = IS_AR ? toArabicDigits(d) : String(d);
      btn.className = "cal-day";

      const dateObj = new Date(currentYear, currentMonth, d);
      dateObj.setHours(0, 0, 0, 0);
      const iso = formatISO(dateObj);

      if (dateObj < today) {
        btn.disabled = true;
        btn.classList.add("is-disabled");
      }

      if (isDateSoldOut(iso)) {
        btn.disabled = true;
        btn.classList.add("is-disabled", "is-soldout");
      }

      if (!btn.disabled && isFullDaySoldOut(iso)) {
        btn.classList.add("is-fullday-soldout");
        btn.title = I18N.soldOut;
      }

      if (selectedDate && sameDay(dateObj, selectedDate)) btn.classList.add("is-selected");

      btn.addEventListener("click", () => {
        if (btn.disabled || btn.classList.contains("is-fullday-soldout")) {
          showSoldOut(I18N.dateSoldOut);
          return;
        }
        selectedDate = dateObj;
        hiddenInput.value = iso;
        hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
        textSpan.textContent = formatLabel(dateObj);
        popup.classList.add("is-hidden");
        renderCalendar();
      });

      grid.appendChild(btn);
    }
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else currentMonth--;
      renderCalendar();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else currentMonth++;
      renderCalendar();
    });
  }

  if (displayBtn) {
    displayBtn.addEventListener("click", () => {
      popup.classList.toggle("is-hidden");
    });
  }

  if (!hiddenInput.value) textSpan.textContent = I18N.selectDate;
  renderCalendar();
})();

document.querySelectorAll('.radio-pill input[type="radio"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const name = radio.name;
    document.querySelectorAll(`.radio-pill input[name="${name}"]`).forEach((r) => r.parentElement.classList.remove("is-active"));
    radio.parentElement.classList.add("is-active");
  });
});

// Expand / collapse "See more information" blocks for add-ons
document.querySelectorAll(".addon-more-btn").forEach((btn) => {
  const targetId = btn.dataset.detailsTarget;
  const panel = document.getElementById(targetId);
  if (!panel) return;

  // Set initial Arabic text if needed
  if (IS_AR) btn.textContent = I18N.seeMore;

  btn.addEventListener("click", () => {
    const isHidden = panel.classList.contains("hidden");
    if (isHidden) {
      panel.classList.remove("hidden");
      btn.textContent = I18N.hideInfo;
    } else {
      panel.classList.add("hidden");
      btn.textContent = I18N.seeMore;
    }
  });
});

// ---------- INIT ----------
syncCMTicketsFromDOM();
refreshTicketPrices();
updateTimeSlotTitleAndVisibility();
renderTimeSlots();
updateCategoryAvailabilityUI();
applySoldOutToTicketRows();
updateCart();
updateStep2Subtitle();
showStep(1);
bindTicketCounterButtonsOnce_();
