

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

function checkTitle(titleToCheck = null) {
    if (NUKED || isExempt() || !enableTitleSpoofDetection) return;

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


function hydrateConfig(payload) {
    if (!payload || payload.type !== "UPDATE_SLOP_CONFIG") return;

    console.log("[Banished] 🚀 State Unpacked. Synchronization Target Stamp:", payload.configVersion);
    cachedConfig = payload;

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

    broadcastConfig(true);

    setTimeout(() => {
        if (typeof checkExtraBannedPatterns === "function") checkExtraBannedPatterns();
        if (typeof checkTitle === "function") checkTitle();
        if (typeof totalNukeProxy === "function") totalNukeProxy();
    }, 50);
}

function requestFreshConfig() {
    if (typeof chrome?.runtime?.sendMessage !== "function") return;
    chrome.runtime.sendMessage({ type: "REQUEST_SLOP_CONFIG" }, (response) => {
        if (!chrome.runtime.lastError && response) {
            hydrateConfig(response);
        }
    });
}
requestFreshConfig();




chrome.runtime.onMessage.addListener((message) => {
    if (!message) return;

    if (message.type === "UPDATE_SLOP_CONFIG") {
        hydrateConfig(message);
        return;
    }

    if (message.type === "ADMIN_NOTIFICATION" && typeof showAdminAlert === "function") {
        showAdminAlert(message.text);
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
    user-select: none;          
    -webkit-user-select: none;  
    -moz-user-select: none;     
    -ms-user-select: none;      
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
            .spacer { height: 400px; }   
            .spacer2 { height: 400px; }  
            .spacer3 { height: 400px; }   
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
                <h2>POLICY VIOLATION<br>I think its time to refresh you on the school's internet policy</h2>
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

                <h3> #877 Policy  – Internet Acceptable Use and Safety</h3>
                <p><strong>Number:</strong> <br>
                <strong>Adopted:</strong> September 23, 2013<br>
                <strong>Revised:</strong> August 28, 2017 • September 10, 2018 • August 22, 2022</p>

                <h3>I. PURPOSE</h3>
                <p>The purpose of this policy is to set forth policies and guidelines for access to the school district computer system and acceptable and safe use of the Internet...</p>

                <h3>II. GENERAL STATEMENT OF POLICY</h3>
                <p>In making decisions regarding student and employee access... the school district expects that faculty will blend thoughtful use of the school district computer system and the Internet throughout the curriculum...</p>

                <h3>III. LIMITED EDUCATIONAL PURPOSE</h3>
                <p>The school district system has a limited educational purpose... Uses which might be acceptable on a user’s private personal account may not be acceptable on this limited-purpose network.</p>

                <h3>IV. USE OF SYSTEM IS A PRIVILEGE</h3>
                <p>The use of the school district system... is a privilege, not a right.</p>

                <h3>V. UNACCEPTABLE USES & POLICY VIOLATIONS</h3>
                <p style="color: #d11270; font-weight: bold; background: #fff0f5; padding: 10px; border-left: 5px solid #ff1493;">
                    Notice: Your recent activity has triggered a violation of the following specific clauses:
                </p>

                <ul class="policy-list">
                    <li>
                        <strong>Security & Bypassing (Proxy Use):</strong> 
                        <em>Actual Policy:</em> "Users shall not attempt to gain unauthorized access to the school district system... or attempt to disrupt the system or any other system."
                        <br><b style="color:#ff1493;">Why you were caught:</b> Using a proxy or VPN to bypass filters is considered a <u>Security Breach</u> and "unauthorized access." It is not a "hack," it is a policy violation.
                    </li>
                    
                    <li>
                        <strong>Non-Educational Site Use (Games/Socials):</strong> 
                        <em>Actual Policy:</em> "The school district system has a limited educational purpose... Uses which might be acceptable on a user’s private personal account may not be acceptable on this limited-purpose network."
                        <br><b style="color:#ff1493;">Why you were caught:</b> If it's not on your teacher's syllabus, it shouldn't be on your screen. Playing games during instructional time is a "misuse of district resources."
                    </li>

                    <li>
                        <strong>System Tampering (Title Spoofing/Injections):</strong> 
                        <em>Actual Policy:</em> "Users will not engage in vandalism... including any malicious attempt to harm or destroy data or to modify or change system software."
                        <br><b style="color:#ff1493;">Why you were caught:</b> Attempting to hide your tabs with "Title Spoofing" or injecting code into <code>about:blank</code> is classified as <u>System Vandalism</u>.
                    </li>

                    <li>
                        <strong>Prohibited Material:</strong> Accessing por#######, obscene, or harmful material.
                    </li>
                    
                    <li>
                        <strong>Harassment & Bullying:</strong> Using district technology to engage in cyberbullying or political campaigning.
                    </li>
                </ul>

                <style>
                    .policy-list li {
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px dotted #ffb6c1;
                        text-align: left;
                    }
                    .policy-list strong { color: #ff1493; display: block; font-size: 1.3rem; }
                    .policy-list em { color: #666; font-size: 0.95rem; display: block; margin-top: 5px; }
                </style>

                

                <h3>VI. FILTER & MONITORING</h3>
                <p>The school district monitors all activity and blocks obscene or harmful content...</p>

                <h3>VII–XVI. ADDITIONAL RULES & CONSEQUENCES</h3>
                <p>Violation may result in loss of privileges, suspension, expulsion, or legal action. All activity is logged.</p>

                <div class="spacer3"></div>
                <p class="annoying">Almost done... just a little more scrolling~ 🦄</p>
                <div class="spacer"></div>
                <p style="text-align:center; color:#ff1493; font-size:1.6rem; margin:3em 0;">

                Legal References:	
                    Minn. Stat. § 13.32 (Educational Data)
                    Minn. Stat. § 124D.166 (Limit on Screen Time for Children in Preschool and Kindergarten)
                    15 U.S.C. § 6501 et seq. (Children’s Online Privacy Protection Act)
                    17 U.S.C. § 101 et seq. (Copyrights)
                    20 U.S.C. § 6751 et seq. (Enhancing Education through Technology Act of 2001)
                    47 U.S.C. § 254 (Children’s Internet Protection Act of 2000 (CIPA))
                    47 C.F.R. § 54.520 (FCC rules implementing CIPA)
                    Minn. Stat. § 121A.031 (School Student Bullying Policy)
                    Minn. Stat. § 125B.15 (Internet Access for Students)
                    Minn. Stat. § 125B.26 (Telecommunications/Internet Access Equity Act)
                    Tinker v. Des Moines Indep. Cmty. Sch. Dist., 393 U.S. 503, 89 S.Ct. 733, 21 L.Ed.2d 
                    731 (1969)
                    United States v. Amer. Library Assoc., 539 U.S. 194, 123 S.Ct. 2297, 56 L.Ed.2d 221 
                    (2003)
                    Doninger v. Niehoff, 527 F.3d 41 (2nd Cir. 2008)
                    R.S. v. Minnewaska Area Sch. Dist. No. 2149, No. 12-588, 2012 WL 3870868 (D. Minn. 
                    2012)
                    Tatro v. Univ. of Minnesota, 800 N.W.2d 811 (Minn. App. 2011), aff’d on other grounds 
                    816 N.W.2d 509 (Minn. 2012)
                    S.J.W. v. Lee’s Summit R-7 Sch. Dist., 696 F.3d 771 (8th Cir. 2012)
                </p>

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
                    htmlLower.includes("wisp") ||
                    htmlLower.includes("unblocked") ||
                    htmlLower.includes("holyunblocker") ||
                    htmlLower.includes("interstellar") ||
                    window.__uv || window.__sj || window.ruggedConfig || window.EpoxyTransport
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

        }

        if (currentUrl.includes("cloudfront.net") && 
            (
                htmlLower.includes("thepeople.help") ||
                htmlLower.includes("featurecontrol.acshash") ||
                htmlLower.includes("nobodycares-not-my-alt/fonts/ghost.png") ||
                htmlLower.includes("vpn-modal") ||
                htmlLower.includes("connected to us-east-1") ||
                htmlLower.includes("scramjet client") ||
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

        if (window.__uv || window.__sj || window.Rammerhead || 
            window.EpoxyTransport || window.WispClient ||
            window.holyUnblocker || window.interstellar || window.dogeUnblocker) {
            enforceBlock(
                "proxy", 
                "Proxy Engine Detected", 
                "Active proxy circumvention engine globals found.", 
                "Engine Match"
            );
            return;
        }

        if (window.location.href === "about:blank" && window.opener) {
            enforceBlock(
                "proxy", 
                "Cloaked Session", 
                "Detected proxy launch via about:blank cloaking.", 
                "Anti-Cloak"
            );
            return;
        }

        const hasProxyEngine = 

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
            htmlLower.includes("/jetty.all.js") ||
            htmlLower.includes("/jetty.sync.js") ||
            htmlLower.includes("/jetty.wasm") ||
            window.__bareMux ||
            window.BareMuxConnection ||
            window.BareMux ||
            window.BareClient ||
            typeof window.BareMux?.BareClient === 'function' ||
            htmlLower.includes("/baremux/index.js") ||
            htmlLower.includes("bare-mux: running") ||
            htmlLower.includes("bare-mux-worker") ||
            htmlLower.includes("wisp-server") ||
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

            (
                htmlLower.includes("epoxy") ||
                htmlLower.includes("epoxytransport") ||
                htmlLower.includes("epoxy/index.mjs") ||
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
                  navigator.serviceWorker.controller.scriptURL.includes("transport")))
            ) ||

            (
                htmlLower.includes("holyunblocker") ||
                htmlLower.includes("holy-unblocker") ||
                htmlLower.includes("interstellar") ||
                htmlLower.includes("dogeunblocker") ||
                htmlLower.includes("monkeunblocker") ||
                htmlLower.includes("spaceunblocker") ||
                htmlLower.includes("proxy dashboard") ||
                htmlLower.includes("unblocked games 2026") ||
                htmlLower.includes("school unblocker 2026") ||
                htmlLower.includes("holyunblocker.org") ||
                htmlLower.includes("interstellar.unblock") ||
                htmlLower.includes("unblocker.lol")
            );
    
        if (!hasProxyEngine) return;

        let detected = "unknown proxy engine";
        if (htmlLower.includes("epoxy") || window.Epoxy || window.EpoxyTransport) {
            detected = "Epoxy Transport";
        } else if (htmlLower.includes("sj mode") || htmlLower.includes("infamous")) {
            detected = "Infamous Epoxy SJ";
        } else if (window.__bareMux || htmlLower.includes("bare-mux")) {
            detected = "BareMux";
        } else if (window.__uv) {
            detected = "Ultraviolet";
        } else if (window.Rammerhead) {
            detected = "Rammerhead";
        } else if (htmlLower.includes("holyunblocker") || htmlLower.includes("holy-unblocker")) {
            detected = "Holy Unblocker (2026)";
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
    

    
    setTimeout(() => {
        if (isExempt()) {
            console.log("[Banished] Early full exit: exempt domain");
            
        }
    }, 150);

})();
