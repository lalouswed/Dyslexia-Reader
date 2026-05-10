<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dyslexia Reader</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:    #EDEAE6; --card:  #FFFFFF; --card2: #F6F3F0; --card3: #ECE8E3;
      --bdr:   #D8D4CE; --bdr2:  #C2BEB8;
      --t1:    #1C1917; --t2:    #57534E; --t3:    #A8A29E;
      --acc:   #2563EB; --acc-d: #1D4ED8; --acc-l: #EFF6FF; --acc-t: #1E40AF;
      --green: #16A34A; --green-l: #F0FDF4;
      --red:   #DC2626; --red-l:   #FEF2F2;
      --tts:   #0891B2; --tts-l:   #ECFEFF; --tts-t: #164E63;
      --amber: #D97706;
      --r: 9px; --r-sm: 6px;
      --sh: 0 1px 2px rgba(0,0,0,.05), 0 3px 10px rgba(0,0,0,.08);
      --sh-s: 0 1px 3px rgba(0,0,0,.09);
      --dur: 0.18s; --ease: cubic-bezier(.4,0,.2,1);
    }
    body { width:368px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif; font-size:12.5px; background:var(--bg); color:var(--t1); line-height:1.45; }

    /* Header */
    .hdr { background:linear-gradient(140deg,#1E3A8A 0%,#2563EB 58%,#3B82F6 100%); padding:14px 14px 13px; display:flex; align-items:center; gap:10px; }
    .hdr-logo { width:36px; height:36px; flex-shrink:0; background:rgba(255,255,255,.16); border-radius:9px; display:flex; align-items:center; justify-content:center; }
    .hdr-logo svg { width:19px; height:19px; fill:#fff; }
    .hdr-copy { flex:1; min-width:0; }
    .hdr-title   { color:#fff; font-size:14.5px; font-weight:700; letter-spacing:-.015em; }
    .hdr-tagline { color:rgba(255,255,255,.55); font-size:10px; margin-top:1px; }
    .hdr-right   { display:flex; align-items:center; gap:8px; }
    .hdr-lbl     { font-size:10px; font-weight:700; color:rgba(255,255,255,.78); }

    /* Status */
    .sbar { display:flex; align-items:center; justify-content:space-between; padding:7px 14px; background:var(--card); border-bottom:1px solid var(--bdr); }
    .pill { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:2px 9px; border-radius:20px; transition:background var(--dur),color var(--dur); }
    .pill.off { background:var(--red-l); color:var(--red); }
    .pill.on  { background:var(--green-l); color:var(--green); }
    .pill-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
    .sbar-right { font-size:10px; color:var(--t3); }

    /* Preview */
    .prev-wrap { border-bottom:1px solid var(--bdr); }
    .prev-hd { display:flex; align-items:center; justify-content:space-between; padding:5px 14px; background:var(--card2); border-bottom:1px solid var(--bdr); font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--t3); }
    .prev-badge { font-size:9px; font-weight:700; background:var(--acc-l); color:var(--acc-t); padding:1px 8px; border-radius:10px; }
    .prev-body { padding:12px 14px; background:#fff; min-height:52px; }
    #prevText { display:block; font-size:13px; line-height:1.65; letter-spacing:.05em; word-spacing:.12em; color:#1C1917; transition:all 0.22s ease; }

    /* Tabs */
    .nav { display:flex; background:var(--card2); border-bottom:1px solid var(--bdr); padding:0 8px; }
    .tab { display:flex; align-items:center; gap:4px; padding:9px 9px 8px; font-size:10.5px; font-weight:600; color:var(--t3); border:none; background:transparent; cursor:pointer; font-family:inherit; border-bottom:2px solid transparent; white-space:nowrap; transition:color var(--dur),border-color var(--dur); }
    .tab svg { width:12px; height:12px; fill:currentColor; }
    .tab:hover { color:var(--t2); }
    .tab.on { color:var(--acc); border-bottom-color:var(--acc); }

    /* Panels */
    .panel { display:none; padding-bottom:6px; }
    .panel.on { display:block; }
    .sbody { transition:opacity var(--dur) var(--ease),filter var(--dur) var(--ease); }
    .sbody.off { opacity:.28; pointer-events:none; filter:grayscale(.4); }

    /* Card */
    .card { background:var(--card); margin:8px 10px 0; border-radius:var(--r); border:1px solid var(--bdr); overflow:hidden; box-shadow:var(--sh); }
    .card-hd { background:var(--card2); border-bottom:1px solid var(--bdr); padding:6px 13px; font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--t2); display:flex; align-items:center; justify-content:space-between; }
    .card-body { padding:12px 13px; display:flex; flex-direction:column; gap:10px; }

    /* Onboarding */
    .onboarding-card { margin:10px 10px 0; border-radius:var(--r); border:1.5px solid #C7D2FE; background:linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%); overflow:hidden; box-shadow:0 2px 12px rgba(99,102,241,.12); }
    .ob-inner { padding:13px 14px 11px; }
    .ob-title { font-size:12.5px; font-weight:700; color:#3730A3; margin-bottom:4px; }
    .ob-desc  { font-size:10.5px; color:#4338CA; line-height:1.5; }
    .ob-items { margin-top:7px; display:flex; flex-direction:column; gap:3px; }
    .ob-item  { font-size:10.5px; color:#3730A3; display:flex; align-items:center; gap:5px; }
    .ob-dot   { width:4px; height:4px; border-radius:50%; background:#6366F1; flex-shrink:0; }
    .ob-btns  { padding:9px 14px 11px; display:flex; gap:7px; border-top:1px solid #C7D2FE; }
    .ob-apply { flex:1; padding:6px 0; border-radius:var(--r-sm); background:#4F46E5; color:#fff; border:none; font-size:11.5px; font-weight:700; cursor:pointer; font-family:inherit; transition:background var(--dur),transform .1s; }
    .ob-apply:hover  { background:#4338CA; }
    .ob-apply:active { transform:scale(.97); }
    .ob-dismiss { padding:6px 12px; border-radius:var(--r-sm); background:transparent; color:#6366F1; border:1.5px solid #A5B4FC; font-size:11px; font-weight:600; cursor:pointer; font-family:inherit; transition:background var(--dur); }
    .ob-dismiss:hover { background:rgba(99,102,241,.08); }

    /* Toggle switch */
    .sw { position:relative; display:inline-block; flex-shrink:0; }
    .sw input { opacity:0; width:0; height:0; position:absolute; }
    .sw-t { display:block; background:#CBD5E1; border-radius:999px; cursor:pointer; transition:background .2s var(--ease); position:relative; }
    .sw-t::before { content:''; position:absolute; background:#fff; border-radius:50%; transition:transform .2s var(--ease); box-shadow:0 1px 4px rgba(0,0,0,.22); }
    input:checked + .sw-t { background:var(--acc); }
    input:focus-visible + .sw-t { outline:2px solid var(--acc); outline-offset:2px; }
    .sw-lg .sw-t { width:44px; height:25px; }
    .sw-lg .sw-t::before { width:19px; height:19px; top:3px; left:3px; }
    .sw-lg input:checked + .sw-t::before { transform:translateX(19px); }
    .sw-md .sw-t { width:38px; height:22px; }
    .sw-md .sw-t::before { width:16px; height:16px; top:3px; left:3px; }
    .sw-md input:checked + .sw-t::before { transform:translateX(16px); }

    /* Toggle row */
    .tr { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .tr-info { flex:1; min-width:0; }
    .tr-name { font-size:12px; font-weight:600; }
    .tr-desc { font-size:10.5px; color:var(--t3); margin-top:2px; line-height:1.4; }

    /* Font selector */
    .font-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    .font-opt { border:2px solid var(--bdr); border-radius:var(--r-sm); padding:10px 10px 9px; cursor:pointer; background:var(--card); font-family:inherit; text-align:left; transition:border-color var(--dur),background var(--dur),transform .1s; }
    .font-opt:hover  { border-color:var(--bdr2); background:var(--card2); }
    .font-opt:active { transform:scale(.97); }
    .font-opt.on     { border-color:var(--acc); background:var(--acc-l); }
    .font-opt-name   { font-size:12px; font-weight:700; color:var(--t1); margin-bottom:2px; }
    .font-opt.on .font-opt-name { color:var(--acc-t); }
    .font-opt-sample { font-size:16px; color:var(--t2); line-height:1.2; margin-bottom:3px; }
    .font-opt-desc   { font-size:9.5px; color:var(--t3); line-height:1.4; }
    [data-font="opendyslexic"] .font-opt-sample { font-family:"ODPreview",Arial,sans-serif; }
    [data-font="lexend"]       .font-opt-sample { font-family:"LXPreview",Arial,sans-serif; }
    [data-font="atkinson"]     .font-opt-sample { font-family:"ATPreview",Arial,sans-serif; }

    /* Theme chips */
    .theme-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    .tc { border:2px solid var(--bdr); border-radius:var(--r-sm); padding:8px 10px 7px; display:flex; align-items:center; gap:8px; cursor:pointer; background:var(--card); font-family:inherit; font-size:12px; font-weight:600; color:var(--t2); transition:border-color var(--dur),background var(--dur),transform .1s; }
    .tc:hover  { border-color:var(--bdr2); background:var(--card2); }
    .tc:active { transform:scale(.97); }
    .tc.on     { border-color:var(--acc); background:var(--acc-l); color:var(--acc-t); }
    .tc-swatch { width:22px; height:22px; border-radius:5px; border:1px solid rgba(0,0,0,.12); flex-shrink:0; }

    /* Profiles */
    .profile-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    .prof { border:2px solid var(--bdr); border-radius:var(--r-sm); padding:10px 10px 9px; cursor:pointer; background:var(--card); font-family:inherit; text-align:left; transition:border-color var(--dur),background var(--dur),transform .1s; }
    .prof:hover  { border-color:var(--bdr2); background:var(--card2); }
    .prof:active { transform:scale(.97); }
    .prof.on     { border-color:var(--acc); background:var(--acc-l); }
    .prof-ico    { font-size:18px; margin-bottom:4px; }
    .prof-name   { font-size:11.5px; font-weight:700; color:var(--t1); }
    .prof.on .prof-name { color:var(--acc-t); }
    .prof-desc   { font-size:9.5px; color:var(--t3); margin-top:2px; line-height:1.4; }

    /* Slider */
    .sl { display:flex; flex-direction:column; gap:5px; }
    .sl-hd { display:flex; justify-content:space-between; align-items:center; }
    .sl-lbl { font-size:11.5px; font-weight:600; display:flex; align-items:center; gap:4px; }
    .sl-rec { font-size:9.5px; color:var(--t3); font-weight:400; }
    .sl-val { font-size:10.5px; font-weight:700; color:var(--acc); background:var(--acc-l); padding:1px 8px; border-radius:10px; min-width:54px; text-align:center; }
    input[type="range"] { -webkit-appearance:none; width:100%; height:4px; border-radius:4px; background:var(--bdr); cursor:pointer; outline:none; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:15px; height:15px; border-radius:50%; background:var(--acc); box-shadow:0 0 0 3px rgba(37,99,235,.13); transition:transform .15s,box-shadow .15s; }
    input[type="range"]:hover::-webkit-slider-thumb { transform:scale(1.2); box-shadow:0 0 0 4px rgba(37,99,235,.2); }

    /* Segment control */
    .seg { display:flex; background:var(--card2); border:1px solid var(--bdr); border-radius:var(--r-sm); padding:2px; }
    .seg-btn { flex:1; padding:5px 0; border-radius:4px; border:none; background:transparent; font-size:11px; font-weight:600; color:var(--t2); cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:4px; transition:background var(--dur),color var(--dur); }
    .seg-btn svg { width:11px; height:11px; fill:currentColor; }
    .seg-btn.on { background:var(--card); color:var(--acc); box-shadow:var(--sh-s); }

    .div { height:1px; background:var(--bdr); margin:0 -13px; }
    .keyhint { display:flex; align-items:center; gap:4px; font-size:10px; color:var(--t3); }
    .kbd { background:var(--card3); border:1px solid var(--bdr); border-radius:3px; padding:0 4px; font-size:9px; font-family:monospace; color:var(--t2); font-weight:700; }

    /* TTS */
    .tts-status { display:flex; align-items:center; gap:7px; padding:9px 11px; border-radius:var(--r-sm); background:var(--tts-l); border:1px solid #A5F3FC; font-size:11.5px; font-weight:600; color:var(--tts-t); transition:background .2s; }
    .tts-status.playing { background:#D0F8FF; border-color:#22D3EE; }
    .tts-status.paused  { background:#FFFBEB; border-color:#FCD34D; color:#92400E; }
    .tts-dot { width:8px; height:8px; border-radius:50%; background:var(--tts); flex-shrink:0; }
    .tts-status.playing .tts-dot { background:#06B6D4; animation:tpulse 1.2s ease-in-out infinite; }
    .tts-status.paused  .tts-dot { background:var(--amber); }
    @keyframes tpulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6} }
    .tts-prog { font-size:10px; color:var(--t3); text-align:center; }
    .tts-btns { display:flex; gap:6px; }
    .tts-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 0; border-radius:var(--r-sm); border:1.5px solid var(--bdr); background:var(--card); font-size:12px; font-weight:700; color:var(--t1); cursor:pointer; font-family:inherit; transition:background var(--dur),border-color var(--dur),color var(--dur),transform .1s; }
    .tts-btn:hover  { border-color:var(--bdr2); background:var(--card2); }
    .tts-btn:active { transform:scale(.96); }
    .tts-btn:disabled { opacity:.35; cursor:not-allowed; pointer-events:none; }
    .tts-btn.primary { background:var(--tts); border-color:var(--tts); color:#fff; }
    .tts-btn.primary:hover { background:#0E7490; border-color:#0E7490; }
    .tts-ico { font-size:14px; line-height:1; }
    .tts-meta { display:flex; flex-direction:column; gap:8px; }
    .tts-row  { display:flex; align-items:center; gap:8px; }
    .tts-row-lbl { font-size:11px; font-weight:600; color:var(--t2); white-space:nowrap; min-width:36px; }
    .spd-seg { flex:1; display:flex; background:var(--card2); border:1px solid var(--bdr); border-radius:var(--r-sm); padding:2px; }
    .spd-btn { flex:1; padding:4px 0; border-radius:4px; border:none; background:transparent; font-size:10.5px; font-weight:700; color:var(--t2); cursor:pointer; font-family:inherit; transition:background var(--dur),color var(--dur); }
    .spd-btn.on { background:var(--tts); color:#fff; box-shadow:var(--sh-s); }
    .voice-sel { flex:1; padding:5px 8px; border:1px solid var(--bdr); border-radius:var(--r-sm); font-size:11px; font-family:inherit; background:var(--card); color:var(--t1); outline:none; cursor:pointer; }
    .voice-sel:focus { border-color:var(--acc); }

    /* Stats */
    .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    .stat { background:var(--card); border:1px solid var(--bdr); border-radius:var(--r-sm); padding:10px 12px; box-shadow:var(--sh-s); }
    .stat-lbl { font-size:9px; font-weight:700; color:var(--t3); text-transform:uppercase; letter-spacing:.07em; }
    .stat-val  { font-size:18px; font-weight:800; margin-top:3px; letter-spacing:-.02em; }
    .stat-sub  { font-size:9px; color:var(--t3); margin-top:1px; }
    .p-slow  { color:#7C3AED; } .p-medium { color:#0284C7; } .p-fast { color:var(--green); }
    .u-high  { color:var(--acc); } .u-none { color:var(--t3); }
    .refresh-btn { display:flex; align-items:center; gap:5px; justify-content:center; margin:8px 10px 0; padding:7px; border-radius:var(--r-sm); background:var(--card); border:1px solid var(--bdr); font-size:11px; font-weight:600; color:var(--t2); cursor:pointer; font-family:inherit; transition:background var(--dur),color var(--dur); }
    .refresh-btn:hover { background:var(--card2); color:var(--t1); }
    .refresh-btn svg { width:12px; height:12px; fill:currentColor; }

    /* Footer */
    .footer { display:flex; align-items:center; justify-content:space-between; padding:9px 10px 14px; }
    .ver { font-size:10px; color:var(--t3); }
    .reset-btn { display:flex; align-items:center; gap:4px; font-size:10.5px; font-weight:600; color:var(--t2); background:var(--card2); border:1px solid var(--bdr); border-radius:6px; padding:4px 10px; cursor:pointer; font-family:inherit; transition:background var(--dur),color var(--dur),transform .1s; }
    .reset-btn:hover  { background:var(--card3); color:var(--t1); }
    .reset-btn:active { transform:scale(.95); }
    .reset-btn svg    { width:10px; height:10px; fill:currentColor; }
  </style>
</head>
<body>

<header class="hdr">
  <div class="hdr-logo" aria-hidden="true">
    <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
  </div>
  <div class="hdr-copy">
    <div class="hdr-title">Dyslexia Reader</div>
    <div class="hdr-tagline">Accessibility reading assistant</div>
  </div>
  <div class="hdr-right">
    <span class="hdr-lbl" id="hdrLbl">Off</span>
    <label class="sw sw-lg" aria-label="Enable Dyslexia Reader">
      <input type="checkbox" id="mainToggle">
      <span class="sw-t"></span>
    </label>
  </div>
</header>

<div class="sbar">
  <div class="pill off" id="pill" role="status" aria-live="polite">
    <span class="pill-dot" aria-hidden="true"></span>
    <span id="pillTxt">Disabled</span>
  </div>
  <div class="sbar-right">v12</div>
</div>

<div class="prev-wrap">
  <div class="prev-hd">Live Preview <span class="prev-badge" id="prevBadge">Default</span></div>
  <div class="prev-body" id="prevBody">
    <span id="prevText">Reading becomes clearer. Letters like a, b, d, p and q are easier to tell apart.</span>
  </div>
</div>

<nav class="nav" role="tablist">
  <button class="tab on" data-tab="reading" role="tab" aria-selected="true">
    <svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h2v8l2.5-1.5L13 12V4h5v16z"/></svg>
    Reading
  </button>
  <button class="tab" data-tab="guide" role="tab" aria-selected="false">
    <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
    Focus &amp; Guide
  </button>
  <button class="tab" data-tab="tools" role="tab" aria-selected="false">
    <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
    Read Aloud
  </button>
  <button class="tab" data-tab="stats" role="tab" aria-selected="false">
    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
    Stats
  </button>
</nav>

<!-- First-time onboarding -->
<div class="onboarding-card" id="onboardCard" style="display:none;">
  <div class="ob-inner">
    <div class="ob-title">✨ Recommended settings for dyslexia</div>
    <div class="ob-desc">A helpful starting point for comfortable reading:</div>
    <div class="ob-items">
      <div class="ob-item"><span class="ob-dot"></span> Sepia theme — reduces eye strain</div>
      <div class="ob-item"><span class="ob-dot"></span> Comfortable spacing — relaxed line height</div>
      <div class="ob-item"><span class="ob-dot"></span> Lexend font — clear, open letterforms</div>
    </div>
  </div>
  <div class="ob-btns">
    <button class="ob-apply"   id="obApplyBtn">Apply Recommended</button>
    <button class="ob-dismiss" id="obDismissBtn">Dismiss</button>
  </div>
</div>

<div class="sbody off" id="sbody">

<!-- READING TAB -->
<div class="panel on" id="panel-reading" role="tabpanel">

  <div class="card">
    <div class="card-hd">Reading Font</div>
    <div class="card-body">
      <div class="font-grid" role="group" aria-label="Reading font">
        <button class="font-opt on" data-font="none" aria-pressed="true">
          <div class="font-opt-name">Default</div>
          <div class="font-opt-sample" style="font-family:inherit;">Aa Bb</div>
          <div class="font-opt-desc">Site's own font</div>
        </button>
        <button class="font-opt" data-font="opendyslexic" aria-pressed="false">
          <div class="font-opt-name">OpenDyslexic</div>
          <div class="font-opt-sample">Aa Bb</div>
          <div class="font-opt-desc">Weighted letterforms</div>
        </button>
        <button class="font-opt" data-font="lexend" aria-pressed="false">
          <div class="font-opt-name">Lexend</div>
          <div class="font-opt-sample">Aa Bb</div>
          <div class="font-opt-desc">Clear humanist sans</div>
        </button>
        <button class="font-opt" data-font="atkinson" aria-pressed="false">
          <div class="font-opt-name">Atkinson</div>
          <div class="font-opt-sample">Aa Bb</div>
          <div class="font-opt-desc">Geometric, legible</div>
        </button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">Page Theme</div>
    <div class="card-body">
      <div class="theme-grid" role="group" aria-label="Page theme">
        <button class="tc on" data-theme="light" aria-pressed="true">
          <div class="tc-swatch" style="background:#FFFFFF;"></div>Light
        </button>
        <button class="tc" data-theme="sepia" aria-pressed="false">
          <div class="tc-swatch" style="background:#F4ECD8;"></div>Sepia
        </button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">Typography</div>
    <div class="card-body">
      <div class="sl">
        <div class="sl-hd"><span class="sl-lbl">Text Size <span class="sl-rec">· 110–120% optimal</span></span><span class="sl-val" id="fsV">Medium</span></div>
        <input type="range" id="fontSize" min="90" max="150" step="5" value="115">
      </div>
      <div class="div"></div>
      <div class="sl">
        <div class="sl-hd"><span class="sl-lbl">Line Spacing</span><span class="sl-val" id="lhV">Comfortable</span></div>
        <input type="range" id="lineHeight" min="140" max="200" step="5" value="165">
      </div>
      <div class="div"></div>
      <div class="sl">
        <div class="sl-hd"><span class="sl-lbl">Letter Spacing</span><span class="sl-val" id="lsV">Clear</span></div>
        <input type="range" id="letterSpacing" min="0" max="10" step="1" value="5">
      </div>
      <div class="div"></div>
      <div class="sl">
        <div class="sl-hd"><span class="sl-lbl">Word Spacing</span><span class="sl-val" id="wsV">Wide</span></div>
        <input type="range" id="wordSpacing" min="0" max="25" step="1" value="12">
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">Reading Profiles</div>
    <div class="card-body">
      <div class="profile-grid" role="group" aria-label="Reading profiles">
        <button class="prof on" data-profile="" aria-pressed="true">
          <div class="prof-ico">🔧</div>
          <div class="prof-name">Custom</div>
          <div class="prof-desc">Your own settings</div>
        </button>
        <button class="prof" data-profile="focused" aria-pressed="false">
          <div class="prof-ico">🎯</div>
          <div class="prof-name">Focus Mode</div>
          <div class="prof-desc">Ruler + paragraph focus</div>
        </button>
        <button class="prof" data-profile="longread" aria-pressed="false">
          <div class="prof-ico">🌙</div>
          <div class="prof-name">Long Reading</div>
          <div class="prof-desc">Sepia · Lexend · auto-scroll</div>
        </button>
        <button class="prof" data-profile="study" aria-pressed="false">
          <div class="prof-ico">📚</div>
          <div class="prof-name">Study Mode</div>
          <div class="prof-desc">Fixed ruler · scroll follow</div>
        </button>
        <button class="prof" data-profile="minimal" aria-pressed="false">
          <div class="prof-ico">✦</div>
          <div class="prof-name">Minimal</div>
          <div class="prof-desc">Light spacing only</div>
        </button>
      </div>
    </div>
  </div>

</div>

<!-- FOCUS & GUIDE TAB -->
<div class="panel" id="panel-guide" role="tabpanel">

  <div class="card">
    <div class="card-hd">Smart Reading Guide</div>
    <div class="card-body">
      <div class="tr">
        <div class="tr-info">
          <div class="tr-name">Reading Ruler</div>
          <div class="tr-desc">Soft horizontal band — helps track the current line</div>
        </div>
        <label class="sw sw-md" aria-label="Enable reading ruler">
          <input type="checkbox" id="guideToggle"><span class="sw-t"></span>
        </label>
      </div>
      <div class="div"></div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="font-size:11px;font-weight:600;color:var(--t2)">Ruler Mode</div>
        <div class="seg" role="group">
          <button class="seg-btn on" data-gm="mouse" aria-pressed="true">
            <svg viewBox="0 0 24 24"><path d="M13.49 5.48c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3.6 13.9l-4-4-.7.7 4 4 .7-.7zm6.6-.7l-4 4 .7.7 4-4-.7-.7zM10 6H4v2h6V6zm0 4H4v2h6v-2zm10 0h-6v2h6v-2zm0-4h-6v2h6V6z"/></svg>
            Mouse Follow
          </button>
          <button class="seg-btn" data-gm="fixed" aria-pressed="false">
            <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
            Fixed Line
          </button>
        </div>
        <div class="keyhint" id="fixedHint" style="display:none">
          Move with <span class="kbd">↑</span> <span class="kbd">↓</span> keys
        </div>
      </div>
      <div class="div"></div>
      <div class="sl">
        <div class="sl-hd"><span class="sl-lbl">Band Height</span><span class="sl-val" id="ghV">2.6em</span></div>
        <input type="range" id="guideHeight" min="10" max="50" step="2" value="26">
      </div>
      <div class="sl">
        <div class="sl-hd"><span class="sl-lbl">Band Opacity</span><span class="sl-val" id="goV">22%</span></div>
        <input type="range" id="guideOpacity" min="4" max="45" step="1" value="22">
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">Focus Mode</div>
    <div class="card-body">
      <div class="tr">
        <div class="tr-info">
          <div class="tr-name">Paragraph Focus</div>
          <div class="tr-desc">Gently elevates the paragraph you hover over</div>
        </div>
        <label class="sw sw-md" aria-label="Paragraph focus">
          <input type="checkbox" id="focusToggle"><span class="sw-t"></span>
        </label>
      </div>
      <div class="div"></div>
      <div class="tr">
        <div class="tr-info">
          <div class="tr-name">Auto-Follow Scroll</div>
          <div class="tr-desc">Highlights the paragraph nearest screen centre as you scroll</div>
        </div>
        <label class="sw sw-md" aria-label="Auto-follow scroll">
          <input type="checkbox" id="focusFollowToggle"><span class="sw-t"></span>
        </label>
      </div>
      <div class="div"></div>
      <div class="sl">
        <div class="sl-hd">
          <span class="sl-lbl">Context Visibility <span class="sl-rec">· higher = more context</span></span>
          <span class="sl-val" id="dimV">Balanced</span>
        </div>
        <input type="range" id="dimStrength" min="55" max="88" step="1" value="62">
      </div>
    </div>
  </div>

</div>

<!-- READ ALOUD TAB -->
<div class="panel" id="panel-tools" role="tabpanel">
  <div class="card" style="margin-top:8px;">
    <div class="card-hd">Read Aloud</div>
    <div class="card-body">
      <div class="tts-status" id="ttsStatus">
        <span class="tts-dot"></span>
        <span id="ttsStatusTxt">Ready to read</span>
      </div>
      <div class="tts-prog" id="ttsProg" style="display:none">
        Para <span id="ttsP">0</span>/<span id="ttsPT">0</span> · Sentence <span id="ttsS">0</span>/<span id="ttsST">0</span>
      </div>
      <div class="tts-btns">
        <button class="tts-btn primary" id="ttsPlayBtn"><span class="tts-ico">▶</span> Read Page</button>
        <button class="tts-btn" id="ttsStopBtn" disabled><span class="tts-ico">⏹</span> Stop</button>
      </div>
      <div class="tts-meta">
        <div class="tts-row">
          <span class="tts-row-lbl">Speed</span>
          <div class="spd-seg" role="group" aria-label="Speed">
            <button class="spd-btn" data-spd="0.75">0.75×</button>
            <button class="spd-btn" data-spd="0.9">0.9×</button>
            <button class="spd-btn on" data-spd="1.0">1.0×</button>
            <button class="spd-btn" data-spd="1.25">1.25×</button>
            <button class="spd-btn" data-spd="1.5">1.5×</button>
          </div>
        </div>
        <div class="tts-row">
          <span class="tts-row-lbl">Voice</span>
          <select class="voice-sel" id="voiceSel"><option value="">Default voice</option></select>
        </div>
      </div>
    </div>
  </div>
  <div style="margin:8px 10px 0;padding:10px 13px;background:var(--tts-l);border:1px solid #A5F3FC;border-radius:var(--r-sm);font-size:10.5px;color:var(--tts-t);line-height:1.6;">
    Uses the browser's built-in speech engine — offline, no internet required.
  </div>
</div>

<!-- STATS TAB -->
<div class="panel" id="panel-stats" role="tabpanel">
  <div style="padding:8px 10px 0;">
    <div class="stat-grid">
      <div class="stat"><div class="stat-lbl">Time Reading</div><div class="stat-val" id="sTime">—</div><div class="stat-sub">this session</div></div>
      <div class="stat"><div class="stat-lbl">Words Read</div><div class="stat-val" id="sWords">—</div><div class="stat-sub">estimated</div></div>
      <div class="stat"><div class="stat-lbl">Reading Pace</div><div class="stat-val" id="sPace">—</div><div class="stat-sub" id="sPaceSub">measuring…</div></div>
      <div class="stat"><div class="stat-lbl">Focus Usage</div><div class="stat-val" id="sFocus">—</div><div class="stat-sub" id="sFocusSub">activations</div></div>
    </div>
  </div>
  <button class="refresh-btn" id="refreshBtn">
    <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
    Refresh
  </button>
</div>

</div><!-- /sbody -->

<div class="footer">
  <span class="ver">Dyslexia Reader v12</span>
  <button class="reset-btn" id="resetBtn">
    <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
    Reset
  </button>
</div>

<script src="popup.js"></script>
</body>
</html>
