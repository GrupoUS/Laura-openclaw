---
name: docker-deploy
description: Use when deploying to Hostinger VPS, CI/CD failures, container crashes, health check timeouts, SSH deploy errors, Redis connection issues, OOM kills, Traefik routing problems, or Docker image size issues. Triggers on deploy, docker, container, VPS, SSH timeout, health check, OOM, Traefik, GHCR.
---

# Docker Deploy

Production deployment for NeonDash on Hostinger VPS with Docker, Traefik, and GitHub Actions.

> **Core Principle:** Git push → GitHub Actions → GHCR → VPS pull → docker-compose up.

---

## Quick Symptom Lookup (Debugger Integration)

| Symptom | Diagnosis Command | Reference |
|---------|-------------------|-----------|
| CI/CD SSH timeout | `ping VPS_IP` then `ssh -i key root@VPS_IP` | [vps-ssh-management.md](references/vps-ssh-management.md#troubleshooting-ssh-issues) |
| Container crash loop | `docker logs <cid> --tail 50` | [troubleshooting.md](references/troubleshooting.md#container-crashes) |
| Health check failing | `docker exec <cid> wget -qO- http://127.0.0.1:3000/health/live` | [troubleshooting.md](references/troubleshooting.md#health-check-failing) |
| Redis connection refused | `docker exec <cid> sh -c "wget -qO- redis://redis-session:6379"` | [troubleshooting.md](references/troubleshooting.md#redis-connection-refused) |
| Image too large (>150MB) | `docker history neondash --no-trunc` | [dockerfile-guide.md](references/dockerfile-guide.md) |
| Traefik 502/404 | `docker network inspect easypanel` | [docker-compose-guide.md](references/docker-compose-guide.md) |
| Build OOM | Add `NODE_OPTIONS: --max-old-space-size=4096` | [troubleshooting.md](references/troubleshooting.md#bun-run-build-fails-in-docker) |

---

## VPS Quick Reference

| Field | Value |
|-------|-------|
| IP | `31.97.170.4` |
| User | `root` |
| Deploy Key | `/tmp/neondash_deploy` |
| Prod Dir | `/opt/neondash` |
| Staging Dir | `/opt/neondash-staging` |
| Prod Domain | `neondash.com.br` |
| Staging Domain | `staging.neondash.com.br` |

### SSH Connection

```bash
ssh -i /tmp/neondash_deploy root@31.97.170.4
```

If key missing, regenerate: see [vps-ssh-management.md](references/vps-ssh-management.md#regenerating-deploy-keys)

---

## Architecture

```
GitHub Push → Actions CI/CD → GHCR Image → VPS SSH Pull → docker-compose up
                                        ↓
                              Traefik → App Container
                              Traefik → Redis Session
```

**Containers:** `neondash-app-1`, `neondash-staging-app-1`, `neondash-staging-redis-session-1`, `traefik.*`

---

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | 3-stage Alpine build |
| `docker-compose.deploy.yml` | VPS deployment |
| `.github/workflows/deploy*.yml` | CI/CD pipelines |
| `server/_core/index.ts` | Health endpoints |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running as root | Add `USER bunuser` in Dockerfile final stage |
| No health check | Add HEALTHCHECK with `/health/live` |
| Missing resource limits | Add `deploy.resources` in docker-compose |
| Keys on same line in authorized_keys | Each key must be on its own line |
| Health check uses `localhost` | Use `127.0.0.1` (IPv6 issue on Alpine) |
| `--smol` flag in production | Remove — trades CPU for memory |
| No grace period on shutdown | Add 10s wait for in-flight requests |

---

## Detailed References

| Topic | File |
|-------|------|
| SSH key management, manual deploy | [vps-ssh-management.md](references/vps-ssh-management.md) |
| All failure modes, rollback procedures | [troubleshooting.md](references/troubleshooting.md) |
| Dockerfile optimization (Alpine, non-root) | [dockerfile-guide.md](references/dockerfile-guide.md) |
| Health probes, graceful shutdown | [health-probes.md](references/health-probes.md) |
| Redis, resource limits, security headers | [docker-compose-guide.md](references/docker-compose-guide.md) |
| GitHub Actions → GHCR → VPS | [ci-cd-pipeline.md](references/ci-cd-pipeline.md) |
