"use client";

import { useState } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

export type ViewType = 'inicio' | 'vip-chat' | 'tarjeta';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
}

export const Sidebar = ({ isOpen, onClose, onNavigate, currentView }: SidebarProps) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotisOpen, setIsNotisOpen] = useState(false);

  const notifications = [
    { id: 1, user: 'Sofia Luna', action: 'subió un nuevo video exclusivo 📹', time: 'hace 2 min', type: 'video' },
    { id: 2, user: 'Valentina Sol', action: 'publicó una nueva galería de fotos 📸', time: 'hace 15 min', type: 'photo' },
    { id: 3, user: 'Sistema', action: 'Tu suscripción Premium ha sido renovada', time: 'hace 1 hora', type: 'alert' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-[#013440] dark:bg-[#011a22] border-r border-white/5 p-6 z-[70]
        transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col`}>
        
        <h1 className="text-[#FD0083] font-black italic text-2xl uppercase mb-10 tracking-tighter">
          Virtual Passion
        </h1>

        <nav className="flex flex-col gap-1">
          {/* INICIO */}
          <div 
            onClick={() => { onNavigate('inicio'); setIsNotisOpen(false); setIsProfileMenuOpen(false); }}
            className={`flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all group ${
              currentView === 'inicio' ? 'bg-white/10 text-[#00BCD4]' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-6 h-6"><InicioIcon /></span>
            <span className="text-lg font-bold">Inicio</span>
          </div>

          {/* NOTIFICACIONES */}
          <div className="relative">
            <div 
              onClick={() => { setIsNotisOpen(!isNotisOpen); setIsProfileMenuOpen(false); }}
              className={`flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all group ${
                isNotisOpen ? 'bg-white/10 text-[#00BCD4]' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="relative w-6 h-6">
                <NotisIcon />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FD0083] rounded-full border-2 border-[#013440] dark:border-[#011a22]"></div>
              </div>
              <span className="text-lg font-bold">Notificaciones</span>
            </div>

            {isNotisOpen && (
              <div className="absolute left-full ml-4 top-0 w-80 bg-[#012a33] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-300 z-[80]">
                <h4 className="text-white font-black italic uppercase text-[10px] tracking-widest mb-6 border-b border-white/5 pb-4">Novedades VIP</h4>
                <div className="flex flex-col gap-4">
                  {notifications.map(noti => (
                    <div key={noti.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
                      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${noti.type === 'video' ? 'bg-[#FD0083]' : 'bg-[#00BCD4]'}`}></div>
                      <div className="flex flex-col text-left">
                        <p className="text-xs text-white/90 leading-tight">
                          <span className="font-bold text-[#00BCD4]">{noti.user}</span> {noti.action}
                        </p>
                        <span className="text-[9px] text-white/30 uppercase font-black mt-1">{noti.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VIP */}
          <div 
            onClick={() => { onNavigate('vip-chat'); setIsNotisOpen(false); setIsProfileMenuOpen(false); }}
            className={`flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all group ${
              currentView === 'vip-chat' ? 'bg-white/10 text-[#00BCD4]' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-6 h-6"><VipIcon /></span>
            <span className="text-lg font-bold">VIP</span>
          </div>

          {/* TARJETA (PAGOS) */}
          <div 
            onClick={() => { onNavigate('tarjeta'); setIsNotisOpen(false); setIsProfileMenuOpen(false); }}
            className={`flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all group ${
              currentView === 'tarjeta' ? 'bg-white/10 text-[#00BCD4]' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-6 h-6"><TarjetaIcon /></span>
            <span className="text-lg font-bold">Pagos</span>
          </div>
          
          {/* MI PERFIL */}
          <div className="relative mt-2">
            <div 
              onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotisOpen(false); }}
              className={`flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all
                ${isProfileMenuOpen ? 'bg-white/10 text-[#00BCD4]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <span className="w-6 h-6"><PerfilIcon /></span>
              <span className="text-lg font-bold">Mi perfil</span>
            </div>

            {isProfileMenuOpen && (
              <div className="absolute bottom-full left-0 w-64 mb-2 bg-[#012a33] border border-white/10 rounded-3xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-400/10 cursor-pointer transition-all">
                   <SalirIcon />
                   <span className="font-bold text-sm">Cerrar Sesión</span>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* FOOTER CON THEME SWITCHER */}
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00BCD4] flex items-center justify-center font-black text-xs text-[#013440]">JZ</div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white">Jose Zapata</span>
              <span className="text-[10px] text-[#00BCD4] uppercase font-black italic">Premium</span>
            </div>
          </div>
          
          <ThemeSwitcher />
        </div>
      </aside>
    </>
  );
};

/* ICONOS */
const InicioIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const NotisIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>);
const VipIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full"><path d="M6 3h12l4 5-10 13L2 8z" /><path d="M11 3 8 8l3 13" /><path d="M13 3l3 5-3 13" /><path d="M2 8h20" /></svg>);
const TarjetaIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>);
const PerfilIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const SalirIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);