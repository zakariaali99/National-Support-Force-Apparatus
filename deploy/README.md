# Deploy runbook — plain VPS, no Docker

Matches PLAN.md's deploy decisions: single-origin (Django serves the built
frontend + WhiteNoise), Postgres, no containers. This is a runbook, not a
one-shot script — read it, adapt the paths/domain, then run the commands.

## 0. Prerequisites on the VPS

- Ubuntu/Debian with `python3.12`, `python3.12-venv`, `postgresql`,
  `nginx`, `git`.
- A non-root deploy user (e.g. `nasf`) that owns `/srv/nasf`.
- `pg_dump`/`psql` on PATH (installed with `postgresql-client`) — required
  by `backup_db`/`restore_db`.

## 1. Database

```bash
sudo -u postgres createuser nasf
sudo -u postgres createdb nasf -O nasf
sudo -u postgres psql -c "ALTER USER nasf WITH PASSWORD '<strong-password>';"
```

## 2. Application checkout + build

```bash
sudo mkdir -p /srv/nasf && sudo chown nasf:nasf /srv/nasf
sudo -u nasf git clone <repo-url> /srv/nasf
cd /srv/nasf/backend
python3.12 -m venv venv
venv/bin/pip install -r requirements.txt

cd /srv/nasf/frontend
npm ci
npm run build   # writes frontend/dist/ — collected as Django static files below
```

## 3. Environment

Create `/srv/nasf/backend/.env` (never committed — see `.gitignore`):

```
DJANGO_ENV=production
DJANGO_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(50))">
ALLOWED_HOSTS=nasf.example.ly
CORS_ALLOWED_ORIGINS=https://nasf.example.ly
POSTGRES_DB=nasf
POSTGRES_USER=nasf
POSTGRES_PASSWORD=<strong-password>
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
PRIVATE_MEDIA_ROOT=/srv/nasf/private_media
MEDIA_ROOT=/srv/nasf/media
BACKUP_ROOT=/srv/nasf/backups
BACKUP_ENCRYPTION_KEY=<separate long random secret — losing this makes existing backups unrecoverable, store it outside this server too>
DJANGO_SECURE_SSL_REDIRECT=True
```

`manage.py check --deploy` (see step 5) fails loudly if `DJANGO_SECRET_KEY`
or `ALLOWED_HOSTS` is missing/placeholder — that's intentional, not a bug.

## 4. Migrate, seed, collect static

```bash
cd /srv/nasf/backend
venv/bin/python manage.py migrate
venv/bin/python manage.py sync_field_requirements
venv/bin/python manage.py collectstatic --noinput
# Copy the built frontend into Django's static tree so WhiteNoise serves
# it single-origin (see PLAN.md's "Deploy target: single-origin" decision):
mkdir -p /srv/nasf/backend/staticfiles/app
cp -r /srv/nasf/frontend/dist/* /srv/nasf/backend/staticfiles/app/
```

Create the first admin user: `venv/bin/python manage.py createsuperuser`.

## 5. Pre-flight check

```bash
venv/bin/python manage.py check --deploy
```

Must print "System check identified no issues" before continuing — the
same check this project's CI/verification steps run after every phase.

## 6. gunicorn + systemd

`/etc/systemd/system/nasf.service`:

```ini
[Unit]
Description=NASF gunicorn
After=network.target postgresql.service

[Service]
User=nasf
Group=nasf
WorkingDirectory=/srv/nasf/backend
EnvironmentFile=/srv/nasf/backend/.env
ExecStart=/srv/nasf/backend/venv/bin/gunicorn config.wsgi:application \
    --bind 127.0.0.1:8000 --workers 3 --timeout 60
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nasf
sudo systemctl status nasf
```

## 7. nginx

`/etc/nginx/sites-available/nasf`:

```nginx
server {
    listen 80;
    server_name nasf.example.ly;

    client_max_body_size 20M;  # document/photo uploads

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nasf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d nasf.example.ly   # TLS; SECURE_SSL_REDIRECT expects this
```

## 8. Cron

Install the jobs in `deploy/crontab.example` (adjust paths first):

```bash
crontab -u nasf deploy/crontab.example
```

## 9. Restore drill (do this before you need it for real)

`restore_db` takes `--file <path>` pointing directly at an encrypted
`.sql.enc` — not just `--backup-id`, which is looked up via the ORM
*against the currently-connected database*. In a genuine disaster where
the database itself was destroyed, its `BackupRecord` table was destroyed
with it, so the file path (copy it off-host alongside `BACKUP_ENCRYPTION_KEY`
— see step 3) is the only metadata that survives. `--backup-id` is only
for restoring into a *separate* throwaway DB while the real one is still
intact, e.g. this drill.

```bash
# 1. On a throwaway DB — never against production:
createdb nasf_restore_drill

# 2. Point DATABASE settings at the drill DB temporarily
#    (POSTGRES_DB=nasf_restore_drill), then restore a real backup file into it:
venv/bin/python manage.py restore_db --yes --file /srv/nasf/backups/nasf-backup-2026-08-10-3.sql.enc

# 3. Sanity-check the restored data:
venv/bin/python manage.py shell -c "from apps.members.models import Member; print(Member.objects.count())"

# 4. Drop the drill DB:
dropdb nasf_restore_drill
```

Run this drill periodically (e.g. quarterly) and after any Postgres major
version upgrade — an untested backup is not a backup. This exact drill was
run once during development (2026-08-10) against a throwaway
`nasf_restore_drill` database and confirmed working end-to-end.

## Redeploying a new version

```bash
cd /srv/nasf && git pull
cd backend && venv/bin/pip install -r requirements.txt && venv/bin/python manage.py migrate
cd ../frontend && npm ci && npm run build && cp -r dist/* ../backend/staticfiles/app/
cd ../backend && venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart nasf
```
