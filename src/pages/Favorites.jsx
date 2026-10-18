import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { carAPI } from '../services/api';
import { useLangStore, useFavStore } from '../store';
import { useBreakpoint } from '../hooks/useBreakpoint';
import CarCard from '../components/CarCard';
import { Loader } from '../components/UI';

/* ─── Mes favoris — véhicules enregistrés (localStorage) ─────────────────── */
export default function Favorites() {
  const { lang } = useLangStore();
  const { isMobile } = useBreakpoint();
  const favIds = useFavStore(s => s.ids);
  const clearFavs = useFavStore(s => s.clear);
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

  // Ordre de la liste = ordre d'ajout par l'utilisateur
  const cars = favIds.map(id => all.find(c => c.id === id)).filter(Boolean);

  return (
    <div>
      {/* Bandeau titre */}
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding: isMobile ? '36px 4% 28px' : '52px 6% 36px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto' }}>
          <div className="section-eyebrow">
            {txt('Votre sélection','Your selection','Ihre Auswahl','Su selección','La tua selezione','A sua seleção','Selecția dvs.')}
          </div>
          <h1 style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize:'clamp(30px,5vw,56px)', color:'var(--text)', letterSpacing:'-0.01em', marginBottom:10 }}>
            {txt('Mes favoris','My favorites','Meine Favoriten','Mis favoritos','I preferiti','Meus favoritos','Preferatele mele')}
          </h1>
          <p style={{ fontSize:16, color:'var(--text-3)', maxWidth:560 }}>
            {txt(
              'Les véhicules que vous avez gardés de côté, au même endroit.',
              'The vehicles you set aside, all in one place.',
              'Fahrzeug, die Sie beiseitegelegt haben — alles an einem Ort.',
              'Los vehículos que has guardado, todos en un mismo lugar.',
              'I veicoli che hai messo da parte, tutti in un unico posto.',
              'Os veículos que guardou, todos num só lugar.',
              'Vehiculele puse deoparte, toate într-un singur loc.'
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
            <div style={{ fontSize:52, marginBottom:14 }}>♡</div>
            <h2 style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize:26, color:'var(--text)', marginBottom:10 }}>
              {txt('Aucun favori pour le moment','No favorites yet','Noch keine Favoriten','Ningún favorito todavía','Nessun preferito','Ainda sem favoritos','Niciun preferat')}
            </h2>
            <p style={{ fontSize:15, color:'var(--text-3)', marginBottom:26, maxWidth:440, margin:'0 auto 26px' }}>
              {txt(
                'Touchez le cœur ♥ sur un véhicule pour l’ajouter ici.',
                'Tap the ♥ on any vehicle to add it here.',
                'Tippen Sie auf ein Fahrzeug auf ♥, um es hier hinzuzufügen.',
                'Toca el ♥ de un vehículo para añadirlo aquí.',
                'Tocca il ♥ di un veicolo per aggiungerlo qui.',
                'Toque no ♥ de um veículo para o adicionar aqui.',
                'Atingeți ♥ pe un vehicul pentru a-l adăuga aici.'
              )}
            </p>
            <Link to="/catalog" className="btn-primary">
              {txt('Voir le catalogue','Browse the catalogue','Katalog durchsuchen','Ver catálogo','Sfoglia il catalogo','Ver catálogo','Răsfoiește catalogul')}
            </Link>
          </motion.div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
              <p style={{ fontSize:14, color:'var(--text-2)' }}>
                <strong style={{ color:'var(--text)', fontWeight:700 }}>{cars.length}</strong>{' '}
                {cars.length > 1
                  ? txt('véhicules enregistrés','vehicles saved','Fahrzeuge gespeichert','vehículos guardados','veicoli salvati','veículos guardados','vehicule salvate')
                  : txt('véhicule enregistré','vehicle saved','Fahrzeug gespeichert','vehículo guardado','veicolo salvato','veículo guardado','vehicul salvat')}
              </p>
              <button onClick={clearFavs} className="btn-outline" style={{ fontSize:13 }}>
                {txt('Tout retirer','Remove all','Alle entfernen','Quitar todos','Rimuovi tutti','Remover todos','Elimină tot')}
              </button>
            </div>
            <div style={{ display:'grid', gap:12 }}>
              {cars.map((car, i) => <CarCard key={car.id} car={car} index={i} variant="row" />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
