import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatEuro } from '../utils/helpers';
import { useLangStore, useFavStore, useCompareStore } from '../store';
import { t } from '../utils/i18n';
import { useBreakpoint } from '../hooks/useBreakpoint';

/* Fiche véhicule — style annuaire pro (AutoScout24)
   variant="row"  → ligne horizontale dense (résultats de recherche)
   variant="grid" → carte compacte (vitrines, accueil)                      */
export default function CarCard({ car, index = 0, variant = 'grid' }) {
  const { lang } = useLangStore();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [hovered, setHovered] = useState(false);
  const favIds = useFavStore(s => s.ids);
  const toggleFav = useFavStore(s => s.toggle);
  const cmpIds = useCompareStore(s => s.ids);
  const toggleCmp = useCompareStore(s => s.toggle);
  const l = lang || 'fr';
  const isFav = favIds.includes(car.id);
  const isCmp = cmpIds.includes(car.id);

  const order = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/commander/${car.id}`);
  };

  const onFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(car.id);
  };

  const onCmp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCmp(car.id);
  };

  /* Cœur favori + comparateur, superposés à l'image */
  const OverlayBtns = ({ small }) => (
    <div style={{ position:'absolute', top: small ? 8 : 10, right: small ? 8 : 10, display:'flex', flexDirection:'column', gap:6, zIndex:2 }}>
      <button onClick={onFav}
        aria-label="favori"
        style={{
          width: small ? 30 : 34, height: small ? 30 : 34, borderRadius:'50%', border:'none', cursor:'pointer',
          background:'rgba(255,255,255,0.94)', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: small ? 14 : 16, lineHeight:1, color: isFav ? '#2373F4' : 'var(--text-2)', padding:0,
          transition:'color 0.15s, transform 0.15s',
        }}
        onMouseOver={e=>e.currentTarget.style.transform='scale(1.1)'}
        onMouseOut={e=>e.currentTarget.style.transform='none'}>
        {isFav ? '♥' : '♡'}
      </button>
      <button onClick={onCmp}
        aria-label="comparer"
        style={{
          width: small ? 30 : 34, height: small ? 30 : 34, borderRadius:'50%', border:'none', cursor:'pointer',
          background: isCmp ? 'var(--red)' : 'rgba(255,255,255,0.94)',
          color: isCmp ? '#fff' : 'var(--text-2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: small ? 13 : 14, lineHeight:1, padding:0,
          transition:'background 0.15s, transform 0.15s',
        }}
        onMouseOver={e=>e.currentTarget.style.transform='scale(1.1)'}
        onMouseOut={e=>e.currentTarget.style.transform='none'}>
        ⇄
      </button>
    </div>
  );

  const F = "var(--font)";
  const img = car.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=70';

  const Badges = ({ stack }) => (
    <div style={{ display:'flex', flexDirection: stack ? 'column' : 'row', gap:6, alignItems:'flex-start' }}>
      {car.featured && (
        <span style={{ background:'var(--red)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', padding:'3px 10px', borderRadius:100 }}>
          ★ {l==='fr'?'À la une':l==='en'?'Featured':l==='de'?'Empfohlen':l==='es'?'Destacado':l==='it'?'In evidenza':'Destacado'}
        </span>
      )}
      {car.promotional && (
        <span style={{ background:'var(--red-light)', color:'#0A0A0A', fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', padding:'3px 10px', borderRadius:100 }}>
          {l==='fr'?'Promo':l==='en'?'Sale':l==='de'?'Aktion':l==='es'?'Oferta':l==='it'?'Promo':'Promoção'}
        </span>
      )}
    </div>
  );

  const specs = [
    car.year,
    car.mileage ? `${Number(car.mileage).toLocaleString('fr-FR')} km` : null,
    car.fuelType,
    car.transmission,
    car.power ? `${car.power} ${l==='de'?'PS':'ch'}` : null,
  ].filter(Boolean);

  const Title = ({ size = 17 }) => (
    <Link to={`/cars/${car.id}`} style={{ textDecoration:'none', display:'block' }}>
      <h3 style={{ fontFamily:F, fontWeight:700, fontSize:size, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1.25, transition:'color 0.15s' }}
        onMouseOver={e=>e.currentTarget.style.color='var(--red)'}
        onMouseOut={e=>e.currentTarget.style.color='var(--text)'}>
        {car.make} {car.model}
      </h3>
    </Link>
  );

  const Price = ({ size = 24 }) => (
    <div>
      <div style={{ fontFamily:F, fontWeight:800, fontSize:size, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1 }}>
        {formatEuro(car.price)}
      </div>
      {car.monthlyPayment && (
        <div style={{ fontSize:12, color:'var(--text-3)', marginTop:5 }}>
          {t('or', l)} {formatEuro(car.monthlyPayment)}{t('per_month', l)}
        </div>
      )}
    </div>
  );

  const OrderBtn = ({ block }) => (
    <button onClick={order}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        width: block ? '100%' : 'auto',
        padding:'11px 22px', borderRadius:'var(--radius-pill)',
        fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:F,
        background:'var(--red)', color:'#fff', transition:'background 0.15s',
      }}
      onMouseOver={e=>e.currentTarget.style.background='var(--red-dark)'}
      onMouseOut={e=>e.currentTarget.style.background='var(--red)'}>
      {l==='fr'?'Commander':l==='en'?'Order':l==='de'?'Bestellen':l==='es'?'Pedir':l==='it'?'Ordina':'Encomendar'}
    </button>
  );

  /* ───────────────────────── LIGNE (résultats) ───────────────────────── */
  if (variant === 'row') {
    return (
      <motion.article
        initial={{ opacity:0, y:12 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay: Math.min(index,8)*0.05, duration:0.4, ease:[0.16,1,0.3,1] }}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        style={{
          display:'flex', gap:0, background:'var(--bg-card)',
          border:`1px solid ${hovered ? 'var(--red)' : 'var(--border)'}`,
          borderRadius:'var(--radius-lg)', overflow:'hidden',
          boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          transition:'border-color 0.15s, box-shadow 0.15s',
        }}>
        {/* Visuel */}
        <Link to={`/cars/${car.id}`} style={{ position:'relative', flexShrink:0, width: isMobile ? 120 : 250, display:'block', background:'var(--bg-card2)' }}>
          <img src={img} alt={`${car.make} ${car.model}`}
            style={{ width:'100%', height: isMobile ? 120 : '100%', minHeight: isMobile ? 120 : 170, objectFit:'cover', display:'block' }} />
          <div style={{ position:'absolute', top:8, left:8 }}><Badges stack /></div>
          <OverlayBtns small={isMobile} />
        </Link>

        {/* Infos */}
        <div style={{ flex:1, minWidth:0, padding: isMobile ? '12px 14px' : '18px 22px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:14, alignItems:'flex-start' }}>
            <div style={{ minWidth:0 }}>
              <Title size={isMobile ? 15 : 18} />
              <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2, fontWeight:500 }}>{car.category}</p>
            </div>
            {/* Prix — colonne droite (desktop) */}
            {!isMobile && (
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <Price size={26} />
              </div>
            )}
          </div>

          {/* Caractéristiques en ligne */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {specs.map((s, i) => (
              <span key={i} className="mk-chip">{s}</span>
            ))}
          </div>

          {/* Bas de ligne */}
          <div style={{ marginTop:'auto', paddingTop:10, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'var(--text-3)', display:'inline-flex', alignItems:'center', gap:6 }}>
              📍 Offenbach am Main · 🛡️ {l==='fr'?'Garantie incluse':l==='en'?'Warranty included':l==='de'?'Garantie inklusive':'Garantía incluida'}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {isMobile && <Price size={19} />}
              <OrderBtn />
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  /* ───────────────────────── CARTE (vitrine) ───────────────────────── */
  return (
    <motion.article
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: Math.min(index,8)*0.06, duration:0.5, ease:[0.16,1,0.3,1] }}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        background:'var(--bg-card)', borderRadius:'var(--radius-lg)', overflow:'hidden',
        border:`1px solid ${hovered ? 'var(--red)' : 'var(--border)'}`,
        transition:'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}>
      {/* Image */}
      <Link to={`/cars/${car.id}`} style={{ display:'block', position:'relative', overflow:'hidden' }}>
        <img src={img} alt={`${car.make} ${car.model}`}
          style={{ width:'100%', height:190, objectFit:'cover', display:'block', transition:'transform 0.4s var(--ease)' }} />
        <div style={{ position:'absolute', top:10, left:10 }}><Badges /></div>
        <OverlayBtns />
        <span style={{ position:'absolute', bottom:10, right:10, background:'rgba(255,255,255,0.94)', color:'var(--text-2)', fontSize:10, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', padding:'3px 10px', borderRadius:100 }}>
          {car.category}
        </span>
      </Link>

      {/* Infos */}
      <div style={{ padding:'14px 16px 16px', display:'flex', flexDirection:'column', gap:9 }}>
        <div>
          <Title />
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
            {specs.slice(0,4).map((s, i) => <span key={i} className="mk-chip">{s}</span>)}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:10, paddingTop:12, marginTop:'auto', borderTop:'1px solid var(--border)' }}>
          <Price size={22} />
          <OrderBtn />
        </div>
      </div>
    </motion.article>
  );
}
