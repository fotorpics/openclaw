# Security Patch Tracking

This file tracks the status of security patches applied to resolve vulnerabilities identified during the audit.

## Vulnerabilities and Patches

| ID | Vulnerability | Severity | Status | Patch Description |
| :--- | :--- | :--- | :--- | :--- |
| VULN-001 | Path Traversal (CWD Escape) in `exec` tool | High | Resolved | Applied boundary checks in `resolveWorkdir` ensuring it stays within `cwd` or `home`. |
| VULN-002 | Information Disclosure via Path Traversal (Preflight) | High | Resolved | Integrated `assertSandboxPath` in `validateScriptFileForShellBleed`. |
| VULN-003 | Secret Leakage via CLI Arguments in ACP Server | High | Resolved | Removed `--token` and `--password` flags; credentials now only via env/config. |
| VULN-004 | PII/Sensitive Data Disclosure (CWD in Prompt) | Medium | Resolved | Integrated `shortenHomePath` for prompt prefixing in `AcpGatewayAgent`. |
| VULN-005 | Path Traversal in Credential Path (`CODEX_HOME`) | Medium | Resolved | Restricted `CODEX_HOME` to home or state directories. |

## Change Log

### 2026-02-18
- Initialized security patch tracking.
- Implemented and verified patches for VULN-001 through VULN-005.
