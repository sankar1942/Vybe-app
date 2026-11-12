// ================= VYBE PHASE 1 NEXT-GEN FEATURES =================
let activeMoodFilter = "all";
const voiceReactionsMap = new Map(); // postId -> array of { user, audioUrl }
let activeVoiceRecorder = null;
let activeVoicePostId = null;

function setMoodVibe(mood, btn) {
  activeMoodFilter = mood;
  document.body.setAttribute("data-mood", mood);
  document.querySelectorAll(".mood-chip").forEach((chip) => chip.classList.remove("active"));
  if (btn) btn.classList.add("active");
  applyMoodFilterToFeed();
  const labels = {
    all: "All Vibes",
    chill: "Late Night Chill 🌙",
    hustle: "Hustle Mode 🔥",
    energetic: "High Energy ⚡",
    latenight: "Midnight Lo-Fi 🎧"
  };
  if (typeof toast === "function") toast(`Vibe switched: ${labels[mood] || mood}`);
}

function applyMoodFilterToFeed() {
  const articles = document.querySelectorAll("#feed article.post");
  articles.forEach((article) => {
    if (activeMoodFilter === "all") {
      article.style.display = "";
      return;
    }
    const caption = (article.querySelector(".caption")?.textContent || "").toLowerCase();
    const moodTag = `#${activeMoodFilter}`;
    const matches =
      caption.includes(moodTag) ||
      (activeMoodFilter === "chill" && (caption.includes("night") || caption.includes("relax") || caption.includes("world"))) ||
      (activeMoodFilter === "hustle" && (caption.includes("work") || caption.includes("build") || caption.includes("code") || caption.includes("dream"))) ||
      (activeMoodFilter === "energetic" && (caption.includes("ride") || caption.includes("bike") || caption.includes("travel") || caption.includes("explore")));
    article.style.display = matches ? "" : "none";
  });
}

// 5-Sec Voice Reaction on Feed Posts
async function togglePostVoiceReaction(postId, btn) {
  const key = String(postId);
  if (activeVoiceRecorder && activeVoiceRecorder.state === "recording") {
    activeVoiceRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    if (typeof toast === "function") toast("Voice recording is not supported on this device.");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    activeVoiceRecorder = recorder;
    activeVoicePostId = key;
    if (btn) {
      btn.classList.add("recording");
      btn.textContent = "⏹ Stop (5s)";
    }
    recorder.addEventListener("dataavailable", (e) => {
      if (e.data?.size) chunks.push(e.data);
    });
    recorder.addEventListener("stop", async () => {
      stream.getTracks().forEach((t) => t.stop());
      activeVoiceRecorder = null;
      if (btn) {
        btn.classList.remove("recording");
        btn.textContent = "🎙 5s Voice";
      }
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (typeof toast === "function") toast("Uploading voice reaction...");
      try {
        const audioUrl = await uploadToCloudinary(
          new File([blob], `reaction-${Date.now()}.webm`, { type: blob.type })
        );
        const list = voiceReactionsMap.get(key) || [];
        list.push({ user: typeof currentProfile !== "undefined" && currentProfile ? currentProfile : "you", audioUrl });
        voiceReactionsMap.set(key, list);
        injectVoiceReactionsIntoFeed();
        if (typeof toast === "function") toast("🎙 Voice reaction added!");
      } catch (err) {
        console.error("Voice reaction error:", err);
        if (typeof toast === "function") toast("Could not upload voice reaction.");
      }
    }, { once: true });

    recorder.start();
    setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 5000);
  } catch (err) {
    if (typeof toast === "function") toast("Allow microphone access to drop a 5s voice reaction.");
  }
}

function injectVoiceReactionsIntoFeed() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const feedId = article.dataset.feedId || "";
    const id = feedId.split(":")[1] || "";
    if (!id) return;
    let bar = article.querySelector(".voice-reaction-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "voice-reaction-bar";
      const actions = article.querySelector(".actions");
      if (actions) actions.insertAdjacentElement("afterend", bar);
    }
    const existing = voiceReactionsMap.get(id) || [];
    const pillsHtml = existing
      .map(
        (item, idx) =>
          `<button type="button" class="voice-pill" onclick="playVoiceReaction('${item.audioUrl}')">▶ @${item.user} (${idx + 1})</button>`
      )
      .join("");
    bar.innerHTML = `<button type="button" class="voice-pill" onclick="togglePostVoiceReaction('${id}', this)">🎙 5s Voice</button>${pillsHtml}`;
  });
}

function playVoiceReaction(url) {
  const audio = new Audio(url);
  audio.play().catch(() => {});
}

// Time-Capsule Countdown & Auto-Unlock Enhancer
function enhanceTimeCapsulesInFeed() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    const match = raw.match(/\[CAPSULE:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\]/);
    if (!match) return;
    const unlockAt = new Date(match[1]).getTime();
    if (!Number.isFinite(unlockAt)) return;
    captionEl.innerHTML = captionEl.innerHTML.replace(match[0], "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage) return;

    if (Date.now() < unlockAt) {
      const originalHtml = stage.innerHTML;
      stage.dataset.capsuleOriginal = originalHtml;
      stage.innerHTML = `
        <div class="time-capsule-overlay">
          <span class="capsule-badge">⏳ TIME-CAPSULE LOCKED</span>
          <div class="capsule-timer" data-unlock-ts="${unlockAt}">Calculating...</div>
          <p style="font-size:12px;color:#94a3b8;">Unlocks automatically on ${new Date(unlockAt).toLocaleString()}</p>
        </div>`;
    }
  });
}

setInterval(() => {
  document.querySelectorAll(".capsule-timer[data-unlock-ts]").forEach((el) => {
    const unlockTs = Number(el.dataset.unlockTs);
    const diff = unlockTs - Date.now();
    if (diff <= 0) {
      const stage = el.closest(".post-media-stage");
      if (stage && stage.dataset.capsuleOriginal) {
        stage.innerHTML = stage.dataset.capsuleOriginal;
      }
      return;
    }
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(hrs).padStart(2, "0")}h : ${String(mins).padStart(2, "0")}m : ${String(secs).padStart(2, "0")}s`;
  });
}, 1000);

// Hook into renderFeed so Mood Filter, Voice Reactions & Time-Capsules stay active
if (typeof renderFeed === "function") {
  const _origRenderFeed = renderFeed;
  window.renderFeed = function () {
    _origRenderFeed.apply(this, arguments);
    enhanceTimeCapsulesInFeed();
    injectVoiceReactionsIntoFeed();
    applyMoodFilterToFeed();
  };
}

// Append selected mood & time-capsule metadata before createPost runs
if (typeof createPost === "function") {
  const _origCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const moodSelect = document.getElementById("postMoodSelect");
    const capsuleInput = document.getElementById("postCapsuleTime");
    if (captionEl) {
      let text = captionEl.value.trim();
      const moodVal = moodSelect?.value || "";
      if (moodVal && !text.toLowerCase().includes("#" + moodVal)) {
        text = `${text} #${moodVal}`.trim();
      }
      if (capsuleInput?.value) {
        text = `${text} [CAPSULE:${capsuleInput.value}]`.trim();
      }
      captionEl.value = text;
    }
    const res = await _origCreatePost.apply(this, arguments);
    if (moodSelect) moodSelect.value = "";
    if (capsuleInput) capsuleInput.value = "";
    return res;
  };
}



// ================= VYBE PHASE 2: RADAR, CO-WATCH MUSIC & DUAL-LAYER PROFILE =================

// 1. CO-WATCH LIVE MUSIC SYNC (Zero-Cost Ambient Synth + Stream Player)
const coWatchStations = [
  { id: "lofi", title: "🎧 Cyber Lo-Fi Radio", subtitle: "Chill coding & late-night beats", freq: 174 },
  { id: "synth", title: "🌌 Midnight Synthwave", subtitle: "Neon drive & cyber atmosphere", freq: 220 },
  { id: "focus", title: "⚡ Deep Focus Alpha", subtitle: "Hustle & creator flow state", freq: 285 },
  { id: "rain", title: "🌧️ Rainy Window & Vinyl", subtitle: "Warm peaceful background", freq: 146 }
];
let activeStation = coWatchStations[0];
let coWatchPlaying = false;
let coWatchAudioCtx = null;
let coWatchOsc = null;
let coWatchGain = null;

function openCoWatchModal() {
  const list = document.getElementById("coWatchStationList");
  if (list) {
    list.innerHTML = coWatchStations
      .map(
        (st) => `
        <button type="button" class="cowatch-station-item ${st.id === activeStation.id ? "active" : ""}" onclick="selectCoWatchStation('${st.id}')">
          <div>
            <strong style="display:block;font-size:13px;">${st.title}</strong>
            <small style="color:#94a3b8;font-size:11px;">${st.subtitle}</small>
          </div>
          <span>${st.id === activeStation.id && coWatchPlaying ? "🔊 Live" : "▶"}</span>
        </button>`
      )
      .join("");
  }
  if (typeof show === "function") show("coWatchModal");
}

function selectCoWatchStation(stationId) {
  const found = coWatchStations.find((s) => s.id === stationId);
  if (!found) return;
  activeStation = found;
  document.getElementById("coWatchTrackTitle").textContent = `${found.title} • Live Room`;
  document.getElementById("coWatchTrackSub").textContent = found.subtitle;
  if (!coWatchPlaying) {
    toggleCoWatchPlay(true);
  } else {
    restartCoWatchTone();
  }
  openCoWatchModal();
  if (typeof toast === "function") toast(`Synced to ${found.title}`);
}

function restartCoWatchTone() {
  stopCoWatchTone();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  coWatchAudioCtx = coWatchAudioCtx || new AudioCtx();
  if (coWatchAudioCtx.state === "suspended") coWatchAudioCtx.resume().catch(() => {});
  coWatchOsc = coWatchAudioCtx.createOscillator();
  coWatchGain = coWatchAudioCtx.createGain();
  coWatchOsc.type = "sine";
  coWatchOsc.frequency.setValueAtTime(activeStation.freq, coWatchAudioCtx.currentTime);
  coWatchGain.gain.setValueAtTime(0.03, coWatchAudioCtx.currentTime);
  coWatchOsc.connect(coWatchGain);
  coWatchGain.connect(coWatchAudioCtx.destination);
  coWatchOsc.start();
}

function stopCoWatchTone() {
  try {
    if (coWatchOsc) {
      coWatchOsc.stop();
      coWatchOsc.disconnect();
      coWatchOsc = null;
    }
  } catch (_) {}
}

function toggleCoWatchPlay(forcePlay) {
  coWatchPlaying = typeof forcePlay === "boolean" ? forcePlay : !coWatchPlaying;
  const bar = document.getElementById("coWatchBar");
  const btn = document.getElementById("coWatchPlayBtn");
  if (bar) bar.classList.toggle("playing", coWatchPlaying);
  if (btn) btn.textContent = coWatchPlaying ? "⏸" : "▶";
  if (coWatchPlaying) {
    restartCoWatchTone();
    if (typeof toast === "function") toast(`🎧 Listening live: ${activeStation.title}`);
  } else {
    stopCoWatchTone();
  }
}

// 2. PROXIMITY VIBE RADAR
function openVibeRadar() {
  if (typeof show === "function") show("vibeRadarModal");
  const pinsEl = document.getElementById("radarPins");
  const listEl = document.getElementById("radarUserList");
  const nearbyUsers = (typeof users !== "undefined" ? users : []).slice(0, 5);
  const positions = [
    { top: "24%", left: "34%", dist: "120m away", vibe: "🌙 Chill" },
    { top: "30%", left: "72%", dist: "280m away", vibe: "🔥 Hustle" },
    { top: "70%", left: "28%", dist: "450m away", vibe: "⚡ Riding" },
    { top: "68%", left: "74%", dist: "600m away", vibe: "🎧 Lo-Fi" }
  ];

  if (pinsEl) {
    pinsEl.innerHTML = nearbyUsers
      .slice(0, 4)
      .map((u, idx) => {
        const pos = positions[idx % positions.length];
        return `<div class="radar-pin" style="top:${pos.top};left:${pos.left}" title="@${u.username}" onclick="hide('vibeRadarModal');viewProfile('${u.id}')">
          <img src="${typeof avatarSrc === 'function' ? avatarSrc(u.pic) : u.pic}" alt="">
        </div>`;
      })
      .join("");
  }

  if (listEl) {
    listEl.innerHTML = nearbyUsers
      .slice(0, 4)
      .map((u, idx) => {
        const pos = positions[idx % positions.length];
        return `<div class="people glass" style="padding:10px 12px;margin:0;">
          <img class="avatar" src="${typeof avatarSrc === 'function' ? avatarSrc(u.pic) : u.pic}" alt="">
          <div style="flex:1;min-width:0;">
            <strong style="display:block;font-size:13px;">@${u.username}</strong>
            <small class="meta">${pos.vibe} • ${pos.dist}</small>
          </div>
          <button type="button" class="secondary" style="padding:6px 12px;font-size:11px;" onclick="hide('vibeRadarModal');openChat('${u.id}')">Wave 👋</button>
        </div>`;
      })
      .join("");
  }
}

function closeVibeRadar() {
  if (typeof hide === "function") hide("vibeRadarModal");
}

// 3. DUAL-LAYER PROFILE FLIP (Public Persona <-> Inner Circle Live Status)
let profileLayerMode = "public"; // "public" | "inner"
let myLiveStatus = localStorage.getItem("vybe:inner-status") || "💻 Building VYBE";

function toggleProfileLayer() {
  profileLayerMode = profileLayerMode === "public" ? "inner" : "public";
  if (typeof renderProfile === "function") renderProfile();
}

function setInnerCircleStatus(statusText) {
  myLiveStatus = statusText;
  try {
    localStorage.setItem("vybe:inner-status", statusText);
  } catch (_) {}
  if (typeof renderProfile === "function") renderProfile();
  if (typeof toast === "function") toast(`Inner Circle status: ${statusText}`);
}

if (typeof renderProfile === "function") {
  const _origRenderProfile = renderProfile;
  window.renderProfile = function () {
    _origRenderProfile.apply(this, arguments);
    const detailsEl = document.querySelector("#profileView .profile-details");
    if (!detailsEl) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dual-profile-toggle";
    btn.textContent =
      profileLayerMode === "public"
        ? "🔄 Flip to Inner Circle (Private Vibe)"
        : "🌐 Flip to Public Profile";
    btn.onclick = toggleProfileLayer;
    detailsEl.appendChild(btn);

    if (profileLayerMode === "inner") {
      const statuses = [
        "💻 Building VYBE",
        "🏍️ Out for a Ride",
        "🎧 Midnight Lo-Fi",
        "☕ Coffee Break",
        "🔥 Deep Hustle"
      ];
      const card = document.createElement("div");
      card.className = "inner-circle-card";
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:13px;color:#38bdf8;">🔒 Inner Circle Live Vibe</strong>
          <span style="font-size:11px;color:#94a3b8;">Close Friends Only</span>
        </div>
        <p style="font-size:14px;font-weight:700;margin-top:8px;color:#fff;">Current Status: ${myLiveStatus}</p>
        <div class="status-chip-row">
          ${statuses
            .map(
              (st) =>
                `<button type="button" class="status-chip ${st === myLiveStatus ? "active" : ""}" onclick="setInnerCircleStatus('${st}')">${st}</button>`
            )
            .join("")}
        </div>`;
      detailsEl.appendChild(card);
    }
  };
}



// ================= ACCOUNT INFO MODAL ("Since DD.MM.YYYY") =================
async function openAccountInfoModal(targetUserId) {
  const uid = String(targetUserId || currentUser?.id || "");
  const usernameEl = document.getElementById("profileInfoUsername");
  const dateEl = document.getElementById("profileJoinedDate");

  const formatDDMMYYYY = (isoStr) => {
    const d = isoStr ? new Date(isoStr) : new Date();
    if (Number.isNaN(d.getTime())) return "01.01.2026";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  if (usernameEl) usernameEl.textContent = "Loading...";
  if (dateEl) dateEl.textContent = "--.--.----";
  if (typeof show === "function") show("profileInfoModal");

  try {
    if (currentUser && uid === String(currentUser.id)) {
      if (usernameEl) usernameEl.textContent = `@${currentProfile || me.username || "user"}`;
      let created = currentUser.created_at;
      if (!created && isValidUserUuid(uid)) {
        const { data } = await supabaseClient.from("profiles").select("created_at").eq("id", uid).maybeSingle();
        if (data?.created_at) created = data.created_at;
      }
      if (dateEl) dateEl.textContent = formatDDMMYYYY(created);
      return;
    }

    const cached = (typeof users !== "undefined" ? users : []).find((u) => String(u.id) === uid);
    if (usernameEl) usernameEl.textContent = `@${cached?.username || "user"}`;

    if (isValidUserUuid(uid)) {
      const { data } = await supabaseClient.from("profiles").select("username, created_at").eq("id", uid).maybeSingle();
      if (data) {
        if (usernameEl && data.username) usernameEl.textContent = `@${data.username}`;
        if (dateEl) dateEl.textContent = formatDDMMYYYY(data.created_at);
        return;
      }
    }
    if (dateEl) dateEl.textContent = formatDDMMYYYY(cached?.created_at || "2026-01-01T00:00:00Z");
  } catch (err) {
    console.error("Account info lookup error:", err);
    if (dateEl) dateEl.textContent = formatDDMMYYYY(currentUser?.created_at);
  }
}

// ================= PERSISTENT REELS SOUND UNLOCK =================
// Once user taps/scrolls after unmuting (or unlocks audio once), every scrolled reel stays unmuted!
document.addEventListener("pointerdown", function unlockReelsAudioOnce() {
  if (window.isGlobalAudioUnmuted && typeof activeReelVideo !== "undefined" && activeReelVideo) {
    activeReelVideo.muted = false;
    activeReelVideo.volume = 1.0;
  }
}, { passive: true });
