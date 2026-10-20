// Migration : Supabase (autokompetenz) → Neon (as-autohandel)
// ---------------------------------------------------------------
// Récupère les véhicules du projet Supabase `autokompetenz` via l'API REST
// (clé service_role, lue dans l'environnement) et les crée dans la base Neon
// du site AS Autohandel.
//
// - Les photos restent hébergées sur Supabase Storage (bucket public `cars`) :
//   elles sont publiques et accessibles directement.
// - Les id sont laissés à Neon (autoincrement) pour éviter toute collision.
// - Idempotent : un véhicule déjà présent (même marque + modèle + kilométrage)
//   est ignoré. Utiliser --update pour rafraîchir les véhicules existants.
//
// Usage :
//   node scripts/import-supabase.cjs --dry
//   node scripts/import-supabase.cjs
//   node scripts/import-supabase.cjs --update
//
// Variables d'environnement requises :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (source)
//   DATABASE_URL, DIRECT_URL                 (cible Neon)

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const UPDATE = args.includes('--update');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Colonnes d'images attendues (imageUrl, imageUrl2..imageUrl20)
const IMAGE_KEYS = ['imageUrl'];
for (let i = 2; i <= 20; i++) IMAGE_KEYS.push(`imageUrl${i}`);

// Valeurs autorisées par les enums Prisma
const FUELS = ['Essence', 'Diesel', 'Electrique', 'Hybride'];
const TRANSMISSIONS = ['Manuelle', 'Automatique'];
const CATEGORIES = ['Berline', 'SUV', 'Citadine', 'Break', 'Coupe', 'Monospace', 'Utilitaire', 'FourX4'];

function pmt(price, months = 60, rate = 0.06) {
  const r = rate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

// Normalise une valeur d'enum (le texte Supabase peut contenir des espaces/casse)
function normEnum(value, allowed, fallback) {
  if (!value) return fallback;
  const v = String(value).trim();
  const exact = allowed.find(a => a.toLowerCase() === v.toLowerCase());
  if (exact) return exact;
  // Quelques alias fréquents
  const map = {
    'électrique': 'Electrique', 'electric': 'Electrique', 'ev': 'Electrique',
    'essence': 'Essence', 'petrol': 'Essence', 'gasoline': 'Essence',
    'diesel': 'Diesel',
    'hybride': 'Hybride', 'hybrid': 'Hybride', 'phev': 'Hybride', 'mhev': 'Hybride',
    'automatique': 'Automatique', 'automatic': 'Automatique', 'auto': 'Automatique',
    'manuelle': 'Manuelle', 'manual': 'Manuelle', 'manuell': 'Manuelle',
    'suv': 'SUV', 'break': 'Break', 'coupe': 'Coupe', 'coupé': 'Coupe',
    'berline': 'Berline', 'citadine': 'Citadine', 'monospace': 'Monospace',
    'utilitaire': 'Utilitaire', '4x4': 'FourX4', 'fourx4': 'FourX4',
  };
  const alias = map[v.toLowerCase()];
  if (alias && allowed.includes(alias)) return alias;
  return fallback;
}

async function fetchSupabaseCars() {
  const url = `${SUPABASE_URL}/rest/v1/Car?select=*&order=id.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Clé logique d'identification : marque + modèle + kilométrage (normalisée)
const logicalKey = (make, model, mileage) =>
  `${make || ''}|${model || ''}|${mileage || 0}`
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim();

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.');
    process.exit(1);
  }

  console.log(`📦 Source Supabase : ${SUPABASE_URL}`);
  console.log(`${DRY ? '   [DRY-RUN]' : ''}${UPDATE ? '  [--update]' : ''}\n`);

  const cars = await fetchSupabaseCars();
  console.log(`${cars.length} véhicules récupérés depuis Supabase.\n`);

  // Index des véhicules déjà présents dans Neon
  const existing = await prisma.car.findMany({
    select: { id: true, make: true, model: true, mileage: true },
  });
  const existingByKey = new Map();
  existing.forEach(c => existingByKey.set(logicalKey(c.make, c.model, c.mileage), c));

  let created = 0, updated = 0, skipped = 0;
  const problems = [];

  for (const c of cars) {
    const make = (c.make || '').trim();
    const model = (c.model || '').trim();
    const mileage = Number(c.mileage) || 0;
    const price = Number(c.price) || 0;

    const fuelType = normEnum(c.fuelType, FUELS, 'Essence');
    const transmission = normEnum(c.transmission, TRANSMISSIONS, 'Automatique');
    const category = normEnum(c.category, CATEGORIES, 'Berline');

    // Colonnes d'images (on ne garde que les URLs non vides)
    const images = {};
    let imgCount = 0;
    IMAGE_KEYS.forEach((k, i) => {
      const v = c[k];
      if (v && typeof v === 'string' && v.trim()) {
        images[k] = v.trim();
        imgCount++;
      }
    });

    const monthlyPayment = c.monthlyPayment != null
      ? Number(c.monthlyPayment)
      : (price ? pmt(price * 0.75) : null);
    const minSalary = c.minSalary != null
      ? Number(c.minSalary)
      : (monthlyPayment ? Math.max(1500, Math.round((monthlyPayment * 3) / 50) * 50) : null);

    const data = {
      make: make || 'Inconnu',
      model: model || make || 'Inconnu',
      year: Number(c.year) || new Date().getFullYear(),
      price,
      description: c.description || null,
      fuelType,
      transmission,
      mileage,
      color: c.color || null,
      power: c.power != null ? Number(c.power) : null,
      category,
      minSalary,
      monthlyPayment,
      featured: !!c.featured,
      promotional: false,
      isActive: c.isActive !== false,
      ...images,
      // Champs propres au nouveau schéma (absents de Supabase) → valeurs par défaut
      accidentFree: false,
      serviceHistory: false,
      previousOwners: null,
      technicalData: { source: 'supabase-autokompetenz', supabaseId: c.id },
    };

    const key = logicalKey(make, model, mileage);
    const found = existingByKey.get(key);

    console.log(`• ${(make + ' ' + model).slice(0, 50)} (supa#${c.id})`);
    console.log(`    ${data.year} | ${mileage.toLocaleString('fr-FR')} km | ${fuelType} | ${transmission} | ${category} | ${price.toLocaleString('fr-FR')} € | ${imgCount} photo(s)`);

    if (found && !UPDATE) {
      skipped++;
      console.log(`    = déjà en base (id ${found.id}) — ignoré\n`);
      continue;
    }
    if (!make || !model) problems.push(`supa#${c.id} : marque ou modèle vide`);
    if (!price) problems.push(`supa#${c.id} : prix manquant`);

    if (DRY) {
      if (found) updated++; else created++;
      console.log(`    → ${found ? 'mise à jour' : 'création'} simulée\n`);
      continue;
    }

    try {
      if (found) {
        await prisma.car.update({ where: { id: found.id }, data });
        updated++;
        console.log(`    ✓ mis à jour (id ${found.id})\n`);
      } else {
        const row = await prisma.car.create({ data });
        created++;
        console.log(`    ✓ créé (id ${row.id})\n`);
      }
    } catch (e) {
      problems.push(`supa#${c.id} (${make} ${model}) : ${e.message}`);
      console.log(`    ✗ erreur : ${e.message}\n`);
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
