# Import des véhicules depuis Supabase

Importe les véhicules du projet Supabase `autokompetenz`
(`https://nnxwwgoxvmfypnjfemmc.supabase.co`) vers la base **Neon** du site
AS Autohandel.

## Prérequis

Deux variables d'environnement (à mettre dans `.env`, **jamais commit**) :

```bash
SUPABASE_URL="https://nnxwwgoxvmfypnjfemmc.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<clé service_role>"
```

Elles existent déjà sur Vercel dans le projet `autokompetenz`.

## Commande

```bash
# Simulation
npm run import:supabase:dry

# Import réel
npm run import:supabase

# Mettre à jour les véhicules déjà importés
npm run import:supabase -- --update
```

## Comportement

- **Photos** : restent hébergées sur **Supabase Storage** (bucket public `cars`).
  Les URLs `https://…supabase.co/storage/v1/object/public/cars/…` sont publiques
  et directement utilisables par le site.
- **Id** : laissés à Neon (`autoincrement`) pour éviter toute collision avec les
  véhicules existants.
- **Idempotence** : un véhicule déjà présent (même **marque + modèle + km**)
  est ignoré. `--update` écrase ses données.
- Les colonnes du nouveau schéma absentes de Supabase (`technicalData`,
  `firstRegistration`, …) sont laissées vides ou initialisées par défaut.
- La provenance est enregistrée dans `technicalData.supabaseId`.

## ⚠️ Ne pas laisser les clés dans le dépôt

`SUPABASE_SERVICE_ROLE_KEY` donne un accès **total** à la base Supabase.
La régénérer après usage (Supabase → Settings → API → *Roll key*).
