---
name: security-audit
description: Use when conducting security reviews, vulnerability assessments, penetration testing (authorized), OWASP compliance checks, code security audits, authentication/authorization reviews, supply chain security analysis, or incident response. Triggers on security, vulnerability, OWASP, XSS, injection, auth, encrypt, supply chain, pentest, audit, CVE, exploit.
---

# Security Audit Skill

Comprehensive security auditing for modern web applications with defensive and authorized offensive capabilities.

## When to Use

### Trigger Symptoms (Use this skill when...)

- Security code review requested
- Vulnerability assessment needed
- OWASP compliance check required
- Authentication/authorization review
- Supply chain dependency audit
- Pre-deployment security gate
- Incident response analysis
- Authorized penetration testing

### Use ESPECIALLY when:

- New authentication flows implemented
- External APIs integrated
- User input handling changes
- Sensitive data processing added
- Third-party dependencies updated
- Production deployment pending

### When NOT to Use

- Feature implementation → use `backend-design` or `frontend-rules` or `frontend-design@claude-plugins-official`
- Bug investigation → use `debugger` skill
- Performance issues → use dedicated performance skill

---

## Core Principles

| Principle | Application |
|-----------|-------------|
| **Assume Breach** | Design as if attacker already inside |
| **Zero Trust** | Never trust, always verify |
| **Defense in Depth** | Multiple layers, no single point of failure |
| **Least Privilege** | Minimum required access only |
| **Fail Secure** | On error, deny access |

---

## OWASP Top 10:2025 Checklist

| Rank | Category | Check For |
|------|----------|-----------|
| **A01** | Broken Access Control | IDOR, missing auth checks, SSRF |
| **A02** | Security Misconfiguration | Default credentials, verbose errors, missing headers |
| **A03** | Software Supply Chain | Outdated deps, unaudited packages, missing lock files |
| **A04** | Cryptographic Failures | Weak crypto, exposed secrets, unencrypted data |
| **A05** | Injection | SQL, command, XSS, LDAP injection patterns |
| **A06** | Insecure Design | Missing threat modeling, architecture flaws |
| **A07** | Authentication Failures | Weak passwords, missing MFA, session issues |
| **A08** | Integrity Failures | Unsigned updates, CI/CD vulnerabilities |
| **A09** | Logging & Alerting | Missing audit logs, blind spots |
| **A10** | Exceptional Conditions | Poor error handling, fail-open states |

---

## Code Pattern Red Flags

### Injection Patterns

| Pattern | Risk | Fix |
|---------|------|-----|
| String concat in queries | SQL Injection | Parameterized queries, ORM |
| `eval()`, `exec()` | Code Injection | Remove or sanitize |
| `dangerouslySetInnerHTML` | XSS | Sanitize or avoid |
| Command concat | Command Injection | Use safe APIs |

### Authentication Patterns

| Pattern | Risk | Fix |
|---------|------|-----|
| Hardcoded secrets | Credential exposure | Environment variables |
| Weak password policy | Account takeover | Enforce strong passwords |
| Missing rate limiting | Brute force | Add rate limiting |
| Session in URL | Session hijacking | Use secure cookies |

### Data Protection Patterns

| Pattern | Risk | Fix |
|---------|------|-----|
| PII in logs | Privacy violation | Mask or remove |
| Unencrypted sensitive data | Data breach | Encrypt at rest |
| Missing HTTPS | MITM | Force HTTPS |
| `verify=False` | MITM | Verify certificates |

---

## Supply Chain Security

### Dependency Audit Checklist

- [ ] All dependencies have lock files
- [ ] No deprecated packages
- [ ] No known CVEs in direct deps
- [ ] Minimal transitive dependencies
- [ ] Integrity hashes verified
- [ ] Provenance attestations checked

### Tools

```bash
# Node.js
bun audit
npm audit

# Check for known vulnerabilities
snyk test

# License compliance
license-checker
```

---

## Security Headers Checklist

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Restrictive policy | XSS prevention |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | Clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy |
| `Permissions-Policy` | Restrict features | Feature abuse |

---

## Risk Prioritization

### Severity Classification

| Severity | Criteria | Response Time |
|----------|----------|---------------|
| **Critical** | RCE, auth bypass, mass data exposure | Immediate |
| **High** | Data exposure, privilege escalation | < 24 hours |
| **Medium** | Limited scope, requires conditions | < 1 week |
| **Low** | Informational, best practice | Backlog |

### Decision Framework

```
Is it actively exploited (EPSS >0.5)?
├── YES → CRITICAL: Immediate action
└── NO → Check CVSS
         ├── CVSS ≥9.0 → HIGH
         ├── CVSS 7.0-8.9 → Consider asset value
         └── CVSS <7.0 → Schedule for later
```

---

## Penetration Testing (Authorized Only)

> **CRITICAL**: Only conduct offensive testing with:
> - Written authorization
> - Clearly defined scope
> - Documented rules of engagement

### PTES Phases

1. **Pre-Engagement** - Define scope, authorization
2. **Reconnaissance** - Information gathering
3. **Threat Modeling** - Attack surface mapping
4. **Vulnerability Analysis** - Discover weaknesses
5. **Exploitation** - Demonstrate impact
6. **Post-Exploitation** - Assess scope of compromise
7. **Reporting** - Document findings with evidence

---

## Security Review Workflow

```
1. UNDERSTAND
   └── Map attack surface, identify assets

2. ANALYZE
   └── Think like attacker, find weaknesses

3. PRIORITIZE
   └── Risk = Likelihood × Impact

4. REPORT
   └── Clear findings with remediation

5. VERIFY
   └── Confirm fixes address root cause
```

---

## Reporting Template

### Summary

- Files reviewed: X
- Critical issues: X
- High priority: X
- Medium priority: X

### Findings

#### Critical (Must Fix)

- [Finding with file:line reference and remediation]

#### High Priority

- [Finding with file:line reference and remediation]

### Recommendations

1. [Priority recommendation with rationale]
2. [Secondary recommendation]

---

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Scan without understanding | Map attack surface first |
| Alert on every CVE | Prioritize by exploitability |
| Fix symptoms | Address root causes |
| Trust third-party blindly | Verify integrity, audit code |
| Security through obscurity | Real security controls |

---

## Quick Commands

```bash
# Dependency audit
bun audit

# Secret scanning
gitleaks detect --source .

# Security headers check
curl -I https://example.com

# SSL certificate check
openssl s_client -connect example.com:443
```
