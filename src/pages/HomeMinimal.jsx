import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { carAPI } from '../services/api';
import { formatEuro } from '../utils/helpers';
import { useLangStore } from '../store';
import { useBreakpoint } from '../hooks/useBreakpoint';

/* ══════════════════════════════════════════════════════════════
   ACCUEIL MINIMAL PREMIUM — style constructeur (Tesla/Porsche)
   Plein écran photo, typo géante, très peu de sections,
   aucun cadre ni ombre : le contraste fait le design.
   Route : /accueil2  (accueil historique inchangée sur /)
══════════════════════════════════════════════════════════════ */

const HERO_IMGS = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2000&q=80&auto=format',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=2000&q=80&auto=format',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=2000&q=80&auto=format',
];

export default function HomeMinimal() {
  const { lang } = useLangStore();
  const { isMobile } = useBreakpoint();
  const l = lang || 'fr';
  const [featured, setFeatured] = useState([]);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    carAPI.getAll({ featured: 'true', limit: 3 })
      .then(r => setFeatured(r.data.cars || []))
      .catch(() => {});
  }, []);

  // Crossfade lent des visuels du hero
  useEffect(() => {
    const id = setInterval(() => setImgIndex(i => (i + 1) % HERO_IMGS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const txt = (fr, en, de, es, it, pt, ro) =>
    ({ fr, en, de, es, it, pt, ro }[l] || fr);

  const F = "var(--font-title)";

  return (
    <div style={{ background: '#FFFFFF' }}>

      {/* ── HERO plein écran ── */}
      <section style={{ position:'relative', height:'100svh', minHeight:560, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {HERO_IMGS.map((src, i) => (
          <motion.div key={src}
            animate={{ opacity: imgIndex === i ? 1 : 0 }}
            transition={{ duration:1.6, ease:'easeInOut' }}
            style={{ position:'absolute', inset:0 }}
          >
            <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </motion.div>
        ))}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.45) 100%)' }} />

        <motion.div
          initial={{ opacity:0, y:30 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:1, ease:[0.16,1,0.3,1] }}
          style={{ position:'relative', zIndex:2, textAlign:'center', padding:'0 5%', maxWidth:1000 }}
        >
          <h1 style={{
            fontFamily:F, fontWeight:600, color:'#fff',
            fontSize: isMobile ? 'clamp(40px,11vw,64px)' : 'clamp(56px,7vw,104px)',
            letterSpacing:'-0.02em', lineHeight:1.02, marginBottom:20,
          }}>
            AS Autohandel
          </h1>
          <p style={{
            fontSize: isMobile ? 15 : 18, color:'rgba(255,255,255,0.85)',
            fontWeight:400, marginBottom:40, maxWidth:520, margin:'0 auto 40px', lineHeight:1.6,
          }}>
            {txt(
              'Des véhicules sélectionnés, garantis et livrés partout en Europe.',
              'Selected, warranted vehicles delivered across Europe.',
              'Ausgewählte, garantierte Fahrzeuge — europaweit geliefert.',
              'Vehículos seleccionados, garantizados y entregados en toda Europa.',
              'Veicoli selezionati e garantiti, consegnati in tutta Europa.',
              'Veículos selecionados e garantidos, entregues em toda a Europa.',
              'Vehicule selectate și garantate, livrate în toată Europa.'
            )}
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/catalog" style={{
              background:'#fff', color:'#0A0A0A', textDecoration:'none',
              fontFamily:F, fontSize:15, fontWeight:600, padding:'14px 36px', borderRadius:100,
              transition:'opacity 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}>
              {txt('Découvrir le catalogue','Explore the catalogue','Katalog entdecken','Ver el catálogo','Scopri il catalogo','Ver catálogo','Descoperă catalogul')} →
            </Link>
            <Link to="/simulation" style={{
              background:'transparent', color:'#fff', textDecoration:'none', border:'1px solid rgba(255,255,255,0.5)',
              fontFamily:F, fontSize:15, fontWeight:600, padding:'14px 36px', borderRadius:100,
              transition:'background 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              {txt('Financer','Financing','Finanzierung','Financiación','Finanziamento','Financiamento','Finanțare')}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── SÉLECTION : 3 véhicules, sans cadre ── */}
      <section style={{ padding: isMobile ? '72px 5%' : '120px 5%', maxWidth:1280, margin:'0 auto' }}>
        <motion.div
          initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          transition={{ duration:0.7 }}
          style={{ textAlign:'center', marginBottom: isMobile ? 44 : 72 }}
        >
          <h2 style={{
            fontFamily:F, fontWeight:600, color:'#0A0A0A',
            fontSize: isMobile ? 'clamp(28px,7vw,40px)' : 'clamp(36px,4.5vw,64px)',
            letterSpacing:'-0.02em', lineHeight:1.08, marginBottom:14,
          }}>
            {txt('Notre sélection','Our selection','Unsere Auswahl','Nuestra selección','La nostra selezione','A nossa seleção','Selecția noastră')}
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color:'#7C8085', maxWidth:480, margin:'0 auto', lineHeight:1.6 }}>
            {txt(
              'Chaque véhicule est inspecté, révisé et garanti 12 mois.',
              'Every vehicle is inspected, serviced and carries a 12-month warranty.',
              'Jedes Fahrzeug ist geprüft, gewartet und 12 Monate garantiert.',
              'Cada vehículo está inspeccionado, revisado y garantizado 12 meses.',
              'Ogni veicolo è ispezionato, revisionato e garantito 12 mesi.',
              'Cada veículo é inspecionado, revisto e garantido 12 meses.',
              'Fiecare vehicul este inspectat, revizuit și garantat 12 luni.'
            )}
          </p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 56 : 32 }}>
          {(featured.length ? featured : [{ id:0 }, { id:1 }, { id:2 }]).map((car, i) => (
            <motion.div
              key={car.id ?? i}
              initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              transition={{ duration:0.7, delay:i*0.12 }}
            >
              <Link to={car.id ? `/cars/${car.id}` : '/catalog'} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ overflow:'hidden', borderRadius:'var(--radius-lg)', marginBottom:22, background:'#F4F4F5', aspectRatio:'4/3' }}>
                  <img
                    src={car.imageUrl || HERO_IMGS[i % HERO_IMGS.length]}
                    alt={car.make ? `${car.make} ${car.model}` : ''}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.7s cubic-bezier(0.16,1,0.3,1)' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'none'}
                  />
                </div>
                {car.make && (
                  <>
                    <h3 style={{ fontFamily:F, fontWeight:600, fontSize: isMobile ? 20 : 24, color:'#0A0A0A', letterSpacing:'-0.01em', marginBottom:6 }}>
                      {car.make} {car.model}
                    </h3>
                    <p style={{ fontSize:14, color:'#7C8085', marginBottom:10 }}>
                      {car.year} · {car.fuelType} · {car.mileage ? `${Number(car.mileage).toLocaleString('fr-FR')} km` : ''}
                    </p>
                    <p style={{ fontFamily:F, fontWeight:600, fontSize:18, color:'#0A0A0A' }}>
                      {formatEuro(car.price)}
                    </p>
                  </>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop: isMobile ? 56 : 80 }}>
          <Link to="/catalog" style={{
            color:'#0A0A0A', fontFamily:F, fontSize:15, fontWeight:600, textDecoration:'none',
            borderBottom:'1px solid #0A0A0A', paddingBottom:4,
          }}>
            {txt('Tout le stock','All vehicles','Alle Fahrzeuge','Todo el stock','Tutto lo stock','Todo o stock','Tot stoculul')} →
          </Link>
        </div>
      </section>

      {/* ── BANDEAU PLEINE LARGEUR ── */}
      <section style={{ position:'relative', height: isMobile ? '60svh' : '75vh', minHeight:420, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <img
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=2000&q=80&auto=format"
          alt=""
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
        />
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.40)' }} />
        <motion.div
          initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          transition={{ duration:0.8 }}
          style={{ position:'relative', zIndex:2, textAlign:'center', padding:'0 6%', maxWidth:860 }}
        >
          <h2 style={{
            fontFamily:F, fontWeight:600, color:'#fff',
            fontSize: isMobile ? 'clamp(26px,6.5vw,38px)' : 'clamp(34px,4.5vw,58px)',
            letterSpacing:'-0.02em', lineHeight:1.12, marginBottom:18,
          }}>
            {txt('Livré chez vous en 48 h','Delivered to your door in 48 h','In 48 Stunden bei Ihnen','Entregado en 48 h','Consegnato a casa in 48 h','Entregue em sua casa em 48 h','Livrat la dumneavoastră în 48 h')}
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 17, color:'rgba(255,255,255,0.8)', lineHeight:1.7, maxWidth:560, margin:'0 auto' }}>
            {txt(
              'Dans toute l\'Union européenne, en Suisse et au Royaume-Uni. Démarches administratives incluses.',
              'Across the European Union, Switzerland and the United Kingdom. All paperwork included.',
              'In der gesamten EU, der Schweiz und im Vereinigten Königreich. Formalitäten inklusive.',
              'En toda la UE, Suiza y Reino Unido. Trámites incluidos.',
              'In tutta l\'UE, Svizzera e Regno Unito. Formalità incluse.',
              'Em toda a UE, Suíça e Reino Unido. Formalidades incluídas.',
              'În toată UE, Elveția și Regatul Unit. Formalități incluse.'
            )}
          </p>
        </motion.div>
      </section>

      {/* ── CHIFFRES : 3 colonnes, typo seule ── */}
      <section style={{ padding: isMobile ? '64px 5%' : '100px 5%' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 44 : 32, textAlign:'center' }}>
          {[
            { n:'48 h',  d: txt('Livraison moyenne','Average delivery','Ø Lieferung','Entrega media','Consegna media','Entrega média','Livrare medie') },
            { n:'12 mois', d: txt('de garantie incluse','warranty included','Garantie inklusive','de garantía inclusa','di garanzia inclusa','de garantia incluídă','de garanție inclusă') },
            { n:'4.9/5', d: txt('sur 30 avis vérifiés','from 30 verified reviews','aus 30 Bewertungen','sobre 30 opiniones verificadas','su 30 recensioni verificate','em 30 avaliações verificadas','din 30 recenzii verificate') },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              transition={{ duration:0.6, delay:i*0.1 }}
            >
              <p style={{ fontFamily:F, fontWeight:600, fontSize: isMobile ? 40 : 52, color:'#0A0A0A', letterSpacing:'-0.02em', lineHeight:1, marginBottom:10 }}>{s.n}</p>
              <p style={{ fontSize:14, color:'#7C8085', lineHeight:1.5 }}>{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA final : bloc noir ── */}
      <section style={{ background:'#0A0A0A', padding: isMobile ? '72px 5%' : '120px 5%', textAlign:'center' }}>
        <motion.div
          initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          transition={{ duration:0.7 }}
        >
          <h2 style={{
            fontFamily:F, fontWeight:600, color:'#fff',
            fontSize: isMobile ? 'clamp(28px,7vw,42px)' : 'clamp(36px,4.5vw,60px)',
            letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:16,
          }}>
            {txt('Trouvez votre prochaine voiture','Find your next car','Finden Sie Ihr nächstes Auto','Encuentre su próximo coche','Trova la tua prossima auto','Encontre o seu próximo carro','Găsește-ți următoarea mașină')}
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color:'rgba(255,255,255,0.65)', marginBottom:36, maxWidth:440, margin:'0 auto 36px', lineHeight:1.6 }}>
            {txt(
              'Plus de 15 véhicules en stock, avec financement sur mesure.',
              'Over 15 vehicles in stock, with tailored financing.',
              'Über 15 Fahrzeuge auf Lager, mit maßgeschneiderter Finanzierung.',
              'Más de 15 vehículos en stock, con financiación a medida.',
              'Oltre 15 veicoli a stock, con finanziamento su misura.',
              'Mais de 15 veículos em stock, com financiamento à medida.',
              'Peste 15 vehicule pe stoc, cu finanțare personalizată.'
            )}
          </p>
          <Link to="/catalog" style={{
            background:'#fff', color:'#0A0A0A', textDecoration:'none',
            fontFamily:F, fontSize:15, fontWeight:600, padding:'15px 40px', borderRadius:100,
            display:'inline-block', transition:'opacity 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}>
            {txt('Voir les véhicules','View vehicles','Fahrzeuge ansehen','Ver vehicoli','Veja os veículos','Vezi vehiculele')} →
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
