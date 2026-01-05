Banished
A lightweight Chrome extension to banish distractions in educational environments by blocking Google Doodle games, hiding AI Overviews in search results, and enforcing a whitelist of approved educational sites via network rules.
Name: Banished
Version: 1.10104
Author: Petty
Description: Banished.
Features

Google Search Enhancements:
Automatically redirects Google searches to use ?udm=14 query parameter, forcing traditional web results and disabling AI features.
Injects CSS to completely hide AI Overviews (e.g., targets classes like .WAUd4.OZ9ddf, .Beswgc, and data attributes for AI sections).
Blocks interactive Google Doodle games and overlays (e.g., hides iframes, canvases, and high z-index elements like div[jsname="lJ2blc"]).

Declarative Net Request Rules:
Extensive whitelist of educational domains (e.g., edpuzzle.com, education.com, study.com, history.com, discovery.com, factcheck.org, goodreads.com, pbs.org, foodnetwork.com, ebay.com, ancestryclassroom.com, and hundreds more).
Prioritizes "allow" actions for safe sites to ensure access in restricted environments.

Minimalist Design: No popup, admin panel, or extra UI – pure background blocking for simplicity and low overhead.

Installation
Load as an unpacked extension in Chrome/Edge (developer mode) or deploy via group policy for managed devices.

Permissions

declarativeNetRequest (for rule-based redirects and allows)
Access to all URLs (for content scripts and rules)

Privacy
No data storage, logging, or external communication – all operations are local and rule-based.
Contributing
Steal any code you need to keep bullying students trying to bypass content filters 

Made by Petty.
