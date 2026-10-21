// Import des véhicules depuis autoparkgmbh.vercel.app → Neon (as-autohandel)
// ---------------------------------------------------------------------------
// Source : API publique `GET https://autoparkgmbh.vercel.app/api/cars`
//          170 véhicules, jusqu'à 20 photos chacun.
//
// Le script :
//   1. récupère les véhicules depuis l'API Autopark
//   2. nettoie/normalise les données (marque, modèle, catégorie, carburant…)
//   3. télécharge chaque photo et la réhéberge sur Cloudinary (dossier
//      `autopark/cars`) — un cache local évite de re-télécharger/uploader les
//      photos déjà traitées lors d'une reprise.
//   4. crée (ou met à jour) le véhicule dans la base Neon
//
// Idempotent : un véhicule déjà présent est identifié par marque + modèle +
// kilométrage, ou par `technicalData.autoparkId`. Utiliser --update pour
// rafraîchir un véhicule existant, --dry pour simuler, --no-upload pour ne pas
// toucher aux photos.
//
// Usage :
//   node scripts/import-autopark.cjs --dry
//   node scripts/import-autopark.cjs
//   node scripts/import-autopark.cjs --update
//   node scripts/import-autopark.cjs --no-upload
//
// Variables d'environnement requises :
//   DATABASE_URL, DIRECT_URL            (cible Neon)
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

const SOURCE_API = process.env.AUTOPARK_API || 'https://autoparkgmbh.vercel.app/api/cars?limit=500';
const CACHE_DIR = path.join(__dirname, '.autopark-cache');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const UPDATE = args.includes('--update');
const NO_UPLOAD = args.includes('--no-upload');
const ONLY_AP = (args.find(a => a.startsWith('--only-ap=')) || '').split('=')[1] || null;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Normalisation ──────────────────────────────────────────────────────────

const FUELS = ['Essence', 'Diesel', 'Electrique', 'Hybride'];
const TRANSMISSIONS = ['Manuelle', 'Automatique'];
const CATEGORIES = ['Berline', 'SUV', 'Citadine', 'Break', 'Coupe', 'Monospace', 'Utilitaire', 'FourX4'];

// Marques Autopark → libellés propres (corrige « Mimi », espaces, casse…)
const MAKE_FIX = {
  'mimi': 'Mini',
  'mercedes benz': 'Mercedes-Benz',
  'mercedes-benz': 'Mercedes-Benz',
  'mercedes-amg': 'Mercedes-AMG',
  'audi': 'Audi',
  'bmw': 'BMW',
  'volkswagen': 'Volkswagen',
  'skoda': 'Škoda',
  'citroen': 'Citroën',
  'seat': 'SEAT',
  'land rover': 'Land Rover',
  'nissan': 'Nissan',
  'opel': 'Opel',
  'toyota': 'Toyota',
  'hyundai': 'Hyundai',
  'kia': 'Kia',
  'renault': 'Renault',
  'peugeot': 'Peugeot',
  'volvo': 'Volvo',
  'jaguar': 'Jaguar',
  'tesla': 'Tesla',
  'mazda': 'Mazda',
  'honda': 'Honda',
  'jeep': 'Jeep',
  'ford': 'Ford',
  'bentley': 'Bentley',
  'mini': 'Mini',
};

function normMake(raw) {
  const key = String(raw || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!key) return 'Inconnu';
  if (MAKE_FIX[key]) return MAKE_FIX[key];
  // Sinon : première lettre en majuscule, reste tel quel
  return key.replace(/\b\w/g, c => c.toUpperCase());
}

function normModel(raw, make) {
  let m = String(raw || '').trim().replace(/\s+/g, ' ').replace(/[«»"]/g, '').replace(/^[-–]\s*/, '').trim();
  // Retire un préfixe correspondant exactement à la marque (ex. « BMW 420D » → « 420D »,
  // « Mercedes-Benz Classe C » → « Classe C »). Comparaison stricte sur le 1er mot
  // pour ne pas casser « Audi A5 » → « A5 ».
  if (make) {
    const prefix = m.split(/\s+/)[0] || '';
    const mc = stripAccents(make).replace(/[^a-z0-9]/g, '');
    const pc = stripAccents(prefix).replace(/[^a-z0-9]/g, '');
    if (pc.length >= 3 && (pc === mc || mc === pc || mc.startsWith(pc) || pc.startsWith(mc))) {
      const rest = m.slice(prefix.length).trim();
      if (rest) m = rest;
    }
  }
  return m;
}

const stripAccents = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function normFuel(raw, model = '') {
  const v = stripAccents(raw);
  const m = stripAccents(model);
  if (v === 'electrique' || v === 'electric' || v === 'ev') return 'Electrique';
  if (v === 'diesel') return 'Diesel';
  if (v === 'hybride' || v === 'hybrid') return 'Hybride';
  if (v === 'essence' || v === 'petrol') return 'Essence';
  // Repli : indice dans le modèle
  if (/\be-?tron\b|\be-?2008\b|\bmodel [sy3x]\b|\bid\.?[3-6]\b|\bleaf\b|\bzo[eé]\b|\bioniq 5\b|\bev\b/.test(m)) return 'Electrique';
  if (/\btdi\b|\bcdi\b|\bdci\b|\bhdi\b|\bgtd\b|\btdci\b|\bbluehdi\b|\bd\s?(200|250|300)\b/.test(m)) return 'Diesel';
  if (/\bphev\b|\bplug-?in\b|\bhybrid\b|\b_tgi[e]?\b|\bhev\b|\b300 e\b|\b200 e\b|\be-?hybrid\b/.test(m)) return 'Hybride';
  return 'Essence';
}

function normTransmission(raw, model = '') {
  const v = stripAccents(raw);
  if (v === 'manuelle' || v === 'manual' || v === 'manuell') return 'Manuelle';
  if (v === 'automatique' || v === 'automatic' || v === 'auto') return 'Automatique';
  const m = stripAccents(model);
  if (/\bautomatic\b|\baut\.?\b|\btiptronic\b|\bdsg\b|\bsteptronic\b|\b7g-?tronic\b|\b9g-?tronic\b/.test(m)) return 'Automatique';
  if (/\bmanual\b|\bmanuelle\b/.test(m)) return 'Manuelle';
  return 'Automatique';
}

// Catégorie : Autopark met tout en « Berline » → on déduit depuis le modèle.
function normCategory(raw, model = '') {
  const m = stripAccents(model);
  // Utilitaire
  if (/\btrafic\b|\btransporter\b|\bsprinter\b|\bvito\b|\bcrafter\b|\bducato\b|\bboxer\b|\bpartner\b|\bberlingo\b|\bcaddy\b|\bexpert\b|\bjumpy\b|\bvivaro\b|\btransit\b|\bmaster\b|\btalento\b/.test(m)) return 'Utilitaire';
  // SUV / crossover
  if (/\bglc\b|\bgla\b|\bglk\b|\bgle\b|\bg-?class\b|\bq[23578]\b|\bsq[578]\b|\bx[1-7]\b|\bx[1-7] m\b|\btiguan\b|\btouareg\b|\bt-?roc\b|\btayron\b|\btucson\b|\bsportage\b|\bsorento\b|\brav4\b|\bcx-?[3579]\b|\bmacan\b|\bcayenne\b|\btonale\b|\bstelvio\b|\bevoque\b|\bdiscovery\b|\brange rover\b|\bqashqai\b|\bx-?trail\b|\bjuke\b|\bkadjar\b|\bcaptur\b|\bateca\b|\barona\b|\bgrandland\b|\bcrossland\b|\bmokka\b|\b2008\b|\b3008\b|\b5008\b|\bcompass\b|\bwrangler\b|\bcherokee\b|\be-?pace\b|\bf-?pace\b|\bxc[4-9]0?\b|\bpuma\b|\bkuga\b|\becosport\b|\bedge\b|\bexplorer\b|\bcr-?v\b|\bhr-?v\b|\belement\b|\bmodel [xy]\b|\bcx-?30\b|\bnx\b|\brx\b|\bux\b|\bgx\b|\blx\b|\bt-cross\b|\btouareg\b/.test(m)) return 'SUV';
  // Break
  if (/\bbreak\b|\bt-?modell\b|\bavant\b|\btouring\b|\bvariant\b|\bcombi\b|\bshooting brake\b|\bsw\b|\bestate\b|\bsportback\b|\bgran coupe\b/.test(m)) return 'Break';
  // Monospace
  if (/\btouran\b|\bespace\b|\bscenic\b|\bzafira\b|\bsharan\b|\bgalaxy\b|\bs-?max\b|\bc-?max\b|\bgrand scenic\b|\bverso\b|\bpicnic\b|\bmazda5\b|\bmonospace\b|\bvan\b/.test(m)) return 'Monospace';
  // Coupé / cabriolet
  if (/\bcoup[e]?\b|\bcabrio|convertible|\broadster|\bspider\b|\bcabriolet\b|\bdécapotable\b|\bdecapotable\b|\btt\b|\bslk\b|\bslc\b|\bcls\b|\bm2\b|\bm4\b|\bm8\b|\brs5\b|\ba5\b/.test(m)) return 'Coupe';
  // Citadine (petites / compactes)
  if (/\bgolf\b|\bpolo\b|\bclio\b|\bc3\b|\bc1\b|\b208\b|\b108\b|\bpunto\b|\byaris\b|\bcorolla\b|\bmini\b|\bcorsa\b|\bfiesta\b|\bka\b|\bi10\b|\bi20\b|\bi30\b|\bpicanto\b|\brio\b|\bswift\b|\bmazda2\b|\bfabia\b|\bup!\b|\b500\b|\b500x\b|\baygo\b|\bsandero\b|\btwingo\b|\bzetta\b/.test(m)) return 'Citadine';
  return 'Berline';
}

function pmt(price, months = 60, rate = 0.06) {
  const r = rate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

const logicalKey = (make, model, mileage) =>
  `${make || ''}|${model || ''}|${mileage || 0}`
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim();

const slugify = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const IMAGE_KEYS = ['imageUrl'];
for (let i = 2; i <= 20; i++) IMAGE_KEYS.push(`imageUrl${i}`);

// ─── Source ─────────────────────────────────────────────────────────────────

async function fetchAutoparkCars() {
  const res = await fetch(SOURCE_API, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Autopark ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.cars || json;
}

// ─── Cache photos (reprise sans re-upload) ──────────────────────────────────

function loadCache() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, 'photos.json');
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}

function saveCache(cache) {
  fs.writeFileSync(path.join(CACHE_DIR, 'photos.json'), JSON.stringify(cache, null, 0));
}

// Télécharge une URL distante et renvoie le buffer
async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Réhéberge les photos d'un véhicule sur Cloudinary.
// cache : { [sourceUrl]: cloudinaryUrl }
// Une image en échec est ignorée (le véhicule garde les autres) et signalée.
async function uploadPhotos(sourceUrls, slug, cache, problems = [], label = '') {
  const out = [];
  for (const src of sourceUrls) {
    if (cache[src]) { out.push(cache[src]); continue; }
    try {
      const buf = await download(src);
      const res = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${buf.toString('base64')}`,
        {
          folder: 'autopark/cars',
          public_id: `${slug}-${out.length + 1}`,
          resource_type: 'image',
          unique_filename: false,
          overwrite: false,
        },
      );
      cache[src] = res.secure_url;
      out.push(res.secure_url);
    } catch (e) {
      problems.push(`${label} : photo ignorée (${e.message}) — ${src}`);
    }
  }
  return out;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`📦 Source Autopark : ${SOURCE_API}`);
  console.log(`${DRY ? '   [DRY-RUN]' : ''}${UPDATE ? '  [--update]' : ''}${NO_UPLOAD ? '  [sans upload photos]' : ''}\n`);

  const allCars = await fetchAutoparkCars();
  const cars = ONLY_AP
    ? allCars.filter(c => String(c.id) === String(ONLY_AP))
    : allCars;
  console.log(`${cars.length} véhicules récupérés.${ONLY_AP ? `  [--only-ap=${ONLY_AP}]` : ''}\n`);

  const existing = await prisma.car.findMany({
    select: { id: true, make: true, model: true, mileage: true, technicalData: true },
  });
  const existingByKey = new Map();
  const existingByAutoparkId = new Map();
  existing.forEach(c => {
    existingByKey.set(logicalKey(c.make, c.model, c.mileage), c);
    const apId = c.technicalData && typeof c.technicalData === 'object' ? c.technicalData.autoparkId : null;
    if (apId != null) existingByAutoparkId.set(Number(apId), c);
  });

  const cache = loadCache();
  let created = 0, updated = 0, skipped = 0, photos = 0;
  const problems = [];

  for (const c of cars) {
    const make = normMake(c.make);
    const model = normModel(c.model, make) || make;
    const mileage = Number(c.mileage) || 0;
    const price = Number(c.price) || 0;
    const year = Number(c.year) || new Date().getFullYear();
    const fuelType = normFuel(c.fuelType, model);
    const transmission = normTransmission(c.transmission, model);
    const category = normCategory(c.category, model);

    const sourceUrls = IMAGE_KEYS.map(k => c[k]).filter(v => v && typeof v === 'string' && v.trim());

    const monthlyPayment = price ? pmt(price * 0.75) : null;
    const minSalary = monthlyPayment ? Math.max(1500, Math.round((monthlyPayment * 3) / 50) * 50) : null;

    const data = {
      make, model, year, price,
      description: c.description || null,
      fuelType, transmission, mileage,
      color: c.color || null,
      power: c.power != null ? Number(c.power) : null,
      category,
      monthlyPayment, minSalary,
      featured: false, promotional: false, isActive: c.isActive !== false,
      accidentFree: true, serviceHistory: true,
      previousOwners: mileage > 60000 ? 2 : 1,
      technicalData: { source: 'autopark-b2b', autoparkId: c.id },
    };

    const key = logicalKey(make, model, mileage);
    const found = existingByAutoparkId.get(Number(c.id)) || existingByKey.get(key);

    console.log(`• ${make} ${model} (ap#${c.id})`);
    console.log(`    ${year} | ${mileage.toLocaleString('fr-FR')} km | ${fuelType} | ${transmission} | ${category} | ${price.toLocaleString('fr-FR')} € | ${sourceUrls.length} photo(s)`);

    if (found && !UPDATE) {
      skipped++;
      console.log(`    = déjà en base (id ${found.id}) — ignoré\n`);
      continue;
    }
    if (!price) problems.push(`ap#${c.id} : prix manquant`);
    if (!c.make || !c.model) problems.push(`ap#${c.id} : marque ou modèle vide`);

    if (DRY) {
      if (found) updated++; else created++;
      photos += sourceUrls.length;
      console.log(`    → ${found ? 'mise à jour' : 'création'} simulée\n`);
      continue;
    }

    // Photos → Cloudinary
    let images = {};
    if (!NO_UPLOAD && sourceUrls.length) {
      const slug = `${slugify(make)}-${slugify(model)}-${mileage}-${c.id}`;
      try {
        const urls = await uploadPhotos(sourceUrls, slug, cache, problems, `ap#${c.id} (${make} ${model})`);
        urls.forEach((url, i) => { images[i === 0 ? 'imageUrl' : `imageUrl${i + 1}`] = url; });
        photos += urls.length;
        saveCache(cache);
      } catch (e) {
        problems.push(`ap#${c.id} (${make} ${model}) : upload photos échoué (${e.message})`);
        console.log(`    ✗ upload photos échoué : ${e.message}\n`);
        continue;
      }
    }

    try {
      const payload = { ...data, ...images };
      if (found) {
        await prisma.car.update({ where: { id: found.id }, data: payload });
        updated++;
        console.log(`    ✓ mis à jour (id ${found.id}) — ${Object.keys(images).length} photo(s)\n`);
      } else {
        const row = await prisma.car.create({ data: payload });
        created++;
        console.log(`    ✓ créé (id ${row.id}) — ${Object.keys(images).length} photo(s)\n`);
      }
    } catch (e) {
      problems.push(`ap#${c.id} (${make} ${model}) : ${e.message}`);
      console.log(`    ✗ erreur base : ${e.message}\n`);
    }
  }

  console.log('─'.repeat(64));
  console.log(`✓ ${created} créé(s) · ${updated} mis à jour · ${skipped} ignoré(s) · ${photos} photo(s)`);
  if (problems.length) {
    console.log('\n⚠ Points à vérifier :');
    problems.forEach(p => console.log(`   - ${p}`));
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
