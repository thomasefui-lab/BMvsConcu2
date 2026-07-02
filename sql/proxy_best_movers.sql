-- Onglet "Proxy des meilleurs" : top produits par évolution du nombre d'avis sur une période.
-- Exécuter dans Supabase SQL Editor après supabase_schema.sql et dashboard_views.sql.

-- 1) Jours de scrape réellement disponibles par site (pour alimenter les sélecteurs de période).
create or replace view scrape_days as
select
  site,
  date(scraped_at) as scrape_day,
  min(scraped_at)  as first_scraped_at,
  max(scraped_at)  as last_scraped_at,
  count(*)         as snapshot_count
from product_snapshots
group by site, date(scraped_at)
order by site, scrape_day;

grant select on scrape_days to anon, authenticated;

-- 2) Évolution d'avis bornée par période.
--    Pour chaque produit d'un site :
--      - snapshot de référence = dernier snapshot <= p_to dont scraped_at est le plus proche de p_from
--        (on prend le dernier snapshot connu au moment de la borne basse),
--      - snapshot de fin       = dernier snapshot <= p_to,
--      - delta = review_count(fin) - review_count(début),
--    puis on filtre review_count(début) >= 1 et delta > 0, et on renvoie les p_limit meilleurs.
--
--    On renvoie volontairement un peu large (p_limit ~ 200) : le regroupement "parent"
--    (déclinaisons couleur) est fait ensuite côté application, comme le reste du dashboard.
create or replace function review_growth_between(
  p_site  text,
  p_from  timestamptz,
  p_to    timestamptz,
  p_limit integer default 200
)
returns table (
  site            text,
  product_url     text,
  product_name    text,
  category_name   text,
  collection_name text,
  price_cents     integer,
  price_text      text,
  image_url       text,
  start_reviews   integer,
  end_reviews     integer,
  review_growth   integer,
  start_scraped_at timestamptz,
  end_scraped_at   timestamptz
)
language sql
stable
as $$
  with bounded as (
    select *
    from product_snapshots ps
    where ps.site = p_site
      and ps.scraped_at <= p_to
  ),
  start_snap as (
    -- dernier snapshot connu à la borne basse (<= p_from), sinon le plus ancien dans la fenêtre
    select distinct on (product_url) product_url, review_count, scraped_at
    from bounded
    where scraped_at <= p_from
    order by product_url, scraped_at desc
  ),
  start_fallback as (
    -- produits apparus après p_from : on prend leur premier snapshot dans la fenêtre
    select distinct on (product_url) product_url, review_count, scraped_at
    from bounded
    order by product_url, scraped_at asc
  ),
  end_snap as (
    select distinct on (product_url)
      product_url, review_count, scraped_at,
      product_name, category_name, collection_name, price_cents, price_text
    from bounded
    order by product_url, scraped_at desc
  ),
  merged as (
    select
      e.product_url,
      e.product_name,
      e.category_name,
      e.collection_name,
      e.price_cents,
      e.price_text,
      pr.image_url,
      coalesce(s.review_count, sf.review_count, 0) as start_reviews,
      coalesce(e.review_count, 0)                  as end_reviews,
      coalesce(s.scraped_at, sf.scraped_at)        as start_scraped_at,
      e.scraped_at                                 as end_scraped_at
    from end_snap e
    left join start_snap s      on s.product_url = e.product_url
    left join start_fallback sf on sf.product_url = e.product_url
    left join products pr       on pr.site = p_site and pr.url = e.product_url
  )
  select
    p_site as site,
    product_url,
    product_name,
    category_name,
    collection_name,
    price_cents,
    price_text,
    image_url,
    start_reviews,
    end_reviews,
    (end_reviews - start_reviews) as review_growth,
    start_scraped_at,
    end_scraped_at
  from merged
  where start_reviews >= 1
    and (end_reviews - start_reviews) > 0
  order by (end_reviews - start_reviews) desc, end_reviews desc
  limit p_limit;
$$;

grant execute on function review_growth_between(text, timestamptz, timestamptz, integer) to anon, authenticated;
