(function () {
    if (window.NUKED === true) return;
//  yt exemption for console hunter
const hostname = window.location.hostname.toLowerCase().trim();
if (hostname.includes('youtube.com') || 
    hostname.includes('youtu.be')) {
    
    console.log(`[MAIN] 🚪 Hard exit - YouTube/Google detected on ${hostname}`);
    return;                    
}
    // =======================
    // GLOBALS & CONFIG
    // =======================
    let exemptDomains = [];
    let isExemptCached = false;
    let configLoaded = false;

    let slopConfig = {
        enabled: true,
        patterns: [],
        replacement: "Please do something productive instead",
        antiAICopyEnabled: true,
        enableProxyDetection: true, 
        enableConsoleDetection: true, 
        aiBlockedDomains: [
            "chatgpt.com", "openai.com", "gemini.google.com", "claude.ai",
            "grok.com", "perplexity.ai", "copilot.microsoft.com"
        ]
    };

    // Proxy detection helpers 
    const isFetchHijacked = window.fetch?.toString && window.fetch.toString().indexOf('[native code]') === -1;
    const isXHRHijacked = window.XMLHttpRequest?.prototype?.open?.toString && window.XMLHttpRequest.prototype.open.toString().indexOf('[native code]') === -1;
    // Proxy Regex 
    const BANNED_PATTERNS = [
        /proxy/i, /unblocker/i, /holyunblocker/i, /holy-unblocker/i,
        /interstellar/i, /dogeunblocker/i, /monkeunblocker/i, /epoxy/i,
        /bare-mux/i, /scramjet/i, /wisp/i, /uv\./i, /rammerhead/i,
        /infamous/i, /mercuryworkshop/i
    ];
// Anti game/proxy html copy pasta
const viewerLaunchSignatures = [
    "about:blank", "about:srcdoc", "about:src",
    "window.open('about:blank'", "window.open(\"about:blank\"",
    "location.href = 'about:blank'", "location = 'about:blank'",
    "data:text/html", "document.open()", "document.write(",
    "iframe srcdoc=", "<iframe srcdoc=", "blob:", "URL.createObjectURL",
    "atob('", "fromCharCode(", "eval(", "Function(",
    "window.open(", "open(", "_blank", "noopener", "noreferrer"
]

    // =======================
    // MATCHING ENGINE
    // =======================
    function matchesPattern(input, pattern) {
    if (!pattern || !input) return false;

    const target = String(input).toLowerCase().trim();
    const p = String(pattern).toLowerCase().trim();

    if (p === "*") return true;

    let regexString = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                       .replace(/\*/g, '.*');

    return new RegExp(regexString, 'i').test(target);
}

// =======================
// UPDATE EXEMPT STATUS (Improved)
// =======================
function updateExemptStatus() {
    isExemptCached = false;
    const hostname = window.location.hostname.toLowerCase().trim();
    const fullUrl = window.location.href.toLowerCase();

    isExemptCached = Array.isArray(exemptDomains) && exemptDomains.some(p => 
        matchesPattern(hostname, p) || matchesPattern(fullUrl, p)
    );

    // Force exempt
    if (hostname.includes('.gov')) {
        isExemptCached = true;
    }

    if (isExemptCached) {
        console.log(`[MAIN] ✅ Exempted site: ${hostname}`);
    }
}

// =======================
// CONFIG SYNC (Replace your current message listener)
window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === "ADMIN_NOTIFICATION") {
        showSlopNotification(event.data.message, 'ai');
    }
    if (event.data.type === "UPDATE_SLOP_CONFIG") {
        console.log("[MAIN]  Fresh policy received");

        exemptDomains = Array.isArray(event.data.exemptDomains) ? [...event.data.exemptDomains] : [];
        isExemptCached = false;
        updateExemptStatus();

        if (typeof event.data.enableProxyDetection !== "undefined") 
            slopConfig.enableProxyDetection = !!event.data.enableProxyDetection;
        if (typeof event.data.enableConsoleDetection !== "undefined") 
            slopConfig.enableConsoleDetection = !!event.data.enableConsoleDetection;
        if (typeof event.data.antiAICopyEnabled !== "undefined") 
            slopConfig.antiAICopyEnabled = !!event.data.antiAICopyEnabled;
        if (typeof event.data.enableSlopClipboardReplacement !== "undefined") 
            slopConfig.enabled = !!event.data.enableSlopClipboardReplacement;
        if (typeof event.data.slopClipboardReplacement === "string") 
            slopConfig.replacement = event.data.slopClipboardReplacement;

        if (Array.isArray(event.data.aiBlockedDomains)) {
            slopConfig.aiBlockedDomains = event.data.aiBlockedDomains.map(d => String(d).toLowerCase().trim());
        }

        configLoaded = true;
        setTimeout(checkHTMLSignatures, 150);
    }

    if (event.data.action === "FORCE_POLICY_RELOAD") {
        console.log("[MAIN] FORCE_POLICY_RELOAD triggered");
        isExemptCached = false;
        updateExemptStatus();
        checkHTMLSignatures();
    }
});

// =======================
// DEFENSE HEARTBEAT SYNC LOOP
// =======================
function requestConfig() {
    window.postMessage({ type: "REQUEST_SLOP_CONFIG" }, "*");
}

// Spark bootstrap loop early
setTimeout(() => requestConfig(), 100);

// Rapid verification heartbeat
setInterval(() => {
    if (window.NUKED) return;
    
    requestConfig(); // Hits our local memory array cache immediately
    
    if (configLoaded && !isExemptCached) {
        if (typeof checkHTMLSignatures === "function") checkHTMLSignatures();
        if (typeof updateExemptStatus === "function") updateExemptStatus();
    }
}, 1500); // 1.5 seconds mitigates environment overrides efficiently

console.log("[MAIN] Heartbeat Loaded");

    // =======================
    // NUCLEAR TOAST 
    // =======================
    function showSlopNotification(message, type = 'ai') {
        if (isExemptCached) return;

        const id = 'banished-toast';
        document.querySelectorAll('#' + id).forEach(el => el.remove());

        const toast = document.createElement('div');
        toast.id = id;
        toast.textContent = message;

        Object.assign(toast.style, {
            position: 'fixed', top: '40px', right: '40px', zIndex: '2147483647',
            background: type === 'ai' ? '#4c1d95' : '#991b1b', color: 'white',
            padding: '20px 30px', borderRadius: '16px',
            fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontWeight: '700',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)', maxWidth: '380px',
            lineHeight: '1.5', border: '6px solid white',
            pointerEvents: 'none', opacity: '1', transform: 'translateY(0)'
        });

        function inject() {
            if (!document.getElementById(id)) {
                (document.body || document.documentElement).appendChild(toast.cloneNode(true));
            }
        }

        inject();
        const keepAlive = setInterval(inject, 200);

        setTimeout(() => {
            clearInterval(keepAlive);
            document.querySelectorAll('#' + id).forEach(el => {
                el.style.transition = 'opacity 0.6s';
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 700);
            });
        }, 5000);
    }

    // =======================
    // GAME SLOP / MALICIOUS PASTE DETECTION
    // =======================
    function checkForSlopPaste(e) {
        if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.enabled) return;

        let pastedText = '';
        try {
            pastedText = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
        } catch (_) {}

        if (!pastedText) return;

        const lowerText = pastedText.toLowerCase().trim();

        const isGameSlop = viewerLaunchSignatures.some(sig => 
            lowerText.includes(sig.toLowerCase())
        );

        if (isGameSlop) {
            e.preventDefault();
            e.stopImmediatePropagation();

            const replacement = slopConfig.replacement || "Please do something productive instead";
            try {
                navigator.clipboard.writeText(replacement).catch(() => {});
            } catch (_) {}

            showSlopNotification("Malicious / Game slop paste blocked 🌸", 'ai');
            console.log("[MAIN] Game slop paste blocked");
        }
    }

    // =======================
    // AI DOMAIN CHECK HELPER
    // =======================
    function isAIDomain() {
        if (!slopConfig.antiAICopyEnabled) return false;
        const hostname = window.location.hostname.toLowerCase().trim();
        return slopConfig.aiBlockedDomains && Array.isArray(slopConfig.aiBlockedDomains) &&
            slopConfig.aiBlockedDomains.some(d => 
                hostname === String(d).toLowerCase().trim() || 
                hostname.endsWith('.' + String(d).toLowerCase().trim())
            );
    }

    // =======================
    // PASTE + GAME SLOP HANDLER
    // =======================
    document.addEventListener('paste', (e) => {
        if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.antiAICopyEnabled) return;

        checkForSlopPaste(e);

        if (isAIDomain()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showSlopNotification("Pasting from this website is disabled! 🌸", 'ai');
        }
    }, true);

    // =======================
    // COPY / CUT
    // =======================
    ['copy', 'cut'].forEach(eventType => {
        document.addEventListener(eventType, (e) => {
            if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.antiAICopyEnabled) return;
            if (!isAIDomain()) return;

            e.preventDefault();
            e.stopImmediatePropagation();

            const msg = "Copying from this website is disabled. Please write in your own words or ask for help.";
            try { e.clipboardData.setData('text/plain', msg); } catch (_) {}
            showSlopNotification(msg, 'ai');
        }, true);
    });

    // =======================
    // KEYBOARD SHORTCUTS (Ctrl+C/V/X)
    // =======================
    document.addEventListener('keydown', (e) => {
        if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.antiAICopyEnabled) return;
        if (!isAIDomain()) return;

        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const msg = "Copying from this website is disabled. Please write in your own words or ask for help.";
            showSlopNotification(msg, 'ai');
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            e.stopImmediatePropagation();
            showSlopNotification("Pasting from this website is disabled! 🌸", 'ai');
        }
    }, true);

    // =======================
    // CLICK INTERCEPTOR FOR COPY BUTTONS
    // =======================
    function isCopyElement(el) {
        if (!el || !el.tagName || el === window || el === document) return false;
        
        const tag = el.tagName.toLowerCase();
        const aria = (el.getAttribute('aria-label') || '').toLowerCase();
        const title = (el.getAttribute('title') || '').toLowerCase();
        const tooltip = (el.getAttribute('data-tooltip') || '').toLowerCase();
        
        if (aria.includes('copy') || title.includes('copy') || tooltip.includes('copy')) return true;
        
        if (tag === 'button' || el.getAttribute('role') === 'button') {
            const text = (el.textContent || '').toLowerCase().trim();
            if (text.includes('copy') && text.length < 25) return true;
        }
        
        if (tag === 'svg' || tag === 'mat-icon' || tag === 'path') {
            const parent = el.closest('button, [role="button"]');
            if (parent) {
                const pAria = (parent.getAttribute('aria-label') || '').toLowerCase();
                const pText = (parent.textContent || '').toLowerCase().trim();
                if (pAria.includes('copy') || (pText.includes('copy') && pText.length < 25)) return true;
            }
        }
        return false;
    }

    ['click', 'pointerdown', 'mousedown'].forEach(eventType => {
        window.addEventListener(eventType, (e) => {
            if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.antiAICopyEnabled) return;
            if (!isAIDomain()) return;

            const path = e.composedPath ? e.composedPath() : (e.path || [e.target]);
            for (const el of path) {
                if (isCopyElement(el)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const msg = "Copying from this website is disabled. Please write in your own words or ask for help.";
                    try { navigator.clipboard.writeText(msg).catch(() => {}); } catch (_) {}
                    showSlopNotification(msg, 'ai');
                    return;
                }
            }
        }, true);
    });

    // =======================
    // BUTTON DISABLER
    // =======================
    function disableAICopyButtons() {
        if (!configLoaded || isExemptCached || !slopConfig.antiAICopyEnabled) return;
        if (!isAIDomain()) return;

        const selectors = [
            'button[aria-label*="copy" i]',
            'button[title*="copy" i]',
            '[role="button"][aria-label*="copy" i]',
            'button svg[aria-label*="copy" i]',
            '[data-testid*="copy"]',
            'button[aria-label="Copy"]',
            'button[aria-label="Copy message"]'
        ];

        document.querySelectorAll(selectors.join(',')).forEach(el => {
            if (!el) return;
            el.disabled = true;
            if (el.style) {
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.3';
                el.style.cursor = 'not-allowed';
            }
            el.title = 'Copying is disabled';
        });
    }

    const buttonObserver = new MutationObserver(disableAICopyButtons);
    buttonObserver.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('load', disableAICopyButtons);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) disableAICopyButtons(); });

    // =======================
    // SELECTION PROTECTION (fallback)
    // =======================
    function protectSelection() {
        if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.antiAICopyEnabled) return;
        if (!isAIDomain()) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const selectedText = selection.toString().trim();
        if (selectedText.length < 5) return;

        const looksLikeAI = selectedText.length > 50 || selectedText.includes('\n\n') || 
                           (/^[A-Z]/.test(selectedText) && selectedText.split(' ').length > 8);

        if (looksLikeAI) {
            const msg = "Copying from this website is disabled. Please write in your own words or ask for help.";
            try {
                selection.deleteFromDocument();
                document.execCommand('insertText', false, msg);
            } catch (err) {
                showSlopNotification(msg, 'ai');
            }
        }
    }

    document.addEventListener('copy', protectSelection, true);
    document.addEventListener('cut', protectSelection, true);
    document.addEventListener('selectionchange', () => {
        if (window.getSelection()?.toString().length > 30) {
            setTimeout(protectSelection, 50);
        }
    });
    
// =======================
// CONSOLE HUNTER - HARDENED 
// =======================
function shouldSkipConsoleCheck() {
    // 1. HARDEST WHITELIST - Check immediately (before anything else)
    const hostname = window.location.hostname.toLowerCase();
    const href = window.location.href.toLowerCase();
    
    if (hostname.includes('.gov')) {
        return true;
    }

    // 2. Race condition protection
    if (!configLoaded) return true;

    // 3. Normal policy checks
    if (window.NUKED) return true;
    if (!slopConfig.enableConsoleDetection) return true;
    if (isExemptCached) return true;
    
    return false;
}

// =======================
// INSTALL CONSOLE HOOKS
// =======================
if (slopConfig.enableConsoleDetection) {
    ['log', 'warn', 'error', 'info'].forEach(method => {
        const original = console[method];
        
        console[method] = function (...args) {
            // Strong check on EVERY console call
            if (shouldSkipConsoleCheck()) {
                return original.apply(this, args);
            }

            try {
                const msg = String(args.join(" ")).toLowerCase();
                
                if (BANNED_PATTERNS.some(p => p.test(msg))) {
                    console.info("[MAIN] Console pattern matched (but skipping block):", msg.substring(0, 100));
                    
                    // Only trigger actual block if proxy detection is also enabled
                    if (slopConfig.enableProxyDetection) {
                        window.postMessage({ 
                            action: "triggerBlock", 
                            type: "proxy", 
                            reason: "Console signature detected" 
                        }, "*");
                    }
                }
            } catch (e) {}

            return original.apply(this, args);
        };
    });
    
    console.log("[MAIN] Console hunter installed (with whitelist protection)");
} else {
    console.log("[MAIN] ✅ Console detection is DISABLED by admin policy");
}

// =======================
// HTML & PROXY SCANNER
// =======================
function checkHTMLSignatures() {
    if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.enableProxyDetection) return;

    // === LIMIT SIZE FOR PERFORMANCE ===
    const html = document.documentElement.outerHTML
        .slice(0, 250000)
        .toLowerCase();

    // === SEPARATE SCRIPT SCANNING ===
    const scriptContent = Array.from(document.scripts)
        .map(s => (s.src || '') + " " + (s.textContent || ''))
        .join(' ')
        .toLowerCase();

    // Standardized helper to trigger block events uniformly
    const trigger = (reason) => {
        console.log("[MAIN] BLOCK TRIGGER:", reason);
        window.postMessage({
            action: "triggerBlock",
            type: "proxy",
            reason: reason
        }, "*");
    };

    // === DIRECT FILE / STRING SIGNATURES ===
    if (html.includes("uv.bundle.js") || scriptContent.includes("uv.bundle.js")) {
        return trigger("HTML/script signature: uv.bundle.js");
    }

    if (html.includes("bare-mux") || scriptContent.includes("bare-mux")) {
        return trigger("HTML/script signature: bare-mux");
    }

    if (html.includes("scramjetserviceworker") || scriptContent.includes("scramjetserviceworker") ||
        html.includes("scramjet.wasm") || scriptContent.includes("scramjet.wasm") ||
        html.includes("scramjet.all.js") || scriptContent.includes("scramjet.all.js") ||
        html.includes("scramjet.sync.js") || scriptContent.includes("scramjet.sync.js")) {
        return trigger("HTML/script signature: Scramjet");
    }

    if (html.includes("libcurl-transport") || scriptContent.includes("libcurl-transport") ||
        html.includes("curltransport") || scriptContent.includes("curltransport") ||
        html.includes("libcurl.js") || scriptContent.includes("libcurl.js")) {
        return trigger("HTML/script signature: libcurl-transport");
    }

    if (html.includes("proxy-transports") || scriptContent.includes("proxy-transports") ||
        html.includes("proxy-transport") || scriptContent.includes("proxy-transport")) {
        return trigger("HTML/script signature: proxy-transports");
    }

    if (html.includes("epoxy-transport") || scriptContent.includes("epoxy-transport") ||
        html.includes("epoxy/index.mjs") || scriptContent.includes("epoxy/index.mjs") ||
        html.includes("@mercuryworkshop/epoxy") || scriptContent.includes("@mercuryworkshop/epoxy")) {
        return trigger("HTML/script signature: epoxy-transport");
    }

    // === GLOBAL OBJECT CHECKS ===
    if (window.__uv || window.__uv$config || typeof window.Ultraviolet === "function") {
        return trigger("Global: Ultraviolet");
    }
    if (window.__bareMux || window.BareMuxConnection || window.BareMux) {
        return trigger("Global: BareMux");
    }
    if (window.$scramjetLoadController || window.$scramjetRequire || window.$scramjetVersion) {
        return trigger("Global: Scramjet");
    }
    if (window.Epoxy || window.EpoxyTransport || typeof window.EpoxyTransport === "function") {
        return trigger("Global: Epoxy");
    }
    if (window.CurlTransport || typeof window.CurlTransport === "function") {
        return trigger("Global: CurlTransport");
    }
    if (window.Rammerhead || window.WispClient) {
        return trigger("Global: Rammerhead/Wisp");
    }

    // === AGGRESSIVE GENERIC DETECTION ===
    const swUrl = navigator.serviceWorker?.controller?.scriptURL || "";
    const hasServiceWorkerProxy = swUrl &&
        /\/(sw|worker|proxy|unblock|scram|epoxy|bare|jetty|uv|libcurl|transport)\//i.test(swUrl);

    const hasHijackedNetwork = (isFetchHijacked || isXHRHijacked) &&
        (html.includes("transport") || html.includes("wisp") || html.includes("bare") ||
         html.includes("proxy") || html.includes("scramjet") || html.includes("libcurl"));

    const hasObfuscatedLoader =
        html.includes("loadcontroller") ||
        html.includes("loadworker") ||
        html.includes("initproxy") ||
        html.includes("startproxy") ||
        scriptContent.includes("loadcontroller") ||
        scriptContent.includes("loadworker");

    const hasCommonForkCombo =
        (html.includes("scramjet") && html.includes("client")) ||
        (html.includes("epoxy") && html.includes("transport")) ||
        (html.includes("bare-mux") && html.includes("worker")) ||
        (html.includes("libcurl") && html.includes("transport")) ||
        (html.includes("proxy-transport") && html.includes("wisp")) ||
        (scriptContent.includes("scramjet") && scriptContent.includes("client")) ||
        (scriptContent.includes("epoxy") && scriptContent.includes("transport")) ||
        (scriptContent.includes("libcurl") && scriptContent.includes("transport"));

    if (hasServiceWorkerProxy && hasHijackedNetwork) {
        return trigger("Service Worker + Network Hijack");
    }

    if (hasObfuscatedLoader && (hasHijackedNetwork || hasCommonForkCombo)) {
        return trigger("Obfuscated loader + proxy signals");
    }

    if (hasCommonForkCombo) {
        return trigger("Common fork signature (scramjet/epoxy/bare-mux/libcurl)");
    }

    if (hasServiceWorkerProxy && (html.includes("unblock") || scriptContent.includes("unblock"))) {
        return trigger("Service Worker + unblock keyword");
    }
}

    // =======================
    // BFCACHE PROTECTION
    // =======================
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.postMessage({ action: "RECHECK_ALL" }, "*");
            window.postMessage({ type: "REQUEST_SLOP_CONFIG" }, "*");
        }
    });

    
    

    // Also run when selection changes (catches right-click copy)
    document.addEventListener('selectionchange', () => {
        if (window.getSelection()?.toString().length > 30) {
            setTimeout(protectSelection, 50);
        }
    });
})();
