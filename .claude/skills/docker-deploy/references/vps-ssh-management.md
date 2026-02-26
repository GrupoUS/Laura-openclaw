# VPS SSH & Hostinger Management

## SSH Key Connection

### Key Location

| Item | Path |
|---|---|
| Local private key | `/tmp/neondash_deploy` |
| Local public key | `/tmp/neondash_deploy.pub` |
| VPS authorized keys | `/root/.ssh/authorized_keys` |
| GitHub Secret | `VPS_SSH_KEY` (private key) |

### Current Deploy Key (generated 2026-02-26)

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGm93YRguTRxpGS3ltlv24+SN41/ayHkmQ/dRJUbSwXl github-actions-deploy
```

> **Note**: If the key file doesn't exist at `/tmp/neondash_deploy`, regenerate it using the steps below.
> **Local key path**: `/tmp/neondash_deploy` (regenerated 2026-02-26, after CI/CD SCP timeout incident).
> **GitHub Secret**: `VPS_SSH_KEY` updated 2026-02-26.

### Connecting to VPS

```bash
# Direct SSH connection
ssh -i /tmp/neondash_deploy root@31.97.170.4

# Run a single command
ssh -i /tmp/neondash_deploy -o StrictHostKeyChecking=no root@31.97.170.4 "docker ps"

# Copy files to VPS
scp -i /tmp/neondash_deploy localfile.yml root@31.97.170.4:/opt/neondash/
```

### Regenerating Deploy Keys

If the key is lost or compromised:

```bash
# 1. Generate new ED25519 key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f /tmp/neondash_deploy -N ""

# 2. View the public key to add to VPS
cat /tmp/neondash_deploy.pub

# 3. Add public key to VPS (via Hostinger panel browser console or existing SSH)
# Option A - via Hostinger Panel:
#    - Login at hpanel.hostinger.com
#    - VPS → Browser Console
#    - Run: echo '<public-key-from-step-2>' >> /root/.ssh/authorized_keys
#
# Option B - if you have root password:
sshpass -p 'YOUR_PASSWORD' ssh -o StrictHostKeyChecking=no root@31.97.170.4 \
  "echo '<public-key-from-step-2>' >> /root/.ssh/authorized_keys"

# 4. Fix line breaks if keys got concatenated (CRITICAL!)
sshpass -p 'YOUR_PASSWORD' ssh root@31.97.170.4 'wc -l /root/.ssh/authorized_keys'
# Should show 2+ lines. If not, fix with proper newlines.

# 5. Update GitHub Secret
gh secret set VPS_SSH_KEY --repo GrupoUS/neondash < /tmp/neondash_deploy

# 6. Verify connection
ssh -i /tmp/neondash_deploy root@31.97.170.4 "echo OK"
```

### authorized_keys Pitfalls

> **CRITICAL**: Each key MUST be on its own line. SSH silently fails if two keys are concatenated on the same line.

```bash
# ❌ WRONG — keys on same line
ssh-rsa AAAAB3...== #hostinger-managed-keyssh-ed25519 AAAAC3...== deploy

# ✅ CORRECT — separate lines
ssh-rsa AAAAB3...== #hostinger-managed-key
ssh-ed25519 AAAAC3...== deploy
```

Verify on VPS:
```bash
wc -l /root/.ssh/authorized_keys
# Should show one line per key (typically 2+)
```

---

## Hostinger VPS Panel

### Accessing VPS Panel

1. Login at [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Navigate to **VPS** → Select your server
3. Key tabs: **Overview**, **SSH Access**, **Manage**

### VPS Management Methods

Hostinger **does NOT have an official CLI** like Railway or Vercel. All VPS management is done via:

#### 1. SSH (Primary — what we use)

```bash
# Interactive session
ssh -i /tmp/neondash_deploy root@31.97.170.4

# One-liner command
ssh -i /tmp/neondash_deploy -o StrictHostKeyChecking=no root@31.97.170.4 "docker ps"
```

#### 2. Hostinger Web Panel

1. Login at [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Navigate to **VPS** → Select your server
3. Key tabs:
   - **Overview** — resource usage, IP, OS info
   - **SSH Access** — manage SSH keys via UI
   - **Settings** → **Operating System** — reinstall/reset VPS
   - **Manage** — firewall, backups, snapshots

#### 3. Hostinger API (REST)

For automation without SSH, Hostinger offers a REST API:

```bash
# Get API token from hpanel.hostinger.com → Account → API
# Base URL: https://api.hostinger.com/v1

# List VPS instances
curl -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  https://api.hostinger.com/v1/vps

# Restart VPS
curl -X POST -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  https://api.hostinger.com/v1/vps/{vps_id}/restart
```

> **Recommendation**: Use SSH for all operational tasks (deploy, logs, config). Use the web panel for DNS, firewall, and backups. Use the API only for CI/CD automation if SSH is not viable.

### VPS Info

| Field | Value |
|---|---|
| IP | `31.97.170.4` |
| Username | `root` |
| VPS Provider | Hostinger |
| OS | Ubuntu (with Docker + EasyPanel) |
| Deploy Dir (Production) | `/opt/neondash` |
| Deploy Dir (Staging) | `/opt/neondash-staging` |
| Domain (Production) | `neondash.com.br` |
| Domain (Staging) | `staging.neondash.com.br` |
| Panel | EasyPanel (port 3000) |

### Docker Containers on VPS

| Container | Purpose | Status Check |
|-----------|---------|--------------|
| `neondash-app-1` | Production app | `docker ps -f name=neondash-app-1` |
| `neondash-staging-app-1` | Staging app | `docker ps -f name=neondash-staging-app-1` |
| `neondash-staging-redis-session-1` | Redis for staging | `docker ps -f name=redis` |
| `traefik.*` | Reverse proxy | `docker ps -f name=traefik` |
| `easypanel.*` | Management panel | `docker ps -f name=easypanel` |

```bash
# Quick health check all containers
ssh -i /tmp/neondash_deploy root@31.97.170.4 "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E '(neondash|traefik)'"
```

---

## Manual Deploy Operations

### Deploy Latest Image

```bash
ssh -i /tmp/neondash_deploy root@31.97.170.4 << 'EOF'
  cd /opt/neondash
  export DOCKER_IMAGE=ghcr.io/grupous/neondash:latest
  docker compose -f docker-compose.deploy.yml pull
  docker compose -f docker-compose.deploy.yml up -d
  docker image prune -f
EOF
```

### Rollback to Specific Commit

```bash
ssh -i /tmp/neondash_deploy root@31.97.170.4 << 'EOF'
  cd /opt/neondash
  export DOCKER_IMAGE=ghcr.io/grupous/neondash:<commit-sha>
  docker compose -f docker-compose.deploy.yml pull
  docker compose -f docker-compose.deploy.yml up -d
EOF
```

### Check Container Health

```bash
# Container status
ssh -i /tmp/neondash_deploy root@31.97.170.4 "docker ps -f name=neondash --format 'table {{.Names}}\t{{.Status}}'"

# Health endpoints (from inside container — EasyPanel owns localhost:3000)
ssh -i /tmp/neondash_deploy root@31.97.170.4 "docker exec neondash-app-1 wget -qO- http://127.0.0.1:3000/health/live"
ssh -i /tmp/neondash_deploy root@31.97.170.4 "docker exec neondash-app-1 wget -qO- http://127.0.0.1:3000/health/ready"

# App logs (last 30 lines)
ssh -i /tmp/neondash_deploy root@31.97.170.4 "export DOCKER_IMAGE=ghcr.io/grupous/neondash:latest && docker compose -f /opt/neondash/docker-compose.deploy.yml logs app --tail 30"
```

### View & Edit VPS Environment

```bash
# View .env on VPS
ssh -i /tmp/neondash_deploy root@31.97.170.4 "cat /opt/neondash/.env"

# Update compose file on VPS
scp -i /tmp/neondash_deploy docker-compose.deploy.yml root@31.97.170.4:/opt/neondash/

# Add env variable
ssh -i /tmp/neondash_deploy root@31.97.170.4 "echo 'NEW_VAR=value' >> /opt/neondash/.env"
```

---

## EasyPanel Considerations

EasyPanel runs on the VPS and binds to `0.0.0.0:3000`:

- **DO NOT** use `curl localhost:3000` to test app health — it hits EasyPanel, not the app
- **DO** use `docker exec` to test from inside the container
- The app container exposes port 3000 internally, routed via Traefik on the `easypanel` network
- Access the app via the domain: `https://neondash.com.br`

---

## DNS Configuration

### Required Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `31.97.170.4` | 3600 |
| **A** | `www` | `31.97.170.4` | 3600 |

### Traefik TLS

Traefik auto-generates Let's Encrypt certificates. Set `APP_HOST` in VPS `.env`:

```bash
# On VPS
echo 'APP_HOST=neondash.com.br' >> /opt/neondash/.env
```

### Verify DNS

```bash
dig neondash.com.br +short
# Should return: 31.97.170.4
```

---

## Troubleshooting SSH Issues

### CI/CD SSH Timeout

If GitHub Actions shows `dial tcp ***:22: i/o timeout`:

1. **Check if VPS is reachable:**
   ```bash
   ping -c 3 31.97.170.4
   ```

2. **Check if local key exists:**
   ```bash
   ls -la /tmp/neondash_deploy
   # If not exists, regenerate (see Regenerating Deploy Keys section)
   ```

3. **Verify key is on VPS:**
   ```bash
   ssh -i /tmp/neondash_deploy root@31.97.170.4 "cat /root/.ssh/authorized_keys"
   ```

4. **Check authorized_keys format:**
   ```bash
   ssh -i /tmp/neondash_deploy root@31.97.170.4 "wc -l /root/.ssh/authorized_keys"
   # Must have 2+ lines (one per key)
   ```

5. **Verify GitHub Secret is updated:**
   ```bash
   gh secret set VPS_SSH_KEY --repo GrupoUS/neondash < /tmp/neondash_deploy
   ```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Permission denied (publickey)` | Key not in authorized_keys | Add key to VPS |
| `i/o timeout` | Network issue or VPS down | Check ping, firewall |
| `Connection refused` | SSH not running | Restart via Hostinger panel |
| Keys on same line | Silent SSH failure | Fix with proper newlines |

### Emergency Access via Hostinger Panel

If SSH is completely broken:
1. Login at https://hpanel.hostinger.com
2. VPS → Select server → Browser Console
3. Run commands directly in browser terminal
