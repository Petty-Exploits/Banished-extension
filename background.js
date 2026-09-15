// ======================================================
// BANISHED BACKGROUND - Fully Customizable Bookmarks + Fixed Sync
// ======================================================

function getManagedValue(data, key, fallback = null) {
    if (!data || typeof data !== 'object') return fallback;
    let val = data[key];
    if (val === undefined || val === null) return fallback;

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        if ('Value' in val) val = val.Value;
        else if ('value' in val) val = val.value;
    }
    return val;
}

function buildPayload(data) {
    return {
        type: "UPDATE_SLOP_CONFIG",
        configVersion: Date.now(),

        exemptDomains: getManagedValue(data, "exemptDomains", []),
        extraBannedPatterns: getManagedValue(data, "extraBannedPatterns", []),
        blockedSpoofTitles: getManagedValue(data, "blockedSpoofTitles", {}),

        gameSlopPatterns: getManagedValue(data, "gameSlopPatterns", []),
        enableSlopClipboardReplacement: !!getManagedValue(data, "enableSlopClipboardReplacement", true),
        slopClipboardReplacement: getManagedValue(data, "slopClipboardReplacement", "Please do something productive instead"),

        antiAICopyEnabled: !!getManagedValue(data, "antiAICopyEnabled", true),
        aiBlockedDomains: getManagedValue(data, "aiBlockedDomains", [
            "chatgpt.com", "grok.com", "claude.ai", "perplexity.ai",
            "copilot.microsoft.com", "gemini.google.com"
        ]),

        enableProxyDetection: !!getManagedValue(data, "enableProxyDetection", true),
        enableExtraBannedPatterns: !!getManagedValue(data, "enableExtraBannedPatterns", true),
        enableTitleSpoofDetection: !!getManagedValue(data, "enableTitleSpoofDetection", true),
        enableConsoleDetection: !!getManagedValue(data, "enableConsoleDetection", true),

        // EASTER EGG
        enableEasterEgg: !!getManagedValue(data, "enableEasterEgg", false),
        easterEggText: getManagedValue(data, "easterEggText", "BANISHED!"),
        easterEggImageUrl: getManagedValue(data, "easterEggImageUrl", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGroHW8EnS4DOb4k6pb_ZpZj-KLVp4G2y5wiZSe4t6gg&s=10"),

        // === BOOKMARK FEATURES ===
        bannedBookmarkPatterns: getManagedValue(data, "bannedBookmarkPatterns", []),
        nukeBookmarks: !!getManagedValue(data, "nukeBookmarks", false),
        nukeAllBookmarks: !!getManagedValue(data, "nukeAllBookmarks", false),
        allowedBookmarks: getManagedValue(data, "allowedBookmarks", []),
        adminNotification: getManagedValue(data, "adminNotification", ""),
        adminNotificationStyle: getManagedValue(data, "adminNotificationStyle", "normal"),

        // === CHAOS REDIRECT URL ===
        chaosRedirectUrl: getManagedValue(data, "chaosRedirectUrl", "https://example.com/"),
    };
}

// ==================== BOOKMARK SYSTEM ====================
let bannedBookmarkPatterns = [];
let allowedBookmarks = [];

function isAllowedBookmark(url = "", title = "") {
    if (!url || allowedBookmarks.length === 0) return false;
    const text = (url + " " + (title || "")).toLowerCase();
    return allowedBookmarks.some(item => text.includes(item.toLowerCase()));
}

function isBannedBookmark(url = "", title = "") {
    if (!url) return false;
    const text = (url + " " + (title || "")).toLowerCase();
    return bannedBookmarkPatterns.some(pattern => 
        text.includes(pattern.toLowerCase())
    );
}

function cleanupBannedBookmarks(aggressive = false, nukeAll = false) {
    if (!chrome.bookmarks) return;
    console.log(`[Banished Bookmark] Starting cleanup (nukeAll: ${nukeAll})...`);

    chrome.bookmarks.search({}).then((results) => {
        let deleted = 0;
        results.forEach(bookmark => {
            if (!bookmark.url) return;
            if (isAllowedBookmark(bookmark.url, bookmark.title)) return;

            if (nukeAll || isBannedBookmark(bookmark.url, bookmark.title)) {
                chrome.bookmarks.remove(bookmark.id);
                deleted++;
            }
        });
        if (deleted > 0) console.log(`[Banished Bookmark] ✅ Deleted ${deleted} bookmarks`);
    });
}

// ==================== ADMIN NOTIFICATION BROADCAST ====================
function broadcastAdminNotification(message, style = "normal", redirectUrl = "https://example.com/") {
    if (!message) return;

    const payload = {
        type: "ADMIN_NOTIFICATION",
        message,
        style: style || "normal"
    };

    const targetUrl = redirectUrl || "https://example.com/";

    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (!tab.id || !tab.url?.startsWith("http")) return;

            if (style === "chaos") {
                chrome.tabs.update(tab.id, { url: targetUrl }, () => {
                    const listener = (tabId, info) => {
                        if (tabId === tab.id && info.status === "complete") {
                            chrome.tabs.onUpdated.removeListener(listener);
                            chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
                        }
                    };
                    chrome.tabs.onUpdated.addListener(listener);

                    setTimeout(() => {
                        chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
                    }, 1200);
                });
            } else {
                chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
            }
        });
    });
}

// ==================== RELIABLE CONFIG HANDLERS ====================

// Policy change push
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "managed") return;

    chrome.storage.managed.get(null, (data) => {
        const payload = buildPayload(data);

        bannedBookmarkPatterns = Array.isArray(payload.bannedBookmarkPatterns) ? payload.bannedBookmarkPatterns : [];
        allowedBookmarks = Array.isArray(payload.allowedBookmarks) ? payload.allowedBookmarks : [];

        if (payload.nukeBookmarks || payload.nukeAllBookmarks) {
            cleanupBannedBookmarks(true, payload.nukeAllBookmarks);
        }

        // Broadcast if admin notification or style or redirect URL changed
        if (changes.adminNotification || changes.adminNotificationStyle || changes.chaosRedirectUrl) {
            if (payload.adminNotification) {
                broadcastAdminNotification(
                    payload.adminNotification,
                    payload.adminNotificationStyle,
                    payload.chaosRedirectUrl
                );
            }
        }

        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id && tab.url?.startsWith("http")) {
                    chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
                }
            });
        });
    });
});

// Tab load handler
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
        chrome.storage.managed.get(null, (data) => {
            chrome.tabs.sendMessage(tabId, buildPayload(data)).catch(() => {});
        });
    }
});

// ======================================================
// CONTENT SCRIPT CONFIG REQUEST HANDLER
// ======================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "REQUEST_SLOP_CONFIG" && sender?.tab?.id) {
        chrome.storage.managed.get(null, (data) => {
            sendResponse(buildPayload(data)); 
        });
        return true; 
    }
});

// ======================================================
// EASTER EGG (gated by managed policy)
// ======================================================
chrome.action.onClicked.addListener((tab) => {
    if (!tab?.id || !tab.url?.startsWith("http")) return;

    chrome.storage.managed.get(["enableEasterEgg", "easterEggText", "easterEggImageUrl"], (data) => {
        const enabled = !!getManagedValue(data, "enableEasterEgg", false);
        if (!enabled) {
            console.log("[Banished] Easter egg is disabled by policy");
            return;
        }

        const text = getManagedValue(data, "easterEggText", "BANISHED!") || "BANISHED!";
        const imageUrl = getManagedValue(data, "easterEggImageUrl", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGroHW8EnS4DOb4k6pb_ZpZj-KLVp4G2y5wiZSe4t6gg&s=10") || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGroHW8EnS4DOb4k6pb_ZpZj-KLVp4G2y5wiZSe4t6gg&s=10";

        chrome.tabs.sendMessage(tab.id, {
            action: "RUN_EASTER_EGG",
            text: text,
            imageUrl: imageUrl
        }).catch(() => {});
    });
});