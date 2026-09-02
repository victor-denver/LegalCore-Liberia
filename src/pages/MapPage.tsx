import { useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import { MapPin, Search, Building2, Scale, GraduationCap, Landmark } from 'lucide-react';
import { courtLocations, type CourtLocation } from '../data/legalData';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';

type T = CourtLocation['type'] | 'all';
const labels: Record<CourtLocation['type'], string> = {
  'supreme-court': 'Supreme Court',
  'circuit-court': 'Circuit Court',
  'magistrate-court': 'Magistrate Court',
  'government': 'Government',
  'law-school': 'Law School',
};
const icons: Record<CourtLocation['type'], any> = {
  'supreme-court': Scale,
  'circuit-court': Landmark,
  'magistrate-court': Building2,
  'government': Building2,
  'law-school': GraduationCap,
};

export default function MapPage(){
  const mapRef=useRef<HTMLDivElement>(null);
  const mapInst=useRef<L.Map|null>(null);
  const markers=useRef<L.Marker[]>([]);
  const [filter,setFilter]=useState<T>('all');
  const [q,setQ]=useState('');
  const [selected,setSelected]=useState<CourtLocation|null>(null);

  const filtered=courtLocations.filter(l=>{
    if(filter!=='all' && l.type!==filter) return false;
    if(q.trim() && !`${l.name} ${l.county} ${l.address}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  useEffect(()=>{
    let cancelled=false;
    async function init(){
      const L=await import('leaflet');
      if(cancelled||!mapRef.current) return;
      if(!mapInst.current){
        mapInst.current=L.map(mapRef.current, {zoomControl:false}).setView([6.35,-10.0],7);
        L.control.zoom({position:'bottomright'}).addTo(mapInst.current);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'© OpenStreetMap', maxZoom:18 }).addTo(mapInst.current);
      }
      markers.current.forEach(m=>m.remove());
      markers.current=[];
      filtered.forEach(loc=>{
        const m=L.marker([loc.lat,loc.lng],{
          icon:L.divIcon({ className:`map-marker map-marker--${loc.type}`, html:`<div class="map-dot"></div>`, iconSize:[20,20], iconAnchor:[10,10] })
        }).addTo(mapInst.current!).on('click',()=>setSelected(loc));
        m.bindTooltip(loc.name,{direction:'top', offset:[0,-10]});
        markers.current.push(m);
      });
    }
    init(); return()=>{cancelled=true;};
  },[filtered]);

  return (
    <div className="map-page">
      <div className="map-sidebar">
        <div className="map-sidebar__header">
          <h1><MapPin size={16}/> Court Map</h1>
          <p>Tap a court to see address. Use filter or search — made super simple.</p>
          <div className="map-search">
            <Search size={14}/><input placeholder="Search — e.g. Monrovia, Supreme Court" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="map-filters">
            {(['all','supreme-court','circuit-court','magistrate-court','government','law-school'] as T[]).map(t=>(
              <button key={t} className={`map-chip ${filter===t?'map-chip--active':''}`} onClick={()=>{setFilter(t); setSelected(null);}}>{t==='all'?'All':labels[t as CourtLocation['type']]}</button>
            ))}
          </div>
          <p className="map-count">{filtered.length} of {courtLocations.length} shown</p>
        </div>

        <div className="map-list">
          {filtered.map(loc=>{
            const Icon=icons[loc.type];
            const active=selected?.id===loc.id;
            return (
              <button key={loc.id} className={`map-item ${active?'map-item--active':''}`} onClick={()=>{ setSelected(loc); mapInst.current?.setView([loc.lat,loc.lng],13,{animate:true}); }}>
                <span className={`map-item__icon map-item__icon--${loc.type}`}><Icon size={14}/></span>
                <span className="map-item__info"><strong>{loc.name}</strong><span>{loc.county} • {labels[loc.type]}</span></span>
              </button>
            );
          })}
          {filtered.length===0 && <div className="map-empty">No courts found. Try clear filter.</div>}
        </div>

        {selected && (
          <div className="map-detail">
            <div className="map-detail__top">
              <span className={`map-badge map-badge--${selected.type}`}>{labels[selected.type]}</span>
              <button className="map-detail__close" onClick={()=>setSelected(null)}>×</button>
            </div>
            <h3>{selected.name}</h3>
            <p className="map-detail__addr"><MapPin size={12}/>{selected.address} • {selected.county}</p>
            <p className="map-detail__desc">{selected.description}</p>
            <p className="map-detail__coords">{selected.lat.toFixed(4)}°, {Math.abs(selected.lng).toFixed(4)}°W</p>
          </div>
        )}
      </div>

      <div className="map-wrap">
        <div ref={mapRef} className="map"/>
        <span className="map-pill">{filtered.length} locations • Tap a red/blue dot</span>
      </div>
    </div>
  );
}
