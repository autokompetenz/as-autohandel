import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { alertAPI } from '../services/api';
import { useLangStore } from '../store';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Loader } from '../components/UI';

/* ─── Gestion d'alerte e-mail (lien reçu dans les e-mails d'alerte) ────────
   /alerte/:token — consulter, activer/désactiver, supprimer               */
export default function AlertManage() {
  const { token } = useParams();
  const { lang } = useLangStore();
  const { isMobile } = useBreakpoint();
  const l = lang || 'fr';
  const [alert, setAlert]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [deleted, setDeleted] = useState(false);

  const m = (fr, en, de, es, it, pt, ro) => ({ fr, en, de, es, it, pt, ro }[l] || fr);

  const LABELS = {
    fr: { brand:'Marque', search:'Recherche', category:'Catégorie', fuelType:'Énergie', transmission:'Boîte', minPrice:'Prix min', maxPrice:'Prix max', minYear:'Année min', maxYear:'Année max', maxMileage:'Km max' },
    en: { brand:'Brand', search:'Search', category:'Category', fuelType:'Fuel', transmission:'Gearbox', minPrice:'Min price', maxPrice:'Max price', minYear:'Min year', maxYear:'Max year', maxMileage:'Max mileage' },
    de: { brand:'Marke', search:'Suche', category:'Kategorie', fuelType:'Kraftstoff', transmission:'Getriebe', minPrice:'Preis min', maxPrice:'Preis max', minYear:'Baujahr min', maxYear:'Baujahr max', maxMileage:'km max' },
    es: { brand:'Marca', search:'Búsqueda', category:'Categoría', fuelType:'Combustible', transmission:'Caja', minPrice:'Precio mín', maxPrice:'Precio máx', minYear:'Año mín', maxYear:'Año máx', maxMileage:'km máx' },
    it: { brand:'Marca', search:'Ricerca', category:'Categoria', fuelType:'Carburante', transmission:'Cambio', minPrice:'Prezzo min', maxPrice:'Prezzo max', minYear:'Anno min', maxYear:'Anno max', maxMileage:'km max' },
    pt: { brand:'Marca', search:'Pesquisa', category:'Categoria', fuelType:'Combustível', transmission:'Caixa', minPrice:'Preço mín', maxPrice:'Preço máx', minYear:'Ano mín', maxYear:'Ano máx', maxMileage:'km máx' },
    ro: { brand:'Marcă', search:'Căutare', category:'Categorie', fuelType:'Combustibil', transmission:'Cutie', minPrice:'Preț min', maxPrice:'Preț max', minYear:'An min', maxYear:'An max', maxMileage:'km max' },
  };
  const lbl = LABELS[l] || LABELS.fr;

  useEffect(() => {
    setLoading(true);
    alertAPI.get(token)
      .then(r => setAlert(r.data.alert))
      .catch(e => setError(e.response?.status === 404
        ? m('Alerte introuvable ou déjà supprimée.', 'Alert not found or already deleted.', 'Warnung nicht gefunden oder bereits gelöscht.', 'Alerta no encontrada o ya eliminada.', 'Avviso non trovato o già eliminato.', 'Alerta não encontrada ou já eliminada.', 'Alertă negăsită sau deja ștearsă.')
        : m('Erreur de chargement.', 'Loading error.', 'Ladefehler.', 'Error de carga.', 'Errore di caricamento.', 'Erro de carregamento.', 'Eroare la încărcare.')))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleActive = async () => {
    if (!alert || busy) return;
    setBusy(true);
    try {
      const { data } = await alertAPI.setActive(token, !alert.active);
      setAlert({ ...alert, active: data.active });
    } catch { /* ignore */ }
    setBusy(false);
  };

  const remove = async () => {
    if (!window.confirm(m('Supprimer définitivement cette alerte ?', 'Delete this alert permanently?', 'Diese Warnung endgültig löschen?', '¿Eliminar esta alerta definitivamente?', 'Eliminare definitivamente questo avviso?', 'Eliminar esta alerta definitivamente?', 'Ștergeți definitiv această alertă?'))) return;
    setBusy(true);
    try { await alertAPI.remove(token); setDeleted(true); setAlert(null); }
    catch { /* ignore */ }
    setBusy(false);
  };

  const critEntries = alert ? Object.entries(alert.params || {}) : [];

  return (
    <div>
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding: isMobile ? '36px 4% 28px' : '52px 6% 36px' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div className="section-eyebrow">🔔 {m('Alerte de stock','Stock alert','Bestand-Warnung','Alerta de stock','Avviso disponibilità','Alerta de stock','Alertă stoc')}</div>
          <h1 style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize:'clamp(28px,4.5vw,48px)', color:'var(--text)', letterSpacing:'-0.01em', marginBottom:8 }}>
            {m('Gérer mon alerte','Manage my alert','Warnung verwalten','Gestionar mi alerta','Gestisci il mio avviso','Gerir o meu alerta','Gestionează alerta')}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth:800, margin:'0 auto', padding: isMobile ? '28px 4% 64px' : '48px 6% 80px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><Loader /></div>
        ) : deleted ? (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mk-panel" style={{ textAlign:'center', padding:'56px 24px' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>🗑️</div>
            <h2 style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize:24, color:'var(--text)', marginBottom:10 }}>
              {m('Alerte supprimée','Alert deleted','Warnung gelöscht','Alerta eliminada','Avviso eliminato','Alerta eliminada','Alertă ștearsă')}
            </h2>
            <p style={{ fontSize:15, color:'var(--text-3)', marginBottom:24 }}>
              {m('Vous ne recevrez plus d’e-mails pour cette recherche.', 'You will no longer receive emails for this search.', 'Sie erhalten keine E-Mails mehr für diese Suche.', 'Ya no recibirá correos por esta búsqueda.', 'Non riceverai più e-mail per questa ricerca.', 'Não receberá mais e-mails para esta pesquisa.', 'Nu veți mai primi e-mailuri pentru această căutare.')}
            </p>
            <Link to="/catalog" className="btn-primary">{m('Voir le catalogue','Browse catalogue','Katalog ansehen','Ver catálogo','Sfoglia il catalogo','Ver catálogo','Vezi catalogul')}</Link>
          </motion.div>
        ) : error || !alert ? (
          <div className="mk-panel" style={{ textAlign:'center', padding:'56px 24px' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
            <h2 style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize:24, color:'var(--text)', marginBottom:10 }}>{error || m('Alerte introuvable','Alert not found','Warnung nicht gefunden','Alerta no encontrada','Avviso non trovato','Alerta não encontrada','Alertă negăsită')}</h2>
            <Link to="/catalog" className="btn-outline" style={{ display:'inline-block' }}>{m('Retour au catalogue','Back to catalogue','Zurück zum Katalog','Volver al catálogo','Torna al catalogo','Voltar ao catálogo','Înapoi la catalog')}</Link>
          </div>
        ) : (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mk-panel" style={{ padding: isMobile ? '26px 20px' : '36px 34px' }}>
            {/* État */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
              <span className="mk-chip" style={{
                background: alert.active ? 'var(--red)' : 'var(--bg-card2)',
                color: alert.active ? 'var(--red-light)' : 'var(--text-3)',
                border:'1px solid var(--border)', fontWeight:700, padding:'6px 16px',
              }}>
                {alert.active
                  ? m('● Active','● Active','● Aktiv','● Activa','● Attiva','● Activă','● Activă')
                  : m('○ Désactivée','○ Paused','○ Pausiert','○ Pausada','○ In pausa','○ Pauzată','○ În pauză')}
              </span>
              <span style={{ fontSize:14, color:'var(--text-2)', fontWeight:600 }}>{alert.email}</span>
            </div>

            {/* Critères */}
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:10 }}>
              {m('Critères recherchés','Search criteria','Suchkriterien','Criterios de búsqueda','Criteri di ricerca','Critérii de căutare','Criterii de căutare')}
            </p>
            <div style={{ marginBottom:20 }}>
              {critEntries.length === 0 ? (
                <span className="mk-chip" style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', color:'var(--red-light)' }}>
                  {m('Tous les nouveaux véhicules','All new vehicles','Alle neuen Fahrzeuge','Todos los vehículos nuevos','Tutti i veicoli nuovi','Todos os veículos novos','Toate vehiculele noi')}
                </span>
              ) : critEntries.map(([k, v]) => (
                <span key={k} className="mk-chip" style={{ marginRight:6, marginBottom:6 }}>
                  {lbl[k] || k} : {v}
                </span>
              ))}
            </div>

            <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:24 }}>
              {m(`${alert.notifiedCount} e-mail(s) envoyé(s) depuis la création.`, `${alert.notifiedCount} email(s) sent since creation.`, `${alert.notifiedCount} E-Mail(s) seit Erstellung gesendet.`, `${alert.notifiedCount} correo(s) enviado(s) desde su creación.`, `${alert.notifiedCount} e-mail inviati dalla creazione.`, `${alert.notifiedCount} e-mail(s) enviados desde a criação.`, `${alert.notifiedCount} e-mail(uri) trimise de la creare.`)}
            </p>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={toggleActive} disabled={busy} className={alert.active ? 'btn-outline' : 'btn-primary'} style={{ fontSize:14 }}>
                {alert.active
                  ? m('Désactiver','Pause','Anhalten','Pausar','Metti in pausa','Pauzar','Oprește')
                  : m('Réactiver','Resume','Fortsetzen','Reanudar','Riprendi','Retomar','Reporne')}
              </button>
              <button onClick={remove} disabled={busy} className="btn-outline" style={{ fontSize:14, color:'#DC2626', borderColor:'#FCA5A5' }}>
                {m('Supprimer','Delete','Löschen','Eliminar','Elimina','Eliminar','Șterge')}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
