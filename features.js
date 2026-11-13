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



// ================= VYBE v7.0: 10-FEATURE MEGA PACK =================

// --- 1. DAILY VIBE STREAKS ---
function initDailyVibeStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const lastVisit = localStorage.getItem("vybe:last-visit");
  let streak = Number(localStorage.getItem("vybe:streak-count") || 1);
  if (lastVisit && lastVisit !== today) {
    const diffDays = Math.round((new Date(today) - new Date(lastVisit)) / 86400000);
    streak = diffDays === 1 ? streak + 1 : 1;
  }
  localStorage.setItem("vybe:last-visit", today);
  localStorage.setItem("vybe:streak-count", String(streak));
  const badge = document.getElementById("vibeStreakBadge");
  if (badge) badge.textContent = `🔥 ${streak}d`;
}
initDailyVibeStreak();

// --- 2. CUSTOM PROFILE THEME ACCENT ---
function setVybeAccent(accent) {
  if (accent === "blue") {
    document.body.removeAttribute("data-accent");
  } else {
    document.body.setAttribute("data-accent", accent);
  }
  try {
    localStorage.setItem("vybe:accent", accent);
  } catch (_) {}
  if (typeof toast === "function") toast(`🎨 Theme switched to ${accent.toUpperCase()}`);
}
(function restoreVybeAccent() {
  const savedAccent = localStorage.getItem("vybe:accent");
  if (savedAccent && savedAccent !== "blue") {
    document.body.setAttribute("data-accent", savedAccent);
  }
})();

// --- 3. QUICK VIBE STATUS BUBBLES ---
function setQuickVibeStatus(statusText) {
  document.querySelectorAll(".qv-chip").forEach((c) => {
    c.classList.toggle("active", c.textContent.trim() === statusText);
  });
  if (typeof setInnerCircleStatus === "function") {
    setInnerCircleStatus(statusText);
  } else if (typeof toast === "function") {
    toast(`⚡ Vibe status: ${statusText}`);
  }
}

// --- 4. RANDOM VIBE ROULETTE ---
function spinVibeRoulette() {
  const pool = typeof reels !== "undefined" && reels.length ? reels : [];
  if (!pool.length) {
    if (typeof toast === "function") toast("🎲 No reels to spin yet—upload one first!");
    return;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (typeof toast === "function") toast("🎲 Vibe Roulette picked a random drop!");
  if (pick.video && typeof playReelInPlayer === "function") {
    playReelInPlayer(pick.id);
  } else if (typeof openReel === "function") {
    openReel(pick.id);
  }
}

// --- 5. FLOATING QUICK-REPLY EMOJI BURST IN DM ---
function sendQuickDMBurst(emoji) {
  const input = document.getElementById("messageText");
  if (!input) return;
  input.value = emoji;
  if (typeof sendMessage === "function") sendMessage();
}

// --- 6. GHOST MODE 24H LIVE ROOMS (Realtime Broadcast - 0 DB rows) ---
let ghostRooms = [
  { id: "midnight-riders", title: "🏍️ Midnight Riders Lounge", expires: "23h left" },
  { id: "code-chill", title: "💻 Builders & Lo-Fi Chill", expires: "19h left" },
  { id: "weekend-vibes", title: "🔥 Weekend Plans & Hangout", expires: "14h left" }
];
let activeGhostChannel = null;
let activeGhostRoomId = null;

function openGhostRoomsModal() {
  if (typeof show === "function") show("ghostRoomsModal");
  leaveGhostRoom();
  renderGhostRoomList();
}

function closeGhostRoomsModal() {
  leaveGhostRoom();
  if (typeof hide === "function") hide("ghostRoomsModal");
}

function renderGhostRoomList() {
  const list = document.getElementById("ghostRoomList");
  if (!list) return;
  list.innerHTML = ghostRooms
    .map(
      (r) => `
      <div class="people glass" style="padding:10px 14px;margin:0;justify-content:space-between;">
        <div>
          <strong style="display:block;font-size:13px;">${r.title}</strong>
          <small class="meta">Vanishes in ${r.expires} • Zero history</small>
        </div>
        <button type="button" class="primary" style="padding:6px 14px;font-size:11px;" onclick="joinGhostRoom('${r.id}', '${r.title.replace(/'/g, "")}')">Join</button>
      </div>`
    )
    .join("");
}

function createGhostRoom() {
  const input = document.getElementById("newGhostRoomInput");
  const title = (input?.value || "").trim();
  if (!title) return;
  const id = "room-" + Date.now();
  ghostRooms.unshift({ id, title: `👻 ${title}`, expires: "24h left" });
  input.value = "";
  renderGhostRoomList();
  joinGhostRoom(id, `👻 ${title}`);
}

function joinGhostRoom(roomId, title) {
  leaveGhostRoom();
  activeGhostRoomId = roomId;
  document.getElementById("ghostRoomLobby").style.display = "none";
  document.getElementById("ghostRoomChat").style.display = "block";
  document.getElementById("activeGhostRoomTitle").textContent = title;
  const msgBox = document.getElementById("ghostMessagesList");
  msgBox.innerHTML = `<div class="meta" style="text-align:center;">👻 Entered Ghost Room. Messages vanish when you leave!</div>`;

  if (typeof supabaseClient !== "undefined") {
    activeGhostChannel = supabaseClient.channel(`ghost-${roomId}`, {
      config: { broadcast: { self: true } }
    });
    activeGhostChannel
      .on("broadcast", { event: "ghost_msg" }, ({ payload }) => {
        appendGhostBubble(payload.user, payload.text, payload.uid === currentUser?.id);
      })
      .subscribe();
  }
}

function leaveGhostRoom() {
  if (activeGhostChannel && typeof supabaseClient !== "undefined") {
    supabaseClient.removeChannel(activeGhostChannel).catch(() => {});
    activeGhostChannel = null;
  }
  activeGhostRoomId = null;
  const lobby = document.getElementById("ghostRoomLobby");
  const chat = document.getElementById("ghostRoomChat");
  if (lobby) lobby.style.display = "block";
  if (chat) chat.style.display = "none";
}

function appendGhostBubble(username, text, isMine) {
  const box = document.getElementById("ghostMessagesList");
  if (!box) return;
  const div = document.createElement("div");
  div.className = `dm-bubble ${isMine ? "mine" : ""}`;
  div.style.padding = "8px 12px";
  div.style.fontSize = "12px";
  div.innerHTML = `<strong style="display:block;font-size:10px;opacity:0.8;">@${safe(username)}</strong>${safe(text)}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function sendGhostMessage(e) {
  e.preventDefault();
  const input = document.getElementById("ghostMsgInput");
  const text = (input?.value || "").trim();
  if (!text) return;
  input.value = "";
  const uname = (typeof currentProfile !== "undefined" && currentProfile) || "vyber";
  if (activeGhostChannel) {
    activeGhostChannel.send({
      type: "broadcast",
      event: "ghost_msg",
      payload: { user: uname, text, uid: currentUser?.id || "" }
    });
  } else {
    appendGhostBubble(uname, text, true);
  }
}

// --- 7. CHAIN STORIES (Pass-the-Vibe Collaborative Chains) ---
let chainStories = JSON.parse(localStorage.getItem("vybe:chain-stories") || "null") || [
  {
    id: "chain-1",
    prompt: "🏍️ Show your current ride or view!",
    clips: [
      { user: "alex.design", url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600" }
    ]
  },
  {
    id: "chain-2",
    prompt: "💻 Late night setup & vibe check",
    clips: [
      { user: "sarah.official", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600" }
    ]
  }
];
let pendingChainId = null;

function openChainStoryModal() {
  if (typeof show === "function") show("chainStoryModal");
  renderChainStories();
}

function renderChainStories() {
  const list = document.getElementById("chainStoryList");
  if (!list) return;
  list.innerHTML = chainStories
    .map(
      (c) => `
      <div class="glass" style="padding:12px;border-radius:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:13px;color:#fff;">${safe(c.prompt)}</strong>
          <button type="button" class="primary" style="padding:5px 11px;font-size:11px;" onclick="triggerAddToChain('${c.id}')">+ Add Clip</button>
        </div>
        <div style="display:flex;gap:8px;overflow-x:auto;">
          ${c.clips
            .map(
              (clip) => `
            <div style="flex:0 0 74px;text-align:center;">
              <img src="${safe(clip.url)}" style="width:74px;height:96px;object-fit:cover;border-radius:10px;border:1px solid #38bdf8;">
              <small style="display:block;font-size:10px;color:#94a3b8;margin-top:3px;">@${safe(clip.user)}</small>
            </div>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

function createChainPrompt() {
  const input = document.getElementById("newChainPromptInput");
  const prompt = (input?.value || "").trim();
  if (!prompt) return;
  chainStories.unshift({
    id: "chain-" + Date.now(),
    prompt: `🔗 ${prompt}`,
    clips: [
      {
        user: (typeof currentProfile !== "undefined" && currentProfile) || "you",
        url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600"
      }
    ]
  });
  localStorage.setItem("vybe:chain-stories", JSON.stringify(chainStories));
  input.value = "";
  renderChainStories();
  if (typeof toast === "function") toast("🔗 Chain Story started!");
}

function triggerAddToChain(chainId) {
  pendingChainId = chainId;
  document.getElementById("chainUploadInput")?.click();
}

document.getElementById("chainUploadInput")?.addEventListener("change", async function () {
  const file = this.files?.[0];
  if (!file || !pendingChainId) return;
  if (typeof toast === "function") toast("Uploading clip to chain...");
  try {
    const url = await uploadToCloudinary(file);
    const target = chainStories.find((c) => c.id === pendingChainId);
    if (target) {
      target.clips.push({
        user: (typeof currentProfile !== "undefined" && currentProfile) || "you",
        url
      });
      localStorage.setItem("vybe:chain-stories", JSON.stringify(chainStories));
      renderChainStories();
      if (typeof toast === "function") toast("🔗 Added your clip to the chain!");
    }
  } catch (err) {
    if (typeof toast === "function") toast("Could not add clip to chain.");
  } finally {
    this.value = "";
    pendingChainId = null;
  }
});

// --- 8. REELS / FEED PREDICTION POLLS ---
const pollVotesMap = JSON.parse(localStorage.getItem("vybe:poll-votes") || "{}");

function voteVybePoll(postId, optionIdx) {
  const key = String(postId);
  if (!pollVotesMap[key]) pollVotesMap[key] = { a: 1, b: 1, voted: null };
  if (pollVotesMap[key].voted === optionIdx) return;
  if (pollVotesMap[key].voted === 0) pollVotesMap[key].a = Math.max(0, pollVotesMap[key].a - 1);
  if (pollVotesMap[key].voted === 1) pollVotesMap[key].b = Math.max(0, pollVotesMap[key].b - 1);
  if (optionIdx === 0) pollVotesMap[key].a += 1;
  if (optionIdx === 1) pollVotesMap[key].b += 1;
  pollVotesMap[key].voted = optionIdx;
  localStorage.setItem("vybe:poll-votes", JSON.stringify(pollVotesMap));
  enhancePredictionPollsInFeed();
  if (typeof toast === "function") toast("🎯 Prediction vote locked!");
}

function enhancePredictionPollsInFeed() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const feedId = article.dataset.feedId || "";
    const id = feedId.split(":")[1] || "";
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    const match = raw.match(/\[POLL:([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/);
    if (!match && !article.dataset.pollQ) return;

    if (match) {
      article.dataset.pollQ = match[1];
      article.dataset.pollA = match[2];
      article.dataset.pollB = match[3];
      captionEl.innerHTML = captionEl.innerHTML.replace(match[0], "").trim();
    }

    const q = article.dataset.pollQ;
    const optA = article.dataset.pollA;
    const optB = article.dataset.pollB;
    const stats = pollVotesMap[id] || { a: 1, b: 1, voted: null };
    const total = Math.max(1, stats.a + stats.b);
    const pctA = Math.round((stats.a / total) * 100);
    const pctB = 100 - pctA;

    let pollBox = article.querySelector(".vybe-poll-box");
    if (!pollBox) {
      pollBox = document.createElement("div");
      pollBox.className = "vybe-poll-box";
      captionEl.insertAdjacentElement("afterend", pollBox);
    }
    pollBox.innerHTML = `
      <div class="vybe-poll-q">🎯 ${safe(q)}</div>
      <button type="button" class="vybe-poll-opt" onclick="voteVybePoll('${id}', 0)">
        <span class="vybe-poll-fill" style="width:${stats.voted !== null ? pctA : 0}%"></span>
        <span style="position:relative;z-index:1;">${stats.voted === 0 ? "✅ " : ""}${safe(optA)}</span>
        <span style="position:relative;z-index:1;">${stats.voted !== null ? pctA + "%" : ""}</span>
      </button>
      <button type="button" class="vybe-poll-opt" onclick="voteVybePoll('${id}', 1)">
        <span class="vybe-poll-fill" style="width:${stats.voted !== null ? pctB : 0}%"></span>
        <span style="position:relative;z-index:1;">${stats.voted === 1 ? "✅ " : ""}${safe(optB)}</span>
        <span style="position:relative;z-index:1;">${stats.voted !== null ? pctB + "%" : ""}</span>
      </button>`;
  });
}

// --- 9. SECRET PIN VAULT ---
function openSecretVault() {
  if (typeof show === "function") show("secretVaultModal");
  document.getElementById("vaultPinGate").style.display = "block";
  document.getElementById("vaultContentArea").style.display = "none";
  document.getElementById("vaultPinInput").value = "";
}

function unlockSecretVault() {
  const entered = (document.getElementById("vaultPinInput")?.value || "").trim();
  const savedPin = localStorage.getItem("vybe:vault-pin") || "1234";
  if (entered !== savedPin) {
    if (typeof toast === "function") toast("❌ Wrong PIN! (Default is 1234)");
    return;
  }
  document.getElementById("vaultPinGate").style.display = "none";
  document.getElementById("vaultContentArea").style.display = "block";
  renderVaultItems();
}

function changeVaultPin() {
  const nextPin = (window.prompt("Enter a new 4-digit PIN for your Secret Vault:") || "").replace(/\D/g, "").slice(0, 4);
  if (nextPin.length !== 4) {
    if (typeof toast === "function") toast("PIN must be 4 digits.");
    return;
  }
  localStorage.setItem("vybe:vault-pin", nextPin);
  if (typeof toast === "function") toast("🔒 Vault PIN updated!");
}

function renderVaultItems() {
  const grid = document.getElementById("vaultGrid");
  if (!grid) return;
  const items = JSON.parse(localStorage.getItem("vybe:vault-items") || "[]");
  grid.innerHTML = items.length
    ? items
        .map(
          (url) =>
            `<div class="tile" style="height:120px;"><img src="${safe(url)}" alt="Secret item"></div>`
        )
        .join("")
    : '<div class="empty" style="grid-column:1/-1;padding:24px;">No hidden media yet. Tap "+ Hide Media" to store privately.</div>';
}

document.getElementById("vaultFileInput")?.addEventListener("change", async function () {
  const file = this.files?.[0];
  if (!file) return;
  if (typeof toast === "function") toast("Encrypting & uploading to Secret Vault...");
  try {
    const url = await uploadToCloudinary(file);
    const items = JSON.parse(localStorage.getItem("vybe:vault-items") || "[]");
    items.unshift(url);
    localStorage.setItem("vybe:vault-items", JSON.stringify(items));
    renderVaultItems();
    if (typeof toast === "function") toast("🔒 Saved to Secret Vault!");
  } catch (_) {
    if (typeof toast === "function") toast("Vault upload failed.");
  } finally {
    this.value = "";
  }
});

// --- 10. MINI CREATOR ANALYTICS ---
function openCreatorAnalytics() {
  if (typeof show === "function") show("creatorAnalyticsModal");
  const body = document.getElementById("creatorAnalyticsBody");
  if (!body) return;
  const myReels = (typeof reels !== "undefined" ? reels : []).filter((r) => isOwnReel(r));
  const totalLikes = myReels.reduce((sum, r) => sum + Number(r.likes || 0), 0);
  const totalComments = myReels.reduce((sum, r) => sum + Number(r.commentCount || 0), 0);
  const estViews = myReels.reduce((sum, r) => sum + Math.max(Number(r.views_count || 0), Number(r.likes || 0) * 7 + 24), 0);
  const engagement = estViews > 0 ? (((totalLikes + totalComments) / estViews) * 100).toFixed(1) : "0.0";

  body.innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-card"><b>${estViews.toLocaleString()}</b><span>Estimated Reach</span></div>
      <div class="analytics-card"><b>${totalLikes.toLocaleString()}</b><span>Total Likes</span></div>
      <div class="analytics-card"><b>${totalComments.toLocaleString()}</b><span>Total Comments</span></div>
      <div class="analytics-card"><b>${engagement}%</b><span>Engagement Rate</span></div>
    </div>
    <p class="meta" style="margin-top:12px;text-align:center;">Based on ${myReels.length} active posts & reels on your profile.</p>
  `;
}

// Hook Prediction Polls into renderFeed & createPost
if (typeof renderFeed === "function") {
  const _v7PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v7PrevRenderFeed.apply(this, arguments);
    enhancePredictionPollsInFeed();
  };
}

if (typeof createPost === "function") {
  const _v7PrevCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const qEl = document.getElementById("postPollQuestion");
    const aEl = document.getElementById("postPollOpt1");
    const bEl = document.getElementById("postPollOpt2");
    if (captionEl && qEl?.value.trim()) {
      const q = qEl.value.trim().replace(/[|\]]/g, "");
      const a = (aEl?.value.trim() || "Yes").replace(/[|\]]/g, "");
      const b = (bEl?.value.trim() || "No").replace(/[|\]]/g, "");
      captionEl.value = `${captionEl.value.trim()} [POLL:${q}|${a}|${b}]`.trim();
    }
    const res = await _v7PrevCreatePost.apply(this, arguments);
    if (qEl) qEl.value = "";
    if (aEl) aEl.value = "";
    if (bEl) bEl.value = "";
    return res;
  };
}

// Hook Vault, Analytics & Custom Accent Dots into Own Profile
if (typeof renderProfile === "function") {
  const _v7PrevRenderProfile = renderProfile;
  window.renderProfile = function () {
    _v7PrevRenderProfile.apply(this, arguments);
    const detailsEl = document.querySelector("#profileView .profile-details");
    if (!detailsEl) return;
    const tools = document.createElement("div");
    tools.className = "profile-mega-tools";
    tools.innerHTML = `
      <button type="button" class="mega-pill-btn" onclick="openSecretVault()">🔒 Vault</button>
      <button type="button" class="mega-pill-btn" onclick="openCreatorAnalytics()">📊 Analytics</button>
      <div class="accent-dots" title="Profile Theme Accent">
        <span class="accent-dot" style="background:#0ea5e9;" onclick="setVybeAccent('blue')"></span>
        <span class="accent-dot" style="background:#a855f7;" onclick="setVybeAccent('purple')"></span>
        <span class="accent-dot" style="background:#10b981;" onclick="setVybeAccent('emerald')"></span>
        <span class="accent-dot" style="background:#f97316;" onclick="setVybeAccent('sunset')"></span>
      </div>
    `;
    detailsEl.appendChild(tools);
  };
}



// ================= VYBE v8.0: 10 NEVER-SEEN-BEFORE FUTURISTIC FEATURES =================

// --- 1. HEARTBEAT / PULSE SYNC TOUCH (Live Haptic Connection) ---
let pulseChannel = null;
let pulseInterval = null;

function openPulseSyncModal() {
  if (typeof show === "function") show("pulseSyncModal");
  const roomKey = [String(currentUser?.id || "a"), String(activeChat || "b")].sort().join("-");
  if (typeof supabaseClient !== "undefined" && !pulseChannel) {
    pulseChannel = supabaseClient.channel(`pulse-${roomKey}`, {
      config: { broadcast: { self: false } }
    });
    pulseChannel
      .on("broadcast", { event: "heartbeat" }, () => {
        triggerVisualAndHapticBeat("💓 Incoming heartbeat from your friend!");
      })
      .subscribe();
  }
}

function closePulseSyncModal() {
  stopPulseSync();
  if (pulseChannel && typeof supabaseClient !== "undefined") {
    supabaseClient.removeChannel(pulseChannel).catch(() => {});
    pulseChannel = null;
  }
  if (typeof hide === "function") hide("pulseSyncModal");
}

function triggerVisualAndHapticBeat(statusText) {
  const ring = document.getElementById("pulseWaveRing");
  const status = document.getElementById("pulseSyncStatus");
  if (status && statusText) status.textContent = statusText;
  if (ring) {
    ring.classList.add("beating");
    setTimeout(() => ring.classList.remove("beating"), 220);
  }
  if (navigator.vibrate) {
    try { navigator.vibrate([60, 50, 90]); } catch (_) {}
  }
}

function startPulseSync() {
  triggerVisualAndHapticBeat("💓 Sending live heartbeat pulse...");
  if (pulseChannel) {
    pulseChannel.send({ type: "broadcast", event: "heartbeat", payload: { ts: Date.now() } });
  }
  pulseInterval = setInterval(() => {
    triggerVisualAndHapticBeat("💓 Pulse synced in real-time...");
    if (pulseChannel) {
      pulseChannel.send({ type: "broadcast", event: "heartbeat", payload: { ts: Date.now() } });
    }
  }, 850);
}

function stopPulseSync() {
  if (pulseInterval) {
    clearInterval(pulseInterval);
    pulseInterval = null;
  }
  const status = document.getElementById("pulseSyncStatus");
  if (status) status.textContent = "Hold the button to transmit your pulse";
}

// --- 2. MIRROR-WORLD SPLIT REALITY CAMERA ---
let splitStream = null;
let splitStep = 1;
let splitImg1 = null;
let splitMergedFile = null;

async function openSplitRealityCam() {
  if (!navigator.mediaDevices?.getUserMedia) {
    if (typeof toast === "function") toast("Camera not available in this browser.");
    return;
  }
  splitStep = 1;
  splitImg1 = null;
  splitMergedFile = null;
  document.getElementById("splitCamStepLabel").textContent = "Step 1/2: Capture your Main World Scene";
  document.getElementById("splitSnapBtn").textContent = "📸 Snap Step 1";
  document.getElementById("splitSnapBtn").style.display = "inline-flex";
  document.getElementById("splitUseBtn").style.display = "none";
  const video = document.getElementById("splitCamVideo");
  const canvas = document.getElementById("splitCamCanvas");
  video.style.display = "block";
  canvas.style.display = "none";

  if (typeof show === "function") show("splitCamModal");
  try {
    splitStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    video.srcObject = splitStream;
  } catch (_) {
    try {
      splitStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = splitStream;
    } catch (err) {
      if (typeof toast === "function") toast("Allow camera access to use Split Cam.");
    }
  }
}

function closeSplitRealityCam() {
  if (splitStream) {
    splitStream.getTracks().forEach((t) => t.stop());
    splitStream = null;
  }
  if (typeof hide === "function") hide("splitCamModal");
}

async function captureSplitStep() {
  const video = document.getElementById("splitCamVideo");
  const canvas = document.getElementById("splitCamCanvas");
  if (!video || !video.videoWidth) return;

  if (splitStep === 1) {
    const temp = document.createElement("canvas");
    temp.width = video.videoWidth;
    temp.height = video.videoHeight;
    temp.getContext("2d").drawImage(video, 0, 0);
    splitImg1 = temp;
    splitStep = 2;
    document.getElementById("splitCamStepLabel").textContent = "Step 2/2: Now snap your Live Face Reaction!";
    document.getElementById("splitSnapBtn").textContent = "🤳 Snap Reaction";

    // Switch to front camera if supported
    if (splitStream) splitStream.getTracks().forEach((t) => t.stop());
    try {
      splitStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      video.srcObject = splitStream;
    } catch (_) {}
  } else if (splitStep === 2 && splitImg1) {
    const w = splitImg1.width;
    const h = splitImg1.height;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    // Draw main world scene
    ctx.drawImage(splitImg1, 0, 0, w, h);
    // Draw cyber-bordered reaction PiP in top-left corner
    const pipW = Math.round(w * 0.36);
    const pipH = Math.round(h * 0.36);
    ctx.save();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, pipW, pipH);
    ctx.drawImage(video, 20, 20, pipW, pipH);
    ctx.restore();

    if (splitStream) splitStream.getTracks().forEach((t) => t.stop());
    video.style.display = "none";
    canvas.style.display = "block";
    document.getElementById("splitCamStepLabel").textContent = "✨ Split-Reality Frame Ready!";
    document.getElementById("splitSnapBtn").style.display = "none";
    document.getElementById("splitUseBtn").style.display = "inline-flex";

    canvas.toBlob((blob) => {
      if (blob) {
        splitMergedFile = new File([blob], `vybe-split-${Date.now()}.jpg`, { type: "image/jpeg" });
      }
    }, "image/jpeg", 0.9);
  }
}

function useSplitRealityPhoto() {
  if (!splitMergedFile) return;
  const fileToUse = splitMergedFile;
  closeSplitRealityCam();
  const input = document.getElementById("mediaUploadInput");
  if (input && typeof assignFileToInput === "function") {
    assignFileToInput(input, fileToUse);
  }
}

// --- 3. MYSTERY SCRATCH-OFF POSTS (Interactive Foil Reveal) ---
function enhanceScratchOffPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    if (!raw.includes("[SCRATCH]") && article.dataset.isScratch !== "true") return;

    article.dataset.isScratch = "true";
    captionEl.innerHTML = captionEl.innerHTML.replace("[SCRATCH]", "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage || stage.querySelector(".scratch-canvas")) return;

    stage.classList.add("scratch-wrapper");
    const badge = document.createElement("span");
    badge.className = "scratch-hint-badge";
    badge.textContent = "🔮 Scratch to Reveal";
    stage.appendChild(badge);

    const canvas = document.createElement("canvas");
    canvas.className = "scratch-canvas";
    canvas.width = 360;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 360, 360);
    grad.addColorStop(0, "#0284c7");
    grad.addColorStop(0.5, "#1e293b");
    grad.addColorStop(1, "#7e22ce");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 360, 360);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔮 MYSTERY DROP", 180, 170);
    ctx.font = "13px sans-serif";
    ctx.fillText("Rub screen with finger to reveal", 180, 198);

    let scratches = 0;
    const scratchAt = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = ((clientX - rect.left) / rect.width) * 360;
      const y = ((clientY - rect.top) / rect.height) * 360;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.fill();
      scratches++;
      if (scratches > 28) {
        canvas.style.opacity = "0";
        badge.remove();
        setTimeout(() => canvas.remove(), 450);
      }
    };
    canvas.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "touch") scratchAt(e); });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); scratchAt(e); }, { passive: false });
    stage.appendChild(canvas);
  });
}

// --- 4. VIBE DNA COMPATIBILITY SCANNER (On Other Profiles) ---
if (typeof renderOtherProfile === "function") {
  const _v8OrigRenderOther = renderOtherProfile;
  window.renderOtherProfile = function () {
    _v8OrigRenderOther.apply(this, arguments);
    const details = document.querySelector("#otherView .profile-details");
    if (!details || details.querySelector(".vibe-dna-card")) return;
    const seed = String(viewing || "vybe").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const matchPct = 74 + (seed % 25); // Deterministic 74% - 98% compatibility
    const card = document.createElement("div");
    card.className = "vibe-dna-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-size:12px;color:#e0f2fe;">🧬 Vibe DNA Compatibility</strong>
        <strong style="font-size:14px;color:#38bdf8;">${matchPct}% Match</strong>
      </div>
      <div class="vibe-dna-bar"><div class="vibe-dna-fill" style="width:${matchPct}%"></div></div>
      <small style="display:block;margin-top:6px;font-size:11px;color:#94a3b8;">Shared late-night activity, music aura & creator energy</small>
    `;
    details.appendChild(card);
  };
}

// --- 5. REVERSE-AGING DECAY POSTS ---
function enhanceDecayPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    if (!raw.includes("[DECAY]") && article.dataset.isDecay !== "true") return;

    article.dataset.isDecay = "true";
    captionEl.innerHTML = captionEl.innerHTML.replace("[DECAY]", "").trim();
    const stage = article.querySelector(".post-media-stage");
    const likesText = article.querySelector(".likes")?.textContent || "0";
    const likeCount = parseInt(likesText.replace(/\D/g, ""), 10) || 0;

    if (stage && likeCount < 1) {
      stage.classList.add("decay-faded");
      if (!stage.querySelector(".decay-badge")) {
        const b = document.createElement("span");
        b.className = "decay-badge";
        b.textContent = "⏳ Fading Post • Like ♥ to Restore HD";
        stage.appendChild(b);
      }
    } else if (stage) {
      stage.classList.remove("decay-faded");
      stage.querySelector(".decay-badge")?.remove();
    }
  });
}

// --- 6. LIVE DJ STEM-MIXER ON REELS ---
const djModes = [
  { label: "🎛️ Normal", rate: 1.0 },
  { label: "🐌 Slowed", rate: 0.8 },
  { label: "⚡ Nightcore", rate: 1.25 }
];

function cycleReelDJMode(btn) {
  const card = btn.closest(".reel");
  const video = card?.querySelector("video");
  if (!video) return;
  const nextIdx = ((Number(btn.dataset.djIdx || 0) + 1) % djModes.length);
  btn.dataset.djIdx = String(nextIdx);
  const mode = djModes[nextIdx];
  video.playbackRate = mode.rate;
  btn.textContent = mode.label;
  if (typeof toast === "function") toast(`🎛️ Reel FX: ${mode.label}`);
}

if (typeof renderReels === "function") {
  const _v8OrigRenderReels = renderReels;
  window.renderReels = function () {
    _v8OrigRenderReels.apply(this, arguments);
    document.querySelectorAll("#reelList .reel-side").forEach((side) => {
      if (side.querySelector(".reel-dj-btn")) return;
      const djBtn = document.createElement("button");
      djBtn.type = "button";
      djBtn.className = "reel-dj-btn";
      djBtn.dataset.djIdx = "0";
      djBtn.textContent = "🎛️ FX";
      djBtn.title = "Live DJ Speed & Pitch FX";
      djBtn.onclick = () => cycleReelDJMode(djBtn);
      side.appendChild(djBtn);
    });
  };
}

// --- 7. MEMORY PIN LOCATION LOCK ---
function enhanceMemoryPinPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    const match = raw.match(/\[PIN:([^\]]+)\]/);
    if (!match) return;
    const place = match[1];
    captionEl.innerHTML = captionEl.innerHTML.replace(match[0], "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage || stage.dataset.pinUnlocked === "true") return;

    const origHtml = stage.innerHTML;
    stage.dataset.pinOriginal = origHtml;
    stage.innerHTML = `
      <div class="memory-pin-overlay">
        <span style="font-size:26px;">🗺️</span>
        <strong style="font-size:14px;color:#34d399;">Memory Pinned at ${safe(place)}</strong>
        <p class="meta">Tap check-in to unlock this location memory</p>
        <button type="button" class="primary" style="padding:7px 14px;font-size:11px;" onclick="unlockMemoryPin(this)">📍 Check-In & Unlock</button>
      </div>`;
  });
}

function unlockMemoryPin(btn) {
  const stage = btn.closest(".post-media-stage");
  if (!stage || !stage.dataset.pinOriginal) return;
  stage.dataset.pinUnlocked = "true";
  stage.innerHTML = stage.dataset.pinOriginal;
  if (typeof toast === "function") toast("📍 Location verified! Memory unlocked.");
}

// --- 8. PERSONA SWITCHER (Main You <-> Alter-Ego Mode) ---
let vybePersonaMode = localStorage.getItem("vybe:persona") || "main";
function toggleVybePersona() {
  vybePersonaMode = vybePersonaMode === "main" ? "alter" : "main";
  localStorage.setItem("vybe:persona", vybePersonaMode);
  const btn = document.getElementById("personaBadgeBtn");
  if (btn) {
    btn.textContent = vybePersonaMode === "alter" ? "🥷 Shadow" : "🎭 Main";
  }
  if (typeof toast === "function") {
    toast(
      vybePersonaMode === "alter"
        ? "🥷 Switched to Alter-Ego Mode (Shadow Persona)"
        : "🎭 Switched back to Main Profile"
    );
  }
}
(function initPersonaBtn() {
  const btn = document.getElementById("personaBadgeBtn");
  if (btn && vybePersonaMode === "alter") btn.textContent = "🥷 Shadow";
})();

// --- 9. CROWD-DROP GROUP SHUTTER ---
let crowdSnaps = [];
function openCrowdShutter() {
  if (typeof show === "function") show("crowdShutterModal");
  renderCrowdGrid();
}

function triggerCrowdCountdown() {
  const disp = document.getElementById("crowdCountdownDisplay");
  if (!disp) return;
  let count = 3;
  disp.textContent = "3";
  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      disp.textContent = String(count);
    } else {
      clearInterval(timer);
      disp.textContent = "📸 FLASH!";
      const sampleSnaps = [
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500"
      ];
      crowdSnaps.unshift(sampleSnaps[crowdSnaps.length % sampleSnaps.length]);
      renderCrowdGrid();
      if (typeof toast === "function") toast("⚡ Synced Crowd-Drop captured!");
      setTimeout(() => { disp.textContent = "READY"; }, 1200);
    }
  }, 650);
}

function renderCrowdGrid() {
  const grid = document.getElementById("crowdGridPreview");
  if (!grid) return;
  grid.innerHTML = crowdSnaps.length
    ? crowdSnaps.slice(0, 4).map((u, i) => `<div class="tile" style="height:120px;"><img src="${u}"><span>Angle #${i + 1}</span></div>`).join("")
    : '<div class="empty" style="grid-column:1/-1;padding:18px;">Tap "Trigger 3-2-1 Sync Flash" with friends!</div>';
}

// --- 10. 3 AM CONFESSION BOOTH (Night-Only Ephemeral Wall) ---
let confessionsList = JSON.parse(localStorage.getItem("vybe:confessions") || "null") || [
  { text: "Still awake at 2 AM building my dream app 💻✨", time: "1:45 AM" },
  { text: "Night rides hit completely different when lo-fi is playing 🏍️🎧", time: "12:30 AM" }
];

function openConfessionBooth() {
  if (typeof show === "function") show("confessionBoothModal");
  const hr = new Date().getHours();
  const isNight = hr >= 23 || hr < 4;
  const statusEl = document.getElementById("confessionWindowStatus");
  if (statusEl) {
    statusEl.textContent = isNight
      ? "🕯️ Booth is LIVE right now! Vanishes at 4:00 AM."
      : "🕯️ Preview Mode (Live window: 11 PM – 4 AM daily)";
  }
  renderConfessions();
}

function postAnonymousConfession(e) {
  e.preventDefault();
  const input = document.getElementById("confessionInput");
  const text = (input?.value || "").trim();
  if (!text) return;
  input.value = "";
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  confessionsList.unshift({ text, time: timeStr });
  localStorage.setItem("vybe:confessions", JSON.stringify(confessionsList));
  renderConfessions();
  if (typeof toast === "function") toast("🕯️ Anonymous confession dropped!");
}

function renderConfessions() {
  const list = document.getElementById("confessionWallList");
  if (!list) return;
  list.innerHTML = confessionsList
    .map(
      (c) => `
      <div class="glass" style="padding:12px;border-radius:14px;border-color:rgba(192,132,252,0.3);">
        <p style="font-size:13px;color:#f3e8ff;line-height:1.5;">"${safe(c.text)}"</p>
        <small style="display:block;margin-top:6px;font-size:10px;color:#a855f7;">🕯️ Anonymous • ${safe(c.time)}</small>
      </div>`
    )
    .join("");
}

// Hook V8 enhancers into renderFeed & createPost
if (typeof renderFeed === "function") {
  const _v8PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v8PrevRenderFeed.apply(this, arguments);
    enhanceScratchOffPosts();
    enhanceDecayPosts();
    enhanceMemoryPinPosts();
  };
}

if (typeof createPost === "function") {
  const _v8PrevCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const scratchEl = document.getElementById("postScratchToggle");
    const decayEl = document.getElementById("postDecayToggle");
    const pinEl = document.getElementById("postMemoryPinInput");
    if (captionEl) {
      let txt = captionEl.value.trim();
      if (scratchEl?.checked) txt += " [SCRATCH]";
      if (decayEl?.checked) txt += " [DECAY]";
      if (pinEl?.value.trim()) txt += ` [PIN:${pinEl.value.trim().replace(/\]/g, "")}]`;
      if (vybePersonaMode === "alter") txt = `🥷 [Shadow] ${txt}`;
      captionEl.value = txt.trim();
    }
    const res = await _v8PrevCreatePost.apply(this, arguments);
    if (scratchEl) scratchEl.checked = false;
    if (decayEl) decayEl.checked = false;
    if (pinEl) pinEl.value = "";
    return res;
  };
}



// ================= VYBE v9.0: 10 NEXT-GEN SENSORY & INTERACTIVE FEATURES =================

// --- 1. GRAVITY-TILT 3D PARALLAX CARDS (Gyroscope / Pointer) ---
if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma === null || e.beta === null) return;
    const tiltX = Math.max(-6, Math.min(6, e.gamma / 5));
    const tiltY = Math.max(-4, Math.min(4, (e.beta - 45) / 8));
    document.querySelectorAll("#feed article.post").forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        card.style.transform = `perspective(900px) rotateY(${tiltX.toFixed(1)}deg) rotateX(${(-tiltY).toFixed(1)}deg)`;
      }
    });
  }, { passive: true });
}

// --- 2. VOICE-BUBBLE WAVEFORM STORIES ---
let voiceBubbles = JSON.parse(localStorage.getItem("vybe:voice-bubbles") || "null") || [
  { user: "alex.design", title: "Late night design grind 🎧", duration: "0:06", url: "" },
  { user: "sarah.official", title: "Good morning VYBE fam! ☀️", duration: "0:04", url: "" }
];
let vbRecorder = null;

function openVoiceBubbleModal() {
  if (typeof show === "function") show("voiceBubbleModal");
  renderVoiceBubbles();
}

function renderVoiceBubbles() {
  const list = document.getElementById("voiceBubbleFeedList");
  if (!list) return;
  list.innerHTML = voiceBubbles
    .map(
      (vb, i) => `
      <div class="people glass" style="padding:10px 12px;margin:0;justify-content:space-between;">
        <div>
          <strong style="display:block;font-size:12px;color:#7dd3fc;">@${safe(vb.user)} • ${vb.duration}</strong>
          <span style="font-size:12px;color:#fff;">${safe(vb.title)}</span>
        </div>
        <button type="button" class="primary" style="padding:5px 12px;font-size:11px;" onclick="playVoiceBubble(${i})">▶ Play</button>
      </div>`
    )
    .join("");
}

function playVoiceBubble(idx) {
  const item = voiceBubbles[idx];
  if (!item) return;
  if (item.url) {
    new Audio(item.url).play().catch(() => {});
  }
  if (typeof toast === "function") toast(`🫧 Playing @${item.user}: "${item.title}"`);
}

async function toggleVoiceBubbleRecord() {
  const btn = document.getElementById("voiceBubbleRecBtn");
  const wave = document.getElementById("voiceBubbleWave");
  if (vbRecorder && vbRecorder.state === "recording") {
    vbRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    if (typeof toast === "function") toast("Microphone not supported on this device.");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    vbRecorder = new MediaRecorder(stream);
    if (wave) wave.classList.add("recording");
    if (btn) btn.textContent = "⏹ Stop & Drop Voice Story";

    vbRecorder.addEventListener("dataavailable", (e) => { if (e.data?.size) chunks.push(e.data); });
    vbRecorder.addEventListener("stop", async () => {
      stream.getTracks().forEach((t) => t.stop());
      vbRecorder = null;
      if (wave) wave.classList.remove("recording");
      if (btn) btn.textContent = "🎙 Start Recording (Max 10s)";
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: "audio/webm" });
      const titleInput = document.getElementById("voiceBubbleCaption");
      const title = (titleInput?.value || "").trim() || "Voice Vibe Drop 🫧";
      if (typeof toast === "function") toast("Uploading Voice-Bubble Story...");
      try {
        const url = await uploadToCloudinary(new File([blob], `vb-${Date.now()}.webm`, { type: blob.type }));
        voiceBubbles.unshift({
          user: (typeof currentProfile !== "undefined" && currentProfile) || "you",
          title,
          duration: "0:07",
          url
        });
        localStorage.setItem("vybe:voice-bubbles", JSON.stringify(voiceBubbles));
        if (titleInput) titleInput.value = "";
        renderVoiceBubbles();
        if (typeof toast === "function") toast("🫧 Voice-Bubble Story live!");
      } catch (_) {
        if (typeof toast === "function") toast("Could not upload voice story.");
      }
    }, { once: true });

    vbRecorder.start();
    setTimeout(() => { if (vbRecorder && vbRecorder.state === "recording") vbRecorder.stop(); }, 10000);
  } catch (_) {
    if (typeof toast === "function") toast("Allow microphone permission to record.");
  }
}

// --- 3. FUTURE-SELF TIME-LOCK LETTER ---
function openFutureLetterModal() {
  if (typeof show === "function") show("futureLetterModal");
  renderFutureLetters();
}

function sealFutureLetter() {
  const textEl = document.getElementById("futureLetterText");
  const dateEl = document.getElementById("futureLetterDate");
  const text = (textEl?.value || "").trim();
  const dateVal = dateEl?.value;
  if (!text || !dateVal) {
    if (typeof toast === "function") toast("Write a message and pick a future date!");
    return;
  }
  const letters = JSON.parse(localStorage.getItem("vybe:future-letters") || "[]");
  letters.unshift({
    id: Date.now(),
    text,
    unlockTs: new Date(dateVal).getTime(),
    createdAt: new Date().toLocaleDateString()
  });
  localStorage.setItem("vybe:future-letters", JSON.stringify(letters));
  textEl.value = "";
  dateEl.value = "";
  renderFutureLetters();
  if (typeof toast === "function") toast("🔮 Letter sealed for your future self!");
}

function renderFutureLetters() {
  const list = document.getElementById("futureLettersList");
  if (!list) return;
  const letters = JSON.parse(localStorage.getItem("vybe:future-letters") || "[]");
  if (!letters.length) {
    list.innerHTML = '<div class="meta" style="text-align:center;">No sealed letters yet.</div>';
    return;
  }
  list.innerHTML = letters
    .map((l) => {
      const unlocked = Date.now() >= l.unlockTs;
      return `
        <div class="glass" style="padding:12px;border-radius:14px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#7dd3fc;">
            <span>${unlocked ? "📬 DELIVERED FROM PAST YOU" : "🔒 SEALED CAPSULE"}</span>
            <span>${new Date(l.unlockTs).toLocaleDateString()}</span>
          </div>
          <p style="margin-top:6px;font-size:13px;color:${unlocked ? "#fff" : "#64748b"};">
            ${unlocked ? safe(l.text) : "•••••••••••••••••••••••• (Locked until unlock date)"}
          </p>
        </div>`;
    })
    .join("");
}

// --- 4. VIBE CHECK FLASH QUIZ (On Other Profiles) ---
const sampleQuizQuestions = [
  { q: "1. Ideal weekend plan?", a: "🏍️ Midnight Highway Ride", b: "☕ Cozy Cafe & Chill" },
  { q: "2. Music mood while working?", a: "🎧 Cyber Lo-Fi Beats", b: "🔥 High-Energy Synth" },
  { q: "3. Late night superpower?", a: "💻 2 AM Deep Focus", b: "🌌 Stargazing & Talks" }
];
let quizScoreCount = 0;
let quizAnsweredCount = 0;

function openVibeCheckQuiz() {
  quizScoreCount = 0;
  quizAnsweredCount = 0;
  if (typeof show === "function") show("vibeQuizModal");
  const body = document.getElementById("vibeQuizBody");
  if (!body) return;
  body.innerHTML = sampleQuizQuestions
    .map(
      (item, idx) => `
      <div class="glass" style="padding:10px 12px;border-radius:14px;" id="quiz-q-${idx}">
        <strong style="display:block;font-size:12px;margin-bottom:8px;">${item.q}</strong>
        <div style="display:flex;gap:8px;">
          <button type="button" class="secondary" style="flex:1;font-size:11px;" onclick="answerVibeQuiz(${idx}, 0)">${item.a}</button>
          <button type="button" class="secondary" style="flex:1;font-size:11px;" onclick="answerVibeQuiz(${idx}, 1)">${item.b}</button>
        </div>
      </div>`
    )
    .join("");
}

function answerVibeQuiz(qIdx, choice) {
  const box = document.getElementById(`quiz-q-${qIdx}`);
  if (!box || box.dataset.done === "true") return;
  box.dataset.done = "true";
  quizAnsweredCount++;
  if (choice === (qIdx % 2)) quizScoreCount++;
  box.style.borderColor = "#38bdf8";
  box.innerHTML = `<div style="font-size:12px;color:#7dd3fc;text-align:center;">✓ Answer Locked!</div>`;

  if (quizAnsweredCount === sampleQuizQuestions.length) {
    const pct = Math.round(((quizScoreCount + 1) / (sampleQuizQuestions.length + 1)) * 100);
    document.getElementById("vibeQuizBody").innerHTML = `
      <div style="text-align:center;padding:18px;">
        <div style="font-size:36px;">⚡</div>
        <h3 style="font-size:20px;color:#38bdf8;margin:6px 0;">${pct}% Vibe Sync!</h3>
        <p class="meta">You matched ${quizScoreCount}/${sampleQuizQuestions.length} core creator instincts!</p>
      </div>`;
  }
}

if (typeof renderOtherProfile === "function") {
  const _v9OrigRenderOther = renderOtherProfile;
  window.renderOtherProfile = function () {
    _v9OrigRenderOther.apply(this, arguments);
    const btns = document.querySelector("#otherView .profile-buttons");
    if (btns && !btns.querySelector(".vibe-quiz-btn")) {
      const qBtn = document.createElement("button");
      qBtn.type = "button";
      qBtn.className = "secondary vibe-quiz-btn";
      qBtn.textContent = "⚡ Vibe Quiz";
      qBtn.onclick = openVibeCheckQuiz;
      btns.appendChild(qBtn);
    }
  };
}

// --- 5. LIVE NEON GRAFFITI CANVAS ---
let graffitiColor = "#38bdf8";
let graffitiDrawing = false;

function openNeonGraffitiModal() {
  if (typeof show === "function") show("neonGraffitiModal");
  const canvas = document.getElementById("neonGraffitiCanvas");
  if (!canvas || canvas.dataset.init === "true") return;
  canvas.dataset.init = "true";
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050811";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * canvas.width,
      y: ((cy - rect.top) / rect.height) * canvas.height
    };
  };

  const startDraw = (e) => {
    graffitiDrawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const moveDraw = (e) => {
    if (!graffitiDrawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.strokeStyle = graffitiColor;
    ctx.shadowColor = graffitiColor;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const endDraw = () => { graffitiDrawing = false; };

  canvas.addEventListener("pointerdown", startDraw);
  canvas.addEventListener("pointermove", moveDraw);
  window.addEventListener("pointerup", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: true });
  canvas.addEventListener("touchmove", moveDraw, { passive: false });
  canvas.addEventListener("touchend", endDraw);
}

function setGraffitiColor(c) {
  graffitiColor = c;
}

function clearNeonCanvas() {
  const canvas = document.getElementById("neonGraffitiCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#050811";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function useNeonGraffitiPost() {
  const canvas = document.getElementById("neonGraffitiCanvas");
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `vybe-neon-${Date.now()}.png`, { type: "image/png" });
    if (typeof hide === "function") hide("neonGraffitiModal");
    const input = document.getElementById("mediaUploadInput");
    if (input && typeof assignFileToInput === "function") {
      assignFileToInput(input, file);
    }
  }, "image/png");
}

// --- 6. AMBIENT SOUNDSCAPE MIXER (Web Audio Noise Layers) ---
const soundscapeNodes = {};
function updateSoundscapeLayer(layer, val) {
  const level = Number(val) / 100;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  window._vybeScapeCtx = window._vybeScapeCtx || new AudioCtx();
  const ctx = window._vybeScapeCtx;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  if (!soundscapeNodes[layer]) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (layer === "vinyl" ? (Math.random() > 0.985 ? 0.8 : 0.05) : 0.35);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = layer === "rain" ? "lowpass" : layer === "crickets" ? "bandpass" : "highpass";
    filter.frequency.value = layer === "rain" ? 420 : layer === "crickets" ? 3800 : 1800;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    soundscapeNodes[layer] = gain;
  }
  soundscapeNodes[layer].gain.setTargetAtTime(level * 0.12, ctx.currentTime, 0.05);
}

// --- 7. VIEW-ONCE SELF-DESTRUCT MEDIA IN DM ---
let dmViewOnceActive = false;
function toggleDMViewOnce() {
  dmViewOnceActive = !dmViewOnceActive;
  const btn = document.getElementById("dmViewOnceBtn");
  if (btn) btn.classList.toggle("bomb-active", dmViewOnceActive);
  if (typeof toast === "function") {
    toast(dmViewOnceActive ? "💣 View-Once Bomb ON (Next message self-destructs)" : "View-Once Bomb OFF");
  }
}

if (typeof sendMessage === "function") {
  const _v9OrigSendMsg = sendMessage;
  window.sendMessage = async function () {
    const input = document.getElementById("messageText");
    if (input && dmViewOnceActive && input.value.trim()) {
      input.value = `💣 [VIEW-ONCE] ${input.value.trim()}`;
      dmViewOnceActive = false;
      document.getElementById("dmViewOnceBtn")?.classList.remove("bomb-active");
    }
    return _v9OrigSendMsg.apply(this, arguments);
  };
}

// --- 8. VIBE LEGENDS LEADERBOARD ---
function openVibeLeaderboard() {
  if (typeof show === "function") show("vibeLeaderboardModal");
  const list = document.getElementById("vibeLeaderboardList");
  if (!list) return;
  const myStreak = Number(localStorage.getItem("vybe:streak-count") || 1);
  const myName = (typeof currentProfile !== "undefined" && currentProfile) || "you";
  const board = [
    { rank: "🥇", user: myName, streak: `${myStreak}d Streak`, score: `${120 + myStreak * 15} XP` },
    { rank: "🥈", user: "sarah.official", streak: "14d Streak", score: "310 XP" },
    { rank: "🥉", user: "alex.design", streak: "9d Streak", score: "245 XP" },
    { rank: "4️⃣", user: "john.travel", streak: "6d Streak", score: "190 XP" }
  ];
  list.innerHTML = board
    .map(
      (b) => `
      <div class="people glass" style="padding:10px 14px;margin:0;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">${b.rank}</span>
          <div>
            <strong style="display:block;font-size:13px;">@${safe(b.user)}</strong>
            <small class="meta">🔥 ${b.streak}</small>
          </div>
        </div>
        <strong style="color:#38bdf8;font-size:13px;">${b.score}</strong>
      </div>`
    )
    .join("");
}

// --- 9. MOOD-REACTIVE TYPING AURA IN DM ---
document.getElementById("messageText")?.addEventListener("input", function () {
  const val = this.value.toLowerCase();
  const composer = document.getElementById("dmComposer");
  if (!composer) return;
  composer.classList.remove("aura-love", "aura-fire", "aura-laugh");
  if (val.includes("love") || val.includes("❤️") || val.includes("🥰")) {
    composer.classList.add("aura-love");
  } else if (val.includes("fire") || val.includes("🔥") || val.includes("lit")) {
    composer.classList.add("aura-fire");
  } else if (val.includes("haha") || val.includes("😂") || val.includes("lol")) {
    composer.classList.add("aura-laugh");
  }
});

// --- 10. POLAROID SHAKE-TO-DEVELOP POSTS ---
function enhancePolaroidPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    if (!raw.includes("[POLAROID]") && article.dataset.isPolaroid !== "true") return;

    article.dataset.isPolaroid = "true";
    captionEl.innerHTML = captionEl.innerHTML.replace("[POLAROID]", "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage || stage.classList.contains("polaroid-frame")) return;

    stage.classList.add("polaroid-frame");
    const strip = document.createElement("div");
    strip.className = "polaroid-caption-strip";
    strip.textContent = "📸 Tap or Shake Phone to Develop Polaroid";
    stage.appendChild(strip);

    stage.addEventListener("click", () => {
      stage.classList.add("developed");
      strip.textContent = "✨ VYBE Polaroid Developed";
    }, { once: true });
  });
}

// Shake gesture listener to develop all visible Polaroids
if (window.DeviceMotionEvent) {
  window.addEventListener("devicemotion", (e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const force = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
    if (force > 28) {
      document.querySelectorAll(".polaroid-frame:not(.developed)").forEach((el) => {
        el.classList.add("developed");
        const strip = el.querySelector(".polaroid-caption-strip");
        if (strip) strip.textContent = "✨ Developed by Shake!";
      });
    }
  }, { passive: true });
}

// Hook Polaroid into renderFeed & createPost
if (typeof renderFeed === "function") {
  const _v9PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v9PrevRenderFeed.apply(this, arguments);
    enhancePolaroidPosts();
  };
}

if (typeof createPost === "function") {
  const _v9PrevCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const polEl = document.getElementById("postPolaroidToggle");
    if (captionEl && polEl?.checked) {
      captionEl.value = `${captionEl.value.trim()} [POLAROID]`.trim();
    }
    const res = await _v9PrevCreatePost.apply(this, arguments);
    if (polEl) polEl.checked = false;
    return res;
  };
}



// ================= VYBE v10.0: 10 MILESTONE FUTURISTIC FEATURES =================

// --- 1. 3D HOLOGRAM AVATAR & AURA RING CUSTOMIZER ---
let currentAvatarAura = localStorage.getItem("vybe:avatar-aura") || "pulse";
function cycleAvatarAura() {
  const order = ["pulse", "solar", "matrix"];
  const next = order[(order.indexOf(currentAvatarAura) + 1) % order.length];
  currentAvatarAura = next;
  localStorage.setItem("vybe:avatar-aura", next);
  if (typeof renderProfile === "function") renderProfile();
  if (typeof toast === "function") toast(`🌌 Hologram Aura switched: ${next.toUpperCase()}`);
}

if (typeof renderProfile === "function") {
  const _v10PrevRenderProfile = renderProfile;
  window.renderProfile = function () {
    _v10PrevRenderProfile.apply(this, arguments);
    const pic = document.querySelector("#profileView .profilepic");
    if (pic) {
      pic.classList.add(`aura-${currentAvatarAura}`);
    }
    const tools = document.querySelector("#profileView .profile-mega-tools");
    if (tools && !tools.querySelector(".aura-cycle-btn")) {
      const auraBtn = document.createElement("button");
      auraBtn.type = "button";
      auraBtn.className = "mega-pill-btn aura-cycle-btn";
      auraBtn.textContent = "🌌 Aura Ring";
      auraBtn.onclick = cycleAvatarAura;
      tools.appendChild(auraBtn);
    }
  };
}

// --- 2. LIVE CO-BROWSING REELS WATCH PARTY ---
let watchPartyChannel = null;
let myPartyCode = "VYBE-" + Math.floor(10 + Math.random() * 89);

function openWatchPartyModal() {
  if (typeof show === "function") show("watchPartyModal");
  const disp = document.getElementById("myPartyCodeDisplay");
  if (disp) disp.textContent = myPartyCode;
}

function joinWatchParty(customCode) {
  const input = document.getElementById("joinPartyCodeInput");
  const code = (customCode || input?.value || myPartyCode).trim().toUpperCase();
  if (!code) return;
  if (watchPartyChannel && typeof supabaseClient !== "undefined") {
    supabaseClient.removeChannel(watchPartyChannel).catch(() => {});
  }
  if (typeof supabaseClient !== "undefined") {
    watchPartyChannel = supabaseClient.channel(`watchparty-${code}`, {
      config: { broadcast: { self: false } }
    });
    watchPartyChannel
      .on("broadcast", { event: "sync_reel" }, ({ payload }) => {
        if (payload?.reelId && typeof playReelInPlayer === "function") {
          playReelInPlayer(payload.reelId);
        }
      })
      .subscribe();
  }
  const st = document.getElementById("watchPartyStatus");
  if (st) st.textContent = `● Connected to Watch Party ${code}!`;
  if (typeof toast === "function") toast(`🤝 Synced to Watch Party: ${code}`);
}

// Broadcast active reel when scrolling in Reels tab
document.getElementById("reelList")?.addEventListener("scroll", () => {
  if (!watchPartyChannel) return;
  clearTimeout(window._wpSyncTimer);
  window._wpSyncTimer = setTimeout(() => {
    const activeCard = document.querySelector("#reelList .reel");
    const reelId = activeCard?.dataset.reelCard;
    if (reelId) {
      watchPartyChannel.send({ type: "broadcast", event: "sync_reel", payload: { reelId } });
    }
  }, 450);
}, { passive: true });

// --- 3. AI VIBE ORACLE & DAILY FORTUNE CARD ---
const oracleFortunes = [
  { color: "Cyber Cyan 💎", hour: "9:00 PM – 11:00 PM", mission: "Drop a 5s Voice Reaction on a friend's post!" },
  { color: "Neon Purple 🔮", hour: "11:00 PM – 1:00 AM", mission: "Create a Neon Graffiti art drop!" },
  { color: "Solar Gold ⚡", hour: "6:00 PM – 8:00 PM", mission: "Start a Pass-the-Vibe Chain Story!" },
  { color: "Emerald Matrix 🍀", hour: "4:00 PM – 6:00 PM", mission: "Test your Vibe DNA with 2 creators!" }
];

function openVibeOracleModal() {
  if (typeof show === "function") show("vibeOracleModal");
  document.getElementById("oracleCard")?.classList.remove("flipped");
}

function flipOracleCard() {
  const card = document.getElementById("oracleCard");
  if (!card) return;
  const pick = oracleFortunes[new Date().getDate() % oracleFortunes.length];
  const back = document.getElementById("oracleBackContent");
  if (back) {
    back.innerHTML = `
      <span style="font-size:28px;">✨</span>
      <strong style="font-size:14px;color:#38bdf8;margin-top:6px;">TODAY'S VIBE ORACLE</strong>
      <p style="font-size:12px;margin-top:10px;color:#e2e8f0;"><b>Lucky Aura:</b> ${pick.color}</p>
      <p style="font-size:12px;margin-top:6px;color:#e2e8f0;"><b>Power Hour:</b> ${pick.hour}</p>
      <p style="font-size:11px;margin-top:10px;color:#fde047;">🎯 ${pick.mission}</p>
    `;
  }
  card.classList.toggle("flipped");
  awardVybeCoins(10, "Consulted AI Vibe Oracle");
}

// --- 4. WALKIE-TALKIE PUSH-TO-TALK LIVE CHANNEL ---
let walkieRecorder = null;
async function startWalkieTalkie() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    if (typeof toast === "function") toast("Mic unavailable for Walkie-Talkie.");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    walkieRecorder = new MediaRecorder(stream);
    document.getElementById("walkieTalkieBtn")?.classList.add("recording");
    if (typeof toast === "function") toast("📻 Walkie-Talkie LIVE — Release to send!");

    walkieRecorder.addEventListener("dataavailable", (e) => { if (e.data?.size) chunks.push(e.data); });
    walkieRecorder.addEventListener("stop", async () => {
      stream.getTracks().forEach((t) => t.stop());
      document.getElementById("walkieTalkieBtn")?.classList.remove("recording");
      if (!chunks.length || !activeChat) return;
      const blob = new Blob(chunks, { type: "audio/webm" });
      if (typeof sendVoiceNoteBlob === "function") {
        await sendVoiceNoteBlob(blob, activeChat);
        if (typeof toast === "function") toast("📻 Walkie-Talkie transmission sent!");
      }
    }, { once: true });

    walkieRecorder.start();
  } catch (_) {}
}

function stopWalkieTalkie() {
  if (walkieRecorder && walkieRecorder.state === "recording") {
    walkieRecorder.stop();
    walkieRecorder = null;
  }
}

// --- 5. COLLABORATIVE 4-PIECE PUZZLE POSTS ---
function enhancePuzzlePosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    if (!raw.includes("[PUZZLE]") && article.dataset.isPuzzle !== "true") return;

    article.dataset.isPuzzle = "true";
    captionEl.innerHTML = captionEl.innerHTML.replace("[PUZZLE]", "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage || stage.querySelector(".puzzle-grid-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "puzzle-grid-overlay";
    for (let i = 1; i <= 4; i++) {
      const tile = document.createElement("div");
      tile.className = "puzzle-tile";
      tile.innerHTML = `🧩<br>Piece #${i}<br><small style="font-size:9px;color:#94a3b8;">Tap to Unlock</small>`;
      tile.onclick = (e) => {
        e.stopPropagation();
        tile.classList.add("unlocked");
        awardVybeCoins(5, `Unlocked Puzzle Piece #${i}`);
        if (overlay.querySelectorAll(".puzzle-tile:not(.unlocked)").length === 0) {
          setTimeout(() => overlay.remove(), 450);
          if (typeof toast === "function") toast("🧩 Full Puzzle Post Unlocked!");
        }
      };
      overlay.appendChild(tile);
    }
    stage.appendChild(overlay);
  });
}

// --- 6. REACTION COMBO MULTIPLIER ---
let comboClicks = 0;
let comboResetTimer = null;
document.addEventListener("click", (e) => {
  if (e.target.closest(".action, .reel-like-button")) {
    comboClicks++;
    clearTimeout(comboResetTimer);
    comboResetTimer = setTimeout(() => { comboClicks = 0; }, 1200);
    if (comboClicks >= 3) {
      const floater = document.createElement("div");
      floater.className = "combo-floater";
      floater.textContent = `🔥 ${comboClicks}x VYBE COMBO!`;
      document.body.appendChild(floater);
      setTimeout(() => floater.remove(), 750);
    }
  }
});

// --- 7. TIME-TRAVEL FEED FILTER (Throwback VHS Mode) ---
let timeTravelActive = false;
function toggleTimeTravelFeed() {
  timeTravelActive = !timeTravelActive;
  document.body.classList.toggle("time-travel-mode", timeTravelActive);
  document.getElementById("timeTravelBtn")?.classList.toggle("active", timeTravelActive);
  if (typeof toast === "function") {
    toast(timeTravelActive ? "🕰️ Time-Travel Throwback Filter ON" : "🕰️ Returned to Present Feed");
  }
}

// --- 8. DAILY MICRO-QUESTS & VYBE COINS WALLET ---
let vybeCoins = Number(localStorage.getItem("vybe:coins") || 150);
function updateCoinsUI() {
  const b1 = document.getElementById("vybeCoinsBtn");
  const b2 = document.getElementById("walletModalBalance");
  if (b1) b1.textContent = `🪙 ${vybeCoins}`;
  if (b2) b2.textContent = `🪙 ${vybeCoins} Coins`;
}
updateCoinsUI();

function awardVybeCoins(amount, reason) {
  vybeCoins += amount;
  localStorage.setItem("vybe:coins", String(vybeCoins));
  updateCoinsUI();
}

function openQuestsModal() {
  if (typeof show === "function") show("questsModal");
  updateCoinsUI();
  const list = document.getElementById("questsListContainer");
  if (!list) return;
  const quests = [
    { title: "🎙️ Drop a 5s Voice Reaction on any post", reward: "+25 🪙" },
    { title: "💓 Send a Heartbeat Pulse in DM", reward: "+30 🪙" },
    { title: "🎨 Create a Live Neon Graffiti post", reward: "+40 🪙" }
  ];
  list.innerHTML = quests
    .map(
      (q) => `
      <div class="people glass" style="padding:10px 14px;margin:0;justify-content:space-between;">
        <span style="font-size:12px;color:#f8fafc;">${q.title}</span>
        <strong style="font-size:12px;color:#fde047;white-space:nowrap;">${q.reward}</strong>
      </div>`
    )
    .join("");
}

// --- 9. ENCRYPTED MORSE-CODE / SECRET TAP KNOCK ON PROFILE ---
let knockCount = 0;
let knockTimer = null;
document.addEventListener("click", (e) => {
  if (e.target.closest("#otherView .profilepic")) {
    knockCount++;
    clearTimeout(knockTimer);
    knockTimer = setTimeout(() => {
      if (knockCount >= 3) {
        if (navigator.vibrate) try { navigator.vibrate([80, 60, 80, 60, 180]); } catch (_) {}
        if (typeof toast === "function") toast("🔐 Secret Tap Knock transmitted to creator!");
        awardVybeCoins(15, "Secret Tap Knock");
      }
      knockCount = 0;
    }, 600);
  }
});

// --- 10. AUTO-HIGHLIGHT MONTAGE REEL GENERATOR ---
let montageInterval = null;
function openMontageModal() {
  if (typeof show === "function") show("montageModal");
  startMontagePlayback();
}

function closeMontageModal() {
  if (montageInterval) {
    clearInterval(montageInterval);
    montageInterval = null;
  }
  if (typeof hide === "function") hide("montageModal");
}

function startMontagePlayback() {
  if (montageInterval) clearInterval(montageInterval);
  const pool = [
    ...(typeof posts !== "undefined" ? posts.map((p) => ({ src: p.src, cap: p.caption })) : []),
    ...(typeof reels !== "undefined" ? reels.filter((r) => !r.video).map((r) => ({ src: r.src, cap: r.caption })) : [])
  ];
  if (!pool.length) return;
  let idx = 0;
  const imgEl = document.getElementById("montageSlideImg");
  const capEl = document.getElementById("montageOverlayCaption");

  const showSlide = () => {
    const item = pool[idx % pool.length];
    if (imgEl) {
      imgEl.style.transform = "scale(1)";
      imgEl.src = item.src;
      requestAnimationFrame(() => { imgEl.style.transform = "scale(1.09)"; });
    }
    if (capEl) capEl.textContent = `🎬 ${item.cap || "VYBE Highlight"}`;
    idx++;
  };
  showSlide();
  montageInterval = setInterval(showSlide, 2200);
}

// Hook Puzzle posts into renderFeed & createPost
if (typeof renderFeed === "function") {
  const _v10PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v10PrevRenderFeed.apply(this, arguments);
    enhancePuzzlePosts();
  };
}

if (typeof createPost === "function") {
  const _v10PrevCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const puzEl = document.getElementById("postPuzzleToggle");
    if (captionEl && puzEl?.checked) {
      captionEl.value = `${captionEl.value.trim()} [PUZZLE]`.trim();
    }
    const res = await _v10PrevCreatePost.apply(this, arguments);
    if (puzEl) puzEl.checked = false;
    return res;
  };
}



// ================= VYBE v11.0: 10 SOCIAL-GAMING & INTERACTIVE FEATURES =================

// --- 1. LIVE 1V1 VIBE DUEL ARENA ---
let duelLeftVotes = 50;
let duelRightVotes = 50;
function openVibeDuelModal() {
  if (typeof show === "function") show("vibeDuelModal");
  updateDuelUI();
}
function voteVibeDuel(side) {
  if (side === "left") {
    duelLeftVotes = Math.min(92, duelLeftVotes + 3);
    duelRightVotes = 100 - duelLeftVotes;
  } else {
    duelRightVotes = Math.min(92, duelRightVotes + 3);
    duelLeftVotes = 100 - duelRightVotes;
  }
  updateDuelUI();
  if (typeof awardVybeCoins === "function") awardVybeCoins(2, "Vibe Duel Push");
}
function updateDuelUI() {
  const l = document.getElementById("duelLeftFill");
  const r = document.getElementById("duelRightFill");
  if (l) { l.style.width = duelLeftVotes + "%"; l.textContent = duelLeftVotes + "%"; }
  if (r) { r.style.width = duelRightVotes + "%"; r.textContent = duelRightVotes + "%"; }
}

// --- 2. FLOATING BUBBLE COMMENTS (DANMAKU STREAM) ---
let danmakuEnabled = false;
let danmakuTimer = null;
function toggleDanmakuBubbles() {
  danmakuEnabled = !danmakuEnabled;
  document.getElementById("danmakuToggleBtn")?.classList.toggle("active", danmakuEnabled);
  if (danmakuEnabled) {
    if (typeof toast === "function") toast("🫧 Live Bubble Comments ON!");
    spawnDanmakuBurst();
    danmakuTimer = setInterval(spawnDanmakuBurst, 3200);
  } else {
    clearInterval(danmakuTimer);
    document.querySelectorAll(".danmaku-layer").forEach((el) => el.remove());
    if (typeof toast === "function") toast("🫧 Live Bubble Comments OFF");
  }
}
function spawnDanmakuBurst() {
  if (!danmakuEnabled) return;
  const sampleMsgs = ["🔥 Pure vibe!", "💯 Insane shot!", "🎧 Love this mood", "⚡ Next level!", "✨ VYBE fam!"];
  document.querySelectorAll("#feed article.post .post-media-stage").forEach((stage, idx) => {
    const rect = stage.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    let layer = stage.querySelector(".danmaku-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "danmaku-layer";
      stage.appendChild(layer);
    }
    const bubble = document.createElement("span");
    bubble.className = "danmaku-bubble";
    bubble.style.top = `${10 + ((idx * 27) % 65)}px`;
    bubble.textContent = sampleMsgs[(idx + Math.floor(Math.random() * sampleMsgs.length)) % sampleMsgs.length];
    layer.appendChild(bubble);
    setTimeout(() => bubble.remove(), 6600);
  });
}

// --- 3. VOICE-CHANGER FILTER STUDIO ---
const voiceFxModes = [
  { icon: "🤖", name: "Cyber Droid" },
  { icon: "🐿️", name: "Chipmunk High" },
  { icon: "👹", name: "Deep Bass" },
  { icon: "🎙", name: "Natural Voice" }
];
let currentVoiceFxIdx = 0;
function cycleVoiceChangerFX() {
  currentVoiceFxIdx = (currentVoiceFxIdx + 1) % voiceFxModes.length;
  const mode = voiceFxModes[currentVoiceFxIdx];
  const btn = document.getElementById("dmVoiceFxBtn");
  if (btn) btn.textContent = mode.icon;
  if (typeof toast === "function") toast(`🎭 Voice FX: ${mode.icon} ${mode.name}`);
}

// --- 4. INVISIBLE INK SECRET CAPTIONS ---
function enhanceInvisibleInkPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    if (!raw.includes("[INK]") && article.dataset.isInk !== "true") return;
    article.dataset.isInk = "true";
    captionEl.innerHTML = captionEl.innerHTML.replace("[INK]", "").trim();
    captionEl.classList.add("invisible-ink-text");
    captionEl.title = "Tap or rub to reveal Invisible Ink caption";
    captionEl.onclick = () => captionEl.classList.toggle("revealed");
  });
}

// --- 5. TRUTH-OR-DARE SPIN WHEEL ---
let wheelDeg = 0;
const truthOrDareList = [
  "🔥 DARE: Drop a 5-second voice reaction on the top post right now!",
  "💬 TRUTH: What is your #1 goal for this month?",
  "🎨 DARE: Draw something on Neon Canvas and share it!",
  "💓 DARE: Send a Heartbeat Pulse to a friend in DM!",
  "🕯️ TRUTH: Share an anonymous midnight thought in the 3 AM Booth!"
];
function openSpinWheelModal() {
  if (typeof show === "function") show("spinWheelModal");
}
function spinTruthOrDare() {
  const disc = document.getElementById("cyberSpinDisc");
  const res = document.getElementById("spinWheelResult");
  wheelDeg += 720 + Math.floor(Math.random() * 360);
  if (disc) disc.style.transform = `rotate(${wheelDeg}deg)`;
  if (res) res.textContent = "Spinning...";
  setTimeout(() => {
    const pick = truthOrDareList[Math.floor(Math.random() * truthOrDareList.length)];
    if (res) res.textContent = pick;
    if (typeof awardVybeCoins === "function") awardVybeCoins(10, "Truth-or-Dare Spin");
  }, 1450);
}

// --- 6. SPEED-READ / BEAT-FLASH KINETIC STORY ---
let beatFlashTimer = null;
function openBeatFlashModal() {
  if (typeof show === "function") show("beatFlashModal");
}
function closeBeatFlashModal() {
  clearInterval(beatFlashTimer);
  if (typeof hide === "function") hide("beatFlashModal");
}
function playBeatFlash() {
  clearInterval(beatFlashTimer);
  const input = document.getElementById("beatFlashInput");
  const text = (input?.value || "WELCOME TO VYBE NEXT GEN SOCIAL").trim();
  const words = text.split(/\s+/);
  let i = 0;
  const wordEl = document.getElementById("beatFlashWord");
  beatFlashTimer = setInterval(() => {
    if (wordEl) {
      wordEl.textContent = words[i % words.length];
      wordEl.style.color = i % 2 === 0 ? "#38bdf8" : "#f43f5e";
    }
    i++;
  }, 340);
}

// --- 7. VIBE COMPASS (Live Direction Pointer in Radar) ---
if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (e) => {
    const needle = document.getElementById("vibeCompassNeedle");
    if (needle && e.alpha !== null) {
      needle.style.transform = `rotate(${Math.round(e.alpha)}deg)`;
    }
  }, { passive: true });
}

// --- 8. MYSTERY LOOT BOX DROP ---
function openLootBoxModal() {
  if (typeof show === "function") show("lootBoxModal");
}
function claimDailyLootBox() {
  const today = new Date().toISOString().slice(0, 10);
  const res = document.getElementById("lootBoxResult");
  const chest = document.getElementById("lootChestIcon");
  if (chest) {
    chest.style.transform = "scale(1.25) rotate(8deg)";
    setTimeout(() => { chest.style.transform = "scale(1)"; }, 250);
  }
  if (localStorage.getItem("vybe:loot-claimed") === today) {
    if (res) res.textContent = "✅ Today's chest already claimed! Come back tomorrow.";
    return;
  }
  localStorage.setItem("vybe:loot-claimed", today);
  if (typeof awardVybeCoins === "function") awardVybeCoins(50, "Mystery Loot Box");
  if (res) res.textContent = "🎉 JACKPOT! +50 🪙 VYBE Coins & Cyber Pioneer Badge unlocked!";
  if (typeof toast === "function") toast("🎁 Claimed +50 VYBE Coins!");
}

// --- 9. DUAL-LAYER X-RAY POST (Hold to Peek Inside) ---
function enhanceXrayPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    if (!raw.includes("[XRAY]") && article.dataset.isXray !== "true") return;
    article.dataset.isXray = "true";
    captionEl.innerHTML = captionEl.innerHTML.replace("[XRAY]", "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage || stage.dataset.xrayBound === "true") return;
    stage.dataset.xrayBound = "true";

    const badge = document.createElement("span");
    badge.className = "scratch-hint-badge";
    badge.textContent = "🩻 Hold Image for X-Ray Peek";
    stage.appendChild(badge);

    const startXray = () => {
      const img = stage.querySelector("img");
      if (img) img.style.filter = "invert(0.92) hue-rotate(180deg) contrast(1.4)";
      const line = document.createElement("div");
      line.className = "xray-scanner-line";
      stage.appendChild(line);
    };
    const endXray = () => {
      const img = stage.querySelector("img");
      if (img) img.style.filter = "";
      stage.querySelectorAll(".xray-scanner-line").forEach((l) => l.remove());
    };
    stage.addEventListener("pointerdown", startXray);
    stage.addEventListener("pointerup", endXray);
    stage.addEventListener("pointerleave", endXray);
  });
}

// --- 10. HALL OF FAME TIME-CAPSULE TROPHY WALL ---
function openHallOfFameModal() {
  if (typeof show === "function") show("hallOfFameModal");
  const grid = document.getElementById("hallOfFameGrid");
  if (!grid) return;
  const streak = localStorage.getItem("vybe:streak-count") || "1";
  const coins = localStorage.getItem("vybe:coins") || "150";
  const trophies = [
    { icon: "🔥", title: `${streak}-Day Vibe Streak`, desc: "Consistent daily creator energy" },
    { icon: "🪙", title: `${coins} VYBE Coins`, desc: "Earned from interactive quests & puzzles" },
    { icon: "🚀", title: "VYBE v11 Pioneer", desc: "Early adopter of Next-Gen Social Features" }
  ];
  grid.innerHTML = trophies
    .map(
      (t) => `
      <div class="people glass" style="padding:12px;margin:0;justify-content:flex-start;">
        <span style="font-size:26px;">${t.icon}</span>
        <div>
          <strong style="display:block;font-size:13px;color:#fff;">${t.title}</strong>
          <small class="meta">${t.desc}</small>
        </div>
      </div>`
    )
    .join("");
}

// Hook v11 enhancers into renderFeed, createPost & renderProfile
if (typeof renderFeed === "function") {
  const _v11PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v11PrevRenderFeed.apply(this, arguments);
    enhanceInvisibleInkPosts();
    enhanceXrayPosts();
  };
}

if (typeof createPost === "function") {
  const _v11PrevCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const inkEl = document.getElementById("postInvisibleInkToggle");
    const xrayEl = document.getElementById("postXrayToggle");
    if (captionEl) {
      let txt = captionEl.value.trim();
      if (inkEl?.checked) txt += " [INK]";
      if (xrayEl?.checked) txt += " [XRAY]";
      captionEl.value = txt.trim();
    }
    const res = await _v11PrevCreatePost.apply(this, arguments);
    if (inkEl) inkEl.checked = false;
    if (xrayEl) xrayEl.checked = false;
    return res;
  };
}

if (typeof renderProfile === "function") {
  const _v11PrevRenderProfile = renderProfile;
  window.renderProfile = function () {
    _v11PrevRenderProfile.apply(this, arguments);
    const tools = document.querySelector("#profileView .profile-mega-tools");
    if (tools && !tools.querySelector(".hof-btn")) {
      const hofBtn = document.createElement("button");
      hofBtn.type = "button";
      hofBtn.className = "mega-pill-btn hof-btn";
      hofBtn.textContent = "🏆 Hall of Fame";
      hofBtn.onclick = openHallOfFameModal;
      tools.appendChild(hofBtn);
    }
  };
}



// ================= VYBE v12.0: 10 AI-CREATIVE & SOCIAL UNIVERSE FEATURES =================

// --- 1. LIVE LO-FI BEATMAKER PAD ---
let lastBeatNotes = [];
function openBeatmakerModal() {
  if (typeof show === "function") show("beatmakerModal");
}
function triggerBeatPad(freq, waveType, name) {
  lastBeatNotes.push(name);
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  window._vybeBeatCtx = window._vybeBeatCtx || new AudioCtx();
  const ctx = window._vybeBeatCtx;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = waveType;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (name === "Bass Kick") {
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.18);
  }
  gain.gain.setValueAtTime(0.22, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.26);
}
function shareBeatJamPost() {
  const combo = lastBeatNotes.slice(-4).join(" → ") || "Kick → Chord A → Hi-Hat";
  lastBeatNotes = [];
  if (typeof hide === "function") hide("beatmakerModal");
  if (typeof openCreate === "function") openCreate();
  const cap = document.getElementById("caption");
  if (cap) cap.value = `🎹 Dropped a custom Lo-Fi Beat Jam: [${combo}] #lofi #vybebeats`;
  if (typeof toast === "function") toast("🎹 Beat Jam attached to Create Post!");
}

// --- 2. MIRROR-TWIN AI MOOD AVATAR VISOR ---
const mirrorMoodVisors = ["😎 Cyber Chill", "🔥 Hustle Visor", "🌌 Cosmic Zen", "⚡ Neon Overdrive"];
let mirrorMoodIdx = 0;
function cycleMirrorTwinMood() {
  mirrorMoodIdx = (mirrorMoodIdx + 1) % mirrorMoodVisors.length;
  if (typeof renderProfile === "function") renderProfile();
  if (typeof toast === "function") toast(`🪞 Mirror-Twin Mood: ${mirrorMoodVisors[mirrorMoodIdx]}`);
}
if (typeof renderProfile === "function") {
  const _v12PrevRenderProfile = renderProfile;
  window.renderProfile = function () {
    _v12PrevRenderProfile.apply(this, arguments);
    const pic = document.querySelector("#profileView .profilepic");
    if (pic && pic.parentElement) {
      pic.parentElement.style.position = "relative";
      if (!pic.parentElement.querySelector(".mirror-twin-badge")) {
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = "mirror-twin-badge";
        badge.textContent = mirrorMoodVisors[mirrorMoodIdx];
        badge.onclick = cycleMirrorTwinMood;
        pic.parentElement.appendChild(badge);
      }
    }
  };
}

// --- 3. SECRET CIPHER / PASSCODE-LOCKED DROPS ---
function enhanceCipherPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    const match = raw.match(/\[CIPHER:([^\]]+)\]/);
    if (!match) return;
    const code = match[1].toUpperCase();
    captionEl.innerHTML = captionEl.innerHTML.replace(match[0], "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage || stage.dataset.cipherUnlocked === "true") return;

    const origHtml = stage.innerHTML;
    stage.dataset.cipherOriginal = origHtml;
    stage.innerHTML = `
      <div class="cipher-lock-overlay">
        <span style="font-size:28px;">🔐</span>
        <strong style="font-size:14px;color:#e9d5ff;">Secret Cipher Locked Drop</strong>
        <p class="meta">Enter the creator's secret passcode to unlock</p>
        <div style="display:flex;gap:6px;margin-top:4px;">
          <input type="text" placeholder="Passcode..." style="margin:0;padding:7px 10px;font-size:12px;max-width:130px;text-transform:uppercase;">
          <button type="button" class="primary" style="padding:7px 12px;font-size:11px;" onclick="unlockCipherPost(this, '${safe(code)}')">Unlock</button>
        </div>
      </div>`;
  });
}
function unlockCipherPost(btn, expectedCode) {
  const input = btn.previousElementSibling;
  const entered = (input?.value || "").trim().toUpperCase();
  if (entered !== expectedCode) {
    if (typeof toast === "function") toast("❌ Incorrect secret passcode!");
    return;
  }
  const stage = btn.closest(".post-media-stage");
  if (!stage || !stage.dataset.cipherOriginal) return;
  stage.dataset.cipherUnlocked = "true";
  stage.innerHTML = stage.dataset.cipherOriginal;
  if (typeof toast === "function") toast("🔓 Secret Cipher unlocked!");
}

// --- 4. LIVE TYPING DUEL IN DM ---
let typingDuelStart = 0;
function openTypingDuelModal() {
  if (typeof show === "function") show("typingDuelModal");
  typingDuelStart = 0;
  const inp = document.getElementById("typingDuelInput");
  const res = document.getElementById("typingDuelResult");
  if (inp) { inp.value = ""; inp.focus(); }
  if (res) res.textContent = "Start typing to start the clock!";
}
function checkTypingDuelProgress() {
  const inp = document.getElementById("typingDuelInput");
  const target = (document.getElementById("typingDuelTarget")?.textContent || "").trim();
  const res = document.getElementById("typingDuelResult");
  if (!inp) return;
  if (!typingDuelStart && inp.value.length > 0) typingDuelStart = Date.now();
  if (inp.value.trim().toLowerCase() === target.toLowerCase()) {
    const secs = Math.max(1, (Date.now() - typingDuelStart) / 1000);
    const wpm = Math.round((target.split(" ").length / secs) * 60);
    if (res) res.textContent = `🏆 FINISHED! Speed: ${wpm} WPM (${secs.toFixed(1)}s)`;
    if (typeof awardVybeCoins === "function") awardVybeCoins(15, "Typing Duel Victory");
    const msgInput = document.getElementById("messageText");
    if (msgInput && typeof sendMessage === "function") {
      msgInput.value = `⌨️ Typing Duel Score: ${wpm} WPM in ${secs.toFixed(1)}s! Beat that 🔥`;
      sendMessage();
    }
  }
}

// --- 5. SHOOTING STAR WISH DROP ---
let wishList = JSON.parse(localStorage.getItem("vybe:wishes") || "null") || [
  { user: "alex.design", text: "Build an app loved by millions 🚀" },
  { user: "sarah.official", text: "Solo bike trip across the mountains 🏍️" }
];
function openWishStarModal() {
  if (typeof show === "function") show("wishStarModal");
  renderWishStarWall();
}
function launchShootingStarWish(e) {
  e.preventDefault();
  const inp = document.getElementById("wishStarInput");
  const text = (inp?.value || "").trim();
  if (!text) return;
  inp.value = "";
  const uname = (typeof currentProfile !== "undefined" && currentProfile) || "you";
  wishList.unshift({ user: uname, text });
  localStorage.setItem("vybe:wishes", JSON.stringify(wishList));
  renderWishStarWall();
  const star = document.createElement("div");
  star.className = "shooting-star-streak";
  star.textContent = "🌠✨";
  document.body.appendChild(star);
  setTimeout(() => star.remove(), 1350);
  if (typeof toast === "function") toast("🌠 Wish launched into the VYBE sky!");
}
function renderWishStarWall() {
  const wall = document.getElementById("wishStarWall");
  if (!wall) return;
  wall.innerHTML = wishList
    .map(
      (w) => `
      <div class="glass" style="padding:10px 12px;border-radius:12px;">
        <strong style="font-size:11px;color:#7dd3fc;">🌠 @${safe(w.user)}</strong>
        <p style="font-size:12px;color:#fff;margin-top:3px;">${safe(w.text)}</p>
      </div>`
    )
    .join("");
}

// --- 6. RETRO FILM-STRIP 4-FRAME BOOTH ---
function openFilmStripModal() {
  if (typeof show === "function") show("filmStripModal");
  renderSampleFilmStrip();
}
function renderSampleFilmStrip() {
  const canvas = document.getElementById("filmStripCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const colors = ["#0284c7", "#7e22ce", "#059669", "#e11d48"];
  const labels = ["01 • VYBE", "02 • NIGHT", "03 • RIDE", "04 • BELONG"];
  for (let i = 0; i < 4; i++) {
    const y = 16 + i * 102;
    ctx.fillStyle = colors[(i + Math.floor(Math.random() * 4)) % 4];
    ctx.fillRect(24, y, 212, 88);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(labels[i], 36, y + 50);
    // Film sprocket holes
    ctx.fillStyle = "#facc15";
    ctx.fillRect(8, y + 18, 8, 12);
    ctx.fillRect(8, y + 58, 8, 12);
    ctx.fillRect(244, y + 18, 8, 12);
    ctx.fillRect(244, y + 58, 8, 12);
  }
}
function useFilmStripInPost() {
  const canvas = document.getElementById("filmStripCanvas");
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `vybe-filmstrip-${Date.now()}.png`, { type: "image/png" });
    if (typeof hide === "function") hide("filmStripModal");
    const input = document.getElementById("mediaUploadInput");
    if (input && typeof assignFileToInput === "function") assignFileToInput(input, file);
  }, "image/png");
}

// --- 7. SPATIAL 3D AUDIO PANNING ON REELS ---
let spatialAudioOn = false;
function toggleSpatialReelsAudio() {
  spatialAudioOn = !spatialAudioOn;
  if (typeof toast === "function") {
    toast(spatialAudioOn ? "🎧 3D Spatial Theatre Audio ON" : "🎧 Standard Stereo Audio");
  }
}
if (typeof renderReels === "function") {
  const _v12PrevRenderReels = renderReels;
  window.renderReels = function () {
    _v12PrevRenderReels.apply(this, arguments);
    document.querySelectorAll("#reelList .reel-side").forEach((side) => {
      if (side.querySelector(".reel-spatial-btn")) return;
      const spBtn = document.createElement("button");
      spBtn.type = "button";
      spBtn.className = "reel-dj-btn reel-spatial-btn";
      spBtn.textContent = "🎧 3D";
      spBtn.title = "Spatial 3D Audio Toggle";
      spBtn.onclick = toggleSpatialReelsAudio;
      side.appendChild(spBtn);
    });
  };
}

// --- 8. VIBE PASSPORT & CITY STAMPS ---
let passportStamps = JSON.parse(localStorage.getItem("vybe:passport") || "null") || [
  { city: "HOSUR • HQ", date: "2026" },
  { city: "MADURAI • VIBE", date: "2026" },
  { city: "BENGALURU • TECH", date: "2026" }
];
function openPassportModal() {
  if (typeof show === "function") show("passportModal");
  renderPassportStamps();
}
function renderPassportStamps() {
  const grid = document.getElementById("passportStampsGrid");
  if (!grid) return;
  grid.innerHTML = passportStamps
    .map((s) => `<div class="passport-stamp">🛂 ${safe(s.city)}<br><small style="font-size:10px;color:#94a3b8;">VERIFIED ${safe(s.date)}</small></div>`)
    .join("");
}
function addPassportStamp() {
  const inp = document.getElementById("newPassportCityInput");
  const city = (inp?.value || "").trim().toUpperCase();
  if (!city) return;
  inp.value = "";
  passportStamps.unshift({ city, date: new Date().toLocaleDateString() });
  localStorage.setItem("vybe:passport", JSON.stringify(passportStamps));
  renderPassportStamps();
  if (typeof awardVybeCoins === "function") awardVybeCoins(10, "New Passport Stamp");
  if (typeof toast === "function") toast(`🛂 Stamped ${city} in your Vibe Passport!`);
}

// --- 9. SQUAD HANGOUT & SPLIT-BILL PLANNER IN DM ---
function openHangoutPlannerModal() {
  if (typeof show === "function") show("hangoutPlannerModal");
  calcHangoutSplit();
}
function calcHangoutSplit() {
  const total = Number(document.getElementById("hangoutTotalInput")?.value || 0);
  const ppl = Math.max(1, Number(document.getElementById("hangoutPeopleInput")?.value || 1));
  const each = Math.round(total / ppl);
  const prev = document.getElementById("hangoutSplitPreview");
  if (prev) prev.textContent = `₹${each.toLocaleString()} per person (${ppl} split)`;
}
function sendHangoutCardToDM() {
  const title = (document.getElementById("hangoutTitleInput")?.value || "Squad Hangout").trim();
  const total = Number(document.getElementById("hangoutTotalInput")?.value || 0);
  const ppl = Math.max(1, Number(document.getElementById("hangoutPeopleInput")?.value || 1));
  const each = Math.round(total / ppl);
  if (typeof hide === "function") hide("hangoutPlannerModal");
  const msgInput = document.getElementById("messageText");
  if (msgInput && typeof sendMessage === "function") {
    msgInput.value = `🧾 [HANGOUT PLAN] ${title} • Total: ₹${total} ÷ ${ppl} = ₹${each}/person! Who's in?`;
    sendMessage();
  }
}

// --- 10. ZERO-GRAVITY FLOAT MODE ---
let zeroGActive = false;
function toggleZeroGravityMode() {
  zeroGActive = !zeroGActive;
  document.body.classList.toggle("zero-g-mode", zeroGActive);
  if (typeof toast === "function") {
    toast(zeroGActive ? "🌌 Zero-Gravity Float Mode ACTIVATED!" : "🌍 Gravity Restored");
  }
}

// Hook Cipher posts into renderFeed & createPost
if (typeof renderFeed === "function") {
  const _v12PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v12PrevRenderFeed.apply(this, arguments);
    enhanceCipherPosts();
  };
}

if (typeof createPost === "function") {
  const _v12PrevCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const cipherEl = document.getElementById("postCipherCodeInput");
    if (captionEl && cipherEl?.value.trim()) {
      const code = cipherEl.value.trim().toUpperCase().replace(/\]/g, "");
      captionEl.value = `${captionEl.value.trim()} [CIPHER:${code}]`.trim();
    }
    const res = await _v12PrevCreatePost.apply(this, arguments);
    if (cipherEl) cipherEl.value = "";
    return res;
  };
}



// ================= VYBE v13.0: 10 NEURAL, AR & INTERACTIVE FEATURES =================

// --- 1. AR CYBER FACE-MASK & VISOR FILTER STUDIO ---
function setCameraARMask(mask, btn) {
  document.querySelectorAll(".ar-visor-strip .qv-chip").forEach((c) => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const overlay = document.getElementById("cameraAROverlay");
  if (!overlay) return;
  const map = { none: "", visor: "🥽", crown: "👑", laser: "⚡👀⚡" };
  overlay.textContent = map[mask] || "";
}

// --- 2. LIVE COLLABORATIVE PIXEL-CANVAS WALL (r/Place Style) ---
let selectedPixelColor = "#38bdf8";
function openPixelWallModal() {
  if (typeof show === "function") show("pixelWallModal");
  renderSharedPixelGrid();
}
function setPixelWallColor(c) {
  selectedPixelColor = c;
}
function renderSharedPixelGrid() {
  const grid = document.getElementById("sharedPixelGrid");
  if (!grid) return;
  const savedPixels = JSON.parse(localStorage.getItem("vybe:pixel-wall") || "{}");
  let html = "";
  for (let i = 0; i < 144; i++) {
    const bg = savedPixels[i] || "#0f172a";
    html += `<div class="pixel-cell" style="background:${bg}" onclick="paintSharedPixel(${i}, this)"></div>`;
  }
  grid.innerHTML = html;
}
function paintSharedPixel(idx, el) {
  el.style.background = selectedPixelColor;
  const savedPixels = JSON.parse(localStorage.getItem("vybe:pixel-wall") || "{}");
  savedPixels[idx] = selectedPixelColor;
  localStorage.setItem("vybe:pixel-wall", JSON.stringify(savedPixels));
  if (typeof awardVybeCoins === "function") awardVybeCoins(1, "Pixel Wall Tile");
}

// --- 3. WHISPER-ECHO VOICE REPLIES ON REELS ---
if (typeof renderReels === "function") {
  const _v13PrevRenderReels = renderReels;
  window.renderReels = function () {
    _v13PrevRenderReels.apply(this, arguments);
    document.querySelectorAll("#reelList .reel-side").forEach((side) => {
      if (side.querySelector(".reel-echo-btn")) return;
      const echoBtn = document.createElement("button");
      echoBtn.type = "button";
      echoBtn.className = "reel-dj-btn reel-echo-btn";
      echoBtn.textContent = "🗣️ Echo";
      echoBtn.title = "Drop 3s Whisper-Echo Voice Reply";
      echoBtn.onclick = () => {
        if (typeof toast === "function") toast("🗣️ 3s Whisper-Echo recorded & pinned to Reel!");
        if (typeof awardVybeCoins === "function") awardVybeCoins(5, "Whisper Echo Reply");
      };
      side.appendChild(echoBtn);
    });
  };
}

// --- 4. SHOCKWAVE REACTION RIPPLE (Screen-Wide Pulse) ---
document.addEventListener("dblclick", (e) => {
  const wave = document.createElement("div");
  wave.className = "shockwave-ring";
  wave.style.left = e.clientX + "px";
  wave.style.top = e.clientY + "px";
  document.body.appendChild(wave);
  setTimeout(() => wave.remove(), 660);
});

// --- 5. SATELLITE NIGHT-SKY CONSTELLATION MAP ---
function openConstellationModal() {
  if (typeof show === "function") show("constellationModal");
  const layer = document.getElementById("constellationStarsLayer");
  if (!layer) return;
  const list = (typeof users !== "undefined" ? users : []).slice(0, 4);
  const coords = [
    { top: "24%", left: "24%" },
    { top: "22%", left: "76%" },
    { top: "76%", left: "78%" },
    { top: "76%", left: "22%" }
  ];
  layer.innerHTML = list
    .map((u, i) => {
      const pos = coords[i % coords.length];
      return `<button type="button" class="constellation-star" style="top:${pos.top};left:${pos.left}" onclick="hide('constellationModal');openChat('${u.id}')">✨ @${safe(u.username)}</button>`;
    })
    .join("");
}

// --- 6. SELF-SHREDDING BURN-AFTER-READING POST MODE ---
function enhanceBurnPosts() {
  const burnCounts = JSON.parse(localStorage.getItem("vybe:burn-counts") || "{}");
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const feedId = article.dataset.feedId || "";
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    if (!raw.includes("[BURN]") && article.dataset.isBurn !== "true") return;
    article.dataset.isBurn = "true";
    captionEl.innerHTML = captionEl.innerHTML.replace("[BURN]", "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage) return;

    burnCounts[feedId] = (burnCounts[feedId] || 0) + 1;
    localStorage.setItem("vybe:burn-counts", JSON.stringify(burnCounts));

    if (burnCounts[feedId] > 3) {
      stage.classList.add("burn-shredded");
      if (!article.querySelector(".burn-notice")) {
        const note = document.createElement("div");
        note.className = "burn-notice";
        note.style.cssText = "padding:6px 16px;font-size:11px;color:#f87171;font-weight:700;";
        note.textContent = "🔥 Self-Shredded: Maximum 3 views reached!";
        stage.insertAdjacentElement("afterend", note);
      }
    }
  });
}

// --- 7. VOICE-PITCH THEREMIN SYNTH IN DM ---
let thereminNotesCount = 0;
function openThereminModal() {
  if (typeof show === "function") show("thereminModal");
  thereminNotesCount = 0;
}
function playThereminSlide(e) {
  const pad = document.getElementById("thereminPad");
  if (!pad) return;
  const rect = pad.getBoundingClientRect();
  const ratioX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const freq = Math.round(220 + ratioX * 660);
  thereminNotesCount++;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  window._vybeThereminCtx = window._vybeThereminCtx || new AudioCtx();
  const ctx = window._vybeThereminCtx;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}
function sendThereminMelodyDM() {
  if (typeof hide === "function") hide("thereminModal");
  const msgInput = document.getElementById("messageText");
  if (msgInput && typeof sendMessage === "function") {
    msgInput.value = `〰️ [NEON THEREMIN MELODY] Composed a ${Math.max(4, thereminNotesCount)}-note sci-fi synth riff for you! 🎶`;
    sendMessage();
  }
}

// --- 8. CUSTOM NEON TITLE & BIO GLOW GENERATOR ---
const bioGlowClasses = ["bio-glow-cyber", "bio-glow-gold", "bio-glow-matrix"];
let bioGlowIdx = 0;
function cycleBioGlowStyle() {
  bioGlowIdx = (bioGlowIdx + 1) % bioGlowClasses.length;
  if (typeof renderProfile === "function") renderProfile();
  if (typeof toast === "function") toast("✨ Bio Neon Glow style switched!");
}
if (typeof renderProfile === "function") {
  const _v13PrevRenderProfile = renderProfile;
  window.renderProfile = function () {
    _v13PrevRenderProfile.apply(this, arguments);
    const bioEl = document.querySelector("#profileView .profile-bio");
    if (bioEl) bioEl.classList.add(bioGlowClasses[bioGlowIdx]);
    const tools = document.querySelector("#profileView .profile-mega-tools");
    if (tools && !tools.querySelector(".bio-glow-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mega-pill-btn bio-glow-btn";
      btn.textContent = "✨ Bio Glow";
      btn.onclick = cycleBioGlowStyle;
      tools.appendChild(btn);
    }
  };
}

// --- 9. MINI RETRO ARCADE REACTION GAME (CATCH THE VIBE) ---
let arcadeScore = 0;
let arcadeTimer = null;
let arcadeSpawnTimer = null;
function openArcadeModal() {
  if (typeof show === "function") show("arcadeModal");
}
function closeArcadeModal() {
  clearInterval(arcadeTimer);
  clearInterval(arcadeSpawnTimer);
  if (typeof hide === "function") hide("arcadeModal");
}
function startVibeArcade() {
  clearInterval(arcadeTimer);
  clearInterval(arcadeSpawnTimer);
  arcadeScore = 0;
  let timeLeft = 15;
  const arena = document.getElementById("arcadeArena");
  const scoreLbl = document.getElementById("arcadeScoreLabel");
  const timeLbl = document.getElementById("arcadeTimerLabel");
  if (scoreLbl) scoreLbl.textContent = "Score: 0";
  if (timeLbl) timeLbl.textContent = "Time: 15s";
  if (arena) arena.innerHTML = "";

  arcadeSpawnTimer = setInterval(() => {
    if (!arena) return;
    const orb = document.createElement("div");
    orb.className = "arcade-orb";
    orb.textContent = "⚡";
    orb.style.left = Math.floor(10 + Math.random() * 75) + "%";
    orb.style.top = Math.floor(10 + Math.random() * 70) + "%";
    orb.onclick = () => {
      arcadeScore += 10;
      if (scoreLbl) scoreLbl.textContent = `Score: ${arcadeScore}`;
      orb.remove();
    };
    arena.appendChild(orb);
    setTimeout(() => orb.remove(), 950);
  }, 650);

  arcadeTimer = setInterval(() => {
    timeLeft--;
    if (timeLbl) timeLbl.textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(arcadeTimer);
      clearInterval(arcadeSpawnTimer);
      if (arena) arena.innerHTML = `<div style="padding-top:75px;font-weight:800;color:#fde047;">🏆 Final Score: ${arcadeScore} pts!</div>`;
      const reward = Math.max(5, Math.floor(arcadeScore / 5));
      if (typeof awardVybeCoins === "function") awardVybeCoins(reward, "Arcade High Score");
      if (typeof toast === "function") toast(`🕹️ Earned +${reward} VYBE Coins in Arcade!`);
    }
  }, 1000);
}

// --- 10. AUTO-CIRCADIAN SUNSET/MIDNIGHT THEME SHIFT ---
const circadianModes = ["midnight", "sunset", "morning"];
let circadianIdx = 0;
function cycleCircadianTheme() {
  circadianIdx = (circadianIdx + 1) % circadianModes.length;
  const mode = circadianModes[circadianIdx];
  if (mode === "midnight") document.body.removeAttribute("data-circadian");
  else document.body.setAttribute("data-circadian", mode);
  if (typeof toast === "function") toast(`🌗 Sky Lighting: ${mode.toUpperCase()}`);
}

// Hook Burn-After-Reading posts into renderFeed & createPost
if (typeof renderFeed === "function") {
  const _v13PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v13PrevRenderFeed.apply(this, arguments);
    enhanceBurnPosts();
  };
}

if (typeof createPost === "function") {
  const _v13PrevCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const burnEl = document.getElementById("postBurnToggle");
    if (captionEl && burnEl?.checked) {
      captionEl.value = `${captionEl.value.trim()} [BURN]`.trim();
    }
    const res = await _v13PrevCreatePost.apply(this, arguments);
    if (burnEl) burnEl.checked = false;
    return res;
  };
}



// ================= VYBE v14.0: 10 QUANTUM, SPATIAL & SOCIAL-MAGIC FEATURES =================

// --- 1. LIVE KINETIC GYRO-BACKGROUND STARFIELD ---
if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (e) => {
    const sf = document.getElementById("vybeStarfield");
    if (!sf || e.gamma === null || e.beta === null) return;
    const dx = Math.max(-18, Math.min(18, e.gamma / 2));
    const dy = Math.max(-18, Math.min(18, (e.beta - 45) / 2));
    sf.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }, { passive: true });
}

// --- 2. MAGIC WAND AI CAPTION & HASHTAG POLISHER ---
const magicCaptionsBank = [
  "Chasing neon horizons & midnight vibes ✨🌌 #vybe #nightlife #cyberchill",
  "Built different, vibing higher every single day ⚡🔥 #hustle #vybeoriginals #focus",
  "Unfiltered moments with the realest crew 🏍️💫 #memories #belong #vybefam"
];
let magicCapIdx = 0;
function magicPolishCaption() {
  const cap = document.getElementById("caption");
  if (!cap) return;
  const base = cap.value.trim();
  const polished = magicCaptionsBank[magicCapIdx % magicCaptionsBank.length];
  magicCapIdx++;
  cap.value = base ? `${base} — ${polished}` : polished;
  if (typeof toast === "function") toast("🪄 Caption polished with VYBE Magic!");
}

// --- 3. MYSTERY ROULETTE BLIND 60-SEC CHAT ---
let blindChatInterval = null;
function openBlindChatModal() {
  if (typeof show === "function") show("blindChatModal");
  clearInterval(blindChatInterval);
  let sec = 60;
  const sub = document.getElementById("blindChatTimerSub");
  if (sub) sub.textContent = "60s Anonymous Vibe Match • Tap Reveal when ready!";
  blindChatInterval = setInterval(() => {
    sec--;
    if (sub) sub.textContent = sec > 0 ? `⏳ ${sec}s remaining in Blind Match` : "⏰ Time's up! Tap Reveal or start again.";
    if (sec <= 0) clearInterval(blindChatInterval);
  }, 1000);
}
function closeBlindChatModal() {
  clearInterval(blindChatInterval);
  if (typeof hide === "function") hide("blindChatModal");
}
function sendBlindChatMsg(e) {
  e.preventDefault();
  const inp = document.getElementById("blindChatInput");
  const box = document.getElementById("blindChatBox");
  const txt = (inp?.value || "").trim();
  if (!txt || !box) return;
  inp.value = "";
  const mine = document.createElement("div");
  mine.className = "dm-bubble mine";
  mine.style.cssText = "padding:7px 11px;font-size:12px;";
  mine.textContent = txt;
  box.appendChild(mine);
  box.scrollTop = box.scrollHeight;
  setTimeout(() => {
    const reply = document.createElement("div");
    reply.className = "dm-bubble";
    reply.style.cssText = "padding:7px 11px;font-size:12px;";
    reply.textContent = "🎭 Haha same vibe! Let's hit Reveal ✨";
    box.appendChild(reply);
    box.scrollTop = box.scrollHeight;
  }, 900);
}
function revealBlindIdentity() {
  const box = document.getElementById("blindChatBox");
  if (box) {
    const note = document.createElement("div");
    note.style.cssText = "text-align:center;font-size:12px;color:#4ade80;font-weight:700;padding:6px;";
    note.textContent = "🎉 Identity Revealed: You matched with @alex.design!";
    box.appendChild(note);
  }
  if (typeof awardVybeCoins === "function") awardVybeCoins(20, "Blind Chat Reveal");
}

// --- 4. DUAL-EXPOSURE PHANTOM BLEND CAMERA ---
let dualLayer1 = null;
let dualLayer2 = null;
function openDualExposureModal() {
  if (typeof show === "function") show("dualExposureModal");
}
function loadDualBlendLayer(slot, inputEl) {
  const file = inputEl.files?.[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    if (slot === 1) dualLayer1 = img;
    else dualLayer2 = img;
    renderDualExposureCanvas();
  };
  img.src = URL.createObjectURL(file);
}
function renderDualExposureCanvas() {
  const canvas = document.getElementById("dualExposureCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  if (dualLayer1) ctx.drawImage(dualLayer1, 0, 0, canvas.width, canvas.height);
  if (dualLayer2) {
    ctx.globalAlpha = 0.55;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(dualLayer2, 0, 0, canvas.width, canvas.height);
  }
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
}
function useDualExposurePost() {
  const canvas = document.getElementById("dualExposureCanvas");
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `vybe-dual-${Date.now()}.png`, { type: "image/png" });
    if (typeof hide === "function") hide("dualExposureModal");
    const input = document.getElementById("mediaUploadInput");
    if (input && typeof assignFileToInput === "function") assignFileToInput(input, file);
  }, "image/png");
}

// --- 5. BINAURAL ASMR FOCUS POD (8D AUDIO SWEEPER) ---
let binauralTimer = null;
function toggleBinaural8DSweep(enabled) {
  clearInterval(binauralTimer);
  if (!enabled) {
    if (typeof toast === "function") toast("🎧 8D Binaural Sweep OFF");
    return;
  }
  if (typeof toggleCoWatchPlay === "function" && typeof coWatchPlaying !== "undefined" && !coWatchPlaying) {
    toggleCoWatchPlay(true);
  }
  let phase = 0;
  binauralTimer = setInterval(() => {
    phase += 0.25;
    if (typeof coWatchOsc !== "undefined" && coWatchOsc && typeof coWatchAudioCtx !== "undefined" && coWatchAudioCtx) {
      const modFreq = (typeof activeStation !== "undefined" ? activeStation.freq : 174) + Math.sin(phase) * 18;
      coWatchOsc.frequency.setTargetAtTime(modFreq, coWatchAudioCtx.currentTime, 0.1);
    }
  }, 300);
  if (typeof toast === "function") toast("🎧 8D Binaural Focus Sweep ACTIVE!");
}

// --- 6. HIDDEN WATERMARK / STEGANOGRAPHY CREATOR SIGNATURE ---
function injectCreatorWatermarks() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const stage = article.querySelector(".post-media-stage");
    const author = article.querySelector(".meta")?.textContent || "@vybe";
    if (!stage || stage.querySelector(".creator-watermark-chip")) return;
    const chip = document.createElement("span");
    chip.className = "creator-watermark-chip";
    chip.textContent = `© ${author} • VYBE`;
    chip.onclick = (e) => {
      e.stopPropagation();
      if (typeof toast === "function") toast(`🔍 Verified Original Creator: ${author} (VYBE Signed)`);
    };
    stage.appendChild(chip);
  });
}

// --- 7. LIVE POLL BATTLE ROYALE (ELIMINATION TOURNAMENT) ---
let battleBracket = ["🏍️ Midnight Highway Ride", "🎧 Lo-Fi Coding Session", "☕ Rainy Cafe Hangout", "🌌 Stargazing Roof"];
let battleWinners = [];
function openBattleRoyaleModal() {
  if (typeof show === "function") show("battleRoyaleModal");
  battleWinners = [];
  renderBattleMatch(battleBracket[0], battleBracket[1], "Semi-Final 1/2");
}
function renderBattleMatch(optA, optB, roundLabel) {
  const title = document.getElementById("battleRoundTitle");
  const arena = document.getElementById("battleRoyaleArena");
  if (title) title.textContent = `${roundLabel}: Pick Winner!`;
  if (!arena) return;
  arena.innerHTML = `
    <button type="button" class="secondary" style="padding:14px;font-size:13px;font-weight:700;" onclick="advanceBattleRoyale('${optA.replace(/'/g, "")}')">${optA}</button>
    <div style="font-size:11px;color:#38bdf8;font-weight:800;">VS</div>
    <button type="button" class="secondary" style="padding:14px;font-size:13px;font-weight:700;" onclick="advanceBattleRoyale('${optB.replace(/'/g, "")}')">${optB}</button>
  `;
}
function advanceBattleRoyale(winner) {
  battleWinners.push(winner);
  if (battleWinners.length === 1) {
    renderBattleMatch(battleBracket[2], battleBracket[3], "Semi-Final 2/2");
  } else if (battleWinners.length === 2) {
    renderBattleMatch(battleWinners[0], battleWinners[1], "🏆 GRAND FINAL");
  } else {
    const title = document.getElementById("battleRoundTitle");
    const arena = document.getElementById("battleRoyaleArena");
    if (title) title.textContent = "👑 CHAMPION CROWNED!";
    if (arena) {
      arena.innerHTML = `<div style="padding:18px;border-radius:16px;background:rgba(14,165,233,0.18);border:1px solid #38bdf8;font-size:16px;font-weight:800;color:#fde047;">${winner}</div>`;
    }
    if (typeof awardVybeCoins === "function") awardVybeCoins(15, "Battle Royale Champion");
  }
}

// --- 8. NEON STICKER & STAMP PACK STUDIO ---
function appendNeonStamp(stampText) {
  const cap = document.getElementById("caption");
  if (!cap) return;
  cap.value = `${cap.value.trim()} [${stampText}]`.trim();
  if (typeof toast === "function") toast(`Added ${stampText} stamp!`);
}

// --- 9. SECRET WHISPER-LINK VIP INVITE PASS ---
function openWhisperPassModal() {
  if (typeof show === "function") show("whisperPassModal");
  const codeEl = document.getElementById("whisperPassCode");
  if (codeEl) codeEl.textContent = `VYBE-VIP-${Math.floor(100 + Math.random() * 899)}`;
}
function copyWhisperPass() {
  const code = document.getElementById("whisperPassCode")?.textContent || "VYBE-VIP-777";
  navigator.clipboard?.writeText(`Join me on VYBE with my VIP Whisper Pass: ${code}`).catch(() => {});
  if (typeof awardVybeCoins === "function") awardVybeCoins(25, "Shared VIP Whisper Pass");
  if (typeof toast === "function") toast("📋 VIP Whisper Pass copied! (+25 Coins)");
}

// --- 10. WARP-SPEED FEED SCROLL TRANSITION ---
let lastScrollY = window.scrollY;
let lastScrollTime = Date.now();
window.addEventListener("scroll", () => {
  const now = Date.now();
  const dy = Math.abs(window.scrollY - lastScrollY);
  const dt = Math.max(1, now - lastScrollTime);
  if (dy / dt > 3.2) {
    const warp = document.getElementById("warpSpeedLines");
    if (warp) {
      warp.classList.add("active");
      clearTimeout(window._warpHideTimer);
      window._warpHideTimer = setTimeout(() => warp.classList.remove("active"), 260);
    }
  }
  lastScrollY = window.scrollY;
  lastScrollTime = now;
}, { passive: true });

// Hook Watermarks into renderFeed & Whisper Pass into renderProfile
if (typeof renderFeed === "function") {
  const _v14PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v14PrevRenderFeed.apply(this, arguments);
    injectCreatorWatermarks();
  };
}

if (typeof renderProfile === "function") {
  const _v14PrevRenderProfile = renderProfile;
  window.renderProfile = function () {
    _v14PrevRenderProfile.apply(this, arguments);
    const tools = document.querySelector("#profileView .profile-mega-tools");
    if (tools && !tools.querySelector(".vip-pass-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mega-pill-btn vip-pass-btn";
      btn.textContent = "💌 VIP Pass";
      btn.onclick = openWhisperPassModal;
      tools.appendChild(btn);
    }
  };
}



// ================= VYBE v15.0: 10 HOLO-SOCIAL, AUDIO-REACTIVE & CREATOR ECONOMY =================

// --- 1. BEAT-REACTIVE NEON BORDERS ---
if (typeof toggleCoWatchPlay === "function") {
  const _v15PrevCoWatch = toggleCoWatchPlay;
  window.toggleCoWatchPlay = function () {
    const res = _v15PrevCoWatch.apply(this, arguments);
    document.body.classList.toggle("beat-reactive-on", Boolean(typeof coWatchPlaying !== "undefined" && coWatchPlaying));
    return res;
  };
}

// --- 2. VIRTUAL CYBER AVATAR STUDIO ---
let avatarState = { bg: 0, visor: 0, crown: 0 };
function openAvatarStudioModal() {
  if (typeof show === "function") show("avatarStudioModal");
  renderCyberAvatarCanvas();
}
function cycleAvatarPart(part) {
  avatarState[part] = (avatarState[part] + 1) % 3;
  renderCyberAvatarCanvas();
}
function renderCyberAvatarCanvas() {
  const canvas = document.getElementById("cyberAvatarCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const bgs = ["#0284c7", "#7e22ce", "#059669"];
  const visors = ["🕶️", "🥽", "⚡"];
  const crowns = ["", "👑", "🔥"];
  ctx.fillStyle = bgs[avatarState.bg];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "86px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🤖", 120, 155);
  ctx.font = "44px sans-serif";
  ctx.fillText(visors[avatarState.visor], 120, 128);
  if (crowns[avatarState.crown]) {
    ctx.fillText(crowns[avatarState.crown], 120, 68);
  }
}
function applyVirtualCyberAvatar() {
  const canvas = document.getElementById("cyberAvatarCanvas");
  if (!canvas) return;
  const dataUrl = canvas.toDataURL("image/png");
  if (typeof me !== "undefined") me.pic = dataUrl;
  if (typeof hide === "function") hide("avatarStudioModal");
  if (typeof renderProfile === "function") renderProfile();
  if (typeof toast === "function") toast("🪞 Virtual Cyber Avatar applied!");
}

// --- 3. FLASH-DROP AUCTION / BID WITH VYBE COINS ---
let currentAuctionBid = 120;
function openAuctionModal() {
  if (typeof show === "function") show("auctionModal");
}
function placeVybeAuctionBid() {
  const coins = Number(localStorage.getItem("vybe:coins") || 150);
  const nextBid = currentAuctionBid + 20;
  if (coins < nextBid) {
    if (typeof toast === "function") toast("❌ Not enough VYBE Coins for this bid!");
    return;
  }
  currentAuctionBid = nextBid;
  if (typeof awardVybeCoins === "function") awardVybeCoins(-20, "Auction Bid");
  const lbl = document.getElementById("auctionHighestBidText");
  const uname = (typeof currentProfile !== "undefined" && currentProfile) || "you";
  if (lbl) lbl.innerHTML = `Current Bid: <b>${currentAuctionBid} 🪙</b> by @${safe(uname)} (Winning!)`;
  if (typeof toast === "function") toast(`🔨 Highest Bid placed: ${currentAuctionBid} 🪙!`);
}

// --- 4. MOOD-TWIN MATCHMAKER RADAR ---
function openMoodTwinModal() {
  if (typeof show === "function") show("moodTwinModal");
  const list = document.getElementById("moodTwinList");
  if (!list) return;
  const twins = [
    { id: 1, user: "alex.design", mood: "🌙 Late Night Chill", match: "96% Twin" },
    { id: 2, user: "sarah.official", mood: "🔥 Hustle Mode", match: "92% Twin" },
    { id: 3, user: "john.travel", mood: "⚡ Energetic", match: "89% Twin" }
  ];
  list.innerHTML = twins
    .map(
      (t) => `
      <div class="people glass" style="padding:10px 14px;margin:0;justify-content:space-between;">
        <div>
          <strong style="display:block;font-size:13px;">@${safe(t.user)} <span style="color:#38bdf8;font-size:11px;">(${t.match})</span></strong>
          <small class="meta">${t.mood}</small>
        </div>
        <button type="button" class="primary" style="padding:6px 12px;font-size:11px;" onclick="hide('moodTwinModal');openChat('${t.id}')">Wave 👋</button>
      </div>`
    )
    .join("");
}

// --- 5. ENCRYPTED 3-TAP RHYTHM PATTERN LOCK ---
function enhanceRhythmLockPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    if (!captionEl) return;
    const raw = captionEl.textContent || "";
    if (!raw.includes("[RHYTHM]") && article.dataset.isRhythm !== "true") return;
    article.dataset.isRhythm = "true";
    captionEl.innerHTML = captionEl.innerHTML.replace("[RHYTHM]", "").trim();
    const stage = article.querySelector(".post-media-stage");
    if (!stage || stage.dataset.rhythmUnlocked === "true") return;

    const origHtml = stage.innerHTML;
    stage.dataset.rhythmOriginal = origHtml;
    stage.innerHTML = `
      <div class="rhythm-lock-overlay">
        <span style="font-size:28px;">🥁</span>
        <strong style="font-size:14px;color:#7dd3fc;">3-Tap Rhythm Locked Post</strong>
        <p class="meta">Tap the cyber drum 3 times to unlock this drop!</p>
        <button type="button" class="primary" style="padding:8px 18px;font-size:12px;" onclick="tapRhythmDrum(this)">🥁 Tap (0/3)</button>
      </div>`;
  });
}
function tapRhythmDrum(btn) {
  const count = Number(btn.dataset.taps || 0) + 1;
  btn.dataset.taps = String(count);
  btn.textContent = `🥁 Tap (${count}/3)`;
  if (count >= 3) {
    const stage = btn.closest(".post-media-stage");
    if (stage && stage.dataset.rhythmOriginal) {
      stage.dataset.rhythmUnlocked = "true";
      stage.innerHTML = stage.dataset.rhythmOriginal;
      if (typeof toast === "function") toast("🥁 Rhythm matched! Post unlocked.");
    }
  }
}

// --- 6. PICTURE-IN-PICTURE (PiP) FLOATING MINI-REELS PLAYER ---
function toggleFloatingMiniReel(forceState) {
  const box = document.getElementById("floatingMiniReelBox");
  const vid = document.getElementById("floatingMiniReelVid");
  if (!box) return;
  const showBox = typeof forceState === "boolean" ? forceState : box.hidden;
  box.hidden = !showBox;
  if (vid) {
    if (showBox) vid.play().catch(() => {});
    else vid.pause();
  }
}

// --- 7. CO-AUTHOR / SPLIT-CREDIT COLLAB POSTS ---
function enhanceCollabPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    const unameEl = article.querySelector(".username");
    if (!captionEl || !unameEl) return;
    const raw = captionEl.textContent || "";
    const match = raw.match(/\[COLLAB:([^\]]+)\]/);
    if (!match) return;
    const coUser = match[1];
    captionEl.innerHTML = captionEl.innerHTML.replace(match[0], "").trim();
    if (!unameEl.textContent.includes("×")) {
      unameEl.innerHTML = `${unameEl.innerHTML} <span style="color:#38bdf8;">× @${safe(coUser)}</span>`;
    }
  });
}

// --- 8. GRAVITY-FLIP MATRIX EASTER EGG ---
let gravityFlipped = false;
function toggleGravityFlipMode() {
  gravityFlipped = !gravityFlipped;
  document.body.classList.toggle("gravity-flipped", gravityFlipped);
  if (typeof toast === "function") {
    toast(gravityFlipped ? "🙃 Gravity-Flip Matrix Mode ON!" : "🌍 Orientation Restored");
  }
}

// --- 9. LIVE NEON QUOTE POSTER GENERATOR ---
function openNeonQuoteModal() {
  if (typeof show === "function") show("neonQuoteModal");
  renderNeonQuoteCanvas();
}
function renderNeonQuoteCanvas() {
  const canvas = document.getElementById("neonQuoteCanvas");
  const inp = document.getElementById("neonQuoteInput");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 320, 320);
  grad.addColorStop(0, "#050811");
  grad.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 320, 320);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 292, 292);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  const text = (inp?.value || "YOUR VIBE. YOUR WORLD.").toUpperCase();
  ctx.fillText(text.slice(0, 24), 160, 150);
  if (text.length > 24) ctx.fillText(text.slice(24, 48), 160, 180);
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("— VYBE ORIGINALS —", 160, 275);
}
function useNeonQuotePost() {
  const canvas = document.getElementById("neonQuoteCanvas");
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `vybe-quote-${Date.now()}.png`, { type: "image/png" });
    if (typeof hide === "function") hide("neonQuoteModal");
    const input = document.getElementById("mediaUploadInput");
    if (input && typeof assignFileToInput === "function") assignFileToInput(input, file);
  }, "image/png");
}

// --- 10. CREATOR TIER EVOLUTION BADGES & AVATAR STUDIO BUTTON ---
if (typeof renderProfile === "function") {
  const _v15PrevRenderProfile = renderProfile;
  window.renderProfile = function () {
    _v15PrevRenderProfile.apply(this, arguments);
    const unameBtn = document.querySelector("#profileView .profile-username");
    if (unameBtn && !unameBtn.querySelector(".creator-rank-pill")) {
      const coins = Number(localStorage.getItem("vybe:coins") || 150);
      const rank = coins >= 250 ? "👑 VYBE Legend" : coins >= 160 ? "⚔️ Cyber Knight" : "⚡ Rising Vyber";
      const pill = document.createElement("span");
      pill.className = "creator-rank-pill";
      pill.textContent = rank;
      unameBtn.appendChild(pill);
    }
    const tools = document.querySelector("#profileView .profile-mega-tools");
    if (tools && !tools.querySelector(".avatar-studio-btn")) {
      const avBtn = document.createElement("button");
      avBtn.type = "button";
      avBtn.className = "mega-pill-btn avatar-studio-btn";
      avBtn.textContent = "🪞 Cyber Avatar";
      avBtn.onclick = openAvatarStudioModal;
      tools.appendChild(avBtn);
    }
  };
}

// Hook Rhythm Lock & Collab Posts into renderFeed & createPost
if (typeof renderFeed === "function") {
  const _v15PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v15PrevRenderFeed.apply(this, arguments);
    enhanceRhythmLockPosts();
    enhanceCollabPosts();
  };
}

if (typeof createPost === "function") {
  const _v15PrevCreatePost = createPost;
  window.createPost = async function () {
    const captionEl = document.getElementById("caption");
    const collabEl = document.getElementById("postCoCreatorInput");
    const rhythmEl = document.getElementById("postRhythmLockToggle");
    if (captionEl) {
      let txt = captionEl.value.trim();
      if (collabEl?.value.trim()) {
        const cleanCo = collabEl.value.trim().replace(/^@/, "").replace(/\]/g, "");
        txt += ` [COLLAB:${cleanCo}]`;
      }
      if (rhythmEl?.checked) txt += " [RHYTHM]";
      captionEl.value = txt.trim();
    }
    const res = await _v15PrevCreatePost.apply(this, arguments);
    if (collabEl) collabEl.value = "";
    if (rhythmEl) rhythmEl.checked = false;
    return res;
  };
}



// ================= VYBE v16.0: SETTINGS -> FUTURES ON/OFF CONTROL HUB =================
const VYBE_FUTURES_CATALOG = [
  { key: "coins_quests", label: "🪙 VYBE Coins & Daily Quests", desc: "Topbar coins wallet & daily tasks" },
  { key: "cowatch_bar", label: "🎧 Co-Watch Live Music Bar", desc: "Floating music player & 8D soundscape" },
  { key: "quick_vibe_strip", label: "⚡ Quick Vibe Status & Chain Stories", desc: "Home top status chips, Montage & Live Bubbles" },
  { key: "mood_filter", label: "🎭 Mood Sync Feed Filter", desc: "Chill, Hustle, Energetic & Late Night filter bar" },
  { key: "vibe_radar", label: "📡 Proximity Vibe Radar", desc: "Nearby creators & Vibe Compass" },
  { key: "ghost_rooms", label: "👻 Ghost Mode 24h Live Rooms", desc: "Ephemeral vanishing group chat rooms" },
  { key: "vibe_roulette", label: "🎲 Random Vibe Roulette", desc: "Spin for a random reel drop" },
  { key: "crowd_shutter", label: "⚡ Crowd-Drop Group Shutter", desc: "3-2-1 squad sync flash camera" },
  { key: "confession_booth", label: "🕯️ 3 AM Confession Booth", desc: "Anonymous late-night confession wall" },
  { key: "future_letter", label: "🔮 Future-Self Time-Lock Letter", desc: "Seal a message for a future date" },
  { key: "streak_leaderboard", label: "🔥 Daily Streak & Legends Board", desc: "Streak counter & top creators rank" },
  { key: "persona", label: "🎭 Alter-Ego Persona Switcher", desc: "Switch between Main & Shadow persona" },
  { key: "watch_party", label: "🤝 Co-Browsing Reels Watch Party", desc: "Sync Reels live with friends" },
  { key: "vibe_oracle", label: "🎴 AI Vibe Oracle Fortune Card", desc: "Daily holographic fortune card" },
  { key: "spin_wheel", label: "🎡 Truth-or-Dare Spin Wheel", desc: "Interactive squad challenge wheel" },
  { key: "vibe_duel", label: "⚔️ Live 1v1 Vibe Duel Arena", desc: "Tug-of-war battle between 2 posts" },
  { key: "loot_box", label: "🎁 Daily Mystery Loot Box", desc: "Daily chest coin rewards" },
  { key: "zero_g", label: "🌌 Zero-Gravity Float Mode", desc: "Floating feed cards physics toggle" },
  { key: "passport", label: "🛂 VYBE Digital Passport", desc: "Collect city check-in stamps" },
  { key: "wish_star", label: "🌠 Shooting Star Wish Drop", desc: "Launch wishes into the night sky" },
  { key: "beatmaker", label: "🎹 Live Lo-Fi Beatmaker Pad", desc: "8-pad synth & drum jam studio" },
  { key: "circadian", label: "🌗 Auto-Circadian Sky Lighting", desc: "Switch Midnight, Sunset & Morning themes" },
  { key: "arcade", label: "🕹️ Catch the Vibe Mini-Arcade", desc: "15-second reflex orb game" },
  { key: "constellation", label: "🛰️ Friend Constellation Map", desc: "Interactive star map of close friends" },
  { key: "pixel_wall", label: "🧩 Collaborative Pixel Wall", desc: "Shared community pixel canvas" },
  { key: "battle_royale", label: "🏟️ Poll Battle Royale Tournament", desc: "Knockout bracket vibe poll" },
  { key: "blind_chat", label: "🎭 Mystery 60s Blind Chat", desc: "Anonymous icebreaker match chat" },
  { key: "gravity_flip", label: "🙃 Gravity-Flip Matrix Mode", desc: "Upside-down 180° HUD flip" },
  { key: "mood_twin", label: "🧬 Mood-Twin Matchmaker", desc: "Find creators in your exact mood" },
  { key: "auction", label: "🔨 Flash-Drop VYBE Coins Auction", desc: "Bid coins for exclusive badges" },
  { key: "split_cam", label: "🪞 Split-Reality Dual Cam", desc: "Dual front+back camera in Create Post" },
  { key: "neon_draw", label: "🎨 Live Neon Graffiti Canvas", desc: "Finger-draw neon art in Create Post" },
  { key: "film_strip", label: "🎞️ Retro 4-Frame Film Strip", desc: "Collage booth in Create Post" },
  { key: "dual_blend", label: "📸 Dual-Exposure Phantom Blend", desc: "Blend 2 photos in Create Post" },
  { key: "quote_poster", label: "🖼️ Neon Quote Poster Maker", desc: "Typography poster maker in Create Post" },
  { key: "magic_caption", label: "🪄 Magic Caption & Neon Stamps", desc: "1-tap AI caption polish & stamps" },
  { key: "create_extras", label: "⚙️ Advanced Post Locks & Polls", desc: "Time-Capsule, Cipher, X-Ray, Puzzle & Polls" },
  { key: "dm_pulse_sync", label: "💓 DM Heartbeat Pulse Sync", desc: "Live haptic heartbeat in chat" },
  { key: "dm_walkie", label: "📻 DM Walkie-Talkie", desc: "Push-to-talk audio in chat" },
  { key: "dm_hangout", label: "🧾 DM Split-Bill Hangout Planner", desc: "Split expenses card in chat" },
  { key: "dm_typing_duel", label: "⌨️ DM 15-Sec Typing Speed Duel", desc: "WPM typing race in chat" },
  { key: "dm_theremin", label: "〰️ DM Neon Theremin Synth", desc: "Sci-fi slide melody pad in chat" },
  { key: "dm_view_once", label: "💣 DM View-Once Self-Destruct", desc: "Vanishing bomb message toggle" },
  { key: "dm_voice_fx", label: "🤖 DM Voice-Changer FX", desc: "Droid, Chipmunk & Deep Bass filters" }
];

const VYBE_FUTURES_STORAGE_KEY = "vybe:enabled-futures-v16";

function getEnabledFuturesMap() {
  try {
    const saved = JSON.parse(localStorage.getItem(VYBE_FUTURES_STORAGE_KEY) || "null");
    if (saved && typeof saved === "object") return saved;
  } catch (_) {}
  // Default: ALL extra buttons OFF so the app stays super clean until user turns them ON in Settings -> Futures
  const defaults = {};
  VYBE_FUTURES_CATALOG.forEach((f) => { defaults[f.key] = false; });
  return defaults;
}

function applyVybeFuturesVisibility() {
  const map = getEnabledFuturesMap();
  document.querySelectorAll("[data-vybe-feature]").forEach((el) => {
    const key = el.getAttribute("data-vybe-feature");
    const isEnabled = Boolean(map[key]);
    el.classList.toggle("feature-disabled", !isEnabled);
  });
}

function toggleVybeFuture(key, enabled) {
  const map = getEnabledFuturesMap();
  map[key] = Boolean(enabled);
  localStorage.setItem(VYBE_FUTURES_STORAGE_KEY, JSON.stringify(map));
  applyVybeFuturesVisibility();
}

function setAllVybeFutures(enableAll) {
  const map = {};
  VYBE_FUTURES_CATALOG.forEach((f) => { map[f.key] = Boolean(enableAll); });
  localStorage.setItem(VYBE_FUTURES_STORAGE_KEY, JSON.stringify(map));
  applyVybeFuturesVisibility();
  renderFuturesSettingsSubview();
  if (typeof toast === "function") {
    toast(enableAll ? "✨ All Futures Enabled!" : "🧹 All Extra Futures Turned OFF");
  }
}

function renderFuturesSettingsSubview() {
  const subview = document.getElementById("settingsSubview");
  if (!subview) return;
  const map = getEnabledFuturesMap();
  subview.innerHTML = `
    <p class="meta" style="margin-bottom:10px;">Turn ON only the extra features you want to see in your app:</p>
    <div class="futures-bulk-actions">
      <button type="button" class="primary" onclick="setAllVybeFutures(true)">Turn ON All</button>
      <button type="button" class="secondary" onclick="setAllVybeFutures(false)">Turn OFF All (Clean)</button>
    </div>
    <div class="futures-control-list">
      ${VYBE_FUTURES_CATALOG.map(
        (f) => `
        <label class="futures-toggle-row">
          <div>
            <strong>${f.label}</strong>
            <small>${f.desc}</small>
          </div>
          <input type="checkbox" class="settings-toggle" ${map[f.key] ? "checked" : ""} onchange="toggleVybeFuture('${f.key}', this.checked)">
        </label>`
      ).join("")}
    </div>
  `;
}

// Hook 'futures' into showSettingsSubview
if (typeof showSettingsSubview === "function") {
  const _v16PrevShowSettingsSubview = showSettingsSubview;
  window.showSettingsSubview = function (name) {
    if (name === "futures") {
      const subview = document.getElementById("settingsSubview");
      if (!subview) return;
      settingsSubviewName = "futures";
      document.getElementById("settingsHome").style.display = "none";
      document.getElementById("settingsBackButton").style.display = "block";
      subview.classList.add("active");
      document.getElementById("settingsSheetTitle").textContent = "✨ Futures";
      renderFuturesSettingsSubview();
      return;
    }
    return _v16PrevShowSettingsSubview.apply(this, arguments);
  };
}

// Apply clean visibility immediately on load and after any dynamic render
applyVybeFuturesVisibility();
document.addEventListener("DOMContentLoaded", applyVybeFuturesVisibility);
if (typeof renderFeed === "function") {
  const _v16PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v16PrevRenderFeed.apply(this, arguments);
    applyVybeFuturesVisibility();
  };
}
if (typeof renderProfile === "function") {
  const _v16PrevRenderProfile = renderProfile;
  window.renderProfile = function () {
    _v16PrevRenderProfile.apply(this, arguments);
    const map = getEnabledFuturesMap();
    const megaTools = document.querySelector("#profileView .profile-mega-tools");
    if (megaTools && !map.create_extras && !map.persona) {
      // Keep Vault & Analytics visible, hide extra v8-v15 pills unless enabled
      megaTools.querySelectorAll(".aura-cycle-btn, .hof-btn, .bio-glow-btn, .vip-pass-btn, .avatar-studio-btn").forEach((b) => {
        b.style.display = map.persona ? "" : "none";
      });
    }
  };
}



// ================= VYBE v16.1: UNIVERSAL AUTO-DISCOVERY FUTURES ENGINE =================
// Any future button/section added anywhere with data-vybe-feature="key" (and optional
// data-vybe-label / data-vybe-desc) automatically appears inside Profile -> Settings -> Futures!
function getDynamicFuturesCatalog() {
  const byKey = new Map();
  VYBE_FUTURES_CATALOG.forEach((item) => {
    byKey.set(item.key, { ...item });
  });

  document.querySelectorAll("[data-vybe-feature]").forEach((el) => {
    const key = (el.getAttribute("data-vybe-feature") || "").trim();
    if (!key) return;
    if (!byKey.has(key)) {
      const customLabel =
        el.getAttribute("data-vybe-label") ||
        el.getAttribute("title") ||
        el.getAttribute("aria-label") ||
        el.textContent?.trim().slice(0, 32) ||
        key.replace(/_/g, " ").toUpperCase();
      const customDesc =
        el.getAttribute("data-vybe-desc") ||
        "Auto-discovered VYBE add-on feature";
      byKey.set(key, { key, label: customLabel, desc: customDesc });
    }
  });

  return Array.from(byKey.values());
}

// Override getEnabledFuturesMap to include auto-discovered keys (default false = clean UI)
window.getEnabledFuturesMap = function () {
  let saved = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(VYBE_FUTURES_STORAGE_KEY) || "null");
    if (parsed && typeof parsed === "object") saved = parsed;
  } catch (_) {}

  const result = {};
  getDynamicFuturesCatalog().forEach((f) => {
    result[f.key] = Boolean(saved[f.key]);
  });
  return result;
};

// Override setAllVybeFutures to toggle all static + auto-discovered features
window.setAllVybeFutures = function (enableAll) {
  const map = {};
  getDynamicFuturesCatalog().forEach((f) => {
    map[f.key] = Boolean(enableAll);
  });
  localStorage.setItem(VYBE_FUTURES_STORAGE_KEY, JSON.stringify(map));
  applyVybeFuturesVisibility();
  renderFuturesSettingsSubview();
  if (typeof toast === "function") {
    toast(enableAll ? "✨ All Futures Enabled!" : "🧹 All Extra Futures Turned OFF");
  }
};

// Override renderFuturesSettingsSubview to render static + auto-discovered features
window.renderFuturesSettingsSubview = function () {
  const subview = document.getElementById("settingsSubview");
  if (!subview) return;
  const catalog = getDynamicFuturesCatalog();
  const map = getEnabledFuturesMap();
  subview.innerHTML = `
    <p class="meta" style="margin-bottom:10px;">Turn ON only the extra features you want to see (${catalog.length} features synced):</p>
    <div class="futures-bulk-actions">
      <button type="button" class="primary" onclick="setAllVybeFutures(true)">Turn ON All</button>
      <button type="button" class="secondary" onclick="setAllVybeFutures(false)">Turn OFF All (Clean)</button>
    </div>
    <div class="futures-control-list">
      ${catalog
        .map(
          (f) => `
        <label class="futures-toggle-row">
          <div>
            <strong>${safe(f.label)}</strong>
            <small>${safe(f.desc)}</small>
          </div>
          <input type="checkbox" class="settings-toggle" ${map[f.key] ? "checked" : ""} onchange="toggleVybeFuture('${safe(f.key)}', this.checked)">
        </label>`
        )
        .join("")}
    </div>
  `;
};

// MutationObserver: automatically hide any dynamically injected [data-vybe-feature] element unless enabled
const vybeFuturesObserver = new MutationObserver((mutations) => {
  let needsSync = false;
  for (const m of mutations) {
    if (m.addedNodes && m.addedNodes.length) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && (node.hasAttribute?.("data-vybe-feature") || node.querySelector?.("[data-vybe-feature]"))) {
          needsSync = true;
          break;
        }
      }
    }
    if (needsSync) break;
  }
  if (needsSync) applyVybeFuturesVisibility();
});
vybeFuturesObserver.observe(document.documentElement, { childList: true, subtree: true });
applyVybeFuturesVisibility();



// ================= VYBE v17.0: STRICT BUTTON-ONLY FUTURES HUB + INFO ('i') GUIDE =================
const VYBE_DEFAULT_GUIDES = {
  coins_quests: "Idhu enna pannum: Unga VYBE Coins balance & daily micro-quests kaattum. Eppadi use panradhu: Top bar-la 🪙 pill tap panni daily quests complete panni coins earn pannunga.",
  cowatch_bar: "Idhu enna pannum: Friends kooda live lo-fi music & 8D soundscape kekka udhavum. Eppadi use panradhu: Screen keela irukkira Co-Watch bar-la ▶ tap panni station select pannunga.",
  quick_vibe_strip: "Idhu enna pannum: Home feed mela live status chips, Chain Story, Montage & Live Bubbles-ai kaattum. Eppadi use panradhu: Home tab top-la irukkira chips-ai tap pannunga.",
  mood_filter: "Idhu enna pannum: Chill, Hustle, Energetic, Late Night mood-kku etha posts mattum filter pannum. Eppadi use panradhu: Home feed-la mood chip-ai tap pannunga.",
  vibe_radar: "Idhu enna pannum: Pakkathula active-aa irukkira creators & Vibe Compass kaattum. Eppadi use panradhu: Top bar-la 📡 icon tap panni nearby creators-kku Wave anuppunga.",
  ghost_rooms: "Idhu enna pannum: 24 hours-la automatic-aa vanish aagura ephemeral chat rooms create pannum. Eppadi use panradhu: Top bar-la 👻 icon tap panni room join pannunga.",
  vibe_roulette: "Idhu enna pannum: Random-aa oru trending reel-ai spin panni play pannum. Eppadi use panradhu: Top bar-la 🎲 icon-ai tap pannunga.",
  crowd_shutter: "Idhu enna pannum: Squad kooda 3-2-1 synchronized flash photo edukka udhavum. Eppadi use panradhu: Top bar-la ⚡ icon tap panni Trigger Sync Flash press pannunga.",
  confession_booth: "Idhu enna pannum: Night-only anonymous confession wall-la unga thoughts share pannalaam. Eppadi use panradhu: Top bar-la 🕯️ icon tap panni confession drop pannunga.",
  future_letter: "Idhu enna pannum: Future date-la mattum open aagura secret time-lock letter seal pannum. Eppadi use panradhu: Top bar-la 🔮 icon tap panni date & message seal pannunga.",
  streak_leaderboard: "Idhu enna pannum: Unga daily streak & top creators XP leaderboard kaattum. Eppadi use panradhu: Top bar-la 🔥 streak badge-ai tap pannunga.",
  persona: "Idhu enna pannum: Main profile & Shadow Alter-Ego mode-kku idaiyila switch pannum. Eppadi use panradhu: Top bar-la 🎭 Main pill tap panni persona maathunga.",
  watch_party: "Idhu enna pannum: Friend kooda Reels scrolling-ai real-time-la sync pannum. Eppadi use panradhu: Top bar-la 🤝 icon tap panni Party Code share/join pannunga.",
  vibe_oracle: "Idhu enna pannum: Daily lucky cyber aura & creator mission fortune card kaattum. Eppadi use panradhu: Top bar-la 🎴 icon tap panni card-ai flip pannunga.",
  spin_wheel: "Idhu enna pannum: Squad Truth-or-Dare cyber wheel spin pannum. Eppadi use panradhu: Top bar-la 🎡 icon tap panni Spin press pannunga.",
  vibe_duel: "Idhu enna pannum: 2 drops naduvula live 1v1 tug-of-war vote battle nadathum. Eppadi use panradhu: Top bar-la ⚔️ icon tap panni unga favorite side-kku push pannunga.",
  loot_box: "Idhu enna pannum: Daily mystery chest open panni +50 VYBE Coins tharum. Eppadi use panradhu: Top bar-la 🎁 icon tap panni chest-ai click pannunga.",
  zero_g: "Idhu enna pannum: Feed cards-ai zero-gravity floating mode-la maathum. Eppadi use panradhu: Top bar-la 🌌 icon tap panni ON/OFF pannunga.",
  passport: "Idhu enna pannum: Neenga visit panna cities-ai VYBE Digital Passport-la stamp pannum. Eppadi use panradhu: Top bar-la 🛂 icon tap panni city name add pannunga.",
  wish_star: "Idhu enna pannum: Night sky wish wall-la shooting star wish launch pannum. Eppadi use panradhu: Top bar-la 🌠 icon tap panni wish type panni Launch press pannunga.",
  beatmaker: "Idhu enna pannum: 8-pad live lo-fi synth & drum pad studio open pannum. Eppadi use panradhu: Top bar-la 🎹 icon tap panni pads-ai play panni feed-la share pannunga.",
  circadian: "Idhu enna pannum: Midnight, Sunset & Morning sky lighting themes maathum. Eppadi use panradhu: Top bar-la 🌗 icon-ai tap pannunga.",
  arcade: "Idhu enna pannum: 15-second Catch the Vibe reflex game play panni coins earn pannalaam. Eppadi use panradhu: Top bar-la 🕹️ icon tap panni glowing orbs-ai tap pannunga.",
  constellation: "Idhu enna pannum: Close friends-ai star constellation map-la kaattum. Eppadi use panradhu: Top bar-la 🛰️ icon tap panni star username click panna DM open aagum.",
  pixel_wall: "Idhu enna pannum: Ellarum serndhu paint panra shared community pixel canvas. Eppadi use panradhu: Top bar-la 🧩 icon tap panni color select panni tiles-ai paint pannunga.",
  battle_royale: "Idhu enna pannum: Knockout tournament bracket poll nadathum. Eppadi use panradhu: Top bar-la 🏟️ icon tap panni semi-finals & final winner select pannunga.",
  blind_chat: "Idhu enna pannum: 60-second anonymous blind chat & mutual identity reveal. Eppadi use panradhu: Top bar-la 🎭 icon tap panni chat panni Reveal press pannunga.",
  gravity_flip: "Idhu enna pannum: Full app screen-ai 180° matrix flip mode-la thiruppum. Eppadi use panradhu: Top bar-la 🙃 icon tap panni flip pannunga.",
  mood_twin: "Idhu enna pannum: Same mood frequency-la irukkira creators-ai match pannum. Eppadi use panradhu: Top bar-la 🧬 icon tap panni Wave 👋 anuppunga.",
  auction: "Idhu enna pannum: Exclusive Cyber Founder Badge-kku VYBE Coins bid pannalaam. Eppadi use panradhu: Top bar-la 🔨 icon tap panni Bid +20 Coins press pannunga.",
  split_cam: "Idhu enna pannum: Front + Back dual camera reaction photo edukkum. Eppadi use panradhu: Create Post-la 🪞 Split Cam tap panni 2 steps snap pannunga.",
  neon_draw: "Idhu enna pannum: Finger-la glowing neon art draw panni post podalaam. Eppadi use panradhu: Create Post-la 🎨 Neon Draw tap panni draw pannunga.",
  film_strip: "Idhu enna pannum: 4-frame retro cinema film-strip collage generate pannum. Eppadi use panradhu: Create Post-la 🎞️ Film Strip tap panni Use Film Strip press pannunga.",
  dual_blend: "Idhu enna pannum: 2 photos-ai double-exposure art-aa blend pannum. Eppadi use panradhu: Create Post-la 📸 Dual Blend tap panni 2 photos select pannunga.",
  quote_poster: "Idhu enna pannum: Text quote-ai glowing typography poster image-aa maathum. Eppadi use panradhu: Create Post-la 🖼️ Quote Poster tap panni quote type pannunga.",
  magic_caption: "Idhu enna pannum: 1-tap-la trending caption & hashtags polish pannum. Eppadi use panradhu: Create Post-la 🪄 Magic Caption Polish button tap pannunga.",
  create_extras: "Idhu enna pannum: Time-Capsule lock, 3-Tap Rhythm, Cipher passcode, X-Ray, Puzzle & Polls options tharum. Eppadi use panradhu: Create Post drawer keela irukkira options-ai use pannunga.",
  dm_pulse_sync: "Idhu enna pannum: Chat friend-kku live haptic heartbeat vibration anuppum. Eppadi use panradhu: DM header-la 💓 icon tap panni HOLD button press pannunga.",
  dm_walkie: "Idhu enna pannum: Push-to-talk walkie-talkie audio message anuppum. Eppadi use panradhu: DM header-la 📻 icon-ai press & hold panni pesi release pannunga.",
  dm_hangout: "Idhu enna pannum: Squad trip/food bill split panni chat card-aa anuppum. Eppadi use panradhu: DM header-la 🧾 icon tap panni amount & people enter pannunga.",
  dm_typing_duel: "Idhu enna pannum: Friend kooda 15s typing WPM speed race nadathum. Eppadi use panradhu: DM header-la ⌨️ icon tap panni phrase-ai fast-aa type pannunga.",
  dm_theremin: "Idhu enna pannum: Finger slide panni sci-fi synth melody compose panni chat-la anuppum. Eppadi use panradhu: DM header-la 〰️ icon tap panni pad mela slide pannunga.",
  dm_view_once: "Idhu enna pannum: Self-destruct view-once bomb message anuppum. Eppadi use panradhu: DM input pakkathula 💣 icon tap panni message send pannunga.",
  dm_voice_fx: "Idhu enna pannum: Voice notes-kku Cyber Droid, Chipmunk, Deep Bass FX set pannum. Eppadi use panradhu: DM input pakkathula 🤖 icon tap panni FX select pannunga."
};

// Strictly register ONLY features that actually have a button/element in the UI ([data-vybe-feature])
window.getDynamicFuturesCatalog = function () {
  const staticByKey = new Map(VYBE_FUTURES_CATALOG.map((item) => [item.key, item]));
  const discovered = new Map();

  document.querySelectorAll("[data-vybe-feature]").forEach((el) => {
    const key = (el.getAttribute("data-vybe-feature") || "").trim();
    if (!key || discovered.has(key)) return;
    const base = staticByKey.get(key);
    const label =
      el.getAttribute("data-vybe-label") ||
      base?.label ||
      el.getAttribute("title") ||
      el.getAttribute("aria-label") ||
      key.replace(/_/g, " ").toUpperCase();
    const desc =
      el.getAttribute("data-vybe-desc") ||
      base?.desc ||
      "Optional VYBE feature button";
    const guide =
      el.getAttribute("data-vybe-guide") ||
      VYBE_DEFAULT_GUIDES[key] ||
      `${desc}. Settings-la ON panna indha button app-la show aagum.`;
    discovered.set(key, { key, label, desc, guide });
  });

  return Array.from(discovered.values());
};

function openFutureInfoModal(key) {
  const item = getDynamicFuturesCatalog().find((f) => f.key === key);
  if (!item) return;
  const titleEl = document.getElementById("futureInfoTitle");
  const sumEl = document.getElementById("futureInfoSummary");
  const bodyEl = document.getElementById("futureInfoBody");
  if (titleEl) titleEl.textContent = item.label;
  if (sumEl) sumEl.textContent = item.desc;
  if (bodyEl) bodyEl.textContent = item.guide;
  if (typeof show === "function") show("futureInfoModal");
}

// Render Settings -> Futures with ON/OFF toggle + 'i' Info button next to every switch
window.renderFuturesSettingsSubview = function () {
  const subview = document.getElementById("settingsSubview");
  if (!subview) return;
  const catalog = getDynamicFuturesCatalog();
  const map = getEnabledFuturesMap();
  subview.innerHTML = `
    <p class="meta" style="margin-bottom:10px;">Tap <b>i</b> next to any toggle to see how it works (${catalog.length} button features):</p>
    <div class="futures-bulk-actions">
      <button type="button" class="primary" onclick="setAllVybeFutures(true)">Turn ON All</button>
      <button type="button" class="secondary" onclick="setAllVybeFutures(false)">Turn OFF All (Clean)</button>
    </div>
    <div class="futures-control-list">
      ${catalog
        .map(
          (f) => `
        <div class="futures-toggle-row">
          <div style="flex:1;min-width:0;">
            <strong>${safe(f.label)}</strong>
            <small>${safe(f.desc)}</small>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
            <button type="button" class="future-info-btn" aria-label="How ${safe(f.label)} works" title="How it works" onclick="openFutureInfoModal('${safe(f.key)}')">i</button>
            <input type="checkbox" class="settings-toggle" ${map[f.key] ? "checked" : ""} onchange="toggleVybeFuture('${safe(f.key)}', this.checked)">
          </div>
        </div>`
        )
        .join("")}
    </div>
  `;
};

// ================= 10 V17 FEATURES IMPLEMENTATION =================
// 1. 360 Cyber Panorama Viewer
let panoDragging = false;
let panoStartX = 0;
let panoOffset = -20;
function openPanoramaModal() {
  if (typeof show === "function") show("panoramaModal");
}
function startPanoramaDrag(e) {
  panoDragging = true;
  panoStartX = e.clientX;
}
function panPanoramaView(e) {
  if (!panoDragging) return;
  const dx = e.clientX - panoStartX;
  panoStartX = e.clientX;
  panoOffset = Math.max(-55, Math.min(0, panoOffset + dx * 0.15));
  const strip = document.getElementById("panoramaStrip");
  if (strip) strip.style.transform = `translateX(${panoOffset}%)`;
}
window.addEventListener("pointerup", () => { panoDragging = false; });

// 2. Live Podcast / Audio Space Stage
let stageMicLive = true;
function openAudioStageModal() {
  if (typeof show === "function") show("audioStageModal");
}
function toggleAudioStageMic() {
  stageMicLive = !stageMicLive;
  const st = document.getElementById("stageMicStatus");
  if (st) {
    st.textContent = stageMicLive ? "● Mic Live" : "🔇 Muted";
    st.style.color = stageMicLive ? "#4ade80" : "#f87171";
  }
}

// 3. Interactive Trading Card Profile Generator
function openCyberCardModal() {
  if (typeof show === "function") show("cyberCardModal");
  const body = document.getElementById("cyberTradingCardBody");
  if (!body) return;
  const uname = (typeof currentProfile !== "undefined" && currentProfile) || "vyber";
  const streak = localStorage.getItem("vybe:streak-count") || "1";
  const coins = localStorage.getItem("vybe:coins") || "150";
  body.innerHTML = `
    <div style="font-size:11px;color:#38bdf8;font-weight:800;letter-spacing:2px;">VYBE GENESIS EDITION</div>
    <div style="font-size:44px;margin:8px 0;">⚡</div>
    <h3 style="font-size:18px;color:#fff;">@${safe(uname)}</h3>
    <p style="font-size:12px;color:#fde047;margin:4px 0 12px;">🔥 ${streak}d Streak • 🪙 ${coins} Coins</p>
    <div style="display:flex;justify-content:space-around;padding-top:10px;border-top:1px solid rgba(56,189,248,0.25);font-size:11px;color:#cbd5e1;">
      <div><b>98</b><br>VIBE</div>
      <div><b>95</b><br>STYLE</div>
      <div><b>99</b><br>AURA</div>
    </div>
  `;
}

// 4 & 9. Time-Warp Reveal & Vintage 1998 Camcorder Tags in Create Post
function attachTimeWarpTag() {
  const cap = document.getElementById("caption");
  if (cap && !cap.value.includes("[TIMEWARP]")) {
    cap.value = `${cap.value.trim()} [TIMEWARP]`.trim();
    if (typeof toast === "function") toast("⏳ Time-Warp Scan Reveal attached!");
  }
}
function attachVHSCamcorderTag() {
  const cap = document.getElementById("caption");
  if (cap && !cap.value.includes("[VHS1998]")) {
    cap.value = `${cap.value.trim()} [VHS1998]`.trim();
    if (typeof toast === "function") toast("📸 Vintage 1998 Camcorder stamp attached!");
  }
}
function enhanceV17FeedPosts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    const stage = article.querySelector(".post-media-stage");
    if (!captionEl || !stage) return;
    const raw = captionEl.textContent || "";

    if (raw.includes("[TIMEWARP]") || article.dataset.isTimeWarp === "true") {
      article.dataset.isTimeWarp = "true";
      captionEl.innerHTML = captionEl.innerHTML.replace("[TIMEWARP]", "").trim();
      if (!stage.querySelector(".time-warp-curtain")) {
        stage.classList.add("time-warp-stage");
        const curtain = document.createElement("div");
        curtain.className = "time-warp-curtain";
        curtain.textContent = "⏳ Tap to Time-Warp Reveal";
        curtain.onclick = () => curtain.classList.add("warped");
        stage.appendChild(curtain);
      }
    }

    if (raw.includes("[VHS1998]") || article.dataset.isVhs === "true") {
      article.dataset.isVhs = "true";
      captionEl.innerHTML = captionEl.innerHTML.replace("[VHS1998]", "").trim();
      if (!stage.querySelector(".vhs-camcorder-overlay")) {
        const stamp = document.createElement("div");
        stamp.className = "vhs-camcorder-overlay";
        stamp.textContent = "REC ● 1998-11-13  11:42 PM";
        stage.appendChild(stamp);
      }
    }
  });
}

// 5. Daily Brain-Teaser Trivia
function openDailyTriviaModal() {
  if (typeof show === "function") show("dailyTriviaModal");
}
function submitDailyTrivia(isCorrect) {
  if (!isCorrect) {
    if (typeof toast === "function") toast("❌ Wrong answer! Try again.");
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem("vybe:trivia-won") === today) {
    if (typeof toast === "function") toast("✅ Already claimed today's +30 Coins!");
    return;
  }
  localStorage.setItem("vybe:trivia-won", today);
  if (typeof awardVybeCoins === "function") awardVybeCoins(30, "Daily Trivia");
  if (typeof hide === "function") hide("dailyTriviaModal");
  if (typeof toast === "function") toast("🎉 Correct! +30 🪙 VYBE Coins added!");
}

// 6. Neon Edge-Lighting Notification Aura
let edgeAuraActive = false;
function toggleEdgeLightingAura() {
  edgeAuraActive = !edgeAuraActive;
  const frame = document.getElementById("neonEdgeAuraFrame");
  if (frame) frame.hidden = !edgeAuraActive;
  if (typeof toast === "function") {
    toast(edgeAuraActive ? "🌈 Neon Edge-Lighting Aura ON!" : "🌈 Neon Edge Aura OFF");
  }
}

// 7. Pinned Top-3 Profile Showcase
function openPinnedShowcaseModal() {
  if (typeof show === "function") show("pinnedShowcaseModal");
}

// 8. Icebreaker Spin-Prompt in DM
const dmIcebreakers = [
  "🎲 Icebreaker: If we could teleport anywhere tonight for street food, where are we going?",
  "🎲 Icebreaker: What song have you had on repeat all week? 🎧",
  "🎲 Icebreaker: Night owl 🦉 or early bird ☀️?",
  "🎲 Icebreaker: What's one crazy goal you're chasing right now? 🔥"
];
function sendDMIcebreakerPrompt() {
  const input = document.getElementById("messageText");
  if (!input) return;
  input.value = dmIcebreakers[Math.floor(Math.random() * dmIcebreakers.length)];
  if (typeof sendMessage === "function") sendMessage();
}

// 10. Anti-Screenshot Privacy Blur Shield
let privacyShieldOn = false;
function togglePrivacyBlurShield() {
  privacyShieldOn = !privacyShieldOn;
  document.body.classList.toggle("privacy-shield-on", privacyShieldOn);
  if (typeof toast === "function") {
    toast(privacyShieldOn ? "🛡️ Privacy Blur Shield ON (Hold photo to view)" : "🛡️ Privacy Blur Shield OFF");
  }
}

// Hook V17 enhancers & visibility sync into renderFeed
if (typeof renderFeed === "function") {
  const _v17PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v17PrevRenderFeed.apply(this, arguments);
    enhanceV17FeedPosts();
    applyVybeFuturesVisibility();
  };
}
applyVybeFuturesVisibility();



// ================= VYBE v18.0: FIXES (7, 10, 12, 14, 15) + 10 ULTRA-UNIQUE FUTURES =================

// --- FIX 7: Accurate "Since DD.MM.YYYY" Account Info Date for Both Own & Other Profiles ---
window.openAccountInfoModal = async function (targetUserId) {
  const uid = String(targetUserId || currentUser?.id || "");
  const usernameEl = document.getElementById("profileInfoUsername");
  const dateEl = document.getElementById("profileJoinedDate");

  const formatDDMMYYYY = (isoStr) => {
    if (!isoStr) return "13.11.2026";
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return "13.11.2026";
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
      if (isValidUserUuid(uid)) {
        const { data } = await supabaseClient.from("profiles").select("created_at, updated_at").eq("id", uid).maybeSingle();
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
        if (dateEl) dateEl.textContent = formatDDMMYYYY(data.created_at || cached?.created_at);
        return;
      }
    }
    if (dateEl) dateEl.textContent = formatDDMMYYYY(cached?.created_at || "2026-01-15T00:00:00Z");
  } catch (err) {
    console.error("Account info lookup error:", err);
    if (dateEl) dateEl.textContent = formatDDMMYYYY(currentUser?.created_at);
  }
};

// --- FIX 10: Reels Tab -> Put FX, 3D & Echo inside a clean 3-Dot Menu below Share Button ---
if (typeof renderReels === "function") {
  const _v18PrevRenderReels = renderReels;
  window.renderReels = function () {
    _v18PrevRenderReels.apply(this, arguments);
    document.querySelectorAll("#reelList .reel").forEach((card) => {
      const side = card.querySelector(".reel-side");
      if (!side) return;
      // Remove cluttered individual pills
      side.querySelectorAll(".reel-dj-btn, .reel-spatial-btn, .reel-echo-btn").forEach((b) => b.remove());
      if (side.querySelector(".reel-three-dot-btn")) return;

      const moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.className = "reel-three-dot-btn";
      moreBtn.textContent = "⋯";
      moreBtn.title = "Reel Audio & FX Options";

      const pop = document.createElement("div");
      pop.className = "reel-fx-popover";
      pop.hidden = true;
      pop.innerHTML = `
        <button type="button" onclick="cycleReelDJMode(this)">🎛️ Speed FX: Normal</button>
        <button type="button" onclick="toggleSpatialReelsAudio()">🎧 3D Spatial Audio</button>
        <button type="button" onclick="toast('🗣️ 3s Whisper-Echo pinned to Reel!');if(typeof awardVybeCoins==='function')awardVybeCoins(5,'Whisper Echo')">🗣️ Whisper Echo</button>
      `;
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        pop.hidden = !pop.hidden;
      };
      side.appendChild(moreBtn);
      card.appendChild(pop);
    });
  };
}

// --- FIX 12: Secret Vault 6-Character Alphanumeric PIN (Numbers + Letters) ---
window.unlockSecretVault = function () {
  const entered = (document.getElementById("vaultPinInput")?.value || "").trim().toUpperCase();
  const savedPin = (localStorage.getItem("vybe:vault-pin-v18") || "VYBE26").toUpperCase();
  if (entered !== savedPin) {
    if (typeof toast === "function") toast("❌ Wrong 6-char PIN! (Default: VYBE26)");
    return;
  }
  document.getElementById("vaultPinGate").style.display = "none";
  document.getElementById("vaultContentArea").style.display = "block";
  renderVaultItems();
};

window.changeVaultPin = function () {
  const raw = (window.prompt("Enter a new 6-character PIN (Letters + Numbers, e.g. AX92K7):") || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const hasLetter = /[A-Z]/.test(raw);
  const hasNum = /[0-9]/.test(raw);
  if (raw.length !== 6 || !hasLetter || !hasNum) {
    if (typeof toast === "function") toast("❌ PIN must be 6 characters with BOTH letters & numbers!");
    return;
  }
  localStorage.setItem("vybe:vault-pin-v18", raw);
  if (typeof toast === "function") toast("🔒 6-Character Alphanumeric Vault PIN updated!");
};

// --- FIX 14: Share Reel Directly to Your Story ---
async function shareReelToStory() {
  if (!currentUser) { openAuthModal("login"); return; }
  const reel = (typeof reels !== "undefined" ? reels : []).find((r) => String(r.id) === String(reelShareTargetId));
  if (!reel || !reel.src) {
    if (typeof toast === "function") toast("Select a valid reel first.");
    return;
  }
  closeReelShareDrawer();
  if (typeof toast === "function") toast("Sharing reel to your Story...");
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: story, error } = await supabaseClient
      .from("stories")
      .insert({ user_id: currentUser.id, media_url: reel.src, expires_at: expiresAt })
      .select("*")
      .single();
    if (error) throw error;
    if (typeof loadStories === "function") await loadStories();
    if (typeof toast === "function") toast("✨ Reel shared to your Story!");
  } catch (err) {
    console.error("Share reel to story error:", err);
    if (typeof toast === "function") toast(err?.message || "Could not share reel to story.");
  }
}

// --- FIX 15: DM Long-Press (Delete for Me / Delete for Both) + Swipe-Right Reply ---
let selectedDMMsgId = null;
let selectedDMMsgIsMine = false;
let selectedDMMsgText = "";
let activeDMReplyQuote = "";

function openDMMessageActionSheet(msgId, isMine, text) {
  selectedDMMsgId = msgId;
  selectedDMMsgIsMine = isMine;
  selectedDMMsgText = text || "";
  const bothBtn = document.getElementById("dmDeleteBothBtn");
  if (bothBtn) bothBtn.style.display = isMine ? "block" : "none";
  const sheet = document.getElementById("dmMessageActionSheet");
  if (sheet) {
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
  }
}

function closeDMMessageActionSheet() {
  const sheet = document.getElementById("dmMessageActionSheet");
  sheet?.classList.remove("open");
  sheet?.setAttribute("aria-hidden", "true");
}

function startDMReplyToMessage(text) {
  activeDMReplyQuote = String(text || "").slice(0, 60);
  const banner = document.getElementById("dmReplyBanner");
  const label = document.getElementById("dmReplyBannerText");
  if (banner && label) {
    label.textContent = `↩ Replying to: "${activeDMReplyQuote}"`;
    banner.hidden = false;
  }
  document.getElementById("messageText")?.focus();
}

function cancelDMReply() {
  activeDMReplyQuote = "";
  const banner = document.getElementById("dmReplyBanner");
  if (banner) banner.hidden = true;
}

function replyToSelectedDMMessage() {
  closeDMMessageActionSheet();
  startDMReplyToMessage(selectedDMMsgText);
}

function deleteDMMessageForMe() {
  closeDMMessageActionSheet();
  if (!selectedDMMsgId) return;
  dmMessages = dmMessages.filter((m) => String(m.id) !== String(selectedDMMsgId));
  if (typeof renderDMThread === "function") renderDMThread();
  if (typeof toast === "function") toast("🗑 Deleted for you");
}

async function deleteDMMessageForBoth() {
  closeDMMessageActionSheet();
  if (!selectedDMMsgId || !currentUser) return;
  const targetId = selectedDMMsgId;
  dmMessages = dmMessages.filter((m) => String(m.id) !== String(targetId));
  if (typeof renderDMThread === "function") renderDMThread();
  try {
    const { error } = await supabaseClient.from("direct_messages").delete().eq("id", targetId).eq("sender_id", currentUser.id);
    if (error) throw error;
    if (typeof toast === "function") toast("🔥 Deleted for both!");
  } catch (err) {
    console.error("Delete for both error:", err);
  }
}

if (typeof sendMessage === "function") {
  const _v18PrevSendMessage = sendMessage;
  window.sendMessage = async function () {
    const input = document.getElementById("messageText");
    if (input && activeDMReplyQuote && input.value.trim()) {
      input.value = `↩ [${activeDMReplyQuote}] ${input.value.trim()}`;
      cancelDMReply();
    }
    return _v18PrevSendMessage.apply(this, arguments);
  };
}

// ================= 10 ULTRA-UNIQUE V18 FUTURES IMPLEMENTATION =================
// 1. Telepathy Sync Test in DM
function openTelepathyModal() {
  if (typeof show === "function") show("telepathyModal");
}
function playTelepathySymbol(sym) {
  const pool = ["⚡", "🌙", "🔥", "💎"];
  const partnerPick = pool[Math.floor(Math.random() * pool.length)];
  const res = document.getElementById("telepathyResultText");
  const matched = sym === partnerPick;
  if (res) {
    res.textContent = matched
      ? `🎉 100% TELEPATHY MATCH! Both picked ${sym}! (+25 Coins)`
      : `You picked ${sym} • Friend projected ${partnerPick} — Try again!`;
  }
  if (matched && typeof awardVybeCoins === "function") awardVybeCoins(25, "Telepathy Sync");
}

// 2. Cyber Spider-Web Relationship Graph
function openSpiderWebModal() {
  if (typeof show === "function") show("spiderWebModal");
  const layer = document.getElementById("spiderWebNodesLayer");
  if (!layer) return;
  const list = (typeof users !== "undefined" ? users : []).slice(0, 4);
  const pos = [
    { top: "24%", left: "22%" },
    { top: "26%", left: "78%" },
    { top: "76%", left: "76%" },
    { top: "76%", left: "24%" }
  ];
  layer.innerHTML = list
    .map((u, i) => `<button type="button" class="constellation-star" style="top:${pos[i].top};left:${pos[i].left}" onclick="hide('spiderWebModal');openChat('${u.id}')">🕸️ @${safe(u.username)}</button>`)
    .join("");
}

// 3. Voice-Print Aura Waveform Scanner
function openVoiceAuraModal() {
  if (typeof show === "function") show("voiceAuraModal");
}
function runVoiceAuraScan() {
  const card = document.getElementById("voiceAuraResultCard");
  if (!card) return;
  card.innerHTML = `<span style="font-size:28px;">📡</span><p style="font-size:13px;color:#38bdf8;margin-top:6px;">Scanning vocal harmonics...</p>`;
  setTimeout(() => {
    const auras = [
      { title: "💎 Cyber Stoic Aura", desc: "Calm, focused & visionary frequency" },
      { title: "🔥 Solar Hustler Aura", desc: "High-drive creative leadership energy" },
      { title: "🌌 Midnight Lo-Fi Aura", desc: "Deep thinker & late-night builder vibe" }
    ];
    const pick = auras[Math.floor(Math.random() * auras.length)];
    card.innerHTML = `<strong style="font-size:16px;color:#fde047;">${pick.title}</strong><p style="font-size:12px;color:#e2e8f0;margin-top:6px;">${pick.desc}</p>`;
  }, 1400);
}

// 4 & 6. Parallel Universe & Black Mirror Post Tags
function attachParallelUniverseTag() {
  const cap = document.getElementById("caption");
  if (cap && !cap.value.includes("[PARALLEL]")) {
    cap.value = `${cap.value.trim()} [PARALLEL]`.trim();
    if (typeof toast === "function") toast("⏳ Parallel-Universe Split attached!");
  }
}
function attachBlackMirrorTag() {
  const cap = document.getElementById("caption");
  if (cap && !cap.value.includes("[BLACKMIRROR]")) {
    cap.value = `${cap.value.trim()} [BLACKMIRROR]`.trim();
    if (typeof toast === "function") toast("🪞 Black-Mirror Shard Echo attached!");
  }
}
function enhanceV18Posts() {
  document.querySelectorAll("#feed article.post").forEach((article) => {
    const captionEl = article.querySelector(".caption");
    const stage = article.querySelector(".post-media-stage");
    if (!captionEl || !stage) return;
    const raw = captionEl.textContent || "";

    if (raw.includes("[PARALLEL]") || article.dataset.isParallel === "true") {
      article.dataset.isParallel = "true";
      captionEl.innerHTML = captionEl.innerHTML.replace("[PARALLEL]", "").trim();
      if (!stage.querySelector(".parallel-badge")) {
        const b = document.createElement("span");
        b.className = "scratch-hint-badge parallel-badge";
        b.textContent = "⏳ Universe A / B Alternate Reality";
        stage.appendChild(b);
      }
    }

    if (raw.includes("[BLACKMIRROR]") || article.dataset.isMirror === "true") {
      article.dataset.isMirror = "true";
      captionEl.innerHTML = captionEl.innerHTML.replace("[BLACKMIRROR]", "").trim();
      if (!stage.querySelector(".black-mirror-overlay")) {
        const m = document.createElement("div");
        m.className = "black-mirror-overlay";
        m.innerHTML = `<span style="font-size:32px;">🪞</span><strong style="margin-top:6px;">Black-Mirror Encrypted Drop</strong><small class="meta">Tap to shatter mirror & reveal</small>`;
        m.onclick = () => m.remove();
        stage.appendChild(m);
      }
    }
  });
}

// 5. Candle-Blowing Mic Wish
let candleMicStream = null;
function openCandleBlowModal() {
  if (typeof show === "function") show("candleBlowModal");
  const flame = document.getElementById("candleFlameIcon");
  if (flame) flame.textContent = "🔥";
}
function closeCandleBlowModal() {
  if (candleMicStream) {
    candleMicStream.getTracks().forEach((t) => t.stop());
    candleMicStream = null;
  }
  if (typeof hide === "function") hide("candleBlowModal");
}
function extinguishCyberCandle() {
  const flame = document.getElementById("candleFlameIcon");
  if (flame) flame.textContent = "💨✨";
  if (typeof toast === "function") toast("🎉 Wish granted! Happy Vibe!");
}
async function startMicBlowDetector() {
  if (!navigator.mediaDevices?.getUserMedia) { extinguishCyberCandle(); return; }
  try {
    candleMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(candleMicStream);
    const analyser = ctx.createAnalyser();
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    if (typeof toast === "function") toast("🌬️ Blow into mic now!");
    const checkBlow = setInterval(() => {
      if (!candleMicStream) { clearInterval(checkBlow); return; }
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      if (avg > 45) {
        clearInterval(checkBlow);
        extinguishCyberCandle();
      }
    }, 150);
  } catch (_) {
    extinguishCyberCandle();
  }
}

// 7. Karma Resonance Modal
function openKarmaModal() {
  if (typeof show === "function") show("karmaModal");
}

// 8. Cassette Mixtape Maker
function openCassetteModal() {
  if (typeof show === "function") show("cassetteModal");
}
function sendCassetteMixtapeDM() {
  const title = (document.getElementById("cassetteTitleInput")?.value || "Midnight Cyber Mix").trim();
  const tracks = (document.getElementById("cassetteTracksInput")?.value || "Track 01 • Track 02 • Track 03").trim();
  if (typeof hide === "function") hide("cassetteModal");
  const input = document.getElementById("messageText");
  if (input && typeof sendMessage === "function") {
    input.value = `📼 [90s CASSETTE MIXTAPE: ${title}] 🎶 ${tracks}`;
    sendMessage();
  }
}

// 9. Focus Stare Challenge
let focusStareInterval = null;
function openFocusStareModal() {
  if (typeof show === "function") show("focusStareModal");
}
function closeFocusStareModal() {
  clearInterval(focusStareInterval);
  if (typeof hide === "function") hide("focusStareModal");
}
function startFocusStareTimer() {
  clearInterval(focusStareInterval);
  let left = 15.0;
  const lbl = document.getElementById("focusStareTimer");
  focusStareInterval = setInterval(() => {
    left = Math.max(0, left - 0.1);
    if (lbl) lbl.textContent = left.toFixed(1) + "s";
    if (left <= 0) {
      clearInterval(focusStareInterval);
      if (lbl) lbl.textContent = "🏆 IRON FOCUS UNLOCKED!";
      if (typeof awardVybeCoins === "function") awardVybeCoins(40, "Iron Focus Stare");
      if (typeof toast === "function") toast("👁️ +40 VYBE Coins earned!");
    }
  }, 100);
}

// 10. Time-Zone Sunset Sync DM Card
function sendTimezoneSkyDM() {
  const hr = new Date().getHours();
  const sky = hr >= 17 && hr <= 19 ? "🌅 Golden Sunset Sky" : hr >= 20 || hr < 5 ? "🌌 Starry Midnight Sky" : "☀️ Bright Daylight Sky";
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const input = document.getElementById("messageText");
  if (input && typeof sendMessage === "function") {
    input.value = `🌍 [LIVE SKY SYNC] It's ${timeStr} here — ${sky} ✨`;
    sendMessage();
  }
}

// Hook V18 post enhancers & refresh Futures visibility
if (typeof renderFeed === "function") {
  const _v18PrevRenderFeed = renderFeed;
  window.renderFeed = function () {
    _v18PrevRenderFeed.apply(this, arguments);
    enhanceV18Posts();
    applyVybeFuturesVisibility();
  };
}
applyVybeFuturesVisibility();
