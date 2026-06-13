"use client";

import { useState } from 'react';

export const AddCard = () => {
  const [cardData, setCardData] = useState({
    number: '**** **** **** ****',
    name: 'NOMBRE DEL TITULAR',
    expiry: 'MM/YY',
    cvv: '***'
  });

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        
        {/* VISUALIZACIÓN DE LA TARJETA (GLASSMORPHISM) */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FD0083] to-[#00BCD4] rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative h-56 w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="w-12 h-10 bg-white/10 rounded-md"></div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            
            <div className="space-y-4">
              <p className="text-2xl font-mono tracking-[0.2em] text-white/90">{cardData.number}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Titular</p>
                  <p className="text-sm font-bold text-white/80">{cardData.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Expira</p>
                  <p className="text-sm font-bold text-white/80">{cardData.expiry}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO DE PAGO */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">Método de Pago</h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Añade una tarjeta para acceso VIP ilimitado</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#00BCD4] ml-4">Número de Tarjeta</label>
              <input 
                type="text" 
                maxLength={19}
                placeholder="0000 0000 0000 0000"
                onChange={(e) => setCardData({...cardData, number: e.target.value || '**** **** **** ****'})}
                className="w-full bg-[#012a33] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#FD0083] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#00BCD4] ml-4">Nombre en la tarjeta</label>
              <input 
                type="text" 
                placeholder="JUAN PEREZ"
                onChange={(e) => setCardData({...cardData, name: e.target.value.toUpperCase() || 'NOMBRE DEL TITULAR'})}
                className="w-full bg-[#012a33] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#FD0083] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#00BCD4] ml-4">Expiración</label>
                <input 
                  type="text" 
                  placeholder="MM/YY"
                  onChange={(e) => setCardData({...cardData, expiry: e.target.value || 'MM/YY'})}
                  className="w-full bg-[#012a33] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#FD0083] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#00BCD4] ml-4">CVV</label>
                <input 
                  type="password" 
                  maxLength={3}
                  placeholder="***"
                  onChange={(e) => setCardData({...cardData, cvv: e.target.value || '***'})}
                  className="w-full bg-[#012a33] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#FD0083] transition-all"
                />
              </div>
            </div>
          </div>

          <button className="w-full bg-[#FD0083] hover:bg-[#ff1a8f] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-[#FD0083]/20 transition-all transform hover:scale-[1.02] active:scale-95 uppercase italic tracking-widest">
            Vincular Tarjeta de Crédito
          </button>
          
          <p className="text-[9px] text-center text-white/20 uppercase font-bold tracking-[0.2em]">
            Pagos encriptados con seguridad SSL de 256 bits
          </p>
        </div>
      </div>
    </div>
  );
};