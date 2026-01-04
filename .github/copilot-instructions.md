# Project Instructions# Project Instructions
















- **NO TOUCHING**: Never modify or retag files that you have not explicitly edited.- **MANDATORY**: You MUST read the file `context.md` at the very beginning of every session.## General Rules  4. **VERIFY**: Check the output to ensure only changed assets were updated.     - This script handles git operations, selective CDN updates, and deployment.  3. **EXECUTE**: Run the publish script: `./scripts/publish.sh vX.Y.Z`  2. **STOP**: Do NOT manually commit, tag, or edit `index.html` versions.  1. Edit local files in `deploy/`.- **Update Process**:- **Local Paths Forbidden**: NEVER change script sources to local relative paths in `deploy/index.html`.- **CDN Usage**: Production HTML (`deploy/index.html`) MUST use jsDelivr CDN links for all scripts.- **Source of Truth**: The `deploy/` folder is the only source for deployment.## Deployment Workflow (Strict)
## Deployment Workflow (Strict)
- **Source of Truth**: The `deploy/` folder is the only source for deployment.
- **CDN Usage**: Production HTML (`deploy/index.html`) MUST use jsDelivr CDN links for all scripts (e.g., `https://cdn.jsdelivr.net/gh/amperedigital/getampere@vX.Y.Z/assets/js/...`).
- **Local Paths Forbidden**: NEVER change script sources to local relative paths (e.g., `./assets/js/...`) in `deploy/index.html` without explicit user permission.
- **Update Process**:
  1. Edit local files in `deploy/`.
  2. Commit changes: `git commit ...`
  3. Tag version: `git tag vX.Y.Z`
  4. Update HTML: Change CDN links in `deploy/index.html` to the new tag `@vX.Y.Z`.
  5. Push: `git push origin main --tags`
  6. Deploy: `npx wrangler deploy`

## General Rules
- **MANDATORY**: You MUST read the file `context.md` at the very beginning of every session to understand the project architecture and rules. Do not proceed without reading it.

