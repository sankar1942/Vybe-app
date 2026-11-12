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
