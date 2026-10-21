// Applique une majoration de prix à tous les véhicules du catalogue.
// ---------------------------------------------------------------------------
// Usage :
//   node scripts/adjust-prices.cjs --amount=1500 --dry
//   node scripts/adjust-prices.cjs --amount=1500
//
// Effets :
//   - price        : + amount (par défaut +1500 €)
//   - monthlyPayment / minSalary : recalculés sur le nouveau prix
//     (mêmes formules que les scripts d'import : 60 mois, 6 %/an, apport 25 %)
//
// Sécurités :
//   - --dry : simulation, aucune écriture
//   - --only=autopark|automatik|ancien : limite à une provenance
//   - un marqueur `priceAdjusted = "<amount>"` est stocké dans technicalData
//     pour éviter d'appliquer deux fois la même majoration (idempotent).

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const AMOUNT = Number((args.find(a => a.startsWith('--amount=')) || '').split('=')[1]) || 1500;
const ONLY = (args.find(a => a.startsWith('--only=')) || '').split('=')[1] || null;

function pmt(price, months = 60, rate = 0.06) {
  const r = rate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

const sourceOf = (car) =>
  car.technicalData && car.technicalData.source
    ? car.technicalData.source
    : (car.technicalData ? 'automatik' : 'ancien');

async function main() {
  console.log(`💰 Majoration : +${AMOUNT} €${DRY ? '  [DRY-RUN]' : ''}${ONLY ? `  [--only=${ONLY}]` : ''}\n`);

  const cars = await prisma.car.findMany({
    select: { id: true, make: true, model: true, price: true, monthlyPayment: true, minSalary: true, technicalData: true },
  });

  let updated = 0, skipped = 0, alreadyDone = 0;
  const marc = String(AMOUNT);

  for (const c of cars) {
    const src = sourceOf(c);
    if (ONLY && src !== ONLY) { skipped++; continue; }

    const td = (c.technicalData && typeof c.technicalData === 'object') ? { ...c.technicalData } : {};
    if (td.priceAdjusted === marc) { alreadyDone++; continue; }

    const newPrice = Number(c.price || 0) + AMOUNT;
    const newMonthly = pmt(newPrice * 0.75);
    const newSalary = Math.max(1500, Math.round((newMonthly * 3) / 50) * 50);

    console.log(`• ${c.make} ${c.model} (id ${c.id})`);
    console.log(`    ${Number(c.price||0).toLocaleString('fr-FR')} € → ${newPrice.toLocaleString('fr-FR')} €  ·  ${c.monthlyPayment ?? '—'} → ${newMonthly} €/mois  ·  ${c.minSalary ?? '—'} → ${newSalary} €`);

    if (DRY) { updated++; continue; }

    td.priceAdjusted = marc;
    await prisma.car.update({
      where: { id: c.id },
      data: { price: newPrice, monthlyPayment: newMonthly, minSalary: newSalary, technicalData: Object.keys(td).length ? td : undefined },
    });
    updated++;
  }

  console.log('─'.repeat(60));
  console.log(`✓ ${updated} mise(s) à jour · ${skipped} ignorée(s) (filtre) · ${alreadyDone} déjà majorée(s)`);
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
