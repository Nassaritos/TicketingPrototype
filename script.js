// ---------- PRICES ----------
// ---------- TIME SLOTS ----------

// Entry slots for Admission Ticket
const ENTRY_SLOTS_DEFAULT = [
  "08:30 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "01:00 PM - 03:00 PM",
  "03:00 PM - 05:00 PM"
];

// Wed & Sat: extra evening slot
const ENTRY_SLOTS_EXTENDED = [
  ...ENTRY_SLOTS_DEFAULT,
  "05:00 PM - 08:00 PM"
];

// Guided tour *tour times* (NOT entry slots)
const GUIDED_SLOTS_AR = ["10:15 AM", "12:15 PM", "2:15 PM", "4:15 PM"]; // Arabic screenshot
const GUIDED_SLOTS_EN = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"]; // English screenshot

const prices = {
  admission: {
    Egyptians:  { Adult: 200, Child: 100, Student: 100, Senior: 100 },
    Arabs:      { Adult: 1450, Child: 730, Student: 730 },
    Expatriates:{ Adult: 730,  Child: 370, Student: 370 }
  },
  guided: {
    Egyptians:  { Adult: 350, Child: 175, Student: 175, Senior: 175 },
    Arabs:      { Adult: 1950, Child: 980, Student: 980 },
    Expatriates:{ Adult: 980,  Child: 500, Student: 500 }
  },
  children: {
    Egyptians:  { Admission: 150 },
    Arabs:      { Admission: 750 },
    Expatriates:{ Admission: 375 }
  }
};

const ADDONS = {
  "gem-discovery": { label: "GEM Discovery Challenge", price: 125 },
  "audio-guide":   { label: "Audio guide",             price: 200 },
  "mixed-reality": { label: "Mixed reality experience",price: 350 }
};

// ---------- STATE ----------

const state = {
  tourLanguage: null,
  experience:   "galleries", // by default we show galleries tickets
  ticketType:   "admission",
  date: null,
  time: null,

  tickets: {
    Egyptians:  { Adult: 0, Child: 0, Student: 0, Senior: 0 },
    Arabs:      { Adult: 0, Child: 0, Student: 0 },
    Expatriates:{ Adult: 0, Child: 0, Student: 0 }
  },

  cmTickets: {
    Egyptians: 0,
    Arabs: 0,
    Expatriates: 0
  },

  addons: {
    "gem-discovery": 0,
    "audio-guide":   0,
    "mixed-reality": 0
  },
  promo: { code: null, percent: 0 },   // 🔹 NEW

  contact: { name: "", email: "", phone: "", country: "" },
  termsAccepted: false
};

const stepPanels = {
  1: "step-2",        // Date & tickets
  2: "step-addons",   // NEW: Add-ons
  3: "step-3",        // Contact details
  4: "step-4"         // Review & pay
};


const goStep3Btn   = document.getElementById("go-step-3");
const backTo1Btn   = document.getElementById("back-to-1");
const backTo3Btn   = document.getElementById("back-to-3");
const backTo2Btn   = document.getElementById("back-to-2");

// Track a ticket type waiting for confirmation
let pendingTicketType = null;

// Modal elements
const ticketTypeModal      = document.getElementById("ticket-type-modal");
const ticketTypeConfirmBtn = document.getElementById("ticket-type-confirm");
const ticketTypeCancelBtn  = document.getElementById("ticket-type-cancel");
const ticketTypeCancelX    = document.getElementById("ticket-type-cancel-x");

// Helper: make the correct radio (and pill) visually selected
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
  // GUIDED TOUR → use tour times, not entry slots
  if (state.ticketType === "guided") {
    if (state.tourLanguage === "ar") return GUIDED_SLOTS_AR;
    if (state.tourLanguage === "en") return GUIDED_SLOTS_EN;
    return []; // guided but language not chosen yet → no buttons
  }

  // ADMISSION TICKET → entry time slots
  // extended evening slot only on Wednesdays & Saturdays
  return isExtendedDay(state.date)
    ? ENTRY_SLOTS_EXTENDED
    : ENTRY_SLOTS_DEFAULT;
}
function renderTimeSlots() {
  const container = document.getElementById("time-slot-group");
  if (!container) return;

  const slots = getCurrentSlotList();
  container.innerHTML = "";
  state.time = null; // reset when we rebuild

  if (!slots.length) {
    container.classList.add("hidden");
    updateCart();
    return;
  }

  container.classList.remove("hidden");

  slots.forEach(label => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time-slot";
    btn.dataset.time = label;
    btn.textContent = label;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".time-slot").forEach(b =>
        b.classList.remove("is-selected")
      );
      btn.classList.add("is-selected");
      state.time = label;
      updateCart();
    });

    container.appendChild(btn);
  });
}
function updateCartTimeLabel() {
  // guided tour (except children's museum) → Tour time
  const isGuided =
    state.ticketType === "guided" && state.experience !== "children";

  const labelText = isGuided ? "Tour time" : "Entry Time";

  const desktopLabel = document.getElementById("cart-time-label");
  if (desktopLabel) desktopLabel.textContent = labelText;

  const mobileLabel = document.getElementById("mobile-cart-time-label");
  if (mobileLabel) mobileLabel.textContent = labelText;
}

function updateTimeSlotTitleAndVisibility() {
  const titleEl   = document.getElementById("time-slot-title");
  const wrapperEl = document.getElementById("time-slot-wrapper");
  if (!titleEl || !wrapperEl) return;

  if (state.ticketType === "guided") {
    titleEl.textContent = "Guided Tour Time";

    // hide until a tour language is picked
    if (!state.tourLanguage) {
      wrapperEl.classList.add("hidden");
    } else {
      wrapperEl.classList.remove("hidden");
    }
  } else {
    // admission (or children’s museum using admission slots)
    titleEl.textContent = "Entry Time Slot";
    wrapperEl.classList.remove("hidden");
  }
}




function showBookingSection() {
  const section = document.getElementById("booking-section");
  if (section) section.classList.remove("booking-hidden");
}

function experienceLabel(key) {
  return key === "children" ? "Children’s Museum" : "GEM Galleries";
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

function formatCurrency(amount) {
  return "EGP " + amount.toLocaleString("en-EG");
}

function goToStep2() {
  showStep(2);
  const panel = document.getElementById(stepPanels[2]);
  if (panel) panel.scrollIntoView({ behavior: "smooth" });
}

// ---------- TICKETS & TOTALS ----------

function refreshTicketPrices() {
  let priceTable;
  if (state.experience === "children") {
    priceTable = prices.children;
  } else {
    priceTable = prices[state.ticketType] || prices.admission;
  }

  document.querySelectorAll(".ticket-price").forEach((el) => {
    const group = el.dataset.group;
    const type  = el.dataset.type;
    if (!priceTable || !group || !type) {
      el.textContent = "—";
      return;
    }
    const groupPrices = priceTable[group];
    const value       = groupPrices ? groupPrices[type] : null;
    el.textContent = value == null ? "—" : formatCurrency(value);
  });
}

function initTicketState() {
  if (state.experience === "children") {
    state.tickets = {
      Egyptians:  { Admission: 0 },
      Arabs:      { Admission: 0 },
      Expatriates:{ Admission: 0 }
    };
    state.ticketType = "admission";
  } else {
    state.tickets = {
      Egyptians:  { Adult: 0, Child: 0, Student: 0, Senior: 0 },
      Arabs:      { Adult: 0, Child: 0, Student: 0 },
      Expatriates:{ Adult: 0, Child: 0, Student: 0 }
    };
  }
}

function resetTicketCountersUI() {
  document.querySelectorAll(".counter[data-group]").forEach((counter) => {
    const span = counter.querySelector(".count");
    if (span) span.textContent = "0";
  });
}

function updateTicketUIForExperience() {
  const galleriesEl = document.getElementById("ticket-categories-galleries");
  const childrenEl  = document.getElementById("ticket-categories-children");
  if (state.experience === "children") {
    if (galleriesEl) galleriesEl.classList.add("hidden");
    if (childrenEl)  childrenEl.classList.remove("hidden");
  } else {
    if (galleriesEl) galleriesEl.classList.remove("hidden");
    if (childrenEl)  childrenEl.classList.add("hidden");
  }
  resetTicketCountersUI();
  initTicketState();
  syncCountersFromDOM();
}

function computeTotals() {
  // Keep CM state in sync with the DOM counters
  syncCMTicketsFromDOM();

  let ticketTotal = 0;
  let addonTotal  = 0;
  let count       = 0; // base tickets only

  // Decide which main price table to use (galleries admission / guided / children)
  let priceTable;
  if (state.experience === "children") {
    priceTable = prices.children;
  } else {
    const tier = state.ticketType === "guided" ? "guided" : "admission";
    priceTable = prices[tier];
  }

  // MAIN TICKETS (these contribute to "Number of tickets")
  if (priceTable && state.tickets) {
    for (const [group, groupTickets] of Object.entries(state.tickets)) {
      const groupPrices = priceTable[group];
      if (!groupPrices) continue;

      for (const [type, qty] of Object.entries(groupTickets)) {
        if (!qty) continue;
        const unit = groupPrices[type];
        if (unit == null) continue;

        ticketTotal += qty * unit;
        count       += qty;           // ✅ ONLY base tickets counted here
      }
    }
  }

  // CHILDREN’S MUSEUM (ADD-ON)
  // ➜ contributes to addonTotal, NOT to base ticket count
  if (state.cmTickets) {
    for (const [group, qty] of Object.entries(state.cmTickets)) {
      if (!qty) continue;
      const gp = prices.children[group];
      if (!gp) continue;
      const unit = gp.Admission;
      if (unit == null) continue;

      addonTotal += qty * unit;       // ✅ CM now included in addonTotal
      // do NOT change `count` here
    }
  }

  // OTHER ADD-ONS (Discovery, audio, MR)
  if (state.addons) {
    for (const [id, qty] of Object.entries(state.addons)) {
      if (!qty) continue;
      const def = ADDONS[id];
      if (!def) continue;

      addonTotal += qty * def.price;
    }
  }

  return {
    ticketTotal,
    addonTotal,
    total: ticketTotal + addonTotal,
    count          // base ticket count only
  };
}


// Any add-ons chosen? (Children's Museum or other add-ons)
// Any add-ons chosen? (Children's Museum OR other add-ons)
function hasAnyAddonsSelected() {
  let any = false;

  // Children's Museum counters
  document.querySelectorAll(".cm-counter .count").forEach((el) => {
    const v = parseInt(el.textContent, 10) || 0;
    if (v > 0) any = true;
  });

  // Other add-ons (Discovery, audio, MR, etc.)
  document.querySelectorAll(".addon-counter .count").forEach((el) => {
    const v = parseInt(el.textContent, 10) || 0;
    if (v > 0) any = true;
  });

  return any;
}


function updateCart() {
  const { addonTotal, total } = computeTotals();

  // BASE TICKETS ONLY (no add-ons)
  const baseTickets = getBaseTicketCount();

  // DATE & TIME
  // DATE & TIME (separated)
  const cartDate = document.getElementById("cart-date");
  const cartTime = document.getElementById("cart-time");
  if (cartDate) cartDate.textContent = state.date || "—";
  if (cartTime) cartTime.textContent = state.time || "—";

  // If you also have a mobile cart, update it too:
  const mobileCartDate = document.getElementById("mobile-cart-date");
  const mobileCartTime = document.getElementById("mobile-cart-time");
  if (mobileCartDate) mobileCartDate.textContent = state.date || "—";
  if (mobileCartTime) mobileCartTime.textContent = state.time || "—";


  // TICKETS (base only)
  // TICKETS (show breakdown by nationality instead of a single total)
  const breakdownText = getTicketBreakdownText();

  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    cartCount.textContent = breakdownText || baseTickets;
  }

  const mobileCount = document.getElementById("mobile-cart-count");
  if (mobileCount) {
    mobileCount.textContent = breakdownText || baseTickets;
  }
  updateCartTimeLabel();


  // TOTAL (still includes add-ons)
  const cartTotal = document.getElementById("cart-total");
  if (cartTotal) cartTotal.textContent = formatCurrency(total);

  const mobileTotal = document.getElementById("mobile-cart-total");
  if (mobileTotal) mobileTotal.textContent = formatCurrency(total);

  // BADGE (based on base tickets only)
  const badge = document.getElementById("cart-badge");
  if (badge) {
    if (baseTickets === 0) {
      badge.textContent = "No tickets yet";
    } else {
      badge.textContent = `${baseTickets} ticket${baseTickets > 1 ? "s" : ""} selected`;
    }
  }

  // ENABLE / DISABLE "CONTINUE" BUTTON
  const go = goStep3Btn;
  if (go) {
    go.disabled = !(baseTickets > 0 && state.date && state.time);
  }

  // ADD-ONS (row visibility, amount + summary)
  const cartAddonRow        = document.getElementById("cart-addon-row");
  const cartAddonAmount     = document.getElementById("cart-addon-amount");
  const cartAddonSummary    = document.getElementById("cart-addon-summary");

  const mobileAddonContain  = document.getElementById("mobile-cart-addons");
  const mobileAddonAmount   = document.getElementById("mobile-cart-addon-amount");
  const mobileAddonSummary  = document.getElementById("mobile-cart-addon-summary");

const addonLines = getSelectedAddonsSummaryLines();
const hasAddons  = addonLines.length > 0;
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

    // ----- STEP 2: enable / disable "Add to booking" button -----
  const addonsNextBtn = document.getElementById("addons-next");
  if (addonsNextBtn) {
    addonsNextBtn.disabled = !hasAnyAddonsSelected();
  }
}




function getSelectedAddonsSummaryLines() {
  const lines = [];

  // Children’s Museum tickets
  document.querySelectorAll(".cm-counter").forEach(counter => {
    const qtyEl = counter.querySelector(".count");
    if (!qtyEl) return;
    const qty = parseInt(qtyEl.textContent, 10) || 0;
    if (!qty) return;

    const group = counter.getAttribute("data-cm-group") || "";
    let label = "Children’s Museum";
    if (group) label += ` – ${group}`;

    lines.push(`${label} × ${qty}`);
  });

  // Other add-ons (Discovery, audio guide, mixed reality, etc.)
  document.querySelectorAll(".addon-counter").forEach(counter => {
    const qtyEl = counter.querySelector(".count");
    if (!qtyEl) return;
    const qty = parseInt(qtyEl.textContent, 10) || 0;
    if (!qty) return;

    const addonKey = counter.getAttribute("data-addon");
    let label = "Add-on";

    switch (addonKey) {
      case "gem-discovery":
        label = "GEM Discovery Challenge";
        break;
      case "audio-guide":
        label = "Audio guide";
        break;
      case "mixed-reality":
        label = "Mixed reality experience";
        break;
      default:
        if (addonKey) label = addonKey;
    }

    lines.push(`${label} × ${qty}`);
  });

  return lines;
}
// ===========================
// ADD-ONS STEP NAVIGATION
// ===========================

// Buttons in the step-addons footer
const addonsSkipBtn    = document.querySelector('#step-addons [data-addons-action="skip"]');
const addonsConfirmBtn = document.querySelector('#step-addons [data-addons-action="confirm"]');

// go to Contact Details step (update index if your mapping is different)
function goToContactStep() {
  // assuming stepPanels = {1:'step-2', 2:'step-addons', 3:'step-3', 4:'step-4'}
  showStep(3);
  const panel = document.getElementById(stepPanels[3]);
  if (panel) panel.scrollIntoView({ behavior: "smooth" });
}

// Skip for now: reset all add-ons, then continue
if (addonsSkipBtn) {
  addonsSkipBtn.addEventListener("click", () => {
    // reset Children's Museum tickets
    state.cmTickets = { Egyptians: 0, Arabs: 0, Expatriates: 0 };
    document.querySelectorAll(".cm-counter .count")
      .forEach((el) => (el.textContent = "0"));

    // reset other add-ons
    state.addons = {
      "gem-discovery": 0,
      "audio-guide":   0,
      "mixed-reality": 0
    };
    document.querySelectorAll(".addon-counter .count")
      .forEach((el) => (el.textContent = "0"));

    syncCMTicketsFromDOM();
    updateCart();

    goToContactStep();
  });
}

// Add to booking: keep selected add-ons, update cart, then continue
if (addonsConfirmBtn) {
  addonsConfirmBtn.addEventListener("click", () => {
    if (!hasAnyAddonsSelected()) return; // safety, should already be disabled
    updateCart();
    goToContactStep();
  });
}

function updateAvailableTimeSlotsForDate() {
  const extraSlot = document.querySelector('.time-slot[data-extra-slot="evening"]');
  if (!extraSlot) return;

  const dateStr = state.date;

  // If no date selected yet → hide extra slot
  if (!dateStr) {
    extraSlot.classList.add("is-hidden");
    if (extraSlot.classList.contains("is-selected")) {
      extraSlot.classList.remove("is-selected");
      state.time = null;
      updateCart();
    }
    return;
  }

  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  const isWedOrSat = day === 3 || day === 6;

  if (isWedOrSat) {
    // show evening slot
    extraSlot.classList.remove("is-hidden");
  } else {
    // hide evening slot and clear selection if it was chosen
    if (extraSlot.classList.contains("is-selected")) {
      extraSlot.classList.remove("is-selected");
      if (state.time === extraSlot.dataset.time) {
        state.time = null;
      }
    }
    extraSlot.classList.add("is-hidden");
    updateCart();
  }
}

function syncCountersFromDOM() {
  document.querySelectorAll(".counter[data-group]").forEach((counter) => {
    const group = counter.dataset.group;
    const type  = counter.dataset.type;
    const value = parseInt(counter.querySelector(".count").textContent, 10) || 0;
    if (state.tickets[group] && state.tickets[group][type] != null) {
      state.tickets[group][type] = value;
    }
  });
  updateCart();
}

function syncCMTicketsFromDOM() {
  document.querySelectorAll(".cm-counter").forEach((counter) => {
    const group = counter.dataset.cmGroup;
    const value = parseInt(counter.querySelector(".count").textContent, 10) || 0;
    if (state.cmTickets[group] != null) {
      state.cmTickets[group] = value;
    }
  });
}

// ---------- ADD-ONS MODAL (POPUP) ----------



// ---------- STEP 2 SUBTITLE ----------

function updateStep2Subtitle() {
  const el = document.getElementById("step-2-subtitle");
  if (!el) return;
  if (!state.experience) {
    el.textContent = "";
    return;
  }
`Select ticket type, date, time slot and number of visitors.`;
}

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

// ---------- HERO / NAV ----------

const navBookBtn = document.getElementById("nav-book-btn");
if (navBookBtn) {
  navBookBtn.addEventListener("click", () => {
    const experiencesSection = document.querySelector(".experiences-home");
    if (experiencesSection) experiencesSection.scrollIntoView({ behavior: "smooth" });
  });
}

const heroGalleriesBtn = document.getElementById("hero-book-galleries");
if (heroGalleriesBtn) {
  heroGalleriesBtn.addEventListener("click", () => {
    setExperience("galleries");
    showBookingSection();
    showStep(1);
    scrollToBooking();
  });
}


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
const timeSlotGroup = document.getElementById("time-slot-group");

function applyTicketTypeChange(newType) {
  // 1) Update ticket type in state
  state.ticketType   = newType;

  // 2) Reset core booking state
  state.tourLanguage = null;
  state.date         = null;
  state.time         = null;

  // Reset main tickets structure based on current experience
  initTicketState();

  // Reset main ticket counters in the UI
  resetTicketCountersUI();

  // Reset Children’s Museum counters (state + UI)
  state.cmTickets = { Egyptians: 0, Arabs: 0, Expatriates: 0 };
  document.querySelectorAll(".cm-counter .count").forEach((el) => {
    el.textContent = "0";
  });

  // Reset other add-ons (state + UI)
  state.addons = {
    "gem-discovery": 0,
    "audio-guide":   0,
    "mixed-reality": 0
  };
  document.querySelectorAll(".addon-counter .count").forEach((el) => {
    el.textContent = "0";
  });

  // Clear tour language radios
  document
    .querySelectorAll('input[name="tourLanguage"]')
    .forEach((i) => (i.checked = false));

  // Clear selected time slot buttons
  document
    .querySelectorAll(".time-slot")
    .forEach((b) => b.classList.remove("is-selected"));

  // Reset & expand the custom calendar
  if (typeof window.resetVisitCalendar === "function") {
    window.resetVisitCalendar();
  }

  // 3) Show / hide language & time groups according to type
  if (state.experience === "children") {
    state.ticketType = "admission";
    if (tourLangGroup) tourLangGroup.classList.add("hidden");
  } else if (state.ticketType === "guided") {
    if (tourLangGroup) tourLangGroup.classList.remove("hidden");
  } else {
    if (tourLangGroup) tourLangGroup.classList.add("hidden");
  }

  // update title + visibility of time-slot wrapper
  updateTimeSlotTitleAndVisibility();

  // 4) Re-sync state from DOM and update cart
  syncCountersFromDOM();
  syncCMTicketsFromDOM();
  updateTimeSlotTitleAndVisibility();
  renderTimeSlots();
  refreshTicketPrices();
  updateCart();

  // Ensure radios & pills visually match new type
  setTicketTypeRadio(state.ticketType);

  // 5) Force the flow back to Step 1
  showStep(1);
}
document.querySelectorAll('input[name="ticketType"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;

    const newType = radio.value;

    // If same as current, nothing to do
    if (newType === state.ticketType) return;

    // Store the requested type and show modal
    pendingTicketType = newType;

    // Visually revert to current type until they confirm
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

[ticketTypeCancelBtn, ticketTypeCancelX]
  .filter(Boolean)
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      // Keep everything as it was
      setTicketTypeRadio(state.ticketType);
      closeTicketTypeModal();
    });
  });

document.querySelectorAll('input[name="tourLanguage"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    state.tourLanguage = radio.value;

    updateTimeSlotTitleAndVisibility();
    renderTimeSlots();      // switch between EN / AR lists
    updateCart();
  });
});

// ---------- DATE & TIME ----------

const visitDateInput = document.getElementById("visit-date");
if (visitDateInput) {
  visitDateInput.addEventListener("change", (e) => {
    state.date = e.target.value || null;
    renderTimeSlots();  // recalc entry slots based on weekday
    updateCart();
  });
}


document.querySelectorAll(".time-slot").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".time-slot")
      .forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    state.time = btn.dataset.time;
    updateCart();
  });
});

// ---------- CATEGORY TABS ----------

document.querySelectorAll(".category-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const group = tab.dataset.groupTab;
    document
      .querySelectorAll(".category-tab")
      .forEach((t) => t.classList.toggle("is-active", t === tab));
    document.querySelectorAll(".category-panel").forEach((panel) =>
      panel.classList.toggle("is-active", panel.dataset.groupPanel === group)
    );
  });
});

// ---------- TICKET COUNTERS ----------

document
  .querySelectorAll(".counter[data-group] .btn-inc")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const counter = btn.closest(".counter");
      const span    = counter.querySelector(".count");
      let value     = parseInt(span.textContent, 10) || 0;
      span.textContent = ++value;
      syncCountersFromDOM();
      updateCart();
    });
  });

document
  .querySelectorAll(".counter[data-group] .btn-dec")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const counter = btn.closest(".counter");
      const span    = counter.querySelector(".count");
      let value     = parseInt(span.textContent, 10) || 0;
      value         = Math.max(0, value - 1);
      span.textContent = value;
      syncCountersFromDOM();
      updateCart();
    });
  });

// ---------- CHILDREN'S MUSEUM COUNTERS (ADD-ON) ----------

document.querySelectorAll(".cm-counter .btn-inc").forEach((btn) => {
  btn.addEventListener("click", () => {
    const counter = btn.closest(".cm-counter");
    const span    = counter.querySelector(".count");
    let value     = parseInt(span.textContent, 10) || 0;
    span.textContent = ++value;
    syncCMTicketsFromDOM();
    updateCart();
  });
});

document.querySelectorAll(".cm-counter .btn-dec").forEach((btn) => {
  btn.addEventListener("click", () => {
    const counter = btn.closest(".cm-counter");
    const span    = counter.querySelector(".count");
    let value     = parseInt(span.textContent, 10) || 0;
    value         = Math.max(0, value - 1);
    span.textContent = value;
    syncCMTicketsFromDOM();
    updateCart();
  });
});

// ---------- OTHER ADD-ON COUNTERS ----------

document.querySelectorAll(".addon-counter").forEach((wrapper) => {
  const addonId = wrapper.dataset.addon;
  const inc     = wrapper.querySelector(".btn-inc");
  const dec     = wrapper.querySelector(".btn-dec");
  const span    = wrapper.querySelector(".count");
  if (!addonId || !span) return;

  function setAddon(value) {
    const safe = Math.max(0, value | 0);
    span.textContent = safe;
    state.addons[addonId] = safe;
    updateCart();
  }

  if (inc) {
    inc.addEventListener("click", () => {
      const value = parseInt(span.textContent, 10) || 0;
      setAddon(value + 1);
    });
  }
  if (dec) {
    dec.addEventListener("click", () => {
      const value = parseInt(span.textContent, 10) || 0;
      setAddon(value - 1);
    });
  }
});

// ---------- STEP NAVIGATION ----------
if (goStep3Btn) {
  goStep3Btn.addEventListener("click", () => {
    if (goStep3Btn.disabled) return; // still respect the date/time/tickets validation
    showStep(2);                     // go to Add-ons step
    const panel = document.getElementById(stepPanels[2]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}
const addonsBackBtn = document.getElementById("addons-back");
const addonsNextBtn = document.getElementById("addons-next");

// Back to tickets (Step 1)
if (addonsBackBtn) {
  addonsBackBtn.addEventListener("click", () => {
    showStep(1);
    const panel = document.getElementById(stepPanels[1]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}

// Continue to contact details (Step 3)
if (addonsNextBtn) {
  addonsNextBtn.addEventListener("click", () => {
    showStep(3); // contact step
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
    const panel = document.getElementById(stepPanels[1]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}
if (backTo2Btn) {
  backTo2Btn.addEventListener("click", () => {
    showStep(2);
    const panel = document.getElementById(stepPanels[1]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}

// ---------- DISCOUNTS MODAL ----------

const discountsModal   = document.getElementById("discounts-modal");
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

// ---------- CONTACT & TERMS (same as your previous logic) ----------

function syncContactFromInputs() {
  const nameEl    = document.getElementById("contact-name");
  const emailEl   = document.getElementById("contact-email");
  const phoneEl   = document.getElementById("contact-phone");
  const codeEl    = document.getElementById("phone-country-code");
  const countryEl = document.getElementById("contact-country");

  state.contact.name    = nameEl ? nameEl.value.trim() : "";
  state.contact.email   = emailEl ? emailEl.value.trim() : "";

  const localPhone = phoneEl ? phoneEl.value.trim() : "";
  const dialCode   = codeEl ? codeEl.value : "";

  state.contact.phone =
    dialCode && localPhone ? `${dialCode} ${localPhone}` : localPhone;

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
    ok = false; showError("name", true);
  } else showError("name", false);

  if (!state.contact.email || !state.contact.email.includes("@")) {
    ok = false; showError("email", true);
  } else showError("email", false);

  if (!state.contact.phone) {
    ok = false; showError("phone", true);
  } else showError("phone", false);

  return ok;
}

const termsModal     = document.getElementById("terms-modal");
const termsBody      = document.getElementById("terms-body");
const termsAcceptBtn = document.getElementById("terms-accept");
const termsHint      = document.getElementById("terms-hint");
// ===== OTP SIMULATION (code = 1234) =====
const CORRECT_OTP = "1234";

const otpModal   = document.getElementById("otp-modal");
const otpDigits  = otpModal ? Array.from(otpModal.querySelectorAll(".otp-digit")) : [];
const otpError   = document.getElementById("otp-error");
const otpConfirm = document.getElementById("otp-confirm");
const otpCancel  = document.getElementById("otp-cancel");
const otpClose   = document.getElementById("otp-close");



function openTerms() {
  if (!termsModal || !termsBody || !termsAcceptBtn || !termsHint) return;
  termsAcceptBtn.disabled = true;
  termsHint.textContent =
    "Please scroll to the end of this text to enable the “Accept” button.";
  termsModal.classList.remove("hidden");
  termsBody.scrollTop = 0;
}

if (termsBody && termsAcceptBtn && termsHint) {
  termsBody.addEventListener("scroll", () => {
    const nearBottom =
      termsBody.scrollTop + termsBody.clientHeight >=
      termsBody.scrollHeight - 10;
    if (nearBottom) {
      termsAcceptBtn.disabled = false;
      termsHint.textContent = "You can now accept the Terms & Conditions.";
    }
  });
}

if (termsModal) {
  document.querySelectorAll('[data-close="terms"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      termsModal.classList.add("hidden");
    });
  });
}

const openTermsBtn   = document.getElementById("open-terms");
const reopenTermsBtn = document.getElementById("reopen-terms");

// NEXT → opens OTP first (after contact validation)
if (openTermsBtn) {
  openTermsBtn.addEventListener("click", () => {
    if (!validateContact()) return;
    openOtpModal();          // ⬅️ show OTP instead of Terms directly
  });
}

// "View Terms again" still opens Terms directly
if (reopenTermsBtn) {
  reopenTermsBtn.addEventListener("click", () => {
    openTerms();
  });
}


if (termsAcceptBtn) {
  termsAcceptBtn.addEventListener("click", () => {
    state.termsAccepted = true;
    if (termsModal) termsModal.classList.add("hidden");
    buildSummary();
    showStep(4);
    const panel = document.getElementById(stepPanels[3]);
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
}
function openOtpModal() {
  if (!otpModal) return;
  otpModal.classList.remove("hidden");
  otpError.classList.add("hidden");
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
    otpError.textContent = "Please enter the 4-digit code.";
    otpError.classList.remove("hidden");
    return;
  }

  if (val !== CORRECT_OTP) {
    otpError.textContent =
      "The code you entered is incorrect. Please try again.";
    otpError.classList.remove("hidden");
    otpDigits.forEach((i) => i.classList.add("is-invalid"));
    return;
  }

  // ✅ Correct → close OTP, then open Terms
  closeOtpModal();
  openTerms();
}

// Hook up OTP buttons
if (otpConfirm) otpConfirm.addEventListener("click", handleOtpSubmit);
if (otpCancel)  otpCancel.addEventListener("click", closeOtpModal);
if (otpClose)   otpClose.addEventListener("click", closeOtpModal);

// Input behaviour (auto-advance, backspace, enter)
otpDigits.forEach((input, idx) => {
  input.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, ""); // digits only

    if (e.target.value && idx < otpDigits.length - 1) {
      otpDigits[idx + 1].focus();
    }

    otpError.classList.add("hidden");
    input.classList.remove("is-invalid");
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !e.target.value && idx > 0) {
      otpDigits[idx - 1].focus();
    } else if (e.key === "Enter") {
      handleOtpSubmit();
    }
  });
});
// ---------- SUMMARY / PAYMENT ----------

function buildSummary() {
  const basic     = document.getElementById("summary-basic");
  const container = document.getElementById("summary-tickets");
  if (!basic || !container) return;

  basic.innerHTML = "";
  container.innerHTML = "";

  const { total, count } = computeTotals();

  // 🔹 Apply promo (if any)
  let finalTotal     = total;
  let discountAmount = 0;
  let promoLabel     = "";

  if (state.promo && state.promo.percent > 0) {
    discountAmount = Math.round(total * (state.promo.percent / 100));
    finalTotal = total - discountAmount;
    promoLabel = `${state.promo.code} (${state.promo.percent}% off)`;
  }

  const items = [
    ["Experience", experienceLabel(state.experience)],
    [
      "Ticket type",
      state.experience === "children"
        ? "Admission ticket"
        : state.ticketType === "admission"
          ? "Admission ticket"
          : "Guided tour ticket"
    ],
    [
      "Date & time",
      (state.date || "-") + (state.time ? `, ${state.time}` : "")
    ],
    ["Number of tickets", count.toString()],
    ["Lead visitor", state.contact.name || "-"],
    ["Email",        state.contact.email || "-"],
    ["Mobile",       state.contact.phone || "-"],
    ["Country",      state.contact.country || "-"]
  ];

  if (state.ticketType === "guided" && state.experience !== "children") {
    items.splice(2, 0, [
      "Tour language",
      state.tourLanguage === "ar"
        ? "Arabic guided tour"
        : state.tourLanguage === "en"
          ? "English guided tour"
          : "-"
    ]);
  }

  items.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="label">${label}</span><span>${value}</span>`;
    basic.appendChild(li);
  });

  // ----- TICKETS ROWS (unchanged from your version) -----
  let priceTable = null;
  if (state.experience === "children") {
    priceTable = prices.children;
  } else {
    const tier = state.ticketType === "guided" ? "guided" : "admission";
    priceTable = prices[tier];
  }

  if (priceTable && state.tickets) {
    for (const [group, types] of Object.entries(state.tickets)) {
      const groupPrices = priceTable[group] || {};
      for (const [type, qty] of Object.entries(types)) {
        if (!qty) continue;
        const unit = groupPrices[type] || 0;
        const row  = document.createElement("div");
        row.className = "summary-table-row";
        row.innerHTML = `
          <span>${group} – ${type} × ${qty}</span>
          <span>${formatCurrency(unit * qty)}</span>
        `;
        container.appendChild(row);
      }
    }
  }

  if (state.cmTickets) {
    for (const [group, qty] of Object.entries(state.cmTickets)) {
      if (!qty) continue;
      const unit = prices.children[group].Admission;
      const row  = document.createElement("div");
      row.className = "summary-table-row";
      row.innerHTML = `
        <span>Children's Museum – ${group} × ${qty}</span>
        <span>${formatCurrency(unit * qty)}</span>
      `;
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
      row.innerHTML = `
        <span>Optional add-on – ${def.label} × ${qty}</span>
        <span>${formatCurrency(def.price * qty)}</span>
      `;
      container.appendChild(row);
    }
  }

  // 🔹 Subtotal row (base total before promo)
  const subtotalRow = document.createElement("div");
  subtotalRow.className = "summary-table-row";
  subtotalRow.innerHTML = `
    <span>Subtotal</span>
    <span>${formatCurrency(total)}</span>
  `;
  container.appendChild(subtotalRow);

  // 🔹 Discount row (if promo applied)
  if (discountAmount > 0) {
    const discountRow = document.createElement("div");
    discountRow.className = "summary-table-row";
    discountRow.innerHTML = `
      <span>Promo discount – ${promoLabel}</span>
      <span>−${formatCurrency(discountAmount)}</span>
    `;
    container.appendChild(discountRow);
  }

  // 🔹 Final total row
  const totalRow = document.createElement("div");
  totalRow.className = "summary-table-row total";
  totalRow.innerHTML = `
    <span>Total amount</span>
    <span>${formatCurrency(finalTotal)}</span>
  `;
  container.appendChild(totalRow);

  const termsFlag = document.getElementById("summary-terms-flag");
  if (termsFlag) {
    termsFlag.textContent =
      "✔ You have read and accepted the Terms & Conditions.";
  }
}
// ---------- PROMO CODE ----------

const promoInput  = document.getElementById("promo-code");
const promoApply  = document.getElementById("promo-apply");
const promoMsg    = document.getElementById("promo-message");
const VALID_PROMO = "GEM10";
const PROMO_PERCENT = 10;

if (promoApply && promoInput && promoMsg) {
  promoApply.addEventListener("click", () => {
    const code = promoInput.value.trim().toUpperCase();

    if (!code) {
      state.promo = { code: null, percent: 0 };
      promoMsg.textContent = "Please enter a promo code.";
      promoMsg.classList.add("is-error");
      buildSummary();
      return;
    }

    if (code === VALID_PROMO) {
      state.promo = { code: VALID_PROMO, percent: PROMO_PERCENT };
      promoMsg.textContent = `Promo applied: ${PROMO_PERCENT}% discount.`;
      promoMsg.classList.remove("is-error");
      buildSummary();
    } else {
      state.promo = { code: null, percent: 0 };
      promoMsg.textContent = "Invalid promo code.";
      promoMsg.classList.add("is-error");
      buildSummary();
    }
  });
}


const payBtn = document.getElementById("pay-btn");
if (payBtn) {
  payBtn.addEventListener("click", () => {
    alert("Prototype only: this would redirect to the payment gateway.");
  });
}

// ---------- CART SCROLL / MOBILE CART (unchanged from your version) ----------

function scrollToCurrentStep() {
  const bookingSection = document.getElementById("booking-section");
  const bookingVisible =
    bookingSection && !bookingSection.classList.contains("booking-hidden");

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
if (cartScrollBtn) {
  cartScrollBtn.addEventListener("click", scrollToCurrentStep);
}

const cartPanelEl   = document.querySelector(".cart-panel");
const mobileCartBtn = document.getElementById("mobile-cart-btn");
const mobileCartCta = document.querySelector("#mobile-cart-btn .mobile-cart-cta");

if (cartPanelEl && mobileCartBtn && mobileCartCta) {
  let mobileCartOpen = false;
  mobileCartBtn.addEventListener("click", () => {
    mobileCartOpen = !mobileCartOpen;
    cartPanelEl.classList.toggle("cart-mobile-visible", mobileCartOpen);
    mobileCartCta.textContent = mobileCartOpen ? "Hide" : "View";
  });
}

// language buttons stub
document.querySelectorAll(".nav-lang").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-lang")
      .forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  });
});

// =============================
// IMPORTANT INFORMATION MODAL
// =============================

const infoModal   = document.getElementById("info-modal");
const infoOpenBtn = document.getElementById("open-info");
const infoCloseBtns = document.querySelectorAll('[data-close="info"]');
const infoAccept  = document.getElementById("info-accept");

// Open modal
if (infoOpenBtn) {
  infoOpenBtn.addEventListener("click", () => {
    infoModal.classList.remove("hidden");
  });
}

// Close modal buttons (× or Close)
infoCloseBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    infoModal.classList.add("hidden");
  });
});

// Accept button
if (infoAccept) {
  infoAccept.addEventListener("click", () => {
    infoModal.classList.add("hidden");

    // If you want: scroll to booking section
    showBookingSection();
    showStep(1);
    scrollToBooking();
  });
}

// ---------- CUSTOM CALENDAR ----------

(function () {
  const hiddenInput = document.getElementById("visit-date");
  const popup       = document.getElementById("visit-calendar");
  const textSpan    = document.getElementById("visit-date-text");
  const monthLabel  = document.getElementById("cal-month-label");
  const grid        = document.getElementById("cal-days");
  const btnPrev     = document.getElementById("cal-prev");
  const btnNext     = document.getElementById("cal-next");
  const displayBtn  = document.getElementById("visit-date-display");

  if (!hiddenInput || !popup || !textSpan || !monthLabel || !grid) return;

  const today = new Date();
  today.setHours(0,0,0,0);

  let currentMonth = today.getMonth();
  let currentYear  = today.getFullYear();
  let selectedDate = null;
    // Allow external code to reset the calendar completely
  window.resetVisitCalendar = function () {
    selectedDate = null;
    hiddenInput.value = "";
    hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
    textSpan.textContent = "Select a Date";
    popup.classList.remove("is-hidden");
    renderCalendar();
  };


  function formatISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatLabel(date) {
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function sameDay(a, b) {
    return (
      a && b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function renderCalendar() {
    const monthName = new Date(currentYear, currentMonth, 1)
      .toLocaleString("en-GB", { month: "long", year: "numeric" });
    monthLabel.textContent = monthName;

    grid.innerHTML = "";

    const firstDay    = new Date(currentYear, currentMonth, 1);
    const startWeek   = firstDay.getDay();
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
      btn.textContent = d;
      btn.className = "cal-day";

      const dateObj = new Date(currentYear, currentMonth, d);
      dateObj.setHours(0,0,0,0);

      if (dateObj < today) {
        btn.disabled = true;
        btn.classList.add("is-disabled");
      }

      if (selectedDate && sameDay(dateObj, selectedDate)) {
        btn.classList.add("is-selected");
      }

      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        selectedDate = dateObj;
        hiddenInput.value = formatISO(dateObj);
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
        currentMonth = 11; currentYear--;
      } else currentMonth--;
      renderCalendar();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (currentMonth === 11) {
        currentMonth = 0; currentYear++;
      } else currentMonth++;
      renderCalendar();
    });
  }

  if (displayBtn) {
    displayBtn.addEventListener("click", () => {
      popup.classList.toggle("is-hidden");
    });
  }

  renderCalendar();
})();

const sliderCtaBtn = document.getElementById("slider-cta-btn");
if (sliderCtaBtn) {
  sliderCtaBtn.addEventListener("click", () => {
    // If you want to force a default experience, uncomment one:
    // setExperience("galleries");
    // setExperience("children");

    showBookingSection();
    showStep(1);
    scrollToBooking();
  });
}
document.querySelectorAll('.radio-pill input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', () => {
    // Remove active class from ALL pills with same name
    const name = radio.name;
    document.querySelectorAll(`.radio-pill input[name="${name}"]`)
      .forEach(r => r.parentElement.classList.remove('is-active'));

    // Add active class to the selected one
    radio.parentElement.classList.add('is-active');
  });
});
// Count ONLY main tickets, not add-ons (no CM, no audio guide, etc.)
function getBaseTicketCount() {
  let total = 0;

  // Assuming main ticket counters are the ones with data-group (Egyptians, Arabs, etc.)
  document.querySelectorAll(".counter[data-group]").forEach(counter => {
    const span = counter.querySelector(".count");
    if (!span) return;
    const val = parseInt(span.textContent, 10) || 0;
    total += val;
  });

  return total;
}

// ---------- INIT ----------
updateAvailableTimeSlotsForDate();

syncCMTicketsFromDOM();
refreshTicketPrices();
updateCart();
updateStep2Subtitle();
showStep(1);
document.addEventListener("DOMContentLoaded", function () {
  const CORRECT_OTP = "1234";   // simulated backend code

  const nextBtn        = document.getElementById("go-step-3");
  const otpModal       = document.getElementById("otp-modal");
  const otpDigits      = otpModal ? Array.from(otpModal.querySelectorAll(".otp-digit")) : [];
  const otpError       = document.getElementById("otp-error");
  const otpConfirm     = document.getElementById("otp-confirm");
  const otpCancel      = document.getElementById("otp-cancel");
  const otpClose       = document.getElementById("otp-close");

  if (!nextBtn || !otpModal) return;

  // Open / close helpers
  function openOtpModal() {
    otpModal.classList.remove("hidden");
    otpError.classList.add("hidden");
    otpDigits.forEach(i => {
      i.value = "";
      i.classList.remove("is-invalid");
    });
    otpDigits[0].focus();
  }

  function closeOtpModal() {
    otpModal.classList.add("hidden");
  }

  function getOtpValue() {
    return otpDigits.map(i => i.value.trim()).join("");
  }

  function handleOtpSubmit() {
    const val = getOtpValue();

    // simple validation
    if (val.length < 4) {
      otpError.textContent = "Please enter the 4-digit code.";
      otpError.classList.remove("hidden");
      return;
    }

    if (val !== CORRECT_OTP) {
      otpError.textContent = "The code you entered is incorrect. Please try again.";
      otpError.classList.remove("hidden");
      otpDigits.forEach(i => i.classList.add("is-invalid"));
      return;
    }

    // ✅ correct – close modal and move to Step 3
    closeOtpModal();

    // Call your real “go to step 3” logic here.
    // If you already have a function, use that instead:
    if (typeof goToStep === "function") {
      goToStep(3);
    } else {
      // fallback: trigger the existing step-3 pill / button if you have one
      const step3Tab = document.querySelector("[data-step='3']");
      if (step3Tab) step3Tab.click();
    }
  }

  // Intercept NEXT in Step 2


  // Confirm / cancel / close
  otpConfirm.addEventListener("click", handleOtpSubmit);
  otpCancel.addEventListener("click", closeOtpModal);
  otpClose.addEventListener("click", closeOtpModal);

  // Inputs behaviour: only digits, auto-advance, backspace to previous, Enter=submit
  otpDigits.forEach((input, idx) => {
    input.addEventListener("input", function (e) {
      e.target.value = e.target.value.replace(/\D/g, ""); // digits only

      if (e.target.value && idx < otpDigits.length - 1) {
        otpDigits[idx + 1].focus();
      }

      otpError.classList.add("hidden");
      input.classList.remove("is-invalid");
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        otpDigits[idx - 1].focus();
      } else if (e.key === "Enter") {
        handleOtpSubmit();
      }
    });
  });
});

// Return text like: "Egyptians 2 · Arabs 1 · Expatriates 3"
// Example output:
// "Egyptians: Adult 2, Child 1 · Arabs: Adult 1"
// Example output (internally):
// "Egyptians: Adult 1, Child 1\nArabs: Adult 1"
function getTicketBreakdownText() {
  if (!state.tickets) return "";

  const groupParts = [];

  for (const [group, types] of Object.entries(state.tickets)) {
    const typeParts = [];

    for (const [type, qty] of Object.entries(types)) {
      const n = qty || 0;
      if (!n) continue;

      typeParts.push(`${type} ${n}`); // Adult 2, Child 1, ...
    }

    if (typeParts.length) {
      groupParts.push(`${group}: ${typeParts.join(", ")}`);
    }
  }

  // Each nationality on its own line
  return groupParts.join("\n");
}

// Expand / collapse "See more information" blocks for add-ons
document.querySelectorAll(".addon-more-btn").forEach((btn) => {
  const targetId = btn.dataset.detailsTarget;
  const panel = document.getElementById(targetId);
  if (!panel) return;

  btn.addEventListener("click", () => {
    const isHidden = panel.classList.contains("hidden");

    if (isHidden) {
      panel.classList.remove("hidden");
      btn.textContent = "Hide information";
    } else {
      panel.classList.add("hidden");
      btn.textContent = "See more information";
    }
  });
});
    updateTimeSlotTitleAndVisibility();
renderTimeSlots();
