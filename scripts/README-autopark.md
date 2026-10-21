# Import Autopark GmbH → AS Autohandel

Importe les véhicules du site partenaire **autoparkgmbh.vercel.app**
(API publique `GET /api/cars`) vers la base Neon du site AS Autohandel.

- **170 véhicules**, jusqu'à 20 photos chacun (~2540 photos).
- Les photos sont **réhébergées sur Cloudinary** (dossier `autopark/cars`) :
  le site ne dépend plus des serveurs d'Autopark.
- Les données sont **nettoyées** : marque normalisée (`Mimi` → `Mini`),
  modèle débarrassé du préfixe de marque, catégorie et carburant déduits.

## Commande

```bash
# Simulation (aucune écriture, aucun upload)
node scripts/import-autopark.cjs --dry

# Import réel (photos → Cloudinary + création en base)
node scripts/import-autopark.cjs

# Mettre à jour des véhicules déjà importés
node scripts/import-autopark.cjs --update

# Créer les véhicules sans uploader les photos
node scripts/import-autopark.cjs --no-upload
```

## Options

| Option | Effet |
|---|---|
| `--dry` | Simulation : affiche ce qui serait fait, sans rien écrire |
| `--update` | Met à jour les véhicules déjà présents (par défaut : ignorés) |
| `--no-upload` | Crée les véhicules sans uploader les photos |

## Variables d'environnement

- `DATABASE_URL`, `DIRECT_URL` — cible Neon (lues dans `.env`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — destination des photos
- `AUTOPARK_API` *(facultatif)* — URL de l'API source, par défaut
  `https://autoparkgmbh.vercel.app/api/cars?limit=500`

## Reprise / cache photos

Le script garde un cache local dans `scripts/.autopark-cache/photos.json`
(associations `URL source → URL Cloudinary`). Si l'import est interrompu,
relancer la commande reprend là où il s'était arrêté **sans re-télécharger
ni re-uploader** les photos déjà traitées.

## Idempotence

Un véhicule déjà importé est reconnu par `technicalData.autoparkId`, sinon
par marque + modèle + kilométrage. Relancer sans `--update` ne crée donc pas
de doublon.

## Données de la source

L'API Autopark renvoie déjà : marque, modèle, année, prix, description,
carburant, boîte, kilométrage, couleur, puissance, catégorie, 20 images max,
mensualité et salaire minimum. Les véhicules importés sont marqués
`accidentFree = true` et `serviceHistory = true` (comme tous les véhicules du
site) et tracés via `technicalData = { source: 'autopark-b2b', autoparkId }`.
