import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { carAPI } from '../services/api';
import CarCard from '../components/CarCard';
import { Loader } from '../components/UI';
import { useLangStore } from '../store';
import { t } from '../utils/i18n';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars]             = useState([]);
  const [brands, setBrands]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView]             = useState('list');
  const { lang } = useLangStore();
  const { isMobile, isTablet } = useBreakpoint();
  const l = lang || 'fr';

  const brand    = searchParams.get('brand')    || '';
  const search   = searchParams.get('search')   || '';
  const sort     = searchParams.get('sort')     || '';
  const category = searchParams.get('category') || '';
  const fuelType = searchParams.get('fuelType') || '';
  const transmission = searchParams.get('transmission') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minYear  = searchParams.get('minYear')  || '';
  const maxYear  = searchParams.get('maxYear')  || '';
  const maxMileage = searchParams.get('maxMileage') || '';

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (brand) params.brand = brand;
      if (search) params.search = search;
      if (sort)   params.sort   = sort;
      if (category) params.category = category;
      if (fuelType) params.fuelType = fuelType;
      if (transmission) params.transmission = transmission;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minYear) params.minYear = minYear;
      if (maxYear) params.maxYear = maxYear;
      if (maxMileage) params.maxMileage = maxMileage;
      const { data } = await carAPI.getAll(params);
      setCars(data.cars || []);
      setTotal(data.total || 0);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  }, [brand, search, sort, category, fuelType, transmission, minPrice, maxPrice, minYear, maxYear, maxMileage]);

  useEffect(() => { fetchCars(); }, [fetchCars]);
  useEffect(() => {
    carAPI.getBrands().then(r => setBrands(r.data.brands || [])).catch(console.error);
  }, []);

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next);
    if (isMobile) setDrawerOpen(false);
  };

  const resetAll = () => { setSearchParams({}); setDrawerOpen(false); };

  const activeCount = [brand, search, sort, category, fuelType, transmission, minPrice, maxPrice, minYear, maxYear, maxMileage].filter(Boolean).length;

  const SortSelect = () => (
    <select value={sort} onChange={e => setFilter('sort', e.target.value)}
      className="input-luxury"
      style={{ fontSize:13, padding:'10px 12px', width:'100%', cursor:'pointer', borderRadius:'var(--radius)' }}>
      <option value="">{t('sort_by', l)}</option>
      <option value="price_asc">{t('sort_price_asc', l)}</option>
      <option value="price_desc">{t('sort_price_desc', l)}</option>
      <option value="newest">{t('sort_newest', l)}</option>
    </select>
  );

  const lbl = (fr, en, de) => l==='fr'?fr:l==='en'?en:de;

  const FacetGroup = ({ title, children }) => (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', marginBottom:10 }}>
      <p className="mk-label" style={{ padding:'13px 14px 10px', borderBottom:'1px solid var(--border)' }}>{title}</p>
      <div style={{ padding:'10px 12px 12px' }}>{children}</div>
    </div>
  );

  const RangeInputs = ({ prefix, min, max, phMin, phMax }) => (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input type="number" inputMode="numeric" placeholder={phMin} value={min}
        onChange={e => setFilter(prefix === 'price' ? 'minPrice' : 'minYear', e.target.value)}
        className="input-luxury" style={{ fontSize:14, padding:'9px 10px' }} />
      <span style={{ color:'var(--text-3)' }}>—</span>
      <input type="number" inputMode="numeric" placeholder={phMax} value={max}
        onChange={e => setFilter(prefix === 'price' ? 'maxPrice' : 'maxYear', e.target.value)}
        className="input-luxury" style={{ fontSize:14, padding:'9px 10px' }} />
    </div>
  );

  const OptionRow = ({ active, onClick, children }) => (
    <button onClick={onClick}
      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', marginBottom:2,
        background:active?'var(--red-bg)':'transparent', border:'none', borderRadius:'var(--radius)',
        color:active?'var(--red)':'var(--text-2)', fontFamily:"var(--font)",
        fontSize:14, fontWeight:active?700:500, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
      onMouseOver={e=>{ if(!active) e.currentTarget.style.background='var(--bg-card2)'; }}
      onMouseOut={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
      {children}
    </button>
  );

  const FilterSidebar = () => (
    <div>
      {/* Search */}
      <input type="text" placeholder={t('search_ph', l)} value={search}
        onChange={e => setFilter('search', e.target.value)}
        className="input-luxury" style={{ fontSize:15, marginBottom:10 }} />

      {/* Brands */}
      {brands.length > 0 && (
        <FacetGroup title={l==='fr'?'Marque':l==='en'?'Brand':l==='de'?'Marke':l==='es'?'Marca':l==='it'?'Marca':'Marca'}>
          <div style={{ maxHeight:260, overflowY:'auto', margin:'-2px -4px 0', padding:'2px 4px' }}>
            <OptionRow active={!brand} onClick={() => setFilter('brand', '')}>
              <span>{l==='fr'?'Toutes les marques':l==='en'?'All brands':l==='de'?'Alle Marken':'Todas las marcas'}</span>
            </OptionRow>
            {brands.map(b => (
              <OptionRow key={b} active={brand===b} onClick={() => setFilter('brand', brand===b?'':b)}>
                <span>{b}</span>
              </OptionRow>
            ))}
          </div>
        </FacetGroup>
      )}

      {/* Price */}
      <FacetGroup title={l==='fr'?'Prix':l==='en'?'Price':l==='de'?'Preis':l==='es'?'Precio':l==='it'?'Prezzo':'Preço'}>
        <RangeInputs prefix="price" min={minPrice} max={maxPrice} phMin="€ min" phMax="€ max" />
      </FacetGroup>

      {/* Year */}
      <FacetGroup title={l==='fr'?'Année':l==='en'?'Year':l==='de'?'Baujahr':l==='es'?'Año':l==='it'?'Anno':'Ano'}>
        <RangeInputs prefix="year" min={minYear} max={maxYear} phMin="1990" phMax="2026" />
      </FacetGroup>

      {/* Mileage */}
      <FacetGroup title={l==='fr'?'Kilométrage':l==='en'?'Mileage':l==='de'?'Kilometer':l==='es'?'Kilometraje':l==='it'?'Chilometraggio':'Quilómetros'}>
        <input type="number" inputMode="numeric" placeholder={l==='fr'?'km max':'max km'} value={maxMileage}
          onChange={e => setFilter('maxMileage', e.target.value)}
          className="input-luxury" style={{ fontSize:14, padding:'9px 10px' }} />
      </FacetGroup>

      {/* Fuel */}
      <FacetGroup title={l==='fr'?'Énergie':l==='en'?'Fuel':l==='de'?'Kraftstoff':l==='es'?'Combustible':l==='it'?'Carburante':'Combustível'}>
        {['Essence','Diesel','Hybrid','Électrique','GPL'].map(f => (
          <OptionRow key={f} active={fuelType===f} onClick={() => setFilter('fuelType', fuelType===f?'':f)}>
            <span>{f}</span>
          </OptionRow>
        ))}
      </FacetGroup>

      {/* Transmission */}
      <FacetGroup title={l==='fr'?'Boîte':l==='en'?'Gearbox':l==='de'?'Getriebe':l==='es'?'Caja':l==='it'?'Cambio':'Caixa'}>
        {['Automatique','Manuelle'].map(g => (
          <OptionRow key={g} active={transmission===g} onClick={() => setFilter('transmission', transmission===g?'':g)}>
            <span>{g}</span>
          </OptionRow>
        ))}
      </FacetGroup>

      {/* Reset */}
      {activeCount > 0 && (
        <button onClick={resetAll}
          style={{ width:'100%', padding:'11px', background:'var(--bg-card)', border:'1px solid var(--border-2)', borderRadius:'var(--radius)', color:'var(--red)', fontFamily:"var(--font)", fontSize:14, fontWeight:700, cursor:'pointer' }}>
          ✕ {t('reset', l)}{activeCount>1 ? ` (${activeCount})` : ''}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:72 }}>
      {/* Page header */}
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding: isMobile ? '36px 4% 28px' : '52px 6% 36px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto' }}>
          <div className="section-eyebrow">
            {l==='fr'?'Catalogue':l==='en'?'Catalog':l==='de'?'Katalog':l==='es'?'Catálogo':l==='it'?'Catalogo':'Catálogo'}
          </div>
          <h1 style={{ fontFamily:"var(--font)", fontWeight:800, fontSize:'clamp(30px,5vw,56px)', color:'var(--text)', letterSpacing:'-0.025em', marginBottom:10 }}>
            {t('catalog_title', l)}
          </h1>
          <p style={{ fontSize:16, color:'var(--text-3)', maxWidth:560 }}>
            {t('catalog_sub', l)}
          </p>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {isMobile && drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199, backdropFilter:'blur(4px)' }} />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <div style={{ position:'fixed', top:0, left:0, bottom:0, zIndex:200, width:'80vw', maxWidth:320, background:'var(--bg-card)', boxShadow:'var(--shadow-xl)', padding:'24px 16px', overflowY:'auto', transform:drawerOpen?'translateX(0)':'translateX(-100%)', transition:'transform 0.3s var(--ease)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <span style={{ fontWeight:700, fontSize:17, color:'var(--text)' }}>{t('filters', l)}</span>
            <button onClick={() => setDrawerOpen(false)} style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:8, width:34, height:34, cursor:'pointer', fontSize:16, color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
          <FilterSidebar />
        </div>
      )}

      <div style={{ maxWidth:1400, margin:'0 auto', padding: isMobile ? '20px 4%' : '40px 6%' }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <button onClick={() => setDrawerOpen(true)}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'11px 14px', color:'var(--text)', fontFamily:"var(--font)", fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-sm)' }}>
              ⚙ {t('filters', l)} {(brand)&&`· ${brand||''}`}
            </button>
            <SortSelect />
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '200px 1fr' : '240px 1fr', gap: isMobile ? 0 : 40 }}>

          {/* Sidebar — desktop/tablet only */}
          {!isMobile && (
            <div style={{ position:'sticky', top:88, alignSelf:'start' }}>
              <FilterSidebar />
            </div>
          )}

          {/* Results */}
          <div>
            {/* Filtres actifs — chips retirables */}
            {activeCount > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                {[
                  brand    && { k:'brand',       v:brand },
                  search   && { k:'search',      v:`« ${search} »` },
                  category && { k:'category',    v:category },
                  fuelType && { k:'fuelType',    v:fuelType },
                  transmission && { k:'transmission', v:transmission },
                  minPrice && { k:'minPrice',    v:`≥ ${minPrice} €` },
                  maxPrice && { k:'maxPrice',    v:`≤ ${maxPrice} €` },
                  minYear  && { k:'minYear',     v:`≥ ${minYear}` },
                  maxYear  && { k:'maxYear',     v:`≤ ${maxYear}` },
                  maxMileage && { k:'maxMileage', v:`≤ ${maxMileage} km` },
                ].filter(Boolean).map(({ k, v }) => (
                  <button key={k} onClick={() => setFilter(k, '')}
                    className="mk-chip"
                    style={{ cursor:'pointer', background:'var(--bg-card)', padding:'6px 10px', color:'var(--text)' }}>
                    {v} <span style={{ color:'var(--text-3)', fontWeight:700 }}>✕</span>
                  </button>
                ))}
                <button onClick={resetAll} className="mk-chip"
                  style={{ cursor:'pointer', background:'transparent', border:'1px dashed var(--border-2)', color:'var(--red)', padding:'6px 10px' }}>
                  {t('reset', l)}
                </button>
              </div>
            )}

            {/* Toolbar */}
            <div className="mk-panel" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', padding:'12px 16px', marginBottom:16 }}>
              <p style={{ fontSize:14, color:'var(--text-2)' }}>
                <strong style={{ color:'var(--text)', fontWeight:800 }}>{total}</strong> {t('found', l)}
                {activeCount > 0 && (
                  <span style={{ color:'var(--text-3)' }}> · {activeCount} {l==='fr'?'filtre actif':l==='en'?'active filter':l==='de'?'Filter aktiv':'filtros activos'}</span>
                )}
              </p>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                {!isMobile && (activeCount > 0) && (
                  <button onClick={resetAll} style={{ fontSize:13, color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontFamily:"var(--font)", fontWeight:700 }}>
                    ✕ {t('reset', l)}
                  </button>
                )}
                {/* Bascule liste / grille */}
                {!isMobile && (
                  <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
                    {[['list','☰'],['grid','▦']].map(([v, ic]) => (
                      <button key={v} onClick={() => setView(v)} title={v}
                        style={{
                          width:34, height:34, border:'none', cursor:'pointer', fontSize:14,
                          background: view===v ? 'var(--red)' : 'var(--bg-card)',
                          color: view===v ? '#fff' : 'var(--text-3)',
                          transition:'all 0.15s',
                        }}>{ic}</button>
                    ))}
                  </div>
                )}
                <div style={{ minWidth:200 }}>
                  <SortSelect />
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><Loader /></div>
            ) : cars.length === 0 ? (
              <div className="mk-panel" style={{ textAlign:'center', padding:'64px 24px' }}>
                <div style={{ fontSize:56, marginBottom:14 }}>🔍</div>
                <h3 style={{ fontFamily:"var(--font)", fontWeight:700, fontSize:22, color:'var(--text)', marginBottom:8 }}>{t('no_results', l)}</h3>
                <p style={{ fontSize:15, color:'var(--text-3)', marginBottom:22 }}>
                  {lang==='fr'?'Essayez une autre marque ou un autre terme.':lang==='en'?'Try another brand or term.':lang==='de'?'Versuchen Sie eine andere Marke oder einen anderen Begriff.':lang==='es'?'Pruebe otra marca u otro término.':lang==='it'?'Prova un\'altra marca o un altro termine.':'Tente outra marca ou outro termo.'}
                </p>
                <button onClick={resetAll} className="btn-primary">{t('reset', l)}</button>
              </div>
            ) : (
              <div style={{
                display:'grid',
                gridTemplateColumns: (isMobile || view==='list') ? '1fr' : 'repeat(auto-fill,minmax(265px,1fr))',
                gap: isMobile ? 12 : (view==='list' ? 12 : 18),
              }}>
                <AnimatePresence>
                  {cars.map((car, i) => <CarCard key={car.id} car={car} index={i} variant={view === 'grid' && !isMobile ? 'grid' : 'row'} />)}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
