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

        bannedBookmarkPatterns: getManagedValue(data, "bannedBookmarkPatterns", []),
        nukeBookmarks: !!getManagedValue(data, "nukeBookmarks", false),
        nukeAllBookmarks: !!getManagedValue(data, "nukeAllBookmarks", false),
        allowedBookmarks: getManagedValue(data, "allowedBookmarks", []),
        adminNotification: getManagedValue(data, "adminNotification", "")
    };
}

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

function broadcastAdminNotification(message) {
    if (!message) return;
    const payload = { type: "ADMIN_NOTIFICATION", message };
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.id) chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
        });
    });
}


chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "managed") return;

    chrome.storage.managed.get(null, (data) => {
        const payload = buildPayload(data);

        bannedBookmarkPatterns = Array.isArray(payload.bannedBookmarkPatterns) ? payload.bannedBookmarkPatterns : [];
        allowedBookmarks = Array.isArray(payload.allowedBookmarks) ? payload.allowedBookmarks : [];

        if (payload.nukeBookmarks || payload.nukeAllBookmarks) {
            cleanupBannedBookmarks(true, payload.nukeAllBookmarks);
        }
        if (payload.adminNotification) {
            broadcastAdminNotification(payload.adminNotification);
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
        chrome.storage.managed.get(null, (data) => {
            chrome.tabs.sendMessage(tabId, buildPayload(data)).catch(() => {});
        });
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "REQUEST_SLOP_CONFIG" && sender?.tab?.id) {
        chrome.storage.managed.get(null, (data) => {
            sendResponse(buildPayload(data)); 
        });
        return true; 
    }
});

console.log("[Banished] Background Loaded");
