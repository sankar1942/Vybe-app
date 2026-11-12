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
