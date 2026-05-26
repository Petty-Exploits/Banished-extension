(function () {
    if (window.NUKED === true) return;

const hostname = window.location.hostname.toLowerCase().trim();
if (hostname.includes('youtube.com') || 
    hostname.includes('youtu.be')) {
    
    console.log(`[MAIN] 🚪 Hard exit - YouTube/Google detected on ${hostname}`);
    return;                    
}



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

    const isFetchHijacked = window.fetch?.toString && window.fetch.toString().indexOf('[native code]') === -1;
    const isXHRHijacked = window.XMLHttpRequest?.prototype?.open?.toString && window.XMLHttpRequest.prototype.open.toString().indexOf('[native code]') === -1;

    const BANNED_PATTERNS = [
        /proxy/i, /unblocker/i, /holyunblocker/i, /holy-unblocker/i,
        /interstellar/i, /dogeunblocker/i, /monkeunblocker/i, /epoxy/i,
        /bare-mux/i, /scramjet/i, /wisp/i, /uv\./i, /rammerhead/i,
        /infamous/i, /mercuryworkshop/i
    ];

const viewerLaunchSignatures = [
    "about:blank", "about:srcdoc", "about:src",
    "window.open('about:blank'", "window.open(\"about:blank\"",
    "location.href = 'about:blank'", "location = 'about:blank'",
    "data:text/html", "document.open()", "document.write(",
    "iframe srcdoc=", "<iframe srcdoc=", "blob:", "URL.createObjectURL",
    "atob('", "fromCharCode(", "eval(", "Function(",
    "window.open(", "open(", "_blank", "noopener", "noreferrer"
]



    function matchesPattern(input, pattern) {
    if (!pattern || !input) return false;

    const target = String(input).toLowerCase().trim();
    const p = String(pattern).toLowerCase().trim();

    if (p === "*") return true;

    let regexString = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                       .replace(/\*/g, '.*');

    return new RegExp(regexString, 'i').test(target);
}



function updateExemptStatus() {
    isExemptCached = false;
    const hostname = window.location.hostname.toLowerCase().trim();
    const fullUrl = window.location.href.toLowerCase();

    isExemptCached = Array.isArray(exemptDomains) && exemptDomains.some(p => 
        matchesPattern(hostname, p) || matchesPattern(fullUrl, p)
    );

    if (hostname.includes('.gov')) {
        isExemptCached = true;
    }

    if (isExemptCached) {
        console.log(`[MAIN] ✅ Exempted site: ${hostname}`);
    }
}


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



function requestConfig() {
    window.postMessage({ type: "REQUEST_SLOP_CONFIG" }, "*");
}

setTimeout(() => requestConfig(), 100);

setInterval(() => {
    if (window.NUKED) return;
    
    requestConfig(); // Hits our local memory array cache immediately
    
    if (configLoaded && !isExemptCached) {
        if (typeof checkHTMLSignatures === "function") checkHTMLSignatures();
        if (typeof updateExemptStatus === "function") updateExemptStatus();
    }
}, 1500); // 1.5 seconds mitigates environment overrides efficiently

console.log("[MAIN] Heartbeat Loaded");



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



    function isAIDomain() {
        if (!slopConfig.antiAICopyEnabled) return false;
        const hostname = window.location.hostname.toLowerCase().trim();
        return slopConfig.aiBlockedDomains && Array.isArray(slopConfig.aiBlockedDomains) &&
            slopConfig.aiBlockedDomains.some(d => 
                hostname === String(d).toLowerCase().trim() || 
                hostname.endsWith('.' + String(d).toLowerCase().trim())
            );
    }



    document.addEventListener('paste', (e) => {
        if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.antiAICopyEnabled) return;

        checkForSlopPaste(e);

        if (isAIDomain()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showSlopNotification("Pasting from this website is disabled! 🌸", 'ai');
        }
    }, true);



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
    

function shouldSkipConsoleCheck() {
    const hostname = window.location.hostname.toLowerCase();
    const href = window.location.href.toLowerCase();
    
    if (hostname.includes('.gov')) {
        return true;
    }

    if (!configLoaded) return true;

    if (window.NUKED) return true;
    if (!slopConfig.enableConsoleDetection) return true;
    if (isExemptCached) return true;
    
    return false;
}


if (slopConfig.enableConsoleDetection) {
    ['log', 'warn', 'error', 'info'].forEach(method => {
        const original = console[method];
        
        console[method] = function (...args) {
            if (shouldSkipConsoleCheck()) {
                return original.apply(this, args);
            }

            try {
                const msg = String(args.join(" ")).toLowerCase();
                
                if (BANNED_PATTERNS.some(p => p.test(msg))) {
                    console.info("[MAIN] Console pattern matched (but skipping block):", msg.substring(0, 100));
                    
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


function checkHTMLSignatures() {
    if (!configLoaded || isExemptCached || window.NUKED || !slopConfig.enableProxyDetection) return;

    const html = document.documentElement.outerHTML
        .slice(0, 250000)           // Limit to first ~250KB
        .toLowerCase();

    const scriptContent = Array.from(document.scripts)
        .map(s => (s.src || '') + " " + (s.textContent || ''))
        .join(' ')
        .toLowerCase();

    if (html.includes("uv.bundle.js") || scriptContent.includes("uv.bundle.js")) {
        console.log("[MAIN] BLOCK TRIGGER: uv.bundle.js signature");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "HTML/script signature: uv.bundle.js" }, "*");
        return;
    }

    if (html.includes("bare-mux") || scriptContent.includes("bare-mux")) {
        console.log("[MAIN] BLOCK TRIGGER: bare-mux signature");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "HTML/script signature: bare-mux" }, "*");
        return;
    }

    if (html.includes("scramjetserviceworker") || scriptContent.includes("scramjetserviceworker")) {
        console.log("[MAIN] BLOCK TRIGGER: scramjetserviceworker signature");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "HTML/script signature: scramjetserviceworker" }, "*");
        return;
    }

    if (window.__uv) {
        console.log("[MAIN] BLOCK TRIGGER: window.__uv global");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "Global: window.__uv" }, "*");
        return;
    }
    if (window.__bareMux) {
        console.log("[MAIN] BLOCK TRIGGER: window.__bareMux global");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "Global: window.__bareMux" }, "*");
        return;
    }
    if (window.BareMuxConnection) {
        console.log("[MAIN] BLOCK TRIGGER: window.BareMuxConnection global");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "Global: BareMuxConnection" }, "*");
        return;
    }
    if (window.$scramjetLoadController) {
        console.log("[MAIN] BLOCK TRIGGER: window.$scramjetLoadController global");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "Global: $scramjetLoadController" }, "*");
        return;
    }

    const hasServiceWorkerProxy = navigator.serviceWorker?.controller?.scriptURL && 
        /\/(sw|worker|proxy|unblock|scram|epoxy|bare|jetty|uv) 
    const hasHijackedNetwork = (isFetchHijacked || isXHRHijacked) && 
        (html.includes("transport") || html.includes("wisp") || html.includes("bare") || html.includes("proxy"));

    const hasObfuscatedLoader = html.includes("loadcontroller") || 
        html.includes("loadworker") || 
        html.includes("initproxy") || 
        html.includes("startproxy") ||
        scriptContent.includes("loadcontroller") ||
        scriptContent.includes("loadworker");

    const hasCommonForkCombo = 
        (html.includes("scramjet") && html.includes("client")) ||
        (html.includes("epoxy") && html.includes("transport")) ||
        (html.includes("bare-mux") && html.includes("worker")) ||
        (scriptContent.includes("scramjet") && scriptContent.includes("client")) ||
        (scriptContent.includes("epoxy") && scriptContent.includes("transport"));

    if (hasServiceWorkerProxy && hasHijackedNetwork) {
        console.log("[MAIN] BLOCK TRIGGER: Service Worker proxy + hijacked fetch/XHR");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "Service Worker + Network Hijack" }, "*");
        return;
    }

    if (hasObfuscatedLoader && (hasHijackedNetwork || hasCommonForkCombo)) {
        console.log("[MAIN] BLOCK TRIGGER: Obfuscated loader + network/proxy signals");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "Obfuscated loader + proxy signals" }, "*");
        return;
    }

    if (hasCommonForkCombo) {
        console.log("[MAIN] BLOCK TRIGGER: Common fork combo (scramjet/epoxy/bare-mux)");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "Common fork signature" }, "*");
        return;
    }

    if (hasServiceWorkerProxy && (html.includes("unblock") || scriptContent.includes("unblock"))) {
        console.log("[MAIN] BLOCK TRIGGER: Service Worker + unblock keyword");
        window.postMessage({ action: "triggerBlock", type: "proxy", reason: "Service Worker + unblock keyword" }, "*");
        return;
    }
}

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.postMessage({ action: "RECHECK_ALL" }, "*");
            window.postMessage({ type: "REQUEST_SLOP_CONFIG" }, "*");
        }
    });

    document.addEventListener('selectionchange', () => {
        if (window.getSelection()?.toString().length > 30) {
            setTimeout(protectSelection, 50);
        }
    });
})();
