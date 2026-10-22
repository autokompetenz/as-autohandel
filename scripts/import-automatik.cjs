// Import des véhicules réels depuis ~/Pictures (ou ~/Pictures/AUTOMATIK)
// ---------------------------------------------------------------
// Chaque dossier = 1 véhicule : photos + `info.txt` (fiche).
// Le script :
//   1. lit le dossier et parse le nom + info.txt (marque, modèle, année, km,
//      carburant, puissance, couleur, boîte, catégorie, châssis, CO2, CT…)
//   2. upload les photos vers Cloudinary
//   3. crée (ou met à jour) le véhicule en base
//
// Formats de fiche acceptés :
//   • "Label : valeur"                      (fiches AUTOMATIK)
//   • "Label\nvaleur"                       (nouvelles fiches sans deux-points)
//
// Formats de nom de dossier acceptés :
//   • "<Marque> <Modèle> - <Carburant> - <Boîte> - X hp - Y km - PRIX€"
//   • "BMW - 2016 - 730 D - Voiture particulière - 13500€"
//   • "2021 BMW X2 sDrive20i F2X (F39) Voiture - 11400€"
// Si un prix figure dans le nom du dossier, il est utilisé tel quel et marqué
// `priceAdjusted` pour que adjust-prices.cjs ne rajoute pas la marge une 2e fois.
//
// Les PRIX absents du dossier et de la fiche se renseignent soit via
// `scripts/automatik-prices.json` (clé = nom du dossier), soit via --price=NNNN.
// Les corrections ponctuelles (puissance/couleur manquantes…) vont dans
// `scripts/automatik-overrides.json`.
//
// Idempotent : un véhicule déjà présent est identifié par son numéro de châssis
// (technicalData.chassis) ou par marque+modèle+km. Utiliser --update pour
// rafraîchir un véhicule existant, --dry pour une simulation sans écriture.
//
// Usage :
//   node scripts/import-automatik.cjs --dry
//   node scripts/import-automatik.cjs --update --only="Kia"
//   node scripts/import-automatik.cjs --no-upload
//   node scripts/import-automatik.cjs --price=24900

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

const SOURCE_DIR = process.env.AUTOMATIK_DIR
  || path.join(process.env.HOME || '/home/headshoot', 'Pictures', 'AUTOMATIK');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const UPDATE = args.includes('--update');
const NO_UPLOAD = args.includes('--no-upload');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').split('=')[1] || null;
const PRICE_FROM = Number((args.find(a => a.startsWith('--price=')) || '').split('=')[1]) || null;

// Prix par dossier (facultatif) — scripts/automatik-prices.json
// { "Abarth 595 1.4 T-jet Turismo - Essence - Automatique - 165 hp - 43.110 km": 18900, ... }
const PRICES_FILE = path.join(__dirname, 'automatik-prices.json');
const PRICES = fs.existsSync(PRICES_FILE)
  ? JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'))
  : {};

// Corrections manuelles par dossier — scripts/automatik-overrides.json
// { "2021 BMW X2 sDrive20i ... - 11400€": { "power": 192, "color": "Gris" } }
const OVERRIDES_FILE = path.join(__dirname, 'automatik-overrides.json');
const OVERRIDES = fs.existsSync(OVERRIDES_FILE)
  ? JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'))
  : {};
const overrideFor = (title) => {
  const t = String(title).trim();
  const key = Object.keys(OVERRIDES).find(k => !k.startsWith('_') && k.trim() === t);
  return key ? OVERRIDES[key] : {};
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const num = (v) => {
  if (v === null || v === undefined) return null;
  const m = String(v).replace(/[^\d]/g, '');
  return m ? Number(m) : null;
};

function pmt(price, months = 60, rate = 0.06) {
  const r = rate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

// "10/06/2021" → Date
function frDate(v) {
  if (!v) return null;
  const m = String(v).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00.000Z`);
  return isNaN(d) ? null : d;
}

// Carburant du site : Essence | Diesel | Electrique | Hybride
// MHEV / mild-hybrid = simple alterno-démarreur → reste Essence ou Diesel.
function normFuel(raw, dirName) {
  const dir = (dirName || '').toLowerCase();
  const info = (raw || '').toLowerCase();
  const s = `${info} ${dir}`;

  if (/mhev|mild[- ]?hybride?|hybride léger|hybride leger/.test(info) && !/phev|rechargeable/.test(info)) {
    // hybride léger : on garde le carburant thermique réel
    return /diesel/.test(dir) ? 'Diesel' : 'Essence';
  }
  if (/électrique|electrique|e-tron|\bélectrique\b/.test(s) && !/hybride|phev/.test(s)) return 'Electrique';
  if (/phev|rechargeable|\bhev\b|hybride/.test(s)) return 'Hybride';
  if (/diesel|cdi|tdi|t-gdi.*diesel/.test(dir)) return 'Diesel';
  if (/diesel|cdi/.test(info)) return 'Diesel';
  return 'Essence';
}

// Catégorie du site : Berline|SUV|Citadine|Break|Coupe|Monospace|Utilitaire|FourX4
function normCategory(bodyType, dirName) {
  const dir = (dirName || '').toLowerCase();
  const body = (bodyType || '').toLowerCase();

  // Modèles dont la carrosserie "officielle" prête à confusion
  if (/\beqs\b|\beqe\b/.test(dir)) return 'Berline';

  // Type de carrosserie issu de la fiche = source la plus fiable
  if (/utilitaire|camionnette|fourgon|camion/.test(body)) return 'Utilitaire';
  if (/suv|tout-terrain|4x4|crossover/.test(body)) return 'SUV';
  if (/break|shooting brake|station wagon/.test(body)) return 'Break';
  if (/coup[eé]/.test(body)) return 'Coupe';
  if (/monospace|minibus|van familial/.test(body)) return 'Monospace';
  if (/berline|limousine|sedan/.test(body)) return 'Berline';
  if (/compact|citadine|hayon|hatchback|kombi|kleinwagen/.test(body)) return 'Citadine';

  // Sinon : nom du dossier
  if (/pick-?up|wrangler|vito|sprinter|transporter|utilitaire|camion/.test(dir)) return 'Utilitaire';
  if (/suv|tonale|sorento|glc|gla|q2\b|q5\b|x3\b|x5\b|x1\b|x2\b|x6\b|tiguan|tucson|sportage|rav4|cx-5|wrangler/.test(dir)) return 'SUV';
  if (/shooting brake|avant|combi|touring|variant|\bsw\b/.test(dir)) return 'Break';
  if (/coup[eé]|\bm4\b|4 series/.test(dir)) return 'Coupe';
  if (/monospace|touran|espace/.test(dir)) return 'Monospace';
  if (/\b730\b|\b740\b|\b520e\b|\b520i\b|\b530e\b|\b318i\b|\b320i\b|7 series|5 series|3 series|a6\b|berline|cla\b|\bsedan\b/.test(dir)) return 'Berline';
  return 'Citadine';
}

// Le nom de dossier peut suivre plusieurs formats :
//   "<Marque> <Modèle> - <Carburant> - <Boîte> - X hp - Y km - PRIX€"
//   "BMW - 2016 - 730 D - Voiture particulière - 13500€"
//   "2021 BMW X2 sDrive20i F2X (F39) Voiture - 11400€"
function parseDirName(dir) {
  const clean = dir.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = clean.split(/\s+-\s+/).map(s => s.trim());
  const head = parts[0];
  const known = ['Mercedes-Benz', 'Alfa Romeo', 'Land Rover', 'Aston Martin'];
  let make = null;
  for (const k of known) if (head.toLowerCase().startsWith(k.toLowerCase())) { make = k; break; }
  if (!make) make = head.split(' ')[0];
  let model = head.slice(make.length).trim().replace(/^[-–]\s*/, '');
  // Nettoie les mots parasites issus du nom de dossier
  model = model
    .replace(/\b(voiture particuli[èe]re|voiture de tourisme|voiture|fahrzeug)\b/gi, ' ')
    .replace(/\s+/g, ' ').trim();
  // "1 Series 116i" → "Série 1 116i" (nommage français du site)
  model = model.replace(/\b(\d)\s*Series\b/gi, 'Série $1');
  const hp = (clean.match(/(\d{2,4})\s*hp/i) || [, null])[1];
  const km = (clean.match(/([\d. ]{3,})\s*km\b/i) || [, null])[1];
  // Prix : dernier nombre qui précède le symbole € (souvent collé au nom)
  const price = num((clean.match(/(\d[\d. ]*)\s*€\s*$/) || [, null])[1]);
  // Année : 19xx/20xx isolé (le prix et le kilométrage ne matchent pas)
  const year = (clean.match(/\b(19|20)\d{2}\b/) || [null])[0];
  return { title: clean, make, model: model || head, hp: num(hp), km: num(km), price, year: num(year) };
}

const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Les fiches existent sous deux formes :
//   1. "Label : valeur"                (fiches AUTOMATIK)
//   2. "Label\nvaleur"                 (nouvelles fiches, sans deux-points)
function parseInfo(txtRaw) {
  // Apostrophes typographiques + espaces insécables → caractères simples
  const txt = String(txtRaw || '')
    .replace(/[\u2018\u2019\u02BC\u00B4]/g, "'")
    .replace(/\u00A0/g, ' ');

  const getColon = (labels) => {
    for (const label of [].concat(labels)) {
      const m = txt.match(new RegExp(`^[ \\t]*${escRe(label)}[ \\t]*:[ \\t]*(.+)$`, 'im'));
      if (m) return m[1].trim();
    }
    return null;
  };

  const getFlat = (labels) => {
    for (const label of [].concat(labels)) {
      const m = txt.match(new RegExp(`^[ \\t]*${escRe(label)}[ \\t]*\\r?\\n[ \\t]*([^\\r\\n]+)`, 'im'));
      if (m) return m[1].trim();
    }
    return null;
  };

  const get = (labels) => getColon(labels) ?? getFlat(labels);

  return {
    make: get('Marque'),
    model: get('Nom modèle'),
    chassis: get('Numéro de châssis'),
    chassisShort: get('Numéro de châssis (court)'),
    production: get('Date de production'),
    firstRegistration: get(['Première immatriculation', 'Date première autorisation']),
    modelYear: get(['Année du modèle', 'Année']),
    mileage: get(['Kilométrage', 'Kilométrage relevé', "Kilométrage relevé à l'admission (km)"]),
    lastService: get('Dernier entretien'),
    inspection: get('Validité du contrôle technique'),
    keys: get('Nombre de clés'),
    fuel: get(['Carburant', 'Type de carburant']),
    displacement: get('Cylindrée'),
    power: get(['Puissance', 'Puissance (cv)', 'Puissance (kw)']),
    transmission: get(['Transmission', 'Type de transmission']),
    emissionNorm: get(["Norme d'émission", "Norme d'émission de CO2"]),
    co2: get(['Émissions de CO2', 'Emission CO2 (NEDC)']),
    bodyType: get(['Type de carrosserie', 'Carrosserie']),
    doors: get(['Portes', 'Nombre de portes']),
    seats: get(['Places', 'Nombre de places', 'Nombre de places assises']),
    exteriorColor: get(['Couleur extérieure', 'Couleur']),
    interiorColor: get(["Couleur intérieure", "Couleur de l'intérieur"]),
    awd: /^oui/i.test(get('Quatre roues motrices') || ''),
    price: get('Prix'),
  };
}

// Couleurs : normalise "carcolor.Grey" → "Gris", "gris" → "Gris"
const COLOR_MAP = {
  grey: 'Gris', gray: 'Gris', black: 'Noir', white: 'Blanc', blue: 'Bleu',
  red: 'Rouge', silver: 'Argent', green: 'Vert', brown: 'Marron', beige: 'Beige',
  yellow: 'Jaune', orange: 'Orange', purple: 'Violet',
};
function normColor(raw) {
  if (!raw) return null;
  const c = String(raw).replace(/^carcolor\./i, '').trim();
  if (!c) return null;
  const mapped = COLOR_MAP[c.toLowerCase()];
  if (mapped) return mapped;
  return c.charAt(0).toUpperCase() + c.slice(1);
}

const POWER_CH = (raw) => {
  const s = String(raw || '');
  let m = s.match(/(\d+)\s*(?:CH|hp|PS)\b/i);
  if (m) return Number(m[1]);
  m = s.match(/(\d+(?:[.,]\d+)?)\s*kW\b/i);
  if (m) return Math.round(Number(m[1].replace(',', '.')) * 1.35962);
  return null;
};

// ─── Cloudinary ─────────────────────────────────────────────────────────────

async function uploadPhotos(dirPath, files, slug) {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const abs = path.join(dirPath, files[i]);
    const res = await cloudinary.uploader.upload(abs, {
      folder: 'automatik/cars',
      public_id: `${slug}-${String(i + 1).padStart(2, '0')}`,
      resource_type: 'image',
      unique_filename: false,
      overwrite: true,
    });
    urls.push(res.secure_url);
    process.stdout.write(`\r    ⬆ ${i + 1}/${files.length} photos`);
  }
  if (files.length) process.stdout.write('\n');
  return urls;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`✗ Dossier source introuvable : ${SOURCE_DIR}`);
    process.exit(1);
  }

  const dirs = fs.readdirSync(SOURCE_DIR)
    .filter(d => fs.statSync(path.join(SOURCE_DIR, d)).isDirectory())
    .filter(d => !ONLY || d.toLowerCase().includes(ONLY.toLowerCase()));

  console.log(`📦 Source : ${SOURCE_DIR}`);
  console.log(`   ${dirs.length} dossier(s) à traiter${DRY ? '  [DRY-RUN]' : ''}${NO_UPLOAD ? '  [sans upload]' : ''}\n`);

  let created = 0, updated = 0, skipped = 0;
  const problems = [];

  for (const dir of dirs) {
    const dirPath = path.join(SOURCE_DIR, dir);
    const name = parseDirName(dir);

    const files = fs.readdirSync(dirPath)
      .filter(f => /\.(jpe?g|png|webp|avif|bmp|gif)$/i.test(f))
      .sort((a, b) => {
        const na = parseInt(a, 10), nb = parseInt(b, 10);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b, undefined, { numeric: true });
      })
      .slice(0, 20); // schema Prisma : 20 images max

    const infoPath = path.join(dirPath, 'info.txt');
    const hasInfo = fs.existsSync(infoPath);
    const info = hasInfo ? parseInfo(fs.readFileSync(infoPath, 'utf8')) : {};

    const infoKm = num(info.mileage);
    // Si la fiche ne correspond pas au dossier (info.txt copié d'un autre véhicule),
    // le nom du dossier fait foi : on neutralise la fiche incohérente.
    const infoMatchesDir = !infoKm || !name.km || Math.abs(infoKm - name.km) / name.km < 0.15;
    if (!infoMatchesDir) {
      problems.push(`${name.title} : info.txt incohérent (fiche ${infoKm} km vs dossier ${name.km} km) — valeurs du dossier utilisées`);
      Object.keys(info).forEach(k => { info[k] = null; });
    }
    const ov = overrideFor(name.title);
    const year = num(ov.year) || num(info.modelYear)
      || name.year
      || frDate(info.firstRegistration)?.getFullYear()
      || new Date().getFullYear();
    const km = num(ov.km) || num(info.mileage) || name.km || 0;
    const make = info.make || name.make;
    const model = info.model || name.model;
    const power = ov.power ?? POWER_CH(info.power) ?? name.hp ?? null;
    const fuel = ov.fuel || normFuel(info.fuel, dir);
    const category = ov.category || normCategory(info.bodyType, dir);
    const transmission = ov.transmission
      || (/manuelle|manuell/i.test(info.transmission || dir) ? 'Manuelle' : 'Automatique');
    const color = normColor(ov.color ?? info.exteriorColor) || null;
    const priceFromName = !num(info.price) && !!name.price;
    const price = num(info.price)
      || name.price
      || PRICES[name.title]
      || PRICES[Object.keys(PRICES).find(k => k.trim() === name.title.trim())]
      || PRICE_FROM
      || 0;

    const technicalData = {
      chassis: info.chassis || null,
      chassisShort: info.chassisShort || null,
      production: info.production || null,
      firstRegistration: info.firstRegistration || null,
      lastService: info.lastService || null,
      inspection: info.inspection || null,
      keys: num(info.keys),
      displacement: info.displacement || null,
      emissionNorm: info.emissionNorm || null,
      co2: info.co2 || null,
      doors: num(info.doors),
      seats: num(info.seats),
      interiorColor: normColor(info.interiorColor),
      awd: !!info.awd,
      sourceFolder: name.title,
      // Prix issu du nom du dossier = prix de vente final : on le verrouille pour
      // que scripts/adjust-prices.cjs ne rajoute pas une seconde fois la marge.
      ...(priceFromName ? { priceAdjusted: '1500' } : {}),
    };

    const description = [
      `${name.title}`,
      '',
      'IDENTIFICATION',
      info.chassis ? `Numéro de châssis : ${info.chassis}` : null,
      info.firstRegistration ? `Première immatriculation : ${info.firstRegistration}` : null,
      info.modelYear ? `Année du modèle : ${info.modelYear}` : null,
      '',
      'ÉTAT ET HISTORIQUE',
      `Kilométrage : ${km ? km.toLocaleString('fr-FR') + ' km' : '—'}`,
      info.lastService ? `Dernier entretien : ${info.lastService}` : null,
      info.inspection ? `Validité du contrôle technique : ${info.inspection}` : null,
      info.keys ? `Nombre de clés : ${info.keys}` : null,
      '',
      'MOTORISATION',
      info.fuel ? `Carburant : ${info.fuel}` : null,
      info.displacement ? `Cylindrée : ${info.displacement}` : null,
      info.power ? `Puissance : ${info.power}` : null,
      info.transmission ? `Transmission : ${info.transmission}` : null,
      info.emissionNorm ? `Norme d'émission : ${info.emissionNorm}` : null,
      info.co2 ? `Émissions de CO2 : ${info.co2}` : null,
      '',
      'CARROSSERIE ET INTÉRIEUR',
      info.bodyType ? `Type de carrosserie : ${info.bodyType}` : null,
      info.doors ? `Portes : ${info.doors}` : null,
      info.seats ? `Places : ${info.seats}` : null,
      info.exteriorColor ? `Couleur extérieure : ${info.exteriorColor}` : null,
      info.interiorColor ? `Couleur intérieure : ${info.interiorColor}` : null,
    ].filter(l => l !== null).join('\n').trim();

    // Identification d'un véhicule déjà importé
    let existing = null;
    if (info.chassis) {
      existing = await prisma.car.findFirst({
        where: { technicalData: { path: ['chassis'], equals: info.chassis } },
      });
    }
    if (!existing) {
      existing = await prisma.car.findFirst({
        where: { make, model, year: year || undefined, mileage: km },
      });
    }
    if (!existing) {
      existing = await prisma.car.findFirst({
        where: { make, model, mileage: km },
      });
    }

    console.log(`• ${name.title}`);
    console.log(`    ${make} | ${model} | ${year} | ${km.toLocaleString('fr-FR')} km | ${fuel} | ${transmission} | ${category} | ${power || '?'} ch | ${color || '?'} | ${files.length} photos${hasInfo ? '' : '  ⚠ pas de info.txt'}`);

    if (existing && !UPDATE) {
      skipped++;
      console.log(`    = déjà en base (id ${existing.id}) — ignoré\n`);
      continue;
    }
    if (!year) problems.push(`${name.title} : année inconnue`);
    if (!price) problems.push(`${name.title} : prix inconnu (utiliser --price=NNNNN)`);

    if (DRY) {
      created += existing ? 0 : 1;
      if (existing) updated++;
      console.log(`    → ${existing ? 'mise à jour' : 'création'} simulée\n`);
      continue;
    }

    let images = {};
    if (!NO_UPLOAD && files.length) {
      const slug = `${make}-${model}-${km}`
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
      try {
        const urls = await uploadPhotos(dirPath, files, slug);
        urls.forEach((url, i) => { images[i === 0 ? 'imageUrl' : `imageUrl${i + 1}`] = url; });
      } catch (e) {
        problems.push(`${name.title} : upload échoué (${e.message})`);
        console.log(`    ✗ upload échoué : ${e.message}\n`);
        continue;
      }
    }

    const monthlyPayment = price ? pmt(price * 0.75) : null;
    const minSalary = monthlyPayment ? Math.max(1500, Math.round((monthlyPayment * 3) / 50) * 50) : null;

    const data = {
      make, model, year: year || new Date().getFullYear(),
      price: price || 0, description, fuelType: fuel, transmission, mileage: km,
      color, power, category, monthlyPayment, minSalary,
      featured: false, promotional: false, isActive: true,
      previousOwners: km > 60000 ? 2 : 1, accidentFree: true, serviceHistory: true,
      firstRegistration: frDate(info.firstRegistration),
      lastInspection: frDate(info.inspection),
      historyNotes: info.lastService ? `Dernier entretien : ${info.lastService}` : null,
      technicalData,
      ...images,
    };

    try {
      if (existing) {
        await prisma.car.update({ where: { id: existing.id }, data });
        updated++;
        console.log(`    ✓ mis à jour (id ${existing.id}) — ${Object.keys(images).length} photo(s)\n`);
      } else {
        const car = await prisma.car.create({ data });
        created++;
        console.log(`    ✓ créé (id ${car.id}) — ${Object.keys(images).length} photo(s)\n`);
      }
    } catch (e) {
      problems.push(`${name.title} : ${e.message}`);
      console.log(`    ✗ erreur base : ${e.message}\n`);
    }
  }

  console.log('─'.repeat(60));
  console.log(`✓ ${created} créé(s) · ${updated} mis à jour · ${skipped} ignoré(s)`);
  if (problems.length) {
    console.log('\n⚠ Points à vérifier :');
    problems.forEach(p => console.log(`   - ${p}`));
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
