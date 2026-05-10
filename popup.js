/**
 * content.js — Dyslexia Reader v12.0
 * ─────────────────────────────────────────────────────────────────────────────
 *  v12 changes:
 *  • Multi-font selector: Default / OpenDyslexic / Lexend / Atkinson
 *  • Softer focus mode (warm amber, box-shadow, not harsh yellow block)
 *  • Dim floor raised to 0.55 minimum — context always readable
 *  • Reading profiles: focused / study / comfort / longread
 *  • All three font families bundled as WOFF files
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════════════════
   * §1  CONSTANTS & SELECTORS
   * ═══════════════════════════════════════════════════════════════════════════ */

  const STYLE_ID = "dr-v11-styles";
  const FONT_ID  = "dr-v11-font";
  const GUIDE_ID = "dr-v11-guide";

  const CLS_ACTIVE = "dr-p-on";
  const CLS_DIM    = "dr-p-dim";
  const CLS_TTS    = "dr-tts-hi";
  const ATTR_READ  = "data-dr-read";

  /**
   * READING ZONE — the core of the content-scoping system.
   *
   *  Problem with previous "body p" approach:
   *  ──────────────────────────────────────────
   *  `body p` matches EVERY paragraph on the page — navigation paragraphs,
   *  sidebar text, TOC items, button labels, footer text, Wikipedia's left
   *  panel, Google's result-type tabs, BBC's cookie banner, etc.
   *  This broke site UI across the board.
   *
   *  Solution — scoped CSS class:
   *  ──────────────────────────────
   *  1. JS detects the article/main reading container (see §4b, findReadingZone)
   *  2. Adds the class CLS_ZONE to that element
   *  3. ALL font and spacing CSS rules are scoped to `.dr-zone ...`
   *     so they only apply inside the detected reading area
   *
   *  The CSS then looks like:
   *    .dr-zone p  { font-family: OpenDyslexic !important; }
   *    .dr-zone li { ... }
   *
   *  Not: body p, body li, etc.
   *
   *  Explicit exclusions still needed for elements INSIDE the reading zone
   *  that are UI, not content — e.g. Wikipedia's TOC div (which sits inside
   *  .mw-parser-output), navboxes, and "related articles" sections.
   */
  const CLS_ZONE = "dr-reading-zone";  // added to the detected content root

  /**
   * Ordered list of CSS selectors that identify the main reading container.
   * The first match with ≥ 2 paragraphs inside it wins.
   * These are all semantic content containers — nav, header, footer, aside
   * are deliberately absent, so the selected element never includes site chrome.
   */
  const CONTENT_SELECTORS = [
    "article",
    '[role="article"]',
    "main",
    '[role="main"]',
    ".mw-parser-output",          // Wikipedia article body
    ".post-content",
    ".entry-content",
    ".article-content",
    ".article-body",
    ".story-body",
    ".content-body",
    ".blog-post",
    ".post__content",
    ".article__body",
    // Medium, Substack, Ghost
    ".section-content",
    ".post-full-content",
    // BBC
    '[data-component="text-block"]',
    // Generic fallback — direct body child with most paragraphs (see findReadingZone)
  ];

  /* ═══════════════════════════════════════════════════════════════════════════
   * §2  DEFAULTS  (must stay in sync with popup.js)
   * ═══════════════════════════════════════════════════════════════════════════ */

  const DEFAULTS = {
    enabled:       false,
    readingFont:   "none",      // "none"|"opendyslexic"|"lexend"|"atkinson"
    theme:         "light",     // "light"|"sepia"
    fontSize:      115,
    lineHeight:    1.65,
    letterSpacing: 0.05,
    wordSpacing:   0.12,
    guideEnabled:  false,
    guideMode:     "mouse",
    guideHeight:   2.6,
    guideOpacity:  0.22,
    focusMode:     false,
    focusFollow:   false,
    dimStrength:   0.62,        // softer default: paragraphs stay at ~62% visible
    ttsVoice:      "",
    profile:       ""           // ""|"focused"|"study"|"comfort"|"longread"
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   * §3  ANALYTICS
   * ═══════════════════════════════════════════════════════════════════════════ */

  const Analytics = {
    sessionStart:     Date.now(),
    scrollLog:        [],
    MAX_LOG:          40,
    focusActivations: 0,
    ttsUsed:          false,
    wordsRead:        0,
    readObserver:     null,

    logScroll(y) {
      this.scrollLog.push({ t: Date.now(), y });
      if (this.scrollLog.length > this.MAX_LOG) this.scrollLog.shift();
    },

    readingPace() {
      const log = this.scrollLog.slice(-15);
      if (log.length < 3) return "measuring";
      const px = log.reduce((s, e, i) => i === 0 ? 0 : s + Math.abs(e.y - log[i-1].y), 0);
      const ms = log[log.length - 1].t - log[0].t;
      if (ms < 100) return "measuring";
      const vps = (px / ms) * 1000;
      return vps < 60 ? "slow" : vps < 260 ? "medium" : "fast";
    },

    focusUsage() {
      if (!this.focusActivations) return "none";
      if (this.focusActivations < 6)  return "low";
      if (this.focusActivations < 25) return "medium";
      return "high";
    },

    sessionSecs() { return Math.round((Date.now() - this.sessionStart) / 1000); },

    formattedTime() {
      const s = this.sessionSecs();
      return s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s % 60}s`;
    },

    startWordTracking() {
      if (this.readObserver) return;
      this.readObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.intersectionRatio >= 0.5 && !e.target.hasAttribute(ATTR_READ)) {
            e.target.setAttribute(ATTR_READ, "1");
            const wc = (e.target.textContent || "").trim().split(/\s+/).filter(Boolean).length;
            this.wordsRead += wc;
          }
        });
      }, { threshold: 0.5 });
      // Cap at 200 paragraphs to keep performance smooth on long pages
      Array.from(document.querySelectorAll("p")).slice(0, 200).forEach(p => {
        this.readObserver.observe(p);
      });
    },

    stopWordTracking() {
      if (this.readObserver) { this.readObserver.disconnect(); this.readObserver = null; }
    },

    toObject() {
      return {
        ok:               true,
        timeOnPage:       this.formattedTime(),
        readingPace:      this.readingPace(),
        focusUsage:       this.focusUsage(),
        focusActivations: this.focusActivations,
        ttsUsed:          this.ttsUsed,
        wordsRead:        this.wordsRead,
        sessionSeconds:   this.sessionSecs()
      };
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   * §4  FONT INJECTION
   *
   *  Registers all three font families at once using WOFF files bundled in
   *  the extension. Each family name matches what the CSS rules use:
   *    "OpenDyslexic"       → fonts/OpenDyslexic-{Regular,Bold}.woff
   *    "Lexend"             → fonts/Lexend-{Regular,Bold}.woff
   *    "Atkinson Hyperlegible" → fonts/AtkinsonHyperlegible-{Regular,Bold}.woff
   *
   *  Registering both weight 400 and 700 for each family prevents the browser
   *  from synthesising fake-bold on heading elements (the "only headings look
   *  affected" bug from previous versions).
   *
   *  font-synthesis: none in §A of buildCSS blocks synthesis as a fallback guard.
   * ═══════════════════════════════════════════════════════════════════════════ */

  function injectAllFonts() {
    if (document.getElementById(FONT_ID)) return;
    try {
      const url = n => chrome.runtime.getURL(`fonts/${n}`);
      const s = document.createElement("style");
      s.id = FONT_ID;
      s.textContent = `
        @font-face { font-family:"OpenDyslexic"; src:url("${url('OpenDyslexic-Regular.woff')}") format("woff"); font-weight:400; font-style:normal; font-display:swap; }
        @font-face { font-family:"OpenDyslexic"; src:url("${url('OpenDyslexic-Bold.woff')}") format("woff"); font-weight:700; font-style:normal; font-display:swap; }
        @font-face { font-family:"Lexend"; src:url("${url('Lexend-Regular.woff')}") format("woff"); font-weight:400; font-style:normal; font-display:swap; }
        @font-face { font-family:"Lexend"; src:url("${url('Lexend-Bold.woff')}") format("woff"); font-weight:700; font-style:normal; font-display:swap; }
        @font-face { font-family:"Atkinson Hyperlegible"; src:url("${url('AtkinsonHyperlegible-Regular.woff')}") format("woff"); font-weight:400; font-style:normal; font-display:swap; }
        @font-face { font-family:"Atkinson Hyperlegible"; src:url("${url('AtkinsonHyperlegible-Bold.woff')}") format("woff"); font-weight:700; font-style:normal; font-display:swap; }
      `;
      (document.head || document.documentElement).prepend(s);
    } catch (e) {
      console.warn("[DR] Font injection failed:", e);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * §5  CSS BUILDER  (v12)
   *
   *  §A  Reading font  — scoped to reading zone, one of 3 families or none
   *  §B  Reading spacing
   *  §C  UI exclusions inside the reading zone
   *  §D  Sepia theme
   *  §E  Focus active — soft warm lift, not a harsh yellow block
   *  §F  Focus dim    — gentle desaturation, never below 55% visible
   *  §G  TTS highlight
   * ═══════════════════════════════════════════════════════════════════════════ */

  const SEPIA = { bg: "#F4ECD8", text: "#2A2A2A" };

  // Map readingFont → CSS font-family stack
  const FONT_STACKS = {
    opendyslexic: '"OpenDyslexic", Arial, sans-serif',
    lexend:       '"Lexend", "Carlito", Arial, sans-serif',
    atkinson:     '"Atkinson Hyperlegible", "Poppins", Arial, sans-serif',
  };

  const Z = `.${CLS_ZONE}`;

  function buildCSS(s) {
    const ls      = Math.min(Math.max(s.letterSpacing, 0), 0.10);
    const ws      = Math.min(Math.max(s.wordSpacing,   0), 0.25);
    const isSepia = s.theme === "sepia";
    const fontStack = FONT_STACKS[s.readingFont] || null;

    // dimStrength is the opacity of NON-active paragraphs.
    // Enforce minimum 0.55 so context is always readable.
    const dimOpacity = Math.max(0.55, Math.min(0.88, s.dimStrength));

    return `
/* ── Dyslexia Reader v12 ─────────────────────────────────────────────────── */

${fontStack ? `
/* §A  Reading font — scoped to detected article/main container */
${Z} p,
${Z} li,
${Z} td,
${Z} th,
${Z} h1, ${Z} h2, ${Z} h3, ${Z} h4, ${Z} h5, ${Z} h6,
${Z} blockquote,
${Z} figcaption,
${Z} dd {
  font-family:             ${fontStack} !important;
  font-synthesis:          none !important;
  -webkit-font-smoothing:  antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  text-rendering:          optimizeLegibility !important;
}` : "/* §A  No font override (Default) */"}

/* §B  Reading spacing */
${Z} p, ${Z} li, ${Z} td, ${Z} th, ${Z} blockquote, ${Z} figcaption, ${Z} dd {
  font-size:      ${s.fontSize}% !important;
  line-height:    ${s.lineHeight} !important;
  letter-spacing: ${ls}em !important;
  word-spacing:   ${ws}em !important;
}
${Z} h1, ${Z} h2, ${Z} h3, ${Z} h4, ${Z} h5, ${Z} h6 {
  line-height: 1.35 !important;
}

/* §C  Exclusions — UI inside the reading container */
${Z} #toc, ${Z} #toc *, ${Z} .toc, ${Z} .toc *,
${Z} .navbox, ${Z} .navbox *, ${Z} .hatnote, ${Z} .hatnote *,
${Z} .mw-editsection, ${Z} .mw-editsection *,
${Z} nav, ${Z} nav *, ${Z} aside, ${Z} aside *,
${Z} [role="navigation"], ${Z} [role="navigation"] *,
${Z} [role="complementary"], ${Z} [role="complementary"] *,
${Z} [class*="sidebar"], ${Z} [class*="sidebar"] *,
${Z} [class*="toolbar"], ${Z} [class*="toolbar"] *,
${Z} [class*="breadcrumb"], ${Z} [class*="breadcrumb"] *,
${Z} [class*="related"], ${Z} [class*="related"] *,
${Z} [class*="social"], ${Z} [class*="social"] *,
${Z} button, ${Z} input, ${Z} select, ${Z} textarea {
  font-family:    inherit !important;
  font-synthesis: auto !important;
  letter-spacing: normal !important;
  word-spacing:   normal !important;
}

${isSepia ? `
/* §D  Sepia theme */
html body {
  background-color: ${SEPIA.bg}   !important;
  color:            ${SEPIA.text} !important;
  transition:       background-color 0.3s ease, color 0.3s ease !important;
}
${Z} p, ${Z} li, ${Z} td, ${Z} th,
${Z} h1, ${Z} h2, ${Z} h3, ${Z} h4, ${Z} h5, ${Z} h6,
${Z} blockquote, ${Z} figcaption, ${Z} dd {
  color: ${SEPIA.text} !important;
}` : ""}

/* §E  Focus Mode — active paragraph
 *
 *  Design goal: feel "gently elevated", not "blocked in".
 *  • Very soft warm tint (low opacity) rather than strong yellow
 *  • Left accent line for visual anchoring (thin, warm amber)
 *  • Subtle box-shadow instead of hard border — gives depth without a box feel
 *  • Slight padding increase for breathing room
 */
body p.${CLS_ACTIVE} {
  background-color: rgba(255,248,210,0.55) !important;
  border-left:      2px solid rgba(210,160,40,0.60) !important;
  padding-left:     14px                             !important;
  border-radius:    0 6px 6px 0                      !important;
  box-shadow:       inset 3px 0 0 rgba(210,160,40,0.18), 0 1px 6px rgba(0,0,0,0.04) !important;
  transition:       background-color 0.22s ease, box-shadow 0.22s ease !important;
}

/* §F  Focus Mode — surrounding paragraphs
 *
 *  Opacity floor: ${dimOpacity} (minimum 0.55 enforced in JS).
 *  At 0.62 (default) surrounding text is at 62% — clearly de-emphasised
 *  but fully readable. Users retain full context while the active paragraph
 *  is gently brought forward by contrast.
 */
body p.${CLS_DIM} {
  opacity:    ${dimOpacity} !important;
  transition: opacity 0.28s ease !important;
}

/* §G  TTS reading highlight */
.${CLS_TTS} {
  background-color: rgba(147,197,253,0.22) !important;
  border-left:      2px solid rgba(59,130,246,0.50) !important;
  padding-left:     14px                             !important;
  border-radius:    0 6px 6px 0                      !important;
  transition:       background-color 0.22s ease      !important;
  scroll-margin-top: 30vh                            !important;
}
/* ── end Dyslexia Reader v12 ─────────────────────────────────────────────── */
`;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * §4b  READING ZONE DETECTION
   *
   *  Finds the element that contains the page's main article content,
   *  adds the CLS_ZONE class to it, and stores a reference so we can
   *  remove the class cleanly when the extension is disabled.
   *
   *  Detection priority (first match with ≥2 paragraphs wins):
   *  1. Semantic / well-known selectors (CONTENT_SELECTORS)
   *  2. Fallback: score every direct body child by paragraph count,
   *     skip any child that is nav/header/footer/aside
   *
   *  The detected element is NEVER nav, header, footer, or aside —
   *  those are excluded from CONTENT_SELECTORS by design.
   *
   *  When no reading container is found (search results pages, dashboards,
   *  form-heavy pages), zoneEl stays null and the CSS rules have no target —
   *  the font is simply not applied, which is the correct behaviour.
   * ═══════════════════════════════════════════════════════════════════════════ */

  let zoneEl = null;   // the element currently wearing CLS_ZONE

  function findReadingZone() {
    // Pass 1 — semantic selectors
    for (const sel of CONTENT_SELECTORS) {
      try {
        const el = document.querySelector(sel);
        if (el && el !== document.body && el.querySelectorAll("p").length >= 2) {
          return el;
        }
      } catch (_) { /* invalid selector on some pages — skip */ }
    }

    // Pass 2 — score direct body children, skip structural chrome
    const SKIP_TAGS = new Set(["nav","header","footer","aside","script","style","noscript"]);
    let bestEl = null, bestScore = 0;
    Array.from(document.body.children).forEach(child => {
      if (SKIP_TAGS.has(child.tagName.toLowerCase())) return;
      if (child.getAttribute("role") === "navigation") return;
      if (child.getAttribute("role") === "banner")     return;
      const score = child.querySelectorAll("p").length;
      if (score > bestScore) { bestScore = score; bestEl = child; }
    });

    // Only return the fallback if it actually has content
    return (bestScore >= 2) ? bestEl : null;
  }

  function markReadingZone() {
    unmarkReadingZone(); // clear any previous zone first
    const el = findReadingZone();
    if (!el) return;
    el.classList.add(CLS_ZONE);
    zoneEl = el;
  }

  function unmarkReadingZone() {
    if (zoneEl) {
      zoneEl.classList.remove(CLS_ZONE);
      zoneEl = null;
    }
    // Belt-and-braces: remove the class from any element that might have it
    document.querySelectorAll(`.${CLS_ZONE}`)
      .forEach(el => el.classList.remove(CLS_ZONE));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * §6  STYLE INJECTION / REMOVAL
   *
   *  injectStyles: injects @font-face + our scoped stylesheet + marks zone
   *  removeStyles: removes stylesheet + unmarks zone + clears focus classes
   * ═══════════════════════════════════════════════════════════════════════════ */

  function injectStyles(settings) {
    // Inject all @font-face declarations once, regardless of which font is chosen.
    // This means switching fonts never requires re-injection.
    injectAllFonts();

    markReadingZone();

    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el    = document.createElement("style");
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = buildCSS(settings);
  }

  function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
    unmarkReadingZone();
    clearFocusClasses();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * §7  SMART READING GUIDE
   *
   *  A translucent horizontal band that helps track the current line.
   *
   *  Colour choice: amber rgba(255,230,80,{OP}) — visible on light pages
   *  as a warm highlight; subtle but harmless on dark pages.
   *
   *  Safety properties:
   *  • position:fixed + pointer-events:none → never blocks any click/scroll
   *  • willChange:top + rAF throttle       → GPU compositing, zero jank
   *  • maskImage gradient                  → soft fade at top/bottom edges,
   *    making the band feel calm rather than harsh
   *  • zIndex:2147483646                   → above page content, below
   *    browser UI (never covers browser chrome)
   *
   *  Mouse mode:  band follows cursor Y coordinate in real time.
   *  Fixed mode:  band stays locked; ↑/↓ keys move it one line (~24px).
   * ═══════════════════════════════════════════════════════════════════════════ */

  const GUIDE = {
    active: false, mode: "mouse", el: null,
    raf: null, lastY: -1, fixedY: -1
  };

  /** Soft gradient mask — band fades in/out at top and bottom edges */
  const GUIDE_MASK = [
    "linear-gradient(to bottom,",
    "  transparent 0%,",
    "  rgba(0,0,0,0.55) 20%,",
    "  rgba(0,0,0,0.92) 40%,",
    "  rgba(0,0,0,0.92) 60%,",
    "  rgba(0,0,0,0.55) 80%,",
    "  transparent 100%)"
  ].join(" ");

  function guideColor(opacity) {
    return `rgba(255,230,80,${opacity})`;
  }

  function buildGuideEl(s) {
    const el = document.createElement("div");
    el.id    = GUIDE_ID;
    Object.assign(el.style, {
      position:        "fixed",
      left:            "0",
      top:             "-120px",        // off-screen until first event
      width:           "100vw",
      height:          `${s.guideHeight}em`,
      pointerEvents:   "none",
      zIndex:          "2147483646",
      backgroundColor: guideColor(s.guideOpacity),
      WebkitMaskImage: GUIDE_MASK,
      maskImage:       GUIDE_MASK,
      willChange:      "top",
      transition:      "background-color 0.3s ease, height 0.2s ease"
    });
    return el;
  }

  function refreshGuideStyle(s) {
    if (!GUIDE.el) return;
    GUIDE.el.style.backgroundColor = guideColor(s.guideOpacity);
    GUIDE.el.style.height           = `${s.guideHeight}em`;
  }

  function onMouseMoveGuide(e) {
    GUIDE.lastY = e.clientY;
    if (GUIDE.raf) return;
    GUIDE.raf = requestAnimationFrame(() => {
      GUIDE.raf = null;
      if (!GUIDE.el || GUIDE.mode !== "mouse") return;
      const h = GUIDE.el.offsetHeight || 40;
      GUIDE.el.style.top = `${GUIDE.lastY - h / 2}px`;
    });
  }

  function onKeyDownGuide(e) {
    if (GUIDE.mode !== "fixed" || !GUIDE.active) return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const STEP = 24; // px ≈ one text line at comfortable reading size
    if (GUIDE.fixedY < 0) GUIDE.fixedY = window.innerHeight * 0.45;
    GUIDE.fixedY += e.key === "ArrowDown" ? STEP : -STEP;
    GUIDE.fixedY  = Math.max(10, Math.min(window.innerHeight - 10, GUIDE.fixedY));
    if (GUIDE.el) GUIDE.el.style.top = `${GUIDE.fixedY - (GUIDE.el.offsetHeight || 40) / 2}px`;
  }

  function enableGuide(s) {
    const modeChanged = GUIDE.mode !== s.guideMode;
    GUIDE.mode = s.guideMode;

    if (GUIDE.active && !modeChanged) { refreshGuideStyle(s); return; }

    if (!GUIDE.el) { GUIDE.el = buildGuideEl(s); document.body.appendChild(GUIDE.el); }
    else refreshGuideStyle(s);

    if (s.guideMode === "mouse") {
      document.removeEventListener("keydown", onKeyDownGuide, true);
      document.addEventListener("mousemove", onMouseMoveGuide, { passive: true });
      if (GUIDE.lastY > 0)
        GUIDE.el.style.top = `${GUIDE.lastY - (GUIDE.el.offsetHeight || 40) / 2}px`;
    } else {
      document.removeEventListener("mousemove", onMouseMoveGuide);
      document.addEventListener("keydown", onKeyDownGuide, true);
      if (GUIDE.fixedY < 0) GUIDE.fixedY = window.innerHeight * 0.45;
      GUIDE.el.style.top = `${GUIDE.fixedY - (GUIDE.el.offsetHeight || 40) / 2}px`;
    }
    GUIDE.active = true;
  }

  function disableGuide() {
    if (!GUIDE.active) return;
    document.removeEventListener("mousemove", onMouseMoveGuide);
    document.removeEventListener("keydown",   onKeyDownGuide, true);
    if (GUIDE.raf) { cancelAnimationFrame(GUIDE.raf); GUIDE.raf = null; }
    GUIDE.el?.remove();
    GUIDE.el = null; GUIDE.active = false;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * §8  FOCUS MODE
   *
   *  Two sub-modes:
   *
   *  Hover (focusMode):
   *    mouseenter on any <p> → that paragraph gets CLS_ACTIVE,
   *    all others get CLS_DIM. mouseleave clears unless moving within
   *    the same paragraph (prevents flicker on inline child elements).
   *    DOM writes batched via rAF = single paint pass per hover.
   *
   *  Auto-Follow Scroll (focusFollow):
   *    IntersectionObserver watches all substantial paragraphs.
   *    The one nearest the vertical centre of the viewport is highlighted.
   *    rootMargin "-20% 0px -20% 0px" = only triggers in the central 60%
   *    of the viewport, so very short glances don't switch the focus.
   *    This mode requires no mouse interaction — ideal for continuous reading.
   *
   *  The two modes are mutually exclusive. focusFollow takes priority.
   * ═══════════════════════════════════════════════════════════════════════════ */

  let focusActive       = false;
  let autoFocusObserver = null;

  function clearFocusClasses() {
    document.querySelectorAll(`p.${CLS_ACTIVE}, p.${CLS_DIM}`).forEach(el => {
      el.classList.remove(CLS_ACTIVE, CLS_DIM);
    });
  }

  function onFocusEnter(e) {
    const para = e.target.closest("p");
    if (!para) return;
    requestAnimationFrame(() => {
      document.querySelectorAll("p").forEach(p => {
        p.classList.toggle(CLS_ACTIVE, p === para);
        p.classList.toggle(CLS_DIM,    p !== para);
      });
    });
    Analytics.focusActivations++;
  }

  function onFocusLeave(e) {
    const from = e.target.closest("p");
    const to   = e.relatedTarget?.closest("p");
    if (from && to && from === to) return; // still within same paragraph
    requestAnimationFrame(clearFocusClasses);
  }

  function enableFocusMode() {
    if (focusActive) return;
    document.addEventListener("mouseenter", onFocusEnter, true);
    document.addEventListener("mouseleave", onFocusLeave, true);
    focusActive = true;
  }

  function disableFocusMode() {
    if (!focusActive) return;
    document.removeEventListener("mouseenter", onFocusEnter, true);
    document.removeEventListener("mouseleave", onFocusLeave, true);
    clearFocusClasses();
    focusActive = false;
  }

  function enableAutoFocusFollow() {
    if (autoFocusObserver) return;

    const paras = Array.from(document.querySelectorAll("p"))
      .filter(p => p.textContent.trim().length > 30);
    if (!paras.length) return;

    let current = null;

    autoFocusObserver = new IntersectionObserver(entries => {
      let best = null, bestDist = Infinity;
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const rect = e.boundingClientRect;
        const mid  = rect.top + rect.height / 2;
        const dist = Math.abs(mid - window.innerHeight / 2);
        if (dist < bestDist) { bestDist = dist; best = e.target; }
      });

      if (!best || best === current) return;
      current = best;
      requestAnimationFrame(() => {
        paras.forEach(p => {
          p.classList.toggle(CLS_ACTIVE, p === current);
          p.classList.toggle(CLS_DIM,    p !== current);
        });
      });
      Analytics.focusActivations++;
    }, {
      threshold:  [0, 0.3, 0.5, 0.8, 1],
      rootMargin: "-20% 0px -20% 0px"
    });

    paras.forEach(p => autoFocusObserver.observe(p));
  }

  function disableAutoFocusFollow() {
    if (!autoFocusObserver) return;
    autoFocusObserver.disconnect();
    autoFocusObserver = null;
    clearFocusClasses();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * §9  READ ALOUD — Text-to-Speech
   *
   *  Reads the page's main article content paragraph-by-paragraph.
   *  Within each paragraph, splits into sentences so onend fires precisely,
   *  allowing accurate progress tracking and paragraph highlighting.
   *
   *  Chrome keep-alive workaround: Chrome's speechSynthesis engine stops
   *  spontaneously after ~15 seconds of speech on long utterances. Calling
   *  resume() every 10 seconds prevents this without interrupting speech.
   *
   *  Voice selection: populated from window.speechSynthesis.getVoices().
   *  Filtered to English voices to keep the list manageable.
   * ═══════════════════════════════════════════════════════════════════════════ */

  const TTS = {
    state: "idle",     // "idle" | "playing" | "paused"
    items: [],         // [{el, sentences:[str]}]
    pIdx:  0,          // current paragraph index
    sIdx:  0,          // current sentence index in paragraph
    speed: 1.0,
    voiceURI: "",
    utt:   null,
    keepAliveTimer: null,

    start(speed, voiceURI) {
      this.stop();
      if (!window.speechSynthesis) return;
      this.items    = this._collect();
      if (!this.items.length) return;
      this.pIdx     = 0;
      this.sIdx     = 0;
      this.speed    = speed    || 1.0;
      this.voiceURI = voiceURI || "";
      this.state    = "playing";
      Analytics.ttsUsed = true;
      this._keepAlive();
      this._speak();
    },

    pause() {
      if (this.state !== "playing") return;
      window.speechSynthesis.pause();
      this.state = "paused";
      this._stopKeepAlive();
    },

    resume() {
      if (this.state !== "paused") return;
      window.speechSynthesis.resume();
      this.state = "playing";
      this._keepAlive();
    },

    stop() {
      window.speechSynthesis?.cancel();
      this._clearHL();
      this._stopKeepAlive();
      this.state = "idle";
      this.utt   = null;
      this.items = [];
      this.pIdx  = this.sIdx = 0;
    },

    getStatus() {
      return {
        ok:     true,
        state:  this.state,
        pIdx:   this.pIdx,
        sIdx:   this.sIdx,
        totalP: this.items.length,
        totalS: this.items[this.pIdx]?.sentences.length || 0
      };
    },

    getVoices() {
      return (window.speechSynthesis?.getVoices() || [])
        .filter(v => v.lang.toLowerCase().startsWith("en"))
        .map(v => ({ name: v.name, uri: v.voiceURI, local: v.localService }));
    },

    _collect() {
      const CONTENT_SELS = [
        "article", '[role="article"]', "main", '[role="main"]',
        ".mw-parser-output", ".post-content", ".entry-content",
        ".article-content", ".story-body", ".article-body"
      ];
      let root = null;
      for (const sel of CONTENT_SELS) {
        const el = document.querySelector(sel);
        if (el && el.querySelectorAll("p").length >= 2) { root = el; break; }
      }
      root = root || document.body;

      return Array.from(root.querySelectorAll("h1,h2,h3,p"))
        .filter(el => el.textContent.trim().length > 15)
        .map(el => ({
          el,
          sentences: (el.textContent.match(/[^.!?]+[.!?]*/g) || [el.textContent])
            .map(t => t.trim()).filter(t => t.length > 5)
        }))
        .filter(item => item.sentences.length > 0);
    },

    _speak() {
      if (this.state !== "playing") return;
      if (this.pIdx >= this.items.length) { this._finish(); return; }

      const item = this.items[this.pIdx];
      if (this.sIdx === 0) this._highlightPara(item.el);

      if (this.sIdx >= item.sentences.length) {
        this.pIdx++;
        this.sIdx = 0;
        this._speak();
        return;
      }

      const utt  = new SpeechSynthesisUtterance(item.sentences[this.sIdx]);
      utt.rate   = this.speed;
      utt.lang   = document.documentElement.lang || "en-US";

      if (this.voiceURI) {
        const v = window.speechSynthesis.getVoices()
          .find(vv => vv.voiceURI === this.voiceURI);
        if (v) utt.voice = v;
      }

      utt.onend = () => {
        if (this.state !== "playing") return;
        this.sIdx++;
        this._speak();
      };
      utt.onerror = ev => {
        if (ev.error === "interrupted" || ev.error === "canceled") return;
        console.warn("[DR TTS] Error:", ev.error);
        this._finish();
      };

      this.utt = utt;
      window.speechSynthesis.speak(utt);
    },

    _finish() {
      this._clearHL();
      this._stopKeepAlive();
      this.state = "idle";
      this.utt   = null;
    },

    _highlightPara(el) {
      this._clearHL();
      el.classList.add(CLS_TTS);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    },

    _clearHL() {
      document.querySelectorAll(`.${CLS_TTS}`)
        .forEach(el => el.classList.remove(CLS_TTS));
    },

    _keepAlive() {
      this._stopKeepAlive();
      this.keepAliveTimer = setInterval(() => {
        if (this.state === "playing" && window.speechSynthesis.speaking)
          window.speechSynthesis.resume();
      }, 10000);
    },

    _stopKeepAlive() {
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   * §10  APPLY SETTINGS — single orchestration entry point
   * ═══════════════════════════════════════════════════════════════════════════ */

  let currentSettings = { ...DEFAULTS };

  function applySettings(raw) {
    // popup.js stamps all profile values onto cur before broadcasting,
    // so we simply merge with DEFAULTS here — no special profile handling needed.
    const s = Object.assign({}, DEFAULTS, raw);
    currentSettings = s;

    if (s.enabled) {
      injectStyles(s);
      Analytics.startWordTracking();
      s.guideEnabled ? enableGuide(s) : disableGuide();
      if (s.focusFollow) {
        disableFocusMode();
        enableAutoFocusFollow();
      } else if (s.focusMode) {
        disableAutoFocusFollow();
        enableFocusMode();
      } else {
        disableFocusMode();
        disableAutoFocusFollow();
      }
    } else {
      removeStyles();
      disableGuide();
      disableFocusMode();
      disableAutoFocusFollow();
      TTS.stop();
      Analytics.stopWordTracking();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * §11  MESSAGE LISTENER  (popup → content script)
   * ═══════════════════════════════════════════════════════════════════════════ */

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    switch (msg.type) {

      case "DR_APPLY_SETTINGS":
        applySettings(msg.settings);
        reply({ ok: true });
        break;

      case "DR_GET_ANALYTICS":
        reply(Analytics.toObject());
        break;

      case "DR_TTS_COMMAND":
        switch (msg.action) {
          case "start":  TTS.start(msg.speed, msg.voiceURI); break;
          case "pause":  TTS.pause();  break;
          case "resume": TTS.resume(); break;
          case "stop":   TTS.stop();   break;
        }
        reply(TTS.getStatus());
        break;

      case "DR_TTS_GET_STATUS":
        reply(TTS.getStatus());
        break;

      case "DR_TTS_GET_VOICES": {
        let voices = TTS.getVoices();
        if (!voices.length) {
          // Voices load asynchronously on first access — retry once
          setTimeout(() => {
            try {
              chrome.runtime.sendMessage({
                type: "DR_VOICES_READY", voices: TTS.getVoices()
              });
            } catch (_) {}
          }, 350);
        }
        reply({ ok: true, voices });
        break;
      }
    }
    return true; // keep channel open for async reply
  });

  /* ═══════════════════════════════════════════════════════════════════════════
   * §12  SCROLL ANALYTICS  (throttled — at most once per 400ms)
   * ═══════════════════════════════════════════════════════════════════════════ */

  let scrollTimer = null;
  document.addEventListener("scroll", () => {
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => {
      Analytics.logScroll(window.scrollY);
      scrollTimer = null;
    }, 400);
  }, { passive: true });

  /* ═══════════════════════════════════════════════════════════════════════════
   * §13  INIT — read saved state and apply on page load
   * ═══════════════════════════════════════════════════════════════════════════ */

  function init() {
    try {
      chrome.storage.local.get(DEFAULTS, saved => {
        if (chrome.runtime.lastError) {
          console.warn("[DR] Storage error:", chrome.runtime.lastError);
          return;
        }
        applySettings(Object.assign({}, DEFAULTS, saved));
      });
    } catch (e) {
      // Extension context invalidated during hot-reload — fail silently
      console.warn("[DR] Init skipped (context invalidated):", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();
