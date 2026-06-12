# Production Acceptance

This checklist is for the main Runvara audience: personal use and small teams running a lightweight self-hosted gateway.

## Run The Script

Start Runvara first, then run:

```bash
scripts/acceptance.sh
```

Default mode verifies the control plane and safety policies without making a real upstream model call.

To include one real `/v1/messages` call through the created API key:

```bash
scripts/acceptance.sh --upstream
```

## What It Checks

The script verifies:

- `/health` is reachable.
- Dashboard URL is reachable when `RUNVARA_DASHBOARD_URL` points to it.
- Admin login works.
- Authenticated `/v1/models` works.
- A temporary user can be created.
- A temporary API key can be created.
- API key IP restriction rejects a disallowed client IP.
- API key spend limit rejects an over-limit request before upstream routing.
- Audit events are recorded.
- Full local backup export and validation work.
- Temporary user and key are cleaned up.

`--upstream` additionally verifies:

- The same temporary API key can make a successful real model request when IP policy allows it.

## Environment

The script reads `.env` through the shared script loader. Required values:

```env
RUNVARA_BIND=127.0.0.1:17878
RUNVARA_AUTH_TOKEN=...
RUNVARA_ADMIN_USERNAME=admin
RUNVARA_ADMIN_PASSWORD=...
```

Optional:

```env
RUNVARA_DASHBOARD_URL=http://127.0.0.1:5173
```

The script requires `curl` and `node`. `node` is already part of the dashboard toolchain.

## Docker Compose

For Docker Compose:

```bash
cp deploy/docker/runvara.env.example .env
nano .env
docker compose up -d --build
RUNVARA_DASHBOARD_URL=http://127.0.0.1:5173 scripts/acceptance.sh
```

If you published the dashboard or API on different host ports, adjust `RUNVARA_BIND` and `RUNVARA_DASHBOARD_URL` in `.env` or in the command environment.

## Interpreting Results

Passing default acceptance means Runvara is ready for personal or small-team trial production.

Passing `--upstream` means the full path is working:

```text
Claude-compatible client -> Runvara auth/policy -> provider route -> upstream model
```

If default acceptance passes but `--upstream` fails, investigate provider credentials, model names, base URL, or upstream quota.
