# Deployment Rules

## Overview
This project uses a unified release script (`scripts/publish.sh`) that handles git tagging, pushing, and Cloudflare Workers deployment.

## Smart Asset Scoping
To prevent unnecessary file churn, the `publish.sh` script employs **"Smart Scoping"**.
- By default, the script **ONLY updates CDN asset links in HTML files that are currently being edited** (staged or uncommitted).
- If an HTML file has not been touched, its asset links (e.g., `<script src="...">`) will **NOT** be updated to the new version tag.

### Why?
This ensures that stable pages (like `index.html`) are not constantly re-deployed or cache-busted when you are only working on isolated features (like `tech-demo.html`).

## Force Updating Specific Pages
If you are releasing a change to a shared asset (like a JS file) but have **NOT** modified the HTML file that consumes it, you must explicitly tell the script to update that HTML file.

**Usage:**
```bash
./scripts/publish.sh vX.Y.Z "deploy/path/to/file.html"
```

**Example:**
To release version v2.988 and force `tech-demo.html` to point to the new assets:
```bash
./scripts/publish.sh v2.988 "deploy/tech-demo.html"
```

## Unified Releases
When releasing a unified update (Frontend + Backend):
1. Ensure both `CHANGELOG.md` files are updated with the same version.
2. Run backend `publish.sh`.
3. Run frontend `publish.sh` (with force argument if necessary).
