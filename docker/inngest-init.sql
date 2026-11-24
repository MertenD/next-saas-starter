-- Runs once on the first start of an empty Postgres volume (see docker-compose.prod.yml).
-- Gives the self-hosted Inngest server its own database, separate from the app data.
CREATE DATABASE inngest_db;
