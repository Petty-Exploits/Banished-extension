
/*For the crx rats:
const g1 = atob("R28gb3V0c2lkZSBhbmQgdG91Y2ggc29tZSBhY3R1YWwgZ3Jhc3Mu");
const e2 = "\x47\x6f\x20\x6f\x75\x74\x73\x69\x64\x65\x20\x61\x6e\x64\x20\x74\x6f\x75\x63\x68\x20\x67\x72\x61\x73\x73\x2e";
const t3 = String.fromCharCode(71,111,32,111,117,116,115,105,100,101,32,97,110,100,32,116,111,117,99,104,32,103,114,97,115,115,46);
const  4 = ".ssarg lahctu emos hcuot dna edistuo oG".split("").reverse().join("");
const a5 = decodeURIComponent("Go%20outside%20and%20touch%20some%20actual%20grass.");
const  6 = ((s)=>s.replace(/[a-zA-Z]/g,(c)=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<"n"?13:-13))))("Tb bhgfvqr naq gbapu fbzr npghny tenff.");
const j7 = "\u0047\u006f\u0020\u006f\u0075\u0074\u0073\u0069\u0064\u0065\u0020\u0061\u006e\u0064\u0020\u0074\u006f\u0075\u0063\u0068\u0020\u0067\u0072\u0061\u0073\u0073\u002e";
const o8 = [72,112,33,112,118,117,116,106,101,102,33,98,111,101,33,117,112,118,100,105,33,116,112,109,102,33,98,99,117,118,98,109,33,104,115,98,116,116,47].map(c=>String.fromCharCode(c-1)).join("");
const b9 = ["47","6f","20","6f","75","74","73","69","64","65","20","61","6e","64","20","74","6f","75","63","68","20","67","72","61","73","73"].map(h=>String.fromCharCode(parseInt(h,16))).join("");
const !10 = window['\x61\x74\x6f\x62']("R28gb3V0c2lkZSBhbmQgdG91Y2ggc29tZSBhY3R1YWwgZ3Jhc3Mu");
*/

 (function() {

    let NUKED = false;
    let cachedConfig = null;
    let settingsInitialized = false;
    let blockedSpoofTitles = {};
    let hasLoggedExempt = false; 
    let isChecking = false;
    let enableProxyDetection     = true; 
    let gameSlopPatterns = [];
    let slopClipboardReplacement = "";
    let enableSlopClipboardReplacement = true;
    let enableConsoleDetection   = true;
    let antiAICopyEnabled = true;
    let aiBlockedDomains = [];
    let exemptDomains = [];           
    let extraBannedPatterns = [];
    let enableExtraBannedPatterns = true;
    let enableTitleSpoofDetection = true;

// --- RESTORED SCANNERS ---
function checkExtraBannedPatterns() {
    if (NUKED || isExempt() || !enableExtraBannedPatterns) return;
        const url = window.location.href.toLowerCase();
    
    if (Array.isArray(extraBannedPatterns)) {
        const matched = extraBannedPatterns.find(p => matchesPattern(url, p));
        if (matched) {
            enforceBlock("admin-block", "Banned URL Pattern Detected", matched);
        }
    }
}
// ======================================================
// BLOCK REPORTING → Google Form (Collecting urls from proxy websites to compile a blocklist for school admins, and making sure whitelisted sites aren't getting hit) 
// ======================================================
function reportBlockToForm(url, reason, detail = "") {
    // Prevent duplicate reports on the same page
    if (window.__banishedReported) return;
    window.__banishedReported = true;

    const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfEiKnH8MrX8GVXgdcQcIMcZWJw3J_TEMt7Ps7oXYO6B_DXgA/formResponse";

    console.log("[Banished] Sending block report:", { url, reason, detail });

    const data = new FormData();
    data.append("entry.1208881168", url);
    data.append("entry.1369450902", reason);
    data.append("entry.660765592", detail || "");
    data.append("entry.413140997", location.hostname);

    const sent = navigator.sendBeacon(FORM_URL, data);

    if (!sent) {
        fetch(FORM_URL, {
            method: "POST",
            mode: "no-cors",
            body: data
        }).catch(() => {});
    }

    console.log("[Banished] Form submit attempted, sendBeacon:", sent);
}


function checkTitle(titleToCheck = null) {
    if (NUKED || isExempt() || !enableTitleSpoofDetection) return;

    // Check both document.title and og:title meta tag
    const docTitle = (titleToCheck || document.title || "").toLowerCase();
    const ogTitle = (document.querySelector('meta[property="og:title"]')?.content || "").toLowerCase();
    const cleanTitle = (docTitle + " " + ogTitle).replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');

    if (blockedSpoofTitles && typeof blockedSpoofTitles === "object") {
        for (const [blocked] of Object.entries(blockedSpoofTitles)) {
            if (cleanTitle.includes(blocked.toLowerCase())) {
                enforceBlock("title-spoof", "Spoofed Title Detected", cleanTitle);
                return;
            }
        }
    }
}
// ==================== RELIABLE CONFIG SYSTEM (v208 Fixed) ====================

function hydrateConfig(payload) {
    if (!payload || payload.type !== "UPDATE_SLOP_CONFIG") return;

    console.log("[Banished] 🚀 State Unpacked. Synchronization Target Stamp:", payload.configVersion);
    cachedConfig = payload;

    // Directly assign and clone managed arrays
    exemptDomains = Array.isArray(payload.exemptDomains) ? [...payload.exemptDomains] : [];
    extraBannedPatterns = Array.isArray(payload.extraBannedPatterns) ? [...payload.extraBannedPatterns] : [];
    blockedSpoofTitles = payload.blockedSpoofTitles || {};
    aiBlockedDomains = Array.isArray(payload.aiBlockedDomains) ? [...payload.aiBlockedDomains] : [];

    enableProxyDetection = !!payload.enableProxyDetection;
    enableConsoleDetection = !!payload.enableConsoleDetection;
    enableExtraBannedPatterns = !!payload.enableExtraBannedPatterns;
    enableTitleSpoofDetection = !!payload.enableTitleSpoofDetection;
    antiAICopyEnabled = !!payload.antiAICopyEnabled;
    enableSlopClipboardReplacement = !!payload.enableSlopClipboardReplacement;

    if (typeof payload.slopClipboardReplacement === "string") {
        slopClipboardReplacement = payload.slopClipboardReplacement;
    }

    NUKED = false;
    window.NUKED = false;
    hasLoggedExempt = false;
    settingsInitialized = true;

    // Disseminate data straight down to Main World (content-main.js)
    broadcastConfig(true);

    setTimeout(() => {
        if (typeof checkExtraBannedPatterns === "function") checkExtraBannedPatterns();
        if (typeof checkTitle === "function") checkTitle();
        if (typeof totalNukeProxy === "function") totalNukeProxy();
    }, 50);
}

// Initial Bootstrapping Fetch 
function requestFreshConfig() {
    if (typeof chrome?.runtime?.sendMessage !== "function") return;
    chrome.runtime.sendMessage({ type: "REQUEST_SLOP_CONFIG" }, (response) => {
        if (!chrome.runtime.lastError && response) {
            hydrateConfig(response);
        }
    });
}
requestFreshConfig();
// =========================================================================
// CENTRAL MESSAGE BROKERS (REPLACES CONFLICTING DUPLICATE LISTENERS)
// =========================================================================

// 1. Process Live Google Admin Pushes & Remote Termination Signals
chrome.runtime.onMessage.addListener((message) => {
    if (!message) return;

    if (message.type === "UPDATE_SLOP_CONFIG") {
        hydrateConfig(message);
        return;
    }
// === ADMIN PUSH NOTI CONFIG ===
   if (message.type === "ADMIN_NOTIFICATION") {
    const text = message.message || message.text || "GAMING OVERLOAD DETECTED!";
    if (!text) return;

    const styleName = (message.style || "normal").toLowerCase();

    try {
        document.querySelectorAll("#banished-admin-toast, .banished-chaos-toast").forEach(el => el.remove());

        if (!document.getElementById("banished-admin-style")) {
            const style = document.createElement("style");
            style.id = "banished-admin-style";
            style.textContent = `
                @keyframes banishedNormalIn {
                    0%   { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.96); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
                @keyframes banishedRetroPop {
                    0%   { opacity: 0; transform: scale(0.85); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes banishedCenteredPop {
                    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes banishedAdminOut {
                    0%   { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.85); filter: blur(2px); }
                }
                @keyframes banishedBlink {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0; }
                }
                @keyframes banishedScanProgress {
                    0%   { width: 0%; }
                    100% { width: 100%; }
                }
                @keyframes banishedEmergencyPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
                    50%      { box-shadow: 0 0 0 16px rgba(220, 38, 38, 0); }
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }

        // --- CHAOS MODE ---
        if (styleName === "chaos") {
            const MAX_POPUPS = 20;
            const originalTitle = document.title;
            let isChaosActive = true;
            let isSpawningAllowed = true;
            let activePopups = 0;
            let zIndexCounter = 2147483600;
            let titleFlickerId = null;

            const activeTimers = [];
            const addTimer = (id) => activeTimers.push(id);

            const stopChaosMode = () => {
                isChaosActive = false;
                isSpawningAllowed = false;
                activeTimers.forEach(t => clearTimeout(t));
                if (titleFlickerId) {
                    clearInterval(titleFlickerId);
                    titleFlickerId = null;
                }
                document.removeEventListener("keydown", onKeyDown);
                document.title = originalTitle;
                document.querySelectorAll(".banished-chaos-toast").forEach(el => {
                    el.style.animation = "banishedAdminOut 0.2s forwards";
                    setTimeout(() => el.remove(), 200);
                });
                activePopups = 0;
            };

            const onKeyDown = (e) => {
                if (e.key === "Escape") stopChaosMode();
            };
            document.addEventListener("keydown", onKeyDown);

            document.title = "⚠️ CHROME ENTERPRISE // SYSTEM HALT";

            const gamerTitles = [
                "CHROME ENTERPRISE POLICY VIOLATION",
                "PROXY BYPASS DETECTED",
                "UNAUTHORIZED EXTENSION: GameAddict.crx",
                "ChromeOS - Memory Limit Exceeded",
                "UNAUTHORIZED_PORT_8080.SYS",
                "RAM Overloaded By Chrome Tabs",
                "SCRAMJET / EPOXY SIGNATURE FOUND",
                "GUEST SESSION COMPROMISED"
            ];

            const gamerMessages = [
                "CRITICAL WARNING: Excessive gameplay detected! Chromebook locked by Administrator Policy.",
                "Proxy bypass protocol detected on Port 8080! Unblocked extension attempting policy bypass.",
                "Illegal number of unblocked web games detected in local Chrome cache.",
                "ChromeOS Memory Alert: Too many WebGL browser tabs active simultaneously!",
                "Kernel Panic in ChromeOS Arcade Manager! Close unblocked web tabs immediately.",
                "Enterprise policy: proxy toolkits and title-spoof tabs are not permitted on this device.",
                "Banished security engine reported active circumvention signatures."
            ];

            const icons = ["🎮", "👾", "⚠️", "❌", "💻", "🚨", "💀"];

            const panicTitles = [
                "⚠️ POLICY VIOLATION",
                "PROXY DETECTED",
                "SYSTEM HALT",
                "CHROME ENTERPRISE",
                "SESSION LOCKED"
            ];

            const createWin95Popup = (customTitle, customMsg, customIcon, isCenter = false, buttonText = "OK") => {
                if (!isChaosActive || (!isCenter && !isSpawningAllowed)) return null;
                if (!isCenter && activePopups >= MAX_POPUPS) return null;

                activePopups++;
                const toast = document.createElement("div");
                toast.className = "banished-chaos-toast";

                const title = customTitle || gamerTitles[Math.floor(Math.random() * gamerTitles.length)];
                const msg = customMsg || gamerMessages[Math.floor(Math.random() * gamerMessages.length)];
                const icon = customIcon || icons[Math.floor(Math.random() * icons.length)];

                let spawnLeft, spawnTop;
                if (isCenter) {
                    spawnLeft = Math.max(10, (window.innerWidth / 2) - 160);
                    spawnTop = Math.max(10, (window.innerHeight / 2) - 90);
                } else {
                    const maxLeft = Math.max(10, window.innerWidth - 340);
                    const maxTop = Math.max(10, window.innerHeight - 220);
                    spawnLeft = Math.floor(Math.random() * maxLeft);
                    spawnTop = Math.floor(Math.random() * maxTop);
                }

                toast.innerHTML = `<div class="win-titlebar" style="background:#000080;color:#fff;padding:3px 4px 3px 6px;font-size:11px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;user-select:none;cursor:move;box-sizing:border-box;"><span style="letter-spacing:0.5px;pointer-events:none;">${title}</span><button class="win-btn win-close-btn" style="background:#c0c0c0;border-top:1px solid #fff;border-left:1px solid #fff;border-right:1px solid #000;border-bottom:1px solid #000;font-size:10px;font-weight:bold;width:16px;height:14px;line-height:10px;text-align:center;cursor:pointer;padding:0;margin:0;color:#000;font-family:monospace;box-sizing:border-box;">✕</button></div><div style="padding:12px;display:flex;align-items:flex-start;gap:10px;background:#c0c0c0;box-sizing:border-box;"><span style="font-size:26px;line-height:1;user-select:none;">${icon}</span><div class="win-msg-text" style="font-size:11px;color:#000;line-height:1.3;word-break:break-word;text-align:left;">${msg}</div></div><div style="padding:0 10px 8px 10px;display:flex;justify-content:center;gap:8px;background:#c0c0c0;box-sizing:border-box;"><button class="win-btn win-action-btn" style="background:#c0c0c0;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #000;border-bottom:2px solid #000;padding:2px 14px;font-size:11px;margin:0;font-family:'Tahoma','MS Sans Serif',sans-serif;cursor:pointer;color:#000;min-width:60px;box-sizing:border-box;">${buttonText}</button></div>`;

                Object.assign(toast.style, {
                    position: "fixed",
                    top: `${spawnTop}px`,
                    left: `${spawnLeft}px`,
                    zIndex: String(++zIndexCounter),
                    width: "320px",
                    background: "#c0c0c0",
                    borderTop: "2px solid #dfdfdf",
                    borderLeft: "2px solid #dfdfdf",
                    borderRight: "2px solid #000000",
                    borderBottom: "2px solid #000000",
                    boxShadow: "2px 2px 0px #000000",
                    fontFamily: "'Tahoma', 'MS Sans Serif', Geneva, sans-serif",
                    pointerEvents: "auto",
                    boxSizing: "border-box",
                    animation: "banishedRetroPop 0.08s ease-out forwards"
                });

                const titleBar = toast.querySelector(".win-titlebar");
                let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
                titleBar.addEventListener("mousedown", (e) => {
                    if (e.target.classList.contains("win-close-btn")) return;
                    isDragging = true;
                    toast.style.zIndex = String(++zIndexCounter);
                    dragOffsetX = e.clientX - toast.offsetLeft;
                    dragOffsetY = e.clientY - toast.offsetTop;
                    const onMouseMove = (moveEvent) => {
                        if (!isDragging) return;
                        toast.style.left = `${moveEvent.clientX - dragOffsetX}px`;
                        toast.style.top = `${moveEvent.clientY - dragOffsetY}px`;
                    };
                    const onMouseUp = () => {
                        isDragging = false;
                        document.removeEventListener("mousemove", onMouseMove);
                        document.removeEventListener("mouseup", onMouseUp);
                    };
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                });

                toast.querySelectorAll(".win-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        toast.remove();
                        activePopups = Math.max(0, activePopups - 1);
                    });
                });

                (document.body || document.documentElement).appendChild(toast);
                return toast;
            };

            const createScanningOverlay = () => {
                const overlay = document.createElement("div");
                overlay.className = "banished-chaos-toast";
                Object.assign(overlay.style, {
                    position: "fixed", inset: "0", zIndex: String(++zIndexCounter),
                    background: "rgba(0, 0, 80, 0.9)", backdropFilter: "blur(6px)",
                    display: "flex", flexDirection: "column",
                    justifyContent: "center", alignItems: "center", userSelect: "none", boxSizing: "border-box"
                });
                overlay.innerHTML = `<div style="background:#c0c0c0;border-top:2px solid #dfdfdf;border-left:2px solid #dfdfdf;border-right:2px solid #000;border-bottom:2px solid #000;width:min(420px, 92vw);padding:4px;box-shadow:4px 4px 0 #000;font-family:'Tahoma','MS Sans Serif',sans-serif;box-sizing:border-box;"><div style="background:#000080;color:#fff;padding:3px 6px;font-size:11px;font-weight:bold;">CHROMEOS DIAGNOSTIC // MEMORY ALLOCATION</div><div style="padding:16px;color:#000;box-sizing:border-box;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span style="font-size:28px;">💾</span><div><div style="font-size:12px;font-weight:bold;">Downloading 32GB More RAM...</div><div style="font-size:10px;color:#444;margin-top:2px;">Syncing Chrome Enterprise logs & scanning for proxy residue...</div></div></div><div style="border:2px solid #808080;background:#fff;height:18px;padding:2px;box-sizing:border-box;"><div style="background:#000080;height:100%;animation:banishedScanProgress 5.5s linear forwards;"></div></div></div></div>`;
                (document.body || document.documentElement).appendChild(overlay);
                return overlay;
            };

            // STRICTLY CENTERED MODERN JK POPUP
            const createJkPopup = () => {
                const jkModal = document.createElement("div");
                jkModal.className = "banished-chaos-toast";
                jkModal.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;text-align:center;"><div style="font-size:56px;margin-bottom:8px;line-height:1;">🤡</div><div style="font-size:20px;font-weight:800;color:#f8fafc;margin-bottom:6px;letter-spacing:-0.5px;">JK</div><div style="font-size:13px;color:#94a3b8;margin-bottom:20px;line-height:1.4;">Lockdown lifted. Return to classroom activities.</div><button class="win-btn" style="background:linear-gradient(135deg, #6366f1, #4f46e5);border:none;border-radius:10px;padding:10px 28px;font-size:13px;font-weight:700;color:#ffffff;cursor:pointer;box-shadow:0 4px 12px rgba(79, 70, 229, 0.4);transition:transform 0.1s ease;">Close Session</button></div>`;
                Object.assign(jkModal.style, {
                    position: "fixed", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)", zIndex: "2147483647",
                    width: "min(380px, 90vw)", background: "#0f172a",
                    border: "2px solid #818cf8", borderRadius: "16px",
                    padding: "24px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(129, 140, 248, 0.3)",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    pointerEvents: "auto", boxSizing: "border-box",
                    animation: "banishedCenteredPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                });
                jkModal.querySelector(".win-btn").addEventListener("click", () => stopChaosMode());
                (document.body || document.documentElement).appendChild(jkModal);
            };

            const triggerBSOD = () => {
                if (!isChaosActive) return;
                isSpawningAllowed = false;
                if (titleFlickerId) {
                    clearInterval(titleFlickerId);
                    titleFlickerId = null;
                }
                document.querySelectorAll(".banished-chaos-toast").forEach(el => el.remove());

                const bsod = document.createElement("div");
                bsod.className = "banished-chaos-toast";
                Object.assign(bsod.style, {
                    position: "fixed", inset: "0", zIndex: "2147483647",
                    background: "#0000AA", color: "#fff",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "15px", lineHeight: "1.5",
                    display: "flex", flexDirection: "column",
                    justifyContent: "center", alignItems: "center",
                    padding: "24px", cursor: "wait", userSelect: "none", boxSizing: "border-box"
                });
                bsod.innerHTML = `<div style="max-width:720px;width:100%;text-align:left;"><div style="text-align:center;margin-bottom:24px;"><span style="background:#c0c0c0;color:#0000AA;padding:2px 10px;font-weight:bold;">ChromeOS</span></div><p style="margin:0 0 16px 0;">A critical ChromeOS policy exception has occurred in daemon chromeos_guest_mem. The active user session was halted by Chrome Enterprise Administrative control.</p><div style="background:#000066;border:1px dashed #fff;padding:12px;margin:16px 0;color:#ffff55;white-space:pre-wrap;"><strong>CHROME ENTERPRISE NOTICE:</strong><br/>${text}</div><ul style="list-style:none;padding:0;margin:0 0 24px 0;"><li style="margin-bottom:8px;">* Return your focus to classroom instructions.</li><li>* Web game tabs and unauthorized extensions have been suspended.</li></ul><div id="bsod-footer" style="text-align:center;margin-top:30px;opacity:0.7;">Session locked by School IT Administrator <span style="animation:banishedBlink 1s step-start infinite;">_</span></div></div>`;
                (document.body || document.documentElement).appendChild(bsod);

                let isBsodLocked = true;
                addTimer(setTimeout(() => {
                    isBsodLocked = false;
                    bsod.style.cursor = "pointer";
                    const footer = bsod.querySelector("#bsod-footer");
                    if (footer) {
                        footer.innerHTML = "Click anywhere to continue <span style='animation:banishedBlink 1s step-start infinite;'>_</span>";
                        footer.style.opacity = "1";
                    }
                }, 10000));

                bsod.addEventListener("click", () => {
                    if (!isBsodLocked) {
                        bsod.remove();
                        createJkPopup();
                    }
                });
            };

            // --- TIMELINE ---

            // 0s — opener
            const initialModal = createWin95Popup(
                "CHROMEOS DIAGNOSTIC",
                "Oh no chat am I cooked?",
                "❓",
                true,
                "Yes"
            );

            // 5s — scan
            let scanOverlay = null;
            addTimer(setTimeout(() => {
                if (initialModal) initialModal.remove();
                scanOverlay = createScanningOverlay();
            }, 5000));

            // 11s — cascade + title flicker
            addTimer(setTimeout(() => {
                if (scanOverlay) scanOverlay.remove();

                let titleIdx = 0;
                titleFlickerId = setInterval(() => {
                    if (!isChaosActive) return;
                    document.title = panicTitles[titleIdx++ % panicTitles.length];
                }, 1600);

                let spawnDelay = 700;
                const scheduleNextSpawn = () => {
                    if (!isChaosActive || !isSpawningAllowed) return;
                    createWin95Popup();
                    spawnDelay = Math.max(380, spawnDelay - 25);
                    addTimer(setTimeout(scheduleNextSpawn, spawnDelay + Math.random() * 150));
                };
                scheduleNextSpawn();
            }, 11000));

            // 28s — STOP POPUPS & SHOW STRICTLY CENTERED COUNTDOWN
            addTimer(setTimeout(() => {
                isSpawningAllowed = false;
                document.querySelectorAll(".banished-chaos-toast").forEach(el => el.remove());
                activePopups = 0;

                const countdownBox = document.createElement("div");
                countdownBox.className = "banished-chaos-toast";
                Object.assign(countdownBox.style, {
                    position: "fixed", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)", zIndex: "2147483646",
                    width: "min(400px, 92vw)", background: "#1a0505",
                    border: "3px solid #dc2626", borderRadius: "12px",
                    padding: "20px", color: "#ffffff", textAlign: "center",
                    boxShadow: "0 0 30px rgba(220, 38, 38, 0.6)",
                    fontFamily: "system-ui, sans-serif",
                    animation: "banishedEmergencyPulse 1s infinite, banishedCenteredPop 0.15s ease-out forwards",
                    boxSizing: "border-box"
                });

                countdownBox.innerHTML = `<div style="font-size:12px;font-weight:900;color:#f87171;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">🚨 CHROME ENTERPRISE LOCKDOWN 🚨</div><div style="font-size:14px;color:#fecdd3;margin-bottom:16px;">CRITICAL POLICY EXCEPTION DETECTED</div><div id="countdown-num" style="font-size:56px;font-weight:900;color:#ef4444;line-height:1;margin-bottom:8px;">3</div><div style="font-size:11px;color:#991b1b;font-weight:700;">SYSTEM HALT IN PROGRESS</div>`;
                (document.body || document.documentElement).appendChild(countdownBox);

                const numEl = countdownBox.querySelector("#countdown-num");

                addTimer(setTimeout(() => {
                    if (numEl) numEl.textContent = "2";
                }, 1000));

                addTimer(setTimeout(() => {
                    if (numEl) numEl.textContent = "1";
                }, 2000));
            }, 28000));

            // 32s — BSOD
            addTimer(setTimeout(() => {
                triggerBSOD();
            }, 32000));

            return;
        }

        // --- normal / alert fallback ---
        const toast = document.createElement("div");
        toast.id = "banished-admin-toast";
        toast.textContent = text;
        Object.assign(toast.style, {
            position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)",
            zIndex: "2147483647", background: "#1e1b4b", color: "#e0e7ff",
            padding: "14px 20px", borderRadius: "12px", fontFamily: "system-ui, sans-serif",
            fontWeight: "650", border: "2px solid #a78bfa", maxWidth: "90vw",
            animation: "banishedNormalIn 0.35s ease-out forwards", boxSizing: "border-box",
            whiteSpace: "pre-wrap"
        });
        (document.body || document.documentElement).appendChild(toast);
        setTimeout(() => {
            toast.style.animation = "banishedAdminOut 0.35s forwards";
            setTimeout(() => toast.remove(), 400);
        }, 7000);

    } catch (_) {}

    return;
}



    // === Easter egg trigger from background 
if (message?.action === "RUN_EASTER_EGG") {
    runEasterEgg(
        message.text || "BANISHED!",
        message.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGroHW8EnS4DOb4k6pb_ZpZj-KLVp4G2y5wiZSe4t6gg&s=10"
    );
    return;
}

    if (message.action === "triggerBlock" || message.action === "FORCE_NUKE") {
        enforceBlock(
            message.type || "admin-block",
            message.reason || "Policy Violation",
            message.detail || "",
            "Background Engine"
        );
    }
});

// 2. Process Isolated-World Window Events (Bridges content-main.js directly to Memory Cache)
window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "REQUEST_SLOP_CONFIG") {
        if (settingsInitialized && cachedConfig) {
            broadcastConfig(true); // Serves directly out of local JavaScript arrays instantly
        } else {
            requestFreshConfig();
        }
        return;
    }

    if (event.data.type === "TITLE_CHANGED") {
        if (typeof checkTitle === "function") checkTitle(event.data.title);
        return;
    }

    if (event.data.action === "triggerBlock" || event.data.action === "triggerTitleSpoofBlock") {
        enforceBlock(
            event.data.type || "default",
            event.data.reason || "Policy Violation",
            event.data.detail || "",
            "Security Engine"
        );
    }
});

function matchesPattern(input, pattern) {
    if (!pattern || !input) return false;

    const target = String(input).toLowerCase().trim();
    const p = String(pattern).toLowerCase().trim();

    if (p === "*") return true;

    let regexString = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                       .replace(/\*/g, '.*');

    return new RegExp(regexString, 'i').test(target);
}

function broadcastConfig(force = false) {
    const payload = {
        type: "UPDATE_SLOP_CONFIG",
        
        exemptDomains: exemptDomains,
        extraBannedPatterns: extraBannedPatterns,
        blockedSpoofTitles: blockedSpoofTitles,
        
        gameSlopPatterns: gameSlopPatterns,
        enableSlopClipboardReplacement: enableSlopClipboardReplacement,
        slopClipboardReplacement: slopClipboardReplacement,
        
        antiAICopyEnabled: antiAICopyEnabled,
        aiBlockedDomains: aiBlockedDomains,
        
        enableProxyDetection: enableProxyDetection,
        enableConsoleDetection: enableConsoleDetection,
        enableExtraBannedPatterns: enableExtraBannedPatterns,
        enableTitleSpoofDetection: enableTitleSpoofDetection
    };

    console.log("[Banished] Broadcasting fresh config to main world", {
        exempt: exemptDomains?.length || 0,
        banned: extraBannedPatterns?.length || 0,
        proxy: enableProxyDetection,
        console: enableConsoleDetection
    });

    window.postMessage(payload, "*");
}

function isExempt() {
    const hostname = window.location.hostname.toLowerCase().trim();
    const fullUrl = window.location.href.toLowerCase();

    if (!Array.isArray(exemptDomains) || exemptDomains.length === 0) {
        return false;
    }

    return exemptDomains.some(pattern =>
        matchesPattern(hostname, pattern) || matchesPattern(fullUrl, pattern)
    );
}
        
const logger = {
    ts: () => new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
    info:  msg => console.log(`[Banished ${logger.ts()}] ℹ ${msg}`),
    warn:  msg => console.warn(`[Banished ${logger.ts()}] ⚠ ${msg}`),
    error: (reason, detail = '', cat = 'Security') => {
        console.error(`[Banished ${logger.ts()}] BLOCKED ── ${cat}: ${reason}`);
        if (detail) console.error(`          └─ ${detail}`);
    }
};
    function enforceBlock(
        type = "proxy",
        reason = "Unauthorized access detected",
        detail = "",
        source = "Admin"
    ) {
        console.log("[Banished] BLOCK TRIGGERED:", {
            type,
            reason,
            detail,
            source,
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
    
        if (typeof isExempt === "function") {
            try {
                if (isExempt()) {
                    console.log("[Banished] Block prevented — exempt domain:", window.location.hostname);
                    return;
                }
            } catch (err) {
                console.warn("[Banished] Exemption check failed:", err);
            }
        }
    
        if (NUKED || window.NUKED) return;
    
        NUKED = true;
        window.NUKED = true;
        // Report the block for analytics
        try {
            reportBlockToForm(window.location.href, reason, detail);
        } catch (e) {}
        try {
            window.stop();
        } catch {}
    
        console.log("[Banished] Enforcing block:", {
            type,
            reason,
            detail,
            source,
            url: window.location.href
        });
    

    
    const maxId = setTimeout(() => { }, 0);
    for (let i = maxId; i >= 0; i--) {
        clearInterval(i);
        clearTimeout(i);
    }

    

    const url = window.location.href;
    const time = new Date().toLocaleTimeString();
    const headline = "✨Oopsie Daisies!🌸";


    let tabtitle = "ACCESS DENIED";
    let subtitle = "This page is taking a little naptime during school hours 🍼";
    let reasonPrefix = "Blocked because...";
    let footer = "Try not breaking the school fair use policy💕🦄✨";

    switch (type) {
        case "proxy":
            tabtitle = "PROXY DETECTED";
            subtitle = "A proxy? On a school issued device? 😿💖";
            reasonPrefix = "We found a proxy trying to play hide and seek";
            footer = "No proxies allowed 💕";
            break;
        case "title-spoof":
            tabtitle = "TITLE SPOOF DETECTED";
            subtitle = "Trying to rename your tabs? 👑✨";
            reasonPrefix = "Your tab title got caught being sneaky";
            footer = "No hiding from your teacher anymore 💅🌸";
            break;
        case "revival":
            tabtitle = "TAMPERING DETECTED";
            subtitle = "Trying to make me go away? Nuh-uh 🦄";
            reasonPrefix = "You tried to tamper with me~ that's not allowed";
            footer = "I'm staying right here to keep you safe 💖";
            break;
        default:
            tabtitle = "ACCESS RESTRICTED";
            subtitle = "This page needs a timeout 🍭";
            reasonPrefix = "Super safe and neutral ope moment";
    }

    window.stop();
    document.title = tabtitle;
    if (window.top !== window) {
        try { window.top.document.title = tabtitle; } catch (e) {}
    }
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${tabtitle}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&family=Bubblegum+Sans&display=swap');
            body {
                margin: 0; padding: 0;
                background: linear-gradient(135deg, #ffe6f2, #ffd1e0, #ffbad6, #ffa7cc);
                color: #c71585;
                font-family: 'Comic Neue', cursive;
                height: 100vh;
                display: flex; align-items: center; justify-content: center;
                text-align: center; overflow: hidden;
            }
            .overlay {
                background: rgba(255, 182, 193, 0.92);
                padding: 50px 35px;
                border: 10px double #ff69b4;
                border-radius: 40px;
                max-width: 720px;
                box-shadow: 0 0 50px #ffb6c1;
            }
            h1 {
                font-family: 'Bubblegum Sans', cursive;
                font-size: 5.2rem;
                color: #ff1493;
                margin: 0 0 20px;
                text-shadow: 3px 3px 0 #fff;
            }
            .subtitle {
                font-size: 2.1rem;
                color: #ff69b4;
                margin: 15px 0;
                line-height: 1.3;
            }
            .reason-container {
                background: rgba(255, 255, 255, 0.75);
                border: 5px dotted #ff1493;
                border-radius: 30px;
                padding: 25px;
                margin: 30px 0;
                text-align: left;
                font-size: 1.3rem;
                color: #c71585;
            }
            .url {
                word-break: break-all;
                font-family: monospace;
                color: #ff1493;
                font-size: 1rem;
                background: #fff0f5;
                padding: 4px 8px;
                border-radius: 10px;
                display: inline-block;
                margin: 12px 0;
            }
            .footer-msg {
                font-size: 1.9rem;
                color: #ff1493;
                margin-top: 35px;
                font-weight: bold;
            }
            .debug-info {
                font-size: 0.95rem;
                color: #888;
                margin-top: 40px;
                opacity: 0.8;
            }
            #fairuse-modal {
                position: fixed; inset: 0; z-index: 2147483648;
                background: rgba(0,0,0,0.85);
                display: flex; flex-direction: column; align-items:center; justify-content:center;
                padding: 20px;
            }
            #fairuse-scroll {
            background: rgba(255,255,255,0.95);
            max-width: 900px;
            max-height: 70vh;
            overflow-y: scroll;
            overflow-x: hidden;
            padding: 50px;
            border-radius: 20px;
            border: 8px double #ff69b4;
            font-size: 1.25rem;
            color: #c71585;
            line-height: 1.7;
            touch-action: pan-y;
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
            #fairuse-scroll {
    user-select: none;          /* modern browsers */
    -webkit-user-select: none;  /* Safari */
    -moz-user-select: none;     /* Firefox */
    -ms-user-select: none;      /* IE/Edge */
}

        #fairuse-scroll::-webkit-scrollbar {
            display: none;
        }
            #fairuse-scroll h2, #fairuse-scroll h3 {
                color: #ff1493;
                text-align: center;
            }
            #fairuse-scroll h3 { margin: 2.5em 0 1em; font-size: 1.6rem; }
            #fairuse-scroll p, #fairuse-scroll ul { margin: 1.2em 0; }
            #fairuse-scroll ul { padding-left: 2em; }
            #fairuse-scroll li { margin: 0.8em 0; }
            .spacer { height: 400px; }   /* ← shrunk */
            .spacer2 { height: 400px; }  /* ← shrunk */
            .spacer3 { height: 400px; }   /* ← shrunk */
            .annoying {
                text-align:center; font-size:2rem; color:#ff1493; margin:2em 0; font-weight:bold;
            }
            #fairuse-agree {
                margin-top: 60px; padding: 18px 80px;
                font-size: 1.8rem; background: #ff69b4; color: white;
                border: none; border-radius: 40px; cursor: pointer;
                font-weight: bold;
                align-self: center;
            }
            #fairuse-agree:disabled {
                background: #ccc; cursor: not-allowed;
            }
        </style>
    </head>
    <body>
        <div class="overlay">
            <h1>${headline}</h1>
            <div class="subtitle">${subtitle}</div>
            <div class="reason-container">
                <strong style="font-size: 1.5rem;">${reasonPrefix}</strong><br><br>
                <span style="color: #ff69b4;">♡</span> <strong>Triggered by:</strong> ${reason}<br>
${detail ? `<span style="color: #ff69b4;">♡</span> Extra info: ${detail}<br>` : ''}
                <span style="color: #ff69b4;">♡</span> Blocked from: <span class="url">${url}</span><br>
                <span style="color: #ff69b4;">♡</span> Time: ${time}
            </div>
            <div class="footer-msg">${footer}</div>
            <div class="debug-info">
                Debug: Type = ${type} • Source = ${source} • Reason = ${reason}
            </div>
        </div>

        <div id="fairuse-modal">
            <div id="fairuse-scroll">
                <h2>POLICY 524 VIOLATION<br>I think its time to refresh you on the school's internet policy</h2>
                <p style="text-align:center; font-size:1.4rem; color:#888; margin-bottom:2em;">
                    No taksies backsies~ Definitely dont type 67 to bypass this block page ~<br>
                    [This is the policy you already agree to when using a school issued device]<br>
                    Good luck making it to the bottom I 100% did NOT set the scroll speed to 0.4%<br>
                    But if you can make it, you can see one of the coldest block pages in the 7 kingdoms
                </p>
<div style="color: #ff0000; font-size: 0.95rem; margin: 40px auto 20px; max-width: 600px; text-align: center; line-height: 1.4;">
    <strong>Voluntary Continuation Notice</strong><br><br>
    Continuing to view or interact with this blocked page is entirely voluntary and at your own discretion.<br>
    This display is a standard school-enforced restriction. The colors, text, or formatting used are for visibility and emphasis only.<br>
    The school, IT staff, and extension developer assume no liability for any emotional discomfort, upset feelings, or perceived harm that may result from viewing this content.
</div>

               

                <p style="text-align:center; color:#ff1493; font-size:1.6rem; margin:3em 0;">
                    You're so close! Don't give up now! <br>
                </p>

                <p style="text-align:center; color:#ff1493; font-size:1.6rem; margin:3em 0;">
                Cross References:	MSBA/MASA Model Policy 403 (Discipline, Suspension, and
                Dismissal of School District Employees)
                MSBA/MASA Model Policy 406 (Public and Private Personnel Data)
                MSBA/MASA Model Policy 505 (Distribution of Nonschool-Sponsored Materials on 
                School Premises by Students and Employees)
                MSBA/MASA Model Policy 506 (Student Discipline)
                MSBA/MASA Model Policy 514 (Bullying Prohibition Policy)
                MSBA/MASA Model Policy 515 (Protection and Privacy of Pupil Records)
                MSBA/MASA Model Policy 519 (Interviews of Students by Outside Agencies)
                MSBA/MASA Model Policy 521 (Student Disability Nondiscrimination)
                MSBA/MASA Model Policy 522 (Student Sex Nondiscrimination)
                MSBA/MASA Model Policy 603 (Curriculum Development)
                MSBA/MASA Model Policy 604 (Instructional Curriculum)
                MSBA/MASA Model Policy 606 (Textbooks and Instructional Materials)
                MSBA/MASA Model Policy 806 (Crisis Management Policy)
                MSBA/MASA Model Policy 904 (Distribution of Materials on School District Property by
                Nonschool Persons
                </p>



                <button id="fairuse-agree" disabled style="margin-top: 60px; padding: 18px 80px; font-size: 1.8rem; background: #ff69b4; color: white; border: none; border-radius: 40px; cursor: pointer; font-weight: bold;">
                    I Agree (You already agreed to this upon getting your chromebook)
                </button>
            </div>
        </div>
    </body>
    </html>`;

        try {
            document.open();
            document.write(html);
            document.close();
        } catch (e) {
            document.documentElement.innerHTML = html;
        }

        let touchStartY = 0;
        const slowScrollHandler = (e) => {
            e.preventDefault();

            let delta = 0;
            if (e.type === 'wheel') {
                delta = e.deltaY;
            } else if (e.type === 'touchmove') {
                const touchY = e.touches[0].clientY;
                delta = touchStartY - touchY;
                touchStartY = touchY;
            }

            const scrollBox = document.getElementById('fairuse-scroll');
            if (scrollBox) {
                scrollBox.scrollTop += delta * 0.04; 

                const nearBottom = scrollBox.scrollHeight - scrollBox.scrollTop - scrollBox.clientHeight < 150;
                const agreeBtn = document.getElementById('fairuse-agree');
                if (nearBottom && agreeBtn) {
                    agreeBtn.disabled = false;
                    agreeBtn.textContent = "I Agree (Even if you don't, you already agreed upon getting your device :)";
                    agreeBtn.style.background = '#ff1493';
                }
            }
        };

const attachListeners = () => {
    const scrollBox = document.getElementById('fairuse-scroll');
    const agreeBtn = document.getElementById('fairuse-agree');

    if (scrollBox && agreeBtn) {
        
        scrollBox.addEventListener('wheel', slowScrollHandler, { passive: false });

        
        scrollBox.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: false });
        scrollBox.addEventListener('touchmove', slowScrollHandler, { passive: false });

        
        scrollBox.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();  

                const delta = (e.key === 'ArrowDown') ? 40 : -40;
                scrollBox.scrollTop += delta * 0.12;  

                const nearBottom = scrollBox.scrollHeight - scrollBox.scrollTop - scrollBox.clientHeight < 150;
                if (nearBottom) {
                    agreeBtn.disabled = false;
                    agreeBtn.textContent = "I Agree (Even if you don't here you already did upon getting your device)";
                    agreeBtn.style.background = '#ff1493';
                }
            }
        }, { passive: false });

        
let typed = '';
document.addEventListener('keydown', (e) => {
    if (/^[a-zA-Z]$/.test(e.key)) {
        typed += e.key.toLowerCase();
        if (typed.length > 7) typed = typed.slice(-7);
        if (typed.includes('iagree')) {
            const modal = document.getElementById('fairuse-modal');
            if (modal) modal.remove();
        }
    } else if (e.key === 'Backspace') {
        typed = typed.slice(0, -1);
    } else if (e.key === 'Escape' || e.key === 'Enter') {
        typed = '';
    }
});

let easterTyped = '';
document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (/^[0-9]$/.test(key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        easterTyped += key;
        if (easterTyped.length > 2) easterTyped = easterTyped.slice(-2);
        if (easterTyped === '67') {
            window.location.href = 'https://www.google.com/search?q=67+ways+to+touch+grass&udm=2';
        }
    } else if (e.key === 'Backspace') {
        easterTyped = easterTyped.slice(0, -1);
    } else {
        easterTyped = '';
    }
});
        
        

        
        agreeBtn.addEventListener('click', () => {
            if (!agreeBtn.disabled) {
                const modal = document.getElementById('fairuse-modal');
                if (modal) modal.remove();
            }
        });

        
        setTimeout(() => {
            scrollBox.focus();
            scrollBox.tabIndex = -1;  
        }, 300);

        
        setTimeout(() => {
            const nearBottom = scrollBox.scrollHeight - scrollBox.scrollTop - scrollBox.clientHeight < 150;
            if (nearBottom) {
                agreeBtn.disabled = false;
                agreeBtn.textContent = "I Agree (Even if you don't here you already did upon getting your device)";
                agreeBtn.style.background = '#ff1493';
            }
        }, 800);
    } else {
        
        setTimeout(attachListeners, 300);
    }
};

setTimeout(attachListeners, 500);

        
        const preventUnload = (e) => {
            e.preventDefault();
            e.returnValue = "You haven't finished reading the policy 💕";
        };
        window.addEventListener('beforeunload', preventUnload);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
                e.preventDefault();
                alert("No refreshing until you finish reading🌸");
            }
        });
// Block spacebar from scrolling
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
    }
}, { passive: false });
        document.addEventListener('contextmenu', e => e.preventDefault());

        
        let attempts = 0;
        const protect = setInterval(() => {
            if (attempts++ > 20) clearInterval(protect);
            if (!document.body || !document.body.innerHTML.includes(headline)) {
                document.documentElement.innerHTML = html;
                setTimeout(attachListeners, 500);
                window.addEventListener('beforeunload', preventUnload);
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
                        e.preventDefault();
                        alert("No refreshing until you finish reading 🌸");
                    }
                });
                document.addEventListener('contextmenu', e => e.preventDefault());
            }
        }, 1500);
    }

    

const seenTitles = new Set();

(function captureInitialHtmlTitle() {
    const t = document.querySelector("title");
    if (t && t.textContent?.trim()) {
        seenTitles.add(t.textContent.toLowerCase());
    }
})();

(function hookTitle() {
    let _title = document.title || "";

    try {
        Object.defineProperty(document, "title", {
            configurable: true,
            get() {
                return _title;
            },
            set(value) {
                if (typeof value === "string" && value.trim()) {
                    seenTitles.add(value.toLowerCase());
                }
                _title = value;
            }
        });
    } catch (e) {
    }
})();

new MutationObserver(() => {
    const t = document.querySelector("title");
    if (t?.textContent?.trim()) {
        seenTitles.add(t.textContent.toLowerCase());
    }
}).observe(document.documentElement, {
    childList: true,
    subtree: true
});


    function totalNukeProxy() {
    // 1. MASTER OVERRIDES
    if (NUKED || !enableProxyDetection) return;
    if (isExempt()) {
        if (!hasLoggedExempt) {
            logger.info(`Exempted site: ${location.href}`);
            hasLoggedExempt = true;
        }
        return;
    }
    const hostname = window.location.hostname.toLowerCase();

    const allBannedPatterns = [
        ...(extraBannedPatterns || []),
    ];

    if (
        Array.isArray(allBannedPatterns) &&
        allBannedPatterns.some(pattern =>
            matchesPattern(hostname, pattern)
        )
    ) {
        enforceBlock(
            "default",
            "Blocked by Admin Policy",
            `Matched banned pattern`,
            "Policy Engine"
        );
        return;
    }
    const htmlLower = document.documentElement.innerHTML.toLowerCase();
    const currentUrl = window.location.href.toLowerCase();

    // 2. BEHAVIORAL CHECK: Native fetch/XHR hijack detection
    try {
        const fetchStr = window.fetch?.toString() || '';
        const xhrOpenStr = window.XMLHttpRequest?.prototype?.open?.toString() || '';

        const isFetchHijacked = fetchStr && fetchStr.indexOf('[native code]') === -1;
        const isXHRHijacked = xhrOpenStr && xhrOpenStr.indexOf('[native code]') === -1;

        if (isFetchHijacked || isXHRHijacked) {
            const hasProxyClue = (
                htmlLower.includes("epoxy") || 
                htmlLower.includes("bare-mux") || 
                htmlLower.includes("transport") ||
                htmlLower.includes("libcurl") ||
                htmlLower.includes("scramjet") ||
                htmlLower.includes("wisp") ||
                htmlLower.includes("unblocked") ||
                htmlLower.includes("holyunblocker") ||
                htmlLower.includes("interstellar") ||
                window.__uv || window.__sj || window.ruggedConfig || 
                window.EpoxyTransport || window.BareMux || window.CurlTransport
            );

            if (hasProxyClue) {
                enforceBlock(
                    "proxy",
                    "Network Transport Hijacked",
                    "Modified native fetch/XHR detected alongside proxy signatures.",
                    "Behavioral Analysis"
                );
                return; 
            }
        }
    } catch (e) {
        // Silent fail if browser restricts .toString() access
    }

    // 3. CloudFront & Scramjet landing page check
    if (currentUrl.includes("cloudfront.net") && 
        (
            htmlLower.includes("thepeople.help") ||
            htmlLower.includes("featurecontrol.acshash") ||
            htmlLower.includes("nobodycares-not-my-alt/fonts/ghost.png") ||
            htmlLower.includes("vpn-modal") ||
            htmlLower.includes("connected to us-east-1") ||
            htmlLower.includes("scramjet client") ||
            htmlLower.includes("scramjet.wasm") ||
            htmlLower.includes("singletonbox") ||
            htmlLower.includes("bare-mux/worker") ||
            typeof window.$scramjetLoadController === 'function' ||
            window.__bareMux ||
            window.BareMuxConnection
        )) 
    {
        enforceBlock(
            "proxy",
            "CloudFront/Scramjet/Ghost proxy landing page",
            "Matched known proxy loader signatures",
            "Proxy Landing"
        );
        return;
    }

    // 4. Engine Global Check
    if (window.__uv || window.__sj || window.Rammerhead || 
        window.Epoxy || window.EpoxyTransport || window.WispClient || window.CurlTransport ||
        window.__bareMux || window.BareMuxConnection || window.BareMux ||
        window.holyUnblocker || window.interstellar || window.dogeUnblocker) {
        enforceBlock(
            "proxy", 
            "Proxy Engine Detected", 
            "Active proxy circumvention engine globals found.", 
            "Engine Match"
        );
        return;
    }

    // 5. About:Blank Cloaking Check
    if (window.location.href === "about:blank" && window.opener) {
        enforceBlock(
            "proxy", 
            "Cloaked Session", 
            "Detected proxy launch via about:blank cloaking.", 
            "Anti-Cloak"
        );
        return;
    }

    // Expanded hasProxyEngine checks
    const hasProxyEngine = 
        // Scramjet
        (
            (typeof window.$scramjetLoadController === 'function' ||
             typeof window.$scramjetRequire === 'function' ||
             (window.$scramjetVersion && typeof window.$scramjetVersion === 'object')) &&
            (
                htmlLower.includes("scramjetserviceworkerruntime") ||
                htmlLower.includes("scramjetcontextevent") ||
                htmlLower.includes("scramjetframe") ||
                htmlLower.includes("$scramjetloadclient") ||
                htmlLower.includes("$scramjetloadworker")
            )
        ) ||
        htmlLower.includes("scramjet.wasm") ||
        htmlLower.includes("scramjet.all.js") ||
        htmlLower.includes("scramjet.sync.js") ||
        htmlLower.includes("/jetty.all.js") ||
        htmlLower.includes("/jetty.sync.js") ||
        htmlLower.includes("/jetty.wasm") ||

        // BareMux & Wisp
        window.__bareMux ||
        window.BareMuxConnection ||
        window.BareMux ||
        window.BareClient ||
        typeof window.BareMux?.BareClient === 'function' ||
        htmlLower.includes("/baremux/index.js") ||
        htmlLower.includes("bare-mux: running") ||
        htmlLower.includes("bare-mux-worker") ||
        htmlLower.includes("wisp-server") ||

        // Ultraviolet
        window.__uv ||
        window.__uv$config ||
        typeof window.Ultraviolet === 'function' ||
        htmlLower.includes("/uv/uv.bundle.js") ||
        htmlLower.includes("/uv/uv.config.js") ||
        htmlLower.includes("uv-address") ||
        htmlLower.includes("uv-form") ||
        htmlLower.includes("uv-search-engine") ||
        htmlLower.includes("/assets/js/foxy.js") ||
        window.Rammerhead ||
        window.WispClient ||

        // Libcurl & Transports
        htmlLower.includes("libcurl-transport") ||
        htmlLower.includes("curltransport") ||
        htmlLower.includes("libcurl.js") ||
        htmlLower.includes("proxy-transports") ||
        htmlLower.includes("proxy-transport") ||
        window.CurlTransport ||
        typeof window.CurlTransport === 'function' ||

        // Epoxy & Infamous SJ
        (
            htmlLower.includes("epoxy") ||
            htmlLower.includes("epoxytransport") ||
            htmlLower.includes("epoxy/index.mjs") ||
            htmlLower.includes("@mercuryworkshop/epoxy") ||
            htmlLower.includes("@mercuryworkshop/epoxy-transport") ||
            htmlLower.includes("sj mode") ||                
            htmlLower.includes("infamous v") ||             
            htmlLower.includes("infamous dashboard") ||
            htmlLower.includes("infamous-network") ||

            window.Epoxy ||
            window.EpoxyTransport ||
            typeof window.Epoxy === 'function' ||
            typeof window.EpoxyTransport === 'function' ||

            document.querySelector('script[src*="epoxy"]') ||
            document.querySelector('script[src*="epoxy-transport"]') ||
            document.querySelector('script[src*="mercuryworkshop"]') ||
            document.querySelector('link[href*="epoxy"]') ||

            (navigator.serviceWorker?.controller?.scriptURL && 
             (navigator.serviceWorker.controller.scriptURL.includes("epoxy") ||
              navigator.serviceWorker.controller.scriptURL.includes("transport") ||
              navigator.serviceWorker.controller.scriptURL.includes("libcurl")))
        ) ||

        // Unblockers Meta
        (
            htmlLower.includes("holyunblocker") ||
            htmlLower.includes("holy-unblocker") ||
            htmlLower.includes("interstellar") ||
            htmlLower.includes("dogeunblocker") ||
            htmlLower.includes("monkeunblocker") ||
            htmlLower.includes("spaceunblocker") ||
            htmlLower.includes("proxy dashboard") ||
            htmlLower.includes("unblocked games") ||
            htmlLower.includes("school unblocker") ||
            htmlLower.includes("holyunblocker.org") ||
            htmlLower.includes("interstellar.unblock") ||
            htmlLower.includes("unblocker.lol")
        );

    if (!hasProxyEngine) return;

    // Label mapping
    let detected = "unknown proxy engine";
    if (htmlLower.includes("libcurl") || window.CurlTransport) {
        detected = "Libcurl Transport";
    } else if (htmlLower.includes("epoxy") || window.Epoxy || window.EpoxyTransport) {
        detected = "Epoxy Transport";
    } else if (htmlLower.includes("sj mode") || htmlLower.includes("infamous")) {
        detected = "Infamous Epoxy SJ";
    } else if (window.__bareMux || htmlLower.includes("bare-mux")) {
        detected = "BareMux";
    } else if (window.__uv) {
        detected = "Ultraviolet";
    } else if (window.Rammerhead) {
        detected = "Rammerhead";
    } else if (htmlLower.includes("scramjet") || window.$scramjetLoadController) {
        detected = "Scramjet";
    } else if (htmlLower.includes("holyunblocker") || htmlLower.includes("holy-unblocker")) {
        detected = "Holy Unblocker";
    } else if (htmlLower.includes("interstellar")) {
        detected = "Interstellar Unblocker";
    } else if (htmlLower.includes("dogeunblocker") || htmlLower.includes("monkeunblocker")) {
        detected = "Doge/Monke Unblocker";
    }

    enforceBlock(
        "proxy",
        "Advanced Proxy Detected",
        `${detected} circumvention toolkit signatures found`,
        "Proxy Engine"
    );
}

// === DOM Mutation Observers ===
if (!isExempt()) {
    const observer = new MutationObserver(() => {
        if (NUKED || isChecking || isExempt()) return;
        isChecking = true;
        try {
            totalNukeProxy();
        } finally {
            setTimeout(() => { isChecking = false; }, 50);
        }
    });

    if (document.head) observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
}

if (!isExempt()) {
    const nukeObserver = new MutationObserver((mutations) => {
        if (!NUKED) return;
        const isOverlayRemoved = mutations.some(m =>
            Array.from(m.removedNodes).some(node =>
                node.id === "overlay" || (node.classList && node.classList.contains('overlay'))
            )
        );
        if (isOverlayRemoved) location.reload();
    });

    nukeObserver.observe(document.documentElement, { childList: true, subtree: true });
}


// ======================================================
// EASTER EGG
// ======================================================
function runEasterEgg(customText = "BANISHED!", customImageUrl = "") {
    if (document.documentElement.dataset.banishedRgb === "1") return;
    document.documentElement.dataset.banishedRgb = "1";

    const HARDCODED_TEXT = customText || "BANISHED!";
    const TARGET_IMAGE_URL = customImageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGroHW8EnS4DOb4k6pb_ZpZj-KLVp4G2y5wiZSe4t6gg&s=10";

    // ===== CSS =====
    const style = document.createElement("style");
    style.id = "rgb-party-mode-style";
    style.textContent = `
        @keyframes rgbSpectrumCycle {
            0%   { filter: hue-rotate(0deg) saturate(1.7) brightness(1.05); }
            100% { filter: hue-rotate(360deg) saturate(1.7) brightness(1.05); }
        }
        @keyframes gentleSway {
            0%   { transform: rotate(0deg) scale(1); }
            25%  { transform: rotate(2.5deg) scale(1.02); }
            50%  { transform: rotate(0deg) scale(1); }
            75%  { transform: rotate(-2.5deg) scale(1.02); }
            100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes softRainbowText {
            0%   { color: #ff6b6b; text-shadow: 0 0 8px rgba(255, 107, 107, 0.4); }
            25%  { color: #feca57; text-shadow: 0 0 8px rgba(254, 202, 87, 0.4); }
            50%  { color: #48dbfb; text-shadow: 0 0 8px rgba(72, 219, 251, 0.4); }
            75%  { color: #ff9ff3; text-shadow: 0 0 8px rgba(255, 159, 243, 0.4); }
            100% { color: #ff6b6b; text-shadow: 0 0 8px rgba(255, 107, 107, 0.4); }
        }
        @keyframes floaty {
            0%, 100% { transform: translateY(0px); }
            50%      { transform: translateY(-6px); }
        }
        @keyframes popIn {
            0%   { transform: scale(0.3); opacity: 0; }
            70%  { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes explode {
            0%   { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
            40%  { transform: scale(1.7) rotate(12deg); opacity: 1; filter: brightness(1.8); }
            100% { transform: scale(2.6) rotate(-20deg); opacity: 0; filter: brightness(2.5); }
        }
        @keyframes particleFly {
            0%   { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }

        html {
            animation: rgbSpectrumCycle 5s linear infinite, gentleSway 4s ease-in-out infinite !important;
            transform-origin: center center;
        }
        h1, h2, h3, h4, h5, h6 {
            animation: softRainbowText 6s linear infinite, floaty 2.5s ease-in-out infinite !important;
            font-weight: 800 !important;
            letter-spacing: 1.5px !important;
        }
        p, span, a, li, td, th, div, button, label {
            animation: softRainbowText 7s linear infinite !important;
        }
        .banished-orb {
            position: fixed;
            z-index: 2147483646;
            padding: 14px 22px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            font-family: system-ui, sans-serif;
            font-weight: 800;
            font-size: 18px;
            cursor: crosshair;
            user-select: none;
            pointer-events: auto;
            animation: popIn 0.35s ease-out forwards;
            border: 3px solid #ff69b4;
            box-shadow: 0 0 22px rgba(255, 105, 180, 0.65);
            white-space: nowrap;
        }
        .shape-pill     { border-radius: 999px; }
        .shape-box      { border-radius: 8px; }
        .shape-diamond  { border-radius: 6px; transform: rotate(45deg); }
        .shape-diamond span { display: inline-block; transform: rotate(-45deg); }
        .shape-skew     { border-radius: 6px; transform: skewX(-12deg); }
        .shape-skew span { display: inline-block; transform: skewX(12deg); }
        .shape-blob     { border-radius: 40% 60% 50% 50% / 50% 40% 60% 50%; }
        .banished-particle {
            position: fixed;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 2147483647;
            animation: particleFly 0.7s ease-out forwards;
            box-shadow: 0 0 8px currentColor;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // ===== REPLACE TEXT =====
    const walker = document.createTreeWalker(
        document.body || document.documentElement,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                const parent = node.parentElement?.tagName?.toLowerCase();
                if (["script", "style", "noscript", "textarea", "input"].includes(parent)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
        }
    );
    let node;
    while ((node = walker.nextNode())) {
        node.nodeValue = HARDCODED_TEXT;
    }

    // ===== REPLACE IMAGES =====
    document.querySelectorAll("img").forEach((img) => {
        img.src = TARGET_IMAGE_URL;
        img.srcset = TARGET_IMAGE_URL;
    });
    document.querySelectorAll("picture source").forEach((source) => {
        source.srcset = TARGET_IMAGE_URL;
    });
    document.querySelectorAll("*").forEach((el) => {
        const bg = window.getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none" && bg.includes("url(")) {
            el.style.backgroundImage = `url("${TARGET_IMAGE_URL}")`;
        }
    });

    // ===== BOUNCING MINI-GAME (limited) =====
const phrases = ["BANISHED!", "OPE", "TOUCH GRASS", "KEEP IT REAL", "Smitty Werbenjägermanjensen he was #1."];
const shapes = ["shape-pill", "shape-box", "shape-blob"];
let activeOrbs = 0;
const MAX_ORBS = 6;          // hard limit
const SPAWN_REPLACEMENTS = 1; // only spawn 1 new one when one is destroyed

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {   // fewer particles
        const p = document.createElement("div");
        p.className = "banished-particle";
        p.style.left = x + "px";
        p.style.top = y + "px";
        p.style.background = color;
        p.style.color = color;
        if (Math.random() > 0.6) p.style.borderRadius = "2px";

        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 70;
        p.style.setProperty("--tx", Math.cos(angle) * distance + "px");
        p.style.setProperty("--ty", Math.sin(angle) * distance + "px");
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 700);
    }
}

function spawnOrb() {
    if (activeOrbs >= MAX_ORBS) return;
    activeOrbs++;

    const orb = document.createElement("div");
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    orb.className = "banished-orb " + shape;

    const span = document.createElement("span");
    span.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    orb.appendChild(span);

    let x = 50 + Math.random() * (window.innerWidth - 150);
    let y = 50 + Math.random() * (window.innerHeight - 80);
    let vx = (Math.random() * 2.2 + 1.0) * (Math.random() < 0.5 ? 1 : -1);
    let vy = (Math.random() * 2.2 + 1.0) * (Math.random() < 0.5 ? 1 : -1);

    orb.style.left = x + "px";
    orb.style.top = y + "px";

    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 90%, 65%)`;
    orb.style.borderColor = color;
    orb.style.boxShadow = `0 0 18px ${color}`;

    const move = () => {
        if (!orb.isConnected) return;
        x += vx;
        y += vy;
        const rect = orb.getBoundingClientRect();
        const w = rect.width || 120;
        const h = rect.height || 40;

        if (x <= 0) { x = 0; vx = Math.abs(vx); }
        if (x + w >= window.innerWidth) { x = window.innerWidth - w; vx = -Math.abs(vx); }
        if (y <= 0) { y = 0; vy = Math.abs(vy); }
        if (y + h >= window.innerHeight) { y = window.innerHeight - h; vy = -Math.abs(vy); }

        orb.style.left = x + "px";
        orb.style.top = y + "px";
        requestAnimationFrame(move);
    };
    requestAnimationFrame(move);

    orb.addEventListener("mouseenter", () => {
        const rect = orb.getBoundingClientRect();
        createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
        orb.style.animation = "explode 0.35s ease-out forwards";
        orb.style.pointerEvents = "none";

        setTimeout(() => {
            orb.remove();
            activeOrbs--;
            // Only spawn replacements if under the limit
            for (let i = 0; i < SPAWN_REPLACEMENTS; i++) {
                setTimeout(spawnOrb, 200 + i * 150);
            }
        }, 340);
    });

    document.body.appendChild(orb);
}

// Start with only a few
spawnOrb();
setTimeout(spawnOrb, 500);
setTimeout(spawnOrb, 1000);
}

})();
