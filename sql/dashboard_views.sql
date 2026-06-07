-- Vues optimisées pour le dashboard (évite de charger tout l'historique product_snapshots)
-- Exécuter dans Supabase SQL Editor après supabase_schema.sql

-- Dernier état connu par produit (1 ligne / produit)
create or replace view latest_product_snapshots as
select distinct on (site, product_url)
  *
from product_snapshots
order by site, product_url, scraped_at desc;

-- Premier snapshot par produit (pour calculer l'évolution d'avis)
create or replace view first_product_snapshots as
select distinct on (site, product_url)
  site,
  product_url,
  review_count as first_review_count,
  scraped_at as first_scraped_at
from product_snapshots
order by site, product_url, scraped_at asc;

-- Vue combinée pour le dashboard (recommandée)
-- DROP nécessaire si la vue existe déjà avec d'autres colonnes (PostgreSQL interdit d'insérer au milieu)
drop view if exists dashboard_products;

create view dashboard_products as
select
  l.site,
  l.category_name,
  l.category_url,
  l.product_url,
  l.product_name,
  l.collection_name,
  l.price_cents,
  l.price_text,
  l.review_count,
  l.badges,
  l.position,
  l.scraped_at,
  coalesce(l.image_url, p.image_url) as image_url,
  f.first_review_count,
  f.first_scraped_at
from latest_product_snapshots l
left join first_product_snapshots f
  on f.site = l.site and f.product_url = l.product_url
left join products p
  on p.site = l.site and p.url = l.product_url;

-- Accès lecture pour le dashboard (clé anon)
grant select on latest_product_snapshots to anon, authenticated;
grant select on first_product_snapshots to anon, authenticated;
grant select on dashboard_products to anon, authenticated;
