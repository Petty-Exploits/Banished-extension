# Banished

A lightweight Chrome extension to banish distractions in educational environments by blocking Google Doodle games, hiding AI Overviews in search results, and enforcing a whitelist of approved educational sites via network rules.

**Name:** Banished  
**Version:** 1.10104  
**Author:** Petty  

## Description

A bandaid to the rampant gaming and distractions students engage in within school environments.

## Features

### Google Search Enhancements
- Automatically redirects all Google searches to use the `?udm=14` parameter, forcing traditional web results and disabling AI-generated features.
- Injects CSS to completely hide AI Overviews (targets classes like `.WAUd4.OZ9ddf`, `.Beswgc`, data attributes, and more).
- Blocks interactive Google Doodle games and full-screen overlays (hides iframes, canvases, close buttons, and high z-index elements like `div[jsname="lJ2blc"]`).

### Declarative Net Request Rules
- Massive whitelist of trusted educational and safe domains (hundreds of entries including `edpuzzle.com`, `education.com`, `study.com`, `history.com`, `discovery.com`, `factcheck.org`, `goodreads.com`, `pbs.org`, `foodnetwork.com`, `ebay.com`, `ancestryclassroom.com`, and many more).
- Uses "allow" rules with higher priority to ensure access to approved sites in restricted networks.
- Includes humorous/test rules for encoded "get a job" / "touch grass" strings.

### Minimalist Design
- No popup, no admin panel, no extra UI — pure background blocking for maximum simplicity and minimal overhead.

## Installation

Load as an unpacked extension in Chrome or Edge (enable Developer Mode) or deploy via group policy for managed devices.

## Permissions

- `declarativeNetRequest` – for rule-based redirects and allows
- `<all_urls>` – required for content script injection and rule application

## Privacy

No data storage, no logging, no external communication — everything is handled locally and rule-based.

## Contributing

Feel free to steal any code you need to keep bullying students trying to bypass content filters. Pull requests welcome for new rules, CSS improvements, or additional educational domains.

---

Made by Petty.

---
