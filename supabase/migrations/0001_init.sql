-- Ensure required extensions
create extension if not exists pgcrypto;

-- Schema for metadata: POIs, tiles, vectors
create schema if not exists world;

create table if not exists world.poi (
  poi_id text primary key,
  type text not null check (type in ('settlement','quest','landmark','other')),
  subtype text not null,
  name text not null,
  lat double precision not null,
  lon double precision not null,
  tile text,
  elevation_m integer,
  tags text[] default '{}',
  pop_est integer,
  economy jsonb,
  links jsonb,
  lore_ref jsonb,
  visibility text not null default 'dm_only' check (visibility in ('dm_only','player_on_reveal','public')),
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists world.tile_index (
  seed text not null,
  z integer not null,
  x integer not null,
  y integer not null,
  has_height boolean default false,
  has_flow boolean default false,
  has_biome boolean default false,
  has_vectors boolean default false,
  locked boolean default false,
  primary key (seed, z, x, y)
);

create table if not exists world.vectors (
  id uuid primary key default gen_random_uuid(),
  seed text not null,
  z integer not null,
  x integer not null,
  y integer not null,
  layer text not null check (layer in ('rivers','coast','roads','borders','poi')),
  geojson jsonb not null,
  created_at timestamptz not null default now()
);

-- helper index
create index if not exists idx_vectors_seed_zyx on world.vectors(seed,z,x,y);


