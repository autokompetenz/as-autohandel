# Import des véhicules réels

Importe les véhicules depuis un dossier local (`~/Pictures/AUTOMATIK` par défaut) :
chaque sous-dossier = 1 véhicule (photos numérotées + `info.txt`).

## Commande

```bash
# Simulation (aucune écriture)
npm run import:cars:dry

# Import réel (photos → Cloudinary + création en base)
npm run import:cars -- --price=19900

# Mettre à jour des véhicules déjà importés
npm run import:cars -- --update --only="Kia"
```

## Options

| Option | Effet |
|---|---|
| `--dry` | Simulation : affiche ce qui serait fait, sans rien écrire |
| `--update` | Met à jour les véhicules déjà présents (par défaut : ignorés) |
| `--only="texte"` | Ne traite que les dossiers contenant `texte` |
| `--price=19900` | Prix appliqué à tous les véhicules sans prix |
| `--no-upload` | Crée les véhicules sans uploader les photos |

## Prix

Les fiches `info.txt` **ne contiennent pas de prix**. Deux solutions :

1. `scripts/automatik-prices.json` — remplis les valeurs par nom de dossier,
   puis relance `npm run import:cars -- --update`.
2. `--price=NNNN` — applique un prix provisoire à tous les véhicules.

## Détection automatique

Le script déduit depuis le nom du dossier + `info.txt` :
marque, modèle, année, kilométrage, carburant, boîte, catégorie, puissance,
couleur, châssis, CO₂, contrôle technique, places, portes.

Si le `info.txt` d'un dossier ne correspond pas (kilométrage incohérent),
les valeurs du **nom du dossier** sont utilisées et un avertissement est affiché.

## Idempotence

Un véhicule déjà importé est reconnu par son numéro de châssis
(`technicalData.chassis`), sinon par marque + modèle + kilométrage.
Relancer le script sans `--update` ne crée donc pas de doublon.
