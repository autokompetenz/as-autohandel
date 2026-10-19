// Seed AS Autohandel GmbH — inventaire de démonstration (≈30 véhicules).
// Lancer : node prisma/seed.cjs   (ou npm run seed)
//
// Le script est idempotent : un véhicule (marque + modèle + année) déjà présent
// n'est pas recréé. L'admin / le client existants ne sont jamais écrasés.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Mensualité indicative (75 % financé, 60 mois, 6 % TAEG)
function pmt(price, months = 60, rate = 0.06) {
  const r = rate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

// Banque d'images (Unsplash) — visuels de démonstration, à remplacer par les
// photos réelles depuis l'espace admin.
const IMG = [
  '1621007947382-bb3c3994e3fb', '1549317661-bd32c8ce0db2', '1609521263047-f8f205293f24',
  '1618843479313-40f8afb4b4d8', '1553440569-bcc63803a83d', '1606220838315-056192d5e927',
  '1555215695-3004980ad54e', '1603584173870-7f23fdae1b7a', '1542362567-b07e54358753',
  '1560958089-b8a1929cea89', '1536700503339-1e4b06520771', '1568605117036-5fe5e7bab0b7',
  '1494976388531-d1058494cdd8', '1507003211169-0a1dd7228f2d', '1606664515524-ed2f786a0bd6',
  '1549399542-7e3f8b79c341', '1616788494672-ec7ca25fdda9', '1617469767053-d3b523a0b982',
  '1612544448445-b8232cff3b6c', '1502877338535-766e1452684a', '1526726538690-5cbf956ae2fd',
  '1504215680853-026ed2a45def', '1606016159991-dfe4f2746ad5', '1551830820-330a71b99659',
  '1580273916550-e323be2ae537', '1583121274602-3e2820c69888', '1503376780353-7e6692767b70',
  '1492144534655-ae79c964c9d7', '1511919884226-fd3cad34687c', '1519641471654-76ce0107ad1b',
  '1571607388263-1044f9ea01dd', '1605559424843-9e4c228bf1c2', '1550355291-bbee04a92027',
  '1552519507-da3b142c6e3d', '1544636331-e26879cd4d9b', '1503736334956-4c8f8e92946d',
  '1563720223185-11003d516935', '1541899481282-d53bffe3c35d', '1502161254066-6c74afbf07aa',
  '1533473359331-0135ef1b58bf', '1517524008697-84bbe3c3fd98', '1507136566006-cfc505b114fc',
  '1525609004556-c46c7d6cf023', '1493238792000-8113da705763', '1558618666-fcd25c85cd64',
  '1494905998402-395d579af36f', '1542282088-fe8426682b8f',
];
const img = (id) => `https://images.unsplash.com/photo-${id}?w=1000&q=80`;
const pick = (i, off) => img(IMG[(i + off) % IMG.length]);

const CARS = [
  { make:'BMW', model:'320d Touring', year:2021, price:32900, mileage:41200, fuelType:'Diesel', transmission:'Automatique', category:'Break', power:190, color:'Noir Saphir', featured:true,
    description:"BMW 320d Touring, diesel efficient et boîte automatique Steptronic. Navigation Professional, sièges sport, caméra de recul. Entretien complet chez BMW." },
  { make:'Audi', model:'A4 Avant 40 TDI', year:2020, price:29900, mileage:58400, fuelType:'Diesel', transmission:'Automatique', category:'Break', power:204, color:'Gris Daytona',
    description:"Audi A4 Avant 40 TDI quattro, finition S line. Virtual Cockpit, sièges chauffants, hayon électrique. Un break familial élégant et sobre." },
  { make:'Mercedes-Benz', model:'C 220 d', year:2021, price:34900, mileage:40900, fuelType:'Diesel', transmission:'Automatique', category:'Berline', power:194, color:'Blanc Polaire', featured:true,
    description:"Mercedes C 220 d avec boîte 9G-Tronic et MBUX. Intérieur cuir, éclairage d'ambiance, aides à la conduite. Confort et prestige au quotidien." },
  { make:'Volkswagen', model:'Golf 8 1.5 TSI Life', year:2022, price:24900, mileage:18600, fuelType:'Essence', transmission:'Automatique', category:'Citadine', power:150, color:'Gris Dolphin',
    description:"VW Golf 8 1.5 TSI DSG7, finition Life. Cockpit numérique, App-Connect, régulateur adaptatif. La référence des compactes, sobre et fiable." },
  { make:'Volkswagen', model:'Passat Variant 2.0 TDI', year:2020, price:23900, mileage:72500, fuelType:'Diesel', transmission:'Automatique', category:'Break', power:150, color:'Bleu Atlantique',
    description:"VW Passat Variant 2.0 TDI DSG, grand coffre et confort routier. Navigation, sièges chauffants, excellent bilan sur autoroute." },
  { make:'BMW', model:'X3 xDrive30d', year:2021, price:46900, mileage:46200, fuelType:'Diesel', transmission:'Automatique', category:'SUV', power:286, color:'Gris Sophisto', featured:true,
    description:"BMW X3 xDrive30d, 6 cylindres et transmission intégrale. Toit ouvrant panoramique, HiFi, caméra 360°. Le SUV dynamique par excellence." },
  { make:'Audi', model:'Q5 45 TFSI quattro', year:2022, price:49900, mileage:21800, fuelType:'Essence', transmission:'Automatique', category:'SUV', power:265, color:'Noir Mythos', featured:true,
    description:"Audi Q5 45 TFSI quattro S tronic, finition S line. Matrix LED, sièges sport cuir/Alcantara, hayon électrique. Presque neuf." },
  { make:'Mercedes-Benz', model:'GLC 300 e', year:2021, price:45900, mileage:39400, fuelType:'Hybride', transmission:'Automatique', category:'SUV', power:320, color:'Argent Iridium', featured:true,
    description:"Mercedes GLC 300 e hybride rechargeable, 4MATIC. Roulez en électrique en ville, sans renoncer au confort et à la puissance." },
  { make:'Tesla', model:'Model 3 Long Range', year:2022, price:39900, mileage:28400, fuelType:'Electrique', transmission:'Automatique', category:'Berline', power:498, color:'Blanc Nacré', featured:true,
    description:"Tesla Model 3 Long Range AWD, plus de 600 km d'autonomie. Autopilot, écran 15\", superchargeur. L'électrique sans compromis." },
  { make:'Skoda', model:'Octavia Combi 2.0 TDI', year:2021, price:21900, mileage:64100, fuelType:'Diesel', transmission:'Automatique', category:'Break', power:150, color:'Gris Graphite',
    description:"Skoda Octavia Combi 2.0 TDI DSG, espace record et équipement généreux. Le meilleur rapport habitabilité/prix du marché." },
  { make:'Seat', model:'Leon 1.4 e-Hybrid', year:2021, price:22900, mileage:33200, fuelType:'Hybride', transmission:'Automatique', category:'Citadine', power:204, color:'Rouge Désir',
    description:"Seat Leon e-Hybrid 204 ch, jusqu'à 60 km en tout électrique. Compacte sportive, économique et connectée." },
  { make:'Opel', model:'Corsa 1.2 Edition', year:2022, price:15900, mileage:15200, fuelType:'Essence', transmission:'Manuelle', category:'Citadine', power:100, color:'Bleu Voltaïque',
    description:"Opel Corsa 1.2, citadine agile et économique. Faible kilométrage, idéale première voiture ou usage urbain." },
  { make:'Renault', model:'Clio V 1.0 TCe', year:2022, price:15950, mileage:19400, fuelType:'Essence', transmission:'Manuelle', category:'Citadine', power:90, color:'Orange Valencia',
    description:"Renault Clio V 1.0 TCe, design moderne et équipement complet. Écran tactile, régulateur, très faible consommation." },
  { make:'Peugeot', model:'208 1.2 PureTech Allure', year:2022, price:17900, mileage:21300, fuelType:'Essence', transmission:'Automatique', category:'Citadine', power:130, color:'Jaune Faro',
    description:"Peugeot 208 Allure EAT8, i-Cockpit 3D et look affirmé. Boîte automatique douce, parfaite en ville comme sur route." },
  { make:'Ford', model:'Focus Turnier 1.5 EcoBlue', year:2020, price:16900, mileage:68200, fuelType:'Diesel', transmission:'Manuelle', category:'Break', power:120, color:'Gris Magnetic',
    description:"Ford Focus Turnier 1.5 EcoBlue, break pratique et sobre. Bonne tenue de route, entretien suivi, prêt à partir." },
  { make:'Hyundai', model:'Tucson 1.6 T-GDI Hybrid', year:2022, price:31900, mileage:24100, fuelType:'Hybride', transmission:'Automatique', category:'SUV', power:230, color:'Aqua Blue', featured:true,
    description:"Hyundai Tucson hybride 230 ch, design avant-gardiste et garantie constructeur restante. Spacieux, high-tech et sobre." },
  { make:'Kia', model:'Sportage 1.6 T-GDI', year:2022, price:28900, mileage:26500, fuelType:'Essence', transmission:'Automatique', category:'SUV', power:150, color:'Blanc Neige',
    description:"Kia Sportage 1.6 T-GDI DCT, 7 ans de garantie constructeur. Écran incurvé, aides à la conduite, look affirmé." },
  { make:'Toyota', model:'Corolla 1.8 Hybrid', year:2022, price:25900, mileage:20100, fuelType:'Hybride', transmission:'Automatique', category:'Berline', power:122, color:'Gris Platinium',
    description:"Toyota Corolla 1.8 Hybrid, fiabilité légendaire et consommation contenue. Boîte automatique douce, idéale en ville." },
  { make:'Toyota', model:'RAV4 2.5 Hybrid AWD', year:2021, price:36900, mileage:34700, fuelType:'Hybride', transmission:'Automatique', category:'SUV', power:222, color:'Bleu Nuit', featured:true,
    description:"Toyota RAV4 2.5 Hybrid AWD-i, le SUV hybride de référence. Spacieux, sobre et increvable. Entretien à jour." },
  { make:'Mazda', model:'CX-5 2.0 Skyactiv-G', year:2021, price:27900, mileage:30800, fuelType:'Essence', transmission:'Automatique', category:'SUV', power:165, color:'Rouge Soul',
    description:"Mazda CX-5 2.0 Skyactiv-G, finitions soignées et plaisir de conduite. Intérieur premium, équipement complet." },
  { make:'Mini', model:'Cooper S 2.0', year:2021, price:26900, mileage:27200, fuelType:'Essence', transmission:'Automatique', category:'Citadine', power:178, color:'British Racing Green',
    description:"Mini Cooper S 2.0, caractère sportif et look intemporel. Boîte automatique, châssis dynamique, finition soignée." },
  { make:'BMW', model:'118i Advantage', year:2021, price:24900, mileage:31600, fuelType:'Essence', transmission:'Automatique', category:'Citadine', power:136, color:'Blanc Alpin',
    description:"BMW 118i Steptronic, compacte premium et efficace. Navigation, capteurs de stationnement, faible consommation." },
  { make:'Audi', model:'A3 Sportback 35 TFSI', year:2022, price:29900, mileage:17400, fuelType:'Essence', transmission:'Automatique', category:'Citadine', power:150, color:'Gris Nano',
    description:"Audi A3 Sportback 35 TFSI S tronic, finition S line. Cockpit numérique, LED, aides à la conduite. Très faible kilométrage." },
  { make:'Mercedes-Benz', model:'A 180 d', year:2021, price:27900, mileage:38500, fuelType:'Diesel', transmission:'Automatique', category:'Citadine', power:116, color:'Noir Cosmos',
    description:"Mercedes A 180 d 7G-DCT, diesel sobre et finition premium. MBUX, caméra de recul, entretien Mercedes complet." },
  { make:'Volkswagen', model:'T-Roc 1.5 TSI Style', year:2022, price:26900, mileage:16300, fuelType:'Essence', transmission:'Automatique', category:'SUV', power:150, color:'Bleu Ravenna',
    description:"VW T-Roc 1.5 TSI DSG, crossover compact et polyvalent. Digital Cockpit, App-Connect, position de conduite surélevée." },
  { make:'Volkswagen', model:'Tiguan 2.0 TDI 4Motion', year:2021, price:32900, mileage:42700, fuelType:'Diesel', transmission:'Automatique', category:'SUV', power:150, color:'Gris Indium', featured:true,
    description:"VW Tiguan 2.0 TDI 4Motion DSG, transmission intégrale pour toutes les saisons. Espace, confort et robustesse." },
  { make:'Volvo', model:'XC60 B4 Momentum', year:2021, price:41900, mileage:37600, fuelType:'Hybride', transmission:'Automatique', category:'SUV', power:197, color:'Gris Osmium',
    description:"Volvo XC60 B4 mild-hybrid, sécurité et confort scandinaves. Sièges cuir, toit panoramique, aides à la conduite de série." },
  { make:'BMW', model:'M440i xDrive', year:2021, price:58900, mileage:29300, fuelType:'Essence', transmission:'Automatique', category:'Coupe', power:374, color:'Bleu Portimao', featured:true,
    description:"BMW M440i xDrive Coupé, 6 cylindres 374 ch et transmission intégrale. Pack M Sport, échappement sport, sensation garantie." },
  { make:'Jeep', model:'Wrangler 2.0 T Sahara', year:2021, price:52900, mileage:33100, fuelType:'Essence', transmission:'Automatique', category:'FourX4', power:272, color:'Gris Granite',
    description:"Jeep Wrangler Sahara 2.0 T, 4x4 pur et caractère unique. Toit amovible, capacités tout-terrain, look iconique." },
  { make:'Mercedes-Benz', model:'Vito 116 CDI Tourer', year:2020, price:28900, mileage:88500, fuelType:'Diesel', transmission:'Automatique', category:'Utilitaire', power:163, color:'Blanc Arctique',
    description:"Mercedes Vito 116 CDI Tourer, 8 places. Utilitaire familial ou professionnel, fiable et confortable sur longue distance." },
];

async function main() {
  console.log('🌱 Seed AS Autohandel GmbH');

  // --- Utilisateurs (créés uniquement s'ils sont absents, jamais écrasés) ---
  const adminEmail = 'info@as-autohandelgmbh.com';
  if (!(await prisma.user.findUnique({ where: { email: adminEmail } }))) {
    await prisma.user.create({
      data: {
        username: 'admin', email: adminEmail,
        password: await bcrypt.hash('password', 12),
        firstName: 'Admin', lastName: 'AS Autohandel', role: 'ADMIN', emailVerified: true,
      },
    });
    console.log('  + admin créé (mot de passe par défaut : password)');
  } else {
    console.log('  = admin déjà présent, inchangé');
  }

  // --- Véhicules ---
  let created = 0, skipped = 0;
  for (let i = 0; i < CARS.length; i++) {
    const c = CARS[i];
    const exists = await prisma.car.findFirst({
      where: { make: c.make, model: c.model, year: c.year },
      select: { id: true },
    });
    if (exists) { skipped++; continue; }

    const monthlyPayment = pmt(c.price * 0.75);
    // Règle indicative : mensualité ≈ 1/3 du salaire net
    const minSalary = Math.max(1500, Math.round((monthlyPayment * 3) / 50) * 50);

    await prisma.car.create({
      data: {
        make: c.make, model: c.model, year: c.year, price: c.price,
        description: c.description, fuelType: c.fuelType, transmission: c.transmission,
        mileage: c.mileage, color: c.color, power: c.power, category: c.category,
        minSalary, monthlyPayment,
        featured: !!c.featured, promotional: false, isActive: true,
        imageUrl:  pick(i, 0),
        imageUrl2: pick(i, 7),
        imageUrl3: pick(i, 15),
        previousOwners: c.mileage > 60000 ? 2 : 1,
        accidentFree: true,
        serviceHistory: true,
      },
    });
    created++;
  }
  console.log(`  ✓ ${created} véhicule(s) créé(s), ${skipped} déjà présent(s)`);

  // --- Rebranding des coordonnées bancaires si encore à l'ancien nom ---
  const bank = await prisma.bankInfo.findUnique({ where: { id: 1 } });
  if (bank && bank.beneficiary === 'AUTOMATIK GEBRAUCHTWAGEN') {
    await prisma.bankInfo.update({ where: { id: 1 }, data: { beneficiary: 'AS AUTOHANDEL GMBH' } });
    console.log('  ✓ bénéficiaire bancaire renommé en AS AUTOHANDEL GMBH');
  }

  console.log('🎉 Seed terminé.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
