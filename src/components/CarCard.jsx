import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatEuro } from '../utils/helpers';
import { useAuthStore, useCartStore, useToastStore, useLangStore } from '../store';
import { t } from '../utils/i18n';

export default function CarCard({ car, index = 0 }) {
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();
  const { lang } = useLangStore();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [hovered, setHovered] = useState(false);
  const l = lang || 'fr';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/commander/${car.id}`);
  };

  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay:index*0.08, duration:0.6, ease:[0.16,1,0.3,1] }}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      className="car-card"
      style={{
        background:'var(--bg-card)', borderRadius:'var(--radius-lg)', overflow:'hidden',
        border:`1px solid ${hovered?'var(--border-2)':'var(--border)'}`,
        transition:'all 0.2s cubic-bezier(0.16,1,0.3,1)',
        transform:hovered?'translateY(-2px)':'translateY(0)',
        boxShadow:hovered?'var(--shadow-md)':'var(--shadow-sm)',
      }}>

      {/* Image */}
      <Link to={`/cars/${car.id}`} style={{ display:'block', position:'relative', overflow:'hidden' }}>
        <img src={car.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=70'}
          alt={`${car.make} ${car.model}`}
          className="car-img-zoom"
          style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />

        {/* Badges — top left */}
        <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:6 }}>
          {car.featured && (
            <span style={{ background:'rgba(19,40,83,0.92)', backdropFilter:'blur(8px)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'0.04em', padding:'3px 9px', borderRadius:4 }}>
              ★ {l==='fr'?'À la une':l==='en'?'Featured':l==='de'?'Empfohlen':l==='es'?'Destacado':l==='it'?'In evidenza':'Destacado'}
            </span>
          )}
          {car.promotional && (
            <span style={{ background:'#E8590C', backdropFilter:'blur(8px)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'0.04em', padding:'3px 9px', borderRadius:4 }}>
              {l==='fr'?'Promo':l==='en'?'Sale':l==='de'?'Aktion':l==='es'?'Oferta':l==='it'?'Promo':'Promoção'}
            </span>
          )}
        </div>

        {/* Category — top right */}
        <span style={{ position:'absolute', top:10, right:10, background:'rgba(255,255,255,0.92)', color:'var(--text-2)', fontSize:10, fontWeight:700, letterSpacing:'0.04em', padding:'3px 9px', borderRadius:4 }}>
          {car.category}
        </span>

        {/* Hover overlay */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:hovered?1:0, transition:'opacity 0.2s', background:'rgba(19,40,83,0.18)' }}>
          <span style={{ background:'#fff', color:'var(--red)', padding:'9px 24px', borderRadius:6, fontSize:13, fontWeight:700, transform:hovered?'translateY(0)':'translateY(6px)', transition:'transform 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
            {t('view_vehicle', l)} →
          </span>
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding:'14px 16px 16px' }}>
        <Link to={`/cars/${car.id}`} style={{ textDecoration:'none' }}>
          <h3 style={{ fontFamily:"var(--font)", fontWeight:700, fontSize:17, color:'var(--text)', letterSpacing:'-0.02em', marginBottom:3, lineHeight:1.25, transition:'color 0.2s' }}
            onMouseOver={e=>e.target.style.color='var(--red)'} onMouseOut={e=>e.target.style.color='var(--text)'}>
            {car.make} {car.model}
          </h3>
        </Link>
        <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:10, fontWeight:500 }}>
          {car.year} · {car.fuelType} · {car.transmission}
        </p>

        {/* Spec chips — caractéristiques denses */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          <span className="mk-chip">🛣 {car.mileage ? `${Number(car.mileage).toLocaleString('fr-FR')} km` : '—'}</span>
          <span className="mk-chip">{car.fuelType}</span>
          <span className="mk-chip">{car.transmission}</span>
          {car.power && <span className="mk-chip">{car.power} {l==='de'?'PS':'ch'}</span>}
        </div>

        {/* Price row */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:10, marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontFamily:"var(--font)", fontWeight:800, fontSize:23, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1 }}>
              {formatEuro(car.price)}
            </div>
            {car.monthlyPayment && (
              <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>
                {t('or', l)} {formatEuro(car.monthlyPayment)}{t('per_month', l)}
              </div>
            )}
          </div>
          <button onClick={handleAddToCart} disabled={adding}
            style={{ padding:'9px 16px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', border:'none', fontFamily:"var(--font)", transition:'all 0.2s', background:adding?'var(--red-dark)':'var(--red)', color:'#fff', flexShrink:0 }}
            onMouseOver={e=>{ if(!adding) e.currentTarget.style.background='var(--red-dark)'; }}
            onMouseOut={e=>{ if(!adding) e.currentTarget.style.background='var(--red)'; }}>
            {adding?'...':(l==='fr'?'Commander':l==='en'?'Order':l==='de'?'Bestellen':'Pedir')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
