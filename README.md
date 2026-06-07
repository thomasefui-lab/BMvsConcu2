# Dashboard veille mobilier — Best Mobilier

Application Next.js pour visualiser les données collectées par les 5 agents de scraping :

| Concurrent | Dossier agent |
|------------|---------------|
| **Best Mobilier** (vous) | `bestmobilier-supabase-github` |
| Bobochic | `Codex/.../bobochic_agent` |
| Sweeek | `sweeek-supabase-github` |
| Baita | `baita-supabase-github` |
| Habitat | `habitat-supabase-github` |

## 3 onglets

1. **Arborescence produits** — arbre visuel par concurrent (taxonomie commune : Salon, Séjour, Chambre, Extérieur, Enfant, Animaux, Luminaire & Déco)
2. **Nouveautés** — tableau croisé concurrents × catégories + top 10 nouveautés par hausse d'avis (produit sans avis à la première apparition)
3. **Best sellers** — top 10 par avis totaux + top 10 par évolution d'avis depuis la première collecte

## Démarrage local

```bash
cd mobilier-veille-dashboard
npm install

# Générer les données démo depuis vos CSV locaux
node scripts/build-demo-data.mjs

npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Sans Supabase configuré, le dashboard utilise `public/demo-data.json` (généré depuis les CSV des agents).

## Supabase (recommandé)

1. Créer un projet Supabase
2. Exécuter `sql/supabase_schema.sql`
3. Configurer chaque agent avec les mêmes `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
4. Copier `.env.example` vers `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

5. Relancer `npm run dev` — le dashboard bascule automatiquement sur Supabase

## Déploiement Vercel

1. Pousser ce dossier sur GitHub
2. [vercel.com](https://vercel.com) → Import Project
3. Ajouter les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Taxonomie commune

La classification repose sur les mots-clés du nom produit + le mapping des catégories scrapées de chaque site. Fichier : `src/lib/taxonomy.ts`.

Pour affiner : ajouter des mots-clés ou des mappings `SITE_CATEGORY_MAP`.

## Photos produits

Les scrapers actuels ne collectent pas encore `image_url`. Le dashboard tente des heuristiques (Habitat, Baita) et affiche sinon une vignette colorée avec lien direct vers la fiche produit.

Pour des photos fiables : ajouter `image_url` dans les scrapers et la table `product_snapshots`.
