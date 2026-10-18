import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { carAPI, orderAPI } from '../services/api';
import { useLangStore, useToastStore } from '../store';
import { useNavigate as useNav } from 'react-router-dom';
import { t } from '../utils/i18n';
import { formatEuro } from '../utils/helpers';
import { Loader } from '../components/UI';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function Commander() {
  const { id } = useParams();
  const { lang } = useLangStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const l = lang || 'fr';
  const { isMobile } = useBreakpoint();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: sessionStorage.getItem('ak_order_email') || '',
    phone: '', address: '', notes: '', paymentType: 'full',
  });

  useEffect(() => {
    carAPI.getById(id)
      .then(r => { setCar(r.data.car || r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.firstName.trim() || !form.address.trim()) {
      addToast(l==='fr' ? 'Nom, email et adresse requis' : 'Name, email and address required', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('paymentType', form.paymentType);
      fd.append('shippingAddress', form.address);
      fd.append('notes', form.notes || '');
      fd.append('email', form.email.trim());
      fd.append('firstName', form.firstName.trim());
      fd.append('lastName', form.lastName.trim());
      fd.append('phone', form.phone.trim());
      fd.append('items', JSON.stringify([{ carId: Number(id), quantity: 1 }]));
      const { data } = await orderAPI.create(fd);
      localStorage.setItem('ak_order_email', form.email.trim());
      sessionStorage.setItem('ak_order_email', form.email.trim());
      window.dispatchEvent(new Event('ak_order_email_changed'));
      setDone(data.orderNumber);
    } catch (err) {
      addToast(err.response?.data?.error || 'Erreur', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding:120, textAlign:'center' }}><Loader /></div>;
  if (!car) return <div style={{ padding:100, textAlign:'center' }}>Véhicule introuvable. <Link to="/catalog">Retour</Link></div>;
  if (done) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:72 }}>
      <div className="mk-panel" style={{ padding:40, maxWidth:480, width:'90%', textAlign:'center', borderRadius:'var(--radius-lg)' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
        <h2 style={{ fontFamily:"var(--font-title)", fontWeight:600, fontSize:24, color:'var(--text)', marginBottom:10 }}>
          {l==='fr'?'Commande enregistrée !':l==='en'?'Order registered!':l==='de'?'Bestellung erfasst!':'¡Pedido registrado!'}
        </h2>
        <p style={{ fontSize:15, color:'var(--text-2)', marginBottom:12 }}>
          {l==='fr'?'Votre numéro de commande :':l==='en'?'Your order number:':l==='de'?'Ihre Bestellnummer:':'Su número de pedido:'} <strong>{done}</strong>
        </p>
        <p style={{ fontSize:14, color:'var(--text-3)', marginBottom:20, lineHeight:1.6 }}>
          {l==='fr'?"Un email de confirmation (avec les coordonnées de paiement) vous sera envoyé dès validation par notre équipe.":l==='en'?'A confirmation email (with payment details) will be sent once our team validates your order.':l==='de'?'Eine Bestätigungs-E-Mail (mit Zahlungsdaten) erhalten Sie nach Freigabe.':'Recibirá un email de confirmación (con los datos de pago) una vez validado.'}
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/catalog" className="btn-primary">{l==='fr'?'Continuer les achats':l==='en'?'Keep browsing':l==='de'?'Weiter':'Seguir'}</Link>
          <Link to="/mes-commandes" className="btn-outline">{l==='fr'?'Mes commandes':l==='en'?'My orders':l==='de'?'Meine Bestellungen':'Mis pedidos'}</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:72 }}>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'36px 4% 80px' }}>
        <div className="section-eyebrow">
          {l==='fr'?'Finaliser votre commande':l==='en'?'Complete your order':l==='de'?'Bestellung abschließen':'Finalizar pedido'}
        </div>
        <h1 style={{ fontFamily:"var(--font-title)", fontWeight:600, fontSize:'clamp(24px,4vw,36px)', color:'var(--text)', marginBottom:8, letterSpacing:'-0.01em', lineHeight:1.1 }}>
          {car.make} {car.model}
        </h1>
        <p style={{ fontSize:15, color:'var(--text-3)', marginBottom:20 }}>{car.year} · {formatEuro(car.price)}</p>

        <div className="mk-panel" style={{ display:'flex', gap: isMobile ? 14 : 20, alignItems:'center', padding: isMobile ? '14px 16px' : '18px 20px', borderRadius:'var(--radius-lg)', marginBottom:18 }}>
          <div style={{ width: isMobile ? 88 : 128, height: isMobile ? 66 : 96, borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--bg-card2)', flexShrink:0 }}>
            <img src={car.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=70'} alt={`${car.make} ${car.model}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ minWidth:0 }}>
            <h2 style={{ fontFamily:'var(--font-title)', fontWeight:600, fontSize: isMobile ? 16 : 18, color:'var(--text)', letterSpacing:'-0.01em', lineHeight:1.2, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {car.make} {car.model}
            </h2>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {[car.year, car.mileage ? `${Number(car.mileage).toLocaleString('fr-FR')} km` : null, car.fuelType, car.transmission].filter(Boolean).map((s, i) => <span key={i} className="mk-chip">{s}</span>)}
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="mk-panel" style={{ padding: isMobile ? '22px 18px 26px' : '28px 32px 32px', borderRadius:'var(--radius-lg)' }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:14 }}>
            <div><label style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{l==='fr'?'Prénom *':l==='en'?'First name *':l==='de'?'Vorname *':'Nombre *'}</label>
              <input value={form.firstName} onChange={e => set('firstName', e.target.value)} className="input-luxury" style={{ width:'100%', boxSizing:'border-box' }} /></div>
            <div><label style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{l==='fr'?'Nom':l==='en'?'Last name':l==='de'?'Nachname':'Apellido'}</label>
              <input value={form.lastName} onChange={e => set('lastName', e.target.value)} className="input-luxury" style={{ width:'100%', boxSizing:'border-box' }} /></div>
          </div>
          <div style={{ marginBottom:14 }}><label style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-luxury" style={{ width:'100%', boxSizing:'border-box' }} /></div>
          <div style={{ marginBottom:14 }}><label style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{l==='fr'?'Téléphone':l==='en'?'Phone':l==='de'?'Telefon':'Teléfono'}</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-luxury" style={{ width:'100%', boxSizing:'border-box' }} /></div>
          <div style={{ marginBottom:14 }}><label style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{l==='fr'?'Adresse de livraison *':l==='en'?'Delivery address *':l==='de'?'Lieferadresse *':'Dirección de entrega *'}</label>
            <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={3} className="input-luxury" style={{ width:'100%', boxSizing:'border-box', resize:'vertical' }} /></div>
          <div style={{ marginBottom:14 }}><label style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{l==='fr'?'Mode de paiement':l==='en'?'Payment method':l==='de'?'Zahlungsart':'Método de pago'}</label>
            <select value={form.paymentType} onChange={e => set('paymentType', e.target.value)} className="input-luxury" style={{ width:'100%', boxSizing:'border-box' }}>
              <option value="full">{l==='fr'?'Paiement comptant (-5%)':l==='en'?'Full payment (-5%)':l==='de'?'Barzahlung (-5%)':'Pago contado (-5%)'}</option>
              <option value="deposit">{l==='fr'?'Acompte 25%':l==='en'?'25% deposit':l==='de'?'25% Anzahlung':'25% entrada'}</option>
              <option value="monthly">{l==='fr'?'Échéancier mensuel':l==='en'?'Monthly financing':l==='de'?'Monatliche Rate':'Financiación mensual'}</option>
            </select></div>
          <div style={{ marginBottom:20 }}><label style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{l==='fr'?'Notes':l==='en'?'Notes':l==='de'?'Notizen':'Notas'}</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} className="input-luxury" style={{ width:'100%', boxSizing:'border-box' }} /></div>
          <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:18, lineHeight:1.6 }}>💳 {l==='fr'?"L'adresse de paiement vous sera communiquée par email une fois votre commande validée.":l==='en'?'Payment details will be emailed after your order is confirmed.':l==='de'?'Zahlungsdaten werden nach Bestätigung per E-Mail mitgeteilt.':'Los datos de pago se enviarán por email tras la confirmación.'}</p>
          <button type="submit" className="btn-primary" disabled={submitting} style={{ width:'100%', justifyContent:'center', padding:'14px 24px', borderRadius:'var(--radius-pill)' }}>
            {submitting ? '⏳ …' : '✓ ' + (l==='fr'?'Confirmer la commande':l==='en'?'Confirm order':l==='de'?'Bestellung bestätigen':'Confirmar pedido')}
          </button>
        </form>
      </div>
    </div>
  );
}
