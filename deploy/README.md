# Deployment auf sotto.piecekeeper.art

Server: Hostinger VPS `46.225.126.167` (ssh hostinger-roots)

## Voraussetzungen

- Docker + Docker Compose auf dem Server (vorhanden)
- DNS A-Record für `sotto.piecekeeper.art` → `46.225.126.167`

## 1. DNS einrichten

Im Hostinger DNS-Panel für `piecekeeper.art`:
- A-Record: `sotto` → `46.225.126.167`

## 2. Repo auf den Server klonen

```bash
ssh hostinger-roots
cd /opt
git clone https://github.com/Hacklerflow/sotto.git
cd sotto
```

## 3. Environment-Variablen

```bash
cp .env.example .env
# Dann .env editieren:
# IDENTITY_DB_PASSWORD=<starkes Passwort>
# ANSWER_DB_PASSWORD=<anderes starkes Passwort>
# ADMIN_SECRET=<Admin-Token>
```

## 4. Container starten

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 5. nginx konfigurieren

```bash
sudo cp deploy/nginx-sotto.conf /etc/nginx/sites-available/sotto
sudo ln -s /etc/nginx/sites-available/sotto /etc/nginx/sites-enabled/sotto
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Testen

```bash
curl -I http://sotto.piecekeeper.art
```

HTTPS wird von Hostingers Infrastruktur-Layer terminiert (kein Caddy/Certbot nötig).

## Updates deployen

```bash
cd /opt/sotto
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Backups

```bash
# Identity-DB
docker compose -f docker-compose.prod.yml exec sotto-identity-db \
  pg_dump -U sotto sotto_identity > backup-identity-$(date +%F).sql

# Answer-DB
docker compose -f docker-compose.prod.yml exec sotto-answer-db \
  pg_dump -U sotto sotto_answer > backup-answer-$(date +%F).sql
```

## Architektur

```
Hostinger TLS-Proxy (443) → nginx (80) → sotto-web (3100)
                                            ├── sotto-identity-db (intern)
                                            └── sotto-answer-db (intern)
```

- Kein Caddy: Hostinger managed TLS
- Datenbanken nur intern erreichbar (kein Port-Mapping nach außen)
- Web-Container nur auf localhost:3100 (kein direkter Zugriff)
