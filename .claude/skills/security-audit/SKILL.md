---
name: security-audit
description: >
  Security audit of the React/TypeScript UI for XSS, dependency risks,
  and data handling.
  Use when asked to audit or check security.
---

Perform a security audit of $ARGUMENTS (or the full project if no args).

## Audit Checklist

1. **XSS**: check for `dangerouslySetInnerHTML` usage. If present, verify input is sanitized. Monaco editor content rendering must not execute arbitrary scripts.

2. **CTXDSL Injection**: user-authored CTXDSL sent to the backend API — verify no client-side eval or template interpolation of CTXDSL content.

3. **API Communication**:
   - Verify axios/fetch calls use relative paths or configured base URL (no hardcoded localhost in production builds)
   - Check CORS expectations match backend configuration
   - Sensitive data (if any) not logged to console in production

4. **Dependencies**:
   - Check `package-lock.json` is committed
   - Flag `devDependencies` that appear in production bundle
   - Note any dependencies with known vulnerabilities (`npm audit` output if available)

5. **Environment Variables**:
   - Only `VITE_*` prefixed env vars are exposed to the client — verify no secrets leak
   - Check `.env` / `.env.local` are in `.gitignore`

6. **Content Security**: if the app loads external resources (fonts, CDN scripts), verify they use SRI hashes or are from trusted origins.

7. **Local Storage / Cookies**: check what's stored client-side and whether it includes sensitive data.

## Output Format

Severity: **Critical** / **High** / **Medium** / **Informational** — with file:line references.
