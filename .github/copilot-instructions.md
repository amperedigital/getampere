# Project Instructions

## Critical Technical Constraints
- **WSL File Sync Bug**: The workspace environment (WSL) has a bug where standard file editing tools (`read_file`, `create_file`, `replace_string_in_file`) fail with a "File Too Large" error for certain files (specifically `deploy/assets/js/tab-flipper.js`).
- **Mandatory Workaround**: You **MUST** use terminal commands (`cat`, `sed`, `rm`, `echo`, heredocs) to read or write to `deploy/assets/js/tab-flipper.js`.
  - **Reading**: Use `cat deploy/assets/js/tab-flipper.js`.
  - **Writing**: Use `cat << 'EOF' > deploy/assets/js/tab-flipper.js` (ensure you `rm` the file first if overwriting completely to be safe).
  - **Do NOT** use the standard edit tools for this file.

## Deployment Workflow (Strict)
- **Source of Truth**: The `deploy/` folder is the only source for deployment.
- **CDN Usage**: Production HTML (`deploy/index.html`) MUST use jsDelivr CDN links for all scripts (e.g., `https://cdn.jsdelivr.net/gh/amperedigital/getampere@vX.Y.Z/assets/js/...`).
- **Local Paths Forbidden**: NEVER change script sources to local relative paths (e.g., `./assets/js/...`) in `deploy/index.html` without explicit user permission.
- **Update Process**:
  1. Edit local files in `deploy/`.
  2. **STOP**: Do NOT manually commit, tag, or edit `index.html` versions.
  3. **EXECUTE**: Run the publish script: `./scripts/publish.sh vX.Y.Z`
     - This script handles git operations, selective CDN updates, and deployment.
  4. **VERIFY**: Check the output to ensure only changed assets were updated.

## General Rules
- **MANDATORY**: You MUST read the file `context.md` at the very beginning of every session to understand the project architecture and rules. Do not proceed without reading it.
- **NO TOUCHING**: Never modify or retag files that you have not explicitly edited.
