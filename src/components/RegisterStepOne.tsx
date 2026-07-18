"use client";

import { useState } from 'react';
import { useCatalogs } from '../hooks/useFlags';

// 1. Ajustamos la interfaz para que coincida EXACTAMENTE con el JSON del backend
interface Country {
  id: string;
  name: string;
  countryFlagUrl: string; // Cambiado de flagUrl a countryFlagUrl
  countryIsoCode: string;
}

interface RegisterStepOneProps {
  onSelectionComplete: (id: string) => void;
}

export const RegisterStepOne = ({ onSelectionComplete }: RegisterStepOneProps) => {
  const { countries, loading, error } = useCatalogs();
  // Forzamos el tipado correcto
  const typedCountries = countries as unknown as Country[];
  
  const [regionId, setRegionId] = useState("");

  const handleConfirmar = () => {
    if (regionId) {
      onSelectionComplete(regionId);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center vp-page-bg">
      <div className="w-10 h-10 border-4 border-[#FD0083] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(253,0,131,0.3)]"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center vp-page-bg text-red-400 font-bold italic px-6 text-center">
      {error}
    </div>
  );

  return (
    <div className="min-h-screen w-full p-8 flex flex-col items-center justify-center font-sans vp-page-bg">
      
      <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="vp-text-primary text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
          Selecciona tu <span className="text-[#FD0083] drop-shadow-[0_0_15px_rgba(253,0,131,0.5)]">Región</span>
        </h1>
        <p className="vp-text-muted mt-3 uppercase tracking-[0.4em] text-[10px] font-bold">
          Pasión virtual
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl animate-in fade-in zoom-in duration-500">
        {typedCountries.map((country) => (
          <button
            key={country.id}
            onClick={() => setRegionId(country.id)}
            className={`group relative flex flex-col items-center p-10 rounded-[2.5rem] border-2 transition-all duration-500 ${
              regionId === country.id 
                ? 'vp-surface border-[#FD0083] shadow-[0_0_40px_rgba(253,0,131,0.2)] scale-[1.02]' 
                : 'vp-surface-soft border-slate-300 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20 hover:bg-[var(--vp-surface)]'
            }`}
          >
            <div className={`relative w-24 h-24 mb-6 rounded-full overflow-hidden border-2 transition-all duration-500 shadow-2xl ${
              regionId === country.id ? 'border-[#FD0083] rotate-3' : 'vp-border group-hover:scale-105'
            }`}>
              <img 
                // CORRECCIÓN: Usamos countryFlagUrl que es lo que manda el backend
                src={country.countryFlagUrl} 
                alt={country.name}
                className="w-full h-full object-cover"
                // Mantenemos un fallback por si Cloudinary falla
                onError={(e) => {
                   (e.target as HTMLImageElement).src = `https://flagcdn.com/w160/${country.countryIsoCode.toLowerCase().substring(0,2)}.png`;
                }}
              />
            </div>

            <span className={`text-xl font-black tracking-tight transition-colors duration-300 ${
              regionId === country.id ? 'vp-text-primary' : 'vp-text-muted group-hover:text-[#FD0083]'
            }`}>
              {country.name}
            </span>

            <div className={`absolute top-6 right-6 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
              regionId === country.id 
                ? 'bg-[#FD0083] opacity-100 scale-100' 
                : 'vp-surface-soft opacity-0 scale-50'
            }`}>
              <svg className="w-4 h-4 text-[var(--vp-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <span className={`text-[9px] mt-4 uppercase tracking-widest font-bold transition-opacity ${
              regionId === country.id ? 'text-[#FD0083] opacity-100' : 'opacity-0'
            }`}>
              Región Activa
            </span>
          </button>
        ))}
      </div>

      <div className="mt-16 w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <button 
          disabled={!regionId}
          onClick={handleConfirmar}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] transition-all text-xs border-2 shadow-2xl ${
            regionId 
              ? 'bg-[#FD0083] border-[#FD0083] text-white shadow-[0_10px_30px_rgba(253,0,131,0.3)] hover:scale-105 active:scale-95' 
              : 'bg-transparent vp-border vp-text-muted cursor-not-allowed opacity-40'
          }`}
        >
          {regionId ? 'Confirmar Selección' : 'Selecciona una Región'}
        </button>
      </div>

      <footer className="mt-8">
        <p className="vp-text-muted text-[9px] uppercase tracking-widest font-medium opacity-60">
          Virtual Passion Core v2.0
        </p>
      </footer>
    </div>
  );
};