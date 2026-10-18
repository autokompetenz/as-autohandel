import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { carAPI } from '../services/api';
import { formatEuro } from '../utils/helpers';
import { useLangStore, useCompareStore } from '../store';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Loader } from '../components/UI';

/* ─── Comparateur — jusqu'à 3 véhicules côte à côte ──────────────────────── */
export default function Compare() {
  const { lang } = useLangStore();
  const { isMobile } = useBreakpoint();
  const cmpIds = useCompareStore(s => s.ids);
  const toggleCmp = useCompareStore(s => s.toggle);
  const clearCmp = useCompareStore(s => s.clear);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const l = lang || 'fr';

  const txt = (fr, en, de, es, it, pt, ro) => ({ fr, en, de, es, it, pt, ro }[l] || fr);

  useEffect(() => {
    carAPI.getAll({ limit: 100 })
      .then(r => setAll(r.data.cars || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cars = cmpIds.map(id => all.find(c => c.id === id)).filter(Boolean);

  const rows = [
    { k: 'price',    label: txt('Prix','Price','Preis','Precio','Prezzo','Preço','Preț'),              fmt: c => formatEuro(c.price) },
    { k: 'monthly',  label: txt('Mensualité','Monthly','Monatlich','Cuota','Rata','Prestação','Rate lunară'), fmt: c => c.monthlyPayment ? `${formatEuro(c.monthlyPayment)}/mo` : '—' },
    { k: 'year',     label: txt('Année','Year','Baujahr','Año','Anno','Ano','An'),                     fmt: c => c.year },
    { k: 'mileage',  label: txt('Kilométrage','Mileage','Kilometer','Kilometraje','Chilometraggio','Quilómetros','Kilometraj'), fmt: c => c.mileage ? `${Number(c.mileage).toLocaleString('fr-FR')} km` : '—' },
    { k: 'fuelType', label: txt('Énergie','Fuel','Kraftstoff','Combustible','Carburante','Combustível','Combustibil'), fmt: c => c.fuelType || '—' },
    { k: 'transmission', label: txt('Boîte','Gearbox','Getriebe','Caja','Cambio','Caixa','Cutie'),      fmt: c => c.transmission || '—' },
    { k: 'power',    label: txt('Puissance','Power','Leistung','Potencia','Potenza','Potência','Putere'), fmt: c => c.power ? `${c.power} ${l==='de'?'PS':'ch'}` : '—' },
    { k: 'category', label: txt('Catégorie','Body type','Karosserie','Carroceria','Carrozzeria','Carroceria','Caroserie'), fmt: c => c.category || '—' },
    { k: 'color',    label: txt('Couleur','Color','Farbe','Color','Colore','Cor','Culoare'),           fmt: c => c.color || '—' },
    { k: 'location', label: txt('Localisation','Location','Standort','Ubicación','Posizione','Localização','Locație'), fmt: c => c.location || 'Offenbach am Main' },
  ];

  return (
    <div>
      {/* Bandeau titre */}
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding: isMobile ? '36px 4% 28px' : '52px 6% 36px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto' }}>
          <div className="section-eyebrow">
            {txt('Côte à côte','Side by side','Nebeneinander','Uno al lado del otro','Affiancati','Lado a lado','Unul lângă altul')}
          </div>
          <h1 style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize:'clamp(30px,5vw,56px)', color:'var(--text)', letterSpacing:'-0.01em', marginBottom:10 }}>
            {txt('Comparateur','Comparison','Vergleich','Comparador','Confronto','Comparador','Comparator')}
          </h1>
          <p style={{ fontSize:16, color:'var(--text-3)', maxWidth:560 }}>
            {txt(
              'Jusqu’à 3 véhicules comparés caractéristique par caractéristique.',
              'Up to 3 vehicles compared feature by feature.',
              'Bis zu 3 Fahrzeuge, Merkmal für Merkmal verglichen.',
              'Hasta 3 vehículos comparados característica a característica.',
              'Fino a 3 veicoli confrontati caratteristica per caratteristica.',
              'Até 3 veículos comparados caractéristica a característica.',
              'Până la 3 vehicule comparate caracteristică cu caracteristică.'
            )}
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1400, margin:'0 auto', padding: isMobile ? '24px 4% 64px' : '40px 6% 80px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><Loader /></div>
        ) : cars.length === 0 ? (
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="mk-panel" style={{ textAlign:'center', padding: isMobile ? '48px 20px' : '72px 24px' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>⇄</div>
            <h2 style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize:26, color:'var(--text)', marginBottom:10 }}>
              {txt('Rien à comparer','Nothing to compare','Nichts zu vergleichen','Nada que comparar','Niente da confrontare','Nada a comparar','Nimic de comparat')}
            </h2>
            <p style={{ fontSize:15, color:'var(--text-3)', marginBottom:26, maxWidth:460, margin:'0 auto 26px' }}>
              {txt(
                'Ajoutez jusqu’à 3 véhicules avec le bouton ⇄ dans le catalogue.',
                'Add up to 3 vehicles with the ⇄ button in the catalogue.',
                'Fügen Sie bis zu 3 Fahrzeuge mit dem ⇄-Button im Katalog hinzu.',
                'Añade hasta 3 vehículos con el botón ⇄ del catálogo.',
                'Aggiungi fino a 3 veicoli con il pulsante ⇄ nel catalogo.',
                'Até 3 veículos com o botão ⇄ no catálogo.',
                'Adăugați până la 3 vehicule cu butonul ⇄ din catalog.'
              )}
            </p>
            <Link to="/catalog" className="btn-primary">
              {txt('Voir le catalogue','Browse the catalogue','Katalog durchsuchen','Ver catálogo','Sfoglia il catalogo','Ver catálogo','Răsfoiește catalogul')}
            </Link>
          </motion.div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:18, flexWrap:'wrap' }}>
              <p style={{ fontSize:14, color:'var(--text-2)' }}>
                <strong style={{ color:'var(--text)', fontWeight:700 }}>{cars.length}</strong>/3 —{' '}
                {txt('sélection pour comparaison','selected for comparison','für Vergleich ausgewählt','seleccionados para comparación','selezionati per il confronto','selecionados para comparação','selectate pentru comparație')}
              </p>
              <button onClick={clearCmp} className="btn-outline" style={{ fontSize:13 }}>
                {txt('Vider la sélection','Clear selection','Auswahl leeren','Vaciar selección','Svuota selezione','Limpar seleção','Golește selecția')}
              </button>
            </div>

            {/* Tableau */}
            <div className="mk-panel" style={{ overflowX:'auto', padding: isMobile ? '6px 12px 16px' : '16px 20px 24px' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth: isMobile ? 520 : 640 }}>
                <thead>
                  <tr>
                    <th style={{ width:150 }} />
                    {cars.map(car => (
                      <th key={car.id} style={{ padding:'12px 10px', textAlign:'center', verticalAlign:'top' }}>
                        <Link to={`/cars/${car.id}`} style={{ textDecoration:'none', display:'block' }}>
                          <div style={{ overflow:'hidden', borderRadius:'var(--radius-lg)', marginBottom:10, background:'var(--bg-card2)', aspectRatio:'4/3' }}>
                            <img src={car.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=70'}
                              alt={`${car.make} ${car.model}`}
                              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                          </div>
                          <span style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize:16, color:'var(--text)', lineHeight:1.3, display:'block' }}>
                            {car.make} {car.model}
                          </span>
                        </Link>
                        <button onClick={() => toggleCmp(car.id)}
                          aria-label="retirer"
                          className="mk-chip"
                          style={{ marginTop:8, cursor:'pointer', border:'1px solid var(--border)', background:'var(--bg-card2)', color:'var(--text-2)' }}>
                          ✕ {txt('Retirer','Remove','Entfernen','Quitar','Rimuovi','Remover','Elimină')}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={row.k} style={{ background: ri % 2 ? 'var(--bg-card2)' : 'transparent' }}>
                      <td style={{ padding:'11px 12px', fontSize:13, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left' }}>
                        {row.label}
                      </td>
                      {cars.map(car => (
                        <td key={car.id} style={{ padding:'11px 12px', fontSize:15, color:'var(--text)', textAlign:'center', fontWeight: row.k === 'price' ? 700 : 500,
                          fontFamily: row.k === 'price' ? 'var(--font-title)' : 'inherit' }}>
                          {row.fmt(car)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding:'14px 12px' }} />
                    {cars.map(car => (
                      <td key={car.id} style={{ padding:'14px 12px', textAlign:'center' }}>
                        <Link to={`/commander/${car.id}`} className="btn-primary" style={{ fontSize:13, padding:'10px 22px' }}>
                          {txt('Commander','Order','Bestellen','Pedir','Ordina','Encomendar','Comandă')}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
