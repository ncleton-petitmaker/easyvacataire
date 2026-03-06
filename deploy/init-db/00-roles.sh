#!/bin/bash
set -e

# This script runs as the superuser (supabase_admin) during container init.
# It creates all required Supabase roles with the same password as POSTGRES_PASSWORD.

psql -v ON_ERROR_STOP=1 --username supabase_admin --dbname postgres <<-EOSQL

-- Core roles
CREATE ROLE postgres SUPERUSER LOGIN PASSWORD '${POSTGRES_PASSWORD}';
CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE SUPERUSER LOGIN PASSWORD '${POSTGRES_PASSWORD}';
ALTER ROLE supabase_auth_admin SET search_path TO auth, public, extensions;
CREATE ROLE supabase_storage_admin NOINHERIT CREATEROLE LOGIN PASSWORD '${POSTGRES_PASSWORD}';
CREATE ROLE supabase_functions_admin NOINHERIT CREATEROLE LOGIN PASSWORD '${POSTGRES_PASSWORD}';
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD '${POSTGRES_PASSWORD}';
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
CREATE ROLE supabase NOLOGIN NOINHERIT;
ALTER ROLE supabase LOGIN PASSWORD '${POSTGRES_PASSWORD}';
CREATE ROLE dashboard_user NOSUPERUSER CREATEDB CREATEROLE REPLICATION;

-- Grants
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_admin TO authenticator;

-- Schemas
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION supabase_admin;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector";

-- Public schema defaults
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

EOSQL
