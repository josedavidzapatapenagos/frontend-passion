"use client";

import { useState } from 'react';
import { 
  CreditCard, 
  Camera, 
  Image as ImageIcon, 
  Crown, 
  CheckCircle2, 
  ScanLine,
  ChevronRight
} from 'lucide-react';

interface RegisterProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

type Step = 'DATOS' | 'ID_FRONTAL' | 'ID_POSTERIOR' | 'MEMBRESIA';

export const Register = ({ onBackToLogin, onRegisterSuccess }: RegisterProps) => {
  const [step, setStep] = useState<Step>('DATOS');
  const [loading, setLoading] = useState(false);

  const nextStep = () => {
    if (step === 'DATOS') setStep('ID_FRONTAL');
    else if (step === 'ID_FRONTAL') setStep('ID_POSTERIOR');
    else if (step === 'ID_POSTERIOR') setStep('MEMBRESIA');
  };

  const handleFinalize = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onRegisterSuccess();
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-[#013440] text-white">
      <div className="bg-[#012a33] rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/5">
        
        {/* HEADER */}
        <div className="bg-[#011a22] p-8 text-center border-b border-white/5">
          <h2 className="text-white text-3xl font-black italic tracking-tighter uppercase">
            Virtual <span className="text-[#FD0083]">Passion</span>
          </h2>
          <p className="text-[#00BCD4] text-[10px] font-black tracking-[0.3em] uppercase mt-1">Registro de Cuenta</p>
        </div>

        <div className="p-10 flex flex-col items-center">
          
          {/* PASO 1: DATOS PERSONALES */}
          {step === 'DATOS' && (
            <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {[
                { label: 'Nombre', key: 'nombre', type: 'text' },
                { label: 'Apellido', key: 'apellido', type: 'text' },
                { label: 'Alias', key: 'alias', type: 'text' },
                { label: 'Fecha Nac', key: 'fechaNac', type: 'date' },
                { label: 'Correo', key: 'correo', type: 'email' },
                { label: 'Clave', key: 'password', type: 'password' },
                { label: 'Celular', key: 'numero', type: 'tel' },
              ].map((field) => (
                <div key={field.key} className="relative flex items-center group">
                  {/* Label Flotante Estilo Badge */}
                  <div className="absolute left-0 bg-[#00BCD4] text-[#012a33] font-black px-5 py-2.5 rounded-full z-10 text-[10px] uppercase tracking-wider shadow-lg shadow-[#00BCD4]/20">
                    {field.label}
                  </div>
                  
                  <input 
                    type={field.type}
                    placeholder={field.type === 'date' ? "" : "Completar..."}
                    className={`
                      w-full pl-28 pr-6 py-2.5 rounded-full bg-[#013440]/50 border border-white/10 
                      text-white placeholder:text-white/20 focus:outline-none focus:border-[#FD0083] 
                      text-right italic transition-all appearance-none
                      ${field.type === 'date' ? 'cursor-pointer' : ''}
                    `}
                    style={{ colorScheme: 'dark' }} // Esto hace que el calendario nativo sea oscuro
                  />
                </div>
              ))}
              <button 
                onClick={nextStep} 
                className="w-full mt-8 bg-[#FD0083] text-white font-black uppercase italic py-4 rounded-full shadow-[0_10px_20px_rgba(253,0,131,0.3)] hover:brightness-110 active:scale-95 transition-all tracking-widest flex items-center justify-center gap-2 group"
              >
                Continuar <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* PASO 2: ID FRONTAL */}
          {step === 'ID_FRONTAL' && (
            <div className="w-full text-center animate-in slide-in-from-right-8 duration-500">
              <div className="bg-[#00BCD4] text-[#012a33] font-black px-8 py-2 rounded-full inline-block mb-6 text-xs uppercase tracking-widest">
                Identidad: Frontal
              </div>
              <div className="border-2 border-dashed border-white/10 rounded-[2rem] p-12 mb-8 bg-black/20 group hover:border-[#FD0083] transition-all flex flex-col items-center gap-3">
                <CreditCard size={64} className="text-[#00BCD4] opacity-50 group-hover:opacity-100 transition-opacity" />
                <ScanLine size={24} className="text-[#FD0083] animate-pulse" />
              </div>
              <div className="flex gap-4 mb-8">
                <button type="button" className="flex-1 bg-white/5 text-white font-black py-3 rounded-full text-[10px] uppercase border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10">
                  <Camera size={14} /> Cámara
                </button>
                <button type="button" className="flex-1 bg-white/5 text-white font-black py-3 rounded-full text-[10px] uppercase border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10">
                  <ImageIcon size={14} /> Galería
                </button>
              </div>
              <button onClick={nextStep} className="w-full bg-[#FD0083] text-white font-black py-4 rounded-full shadow-lg uppercase tracking-widest">
                Siguiente
              </button>
            </div>
          )}

          {/* PASO 3: ID POSTERIOR */}
          {step === 'ID_POSTERIOR' && (
            <div className="w-full text-center animate-in slide-in-from-right-8 duration-500">
              <div className="bg-[#00BCD4] text-[#012a33] font-black px-8 py-2 rounded-full inline-block mb-6 text-xs uppercase tracking-widest">
                Identidad: Posterior
              </div>
              <div className="border-2 border-dashed border-white/10 rounded-[2rem] p-12 mb-8 bg-black/20 group hover:border-[#FD0083] transition-all flex flex-col items-center gap-3 rotate-180">
                <CreditCard size={64} className="text-[#00BCD4] opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <button onClick={nextStep} className="w-full bg-[#FD0083] text-white font-black py-4 rounded-full shadow-lg uppercase tracking-widest">
                Ver Planes
              </button>
            </div>
          )}

          {/* PASO 4: PLANES */}
          {step === 'MEMBRESIA' && (
            <div className="w-full text-center animate-in zoom-in-95 duration-500">
              <p className="text-[#00BCD4] text-[10px] font-black uppercase tracking-[0.3em] mb-8">Selecciona tu Membresía</p>
              <div className="space-y-4 mb-10 text-left">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex justify-between items-center group cursor-pointer hover:bg-white/10 transition-all">
                  <div>
                    <p className="text-white font-bold">Standard</p>
                    <p className="text-white/40 text-[10px]">Acceso limitado al catálogo</p>
                  </div>
                  <CheckCircle2 size={20} className="text-white/20" />
                </div>
                <div className="p-6 bg-[#FD0083]/10 rounded-3xl border border-[#FD0083]/30 flex justify-between items-center group cursor-pointer hover:bg-[#FD0083]/20 transition-all scale-105">
                  <div>
                    <p className="text-white font-bold italic">Premium VIP</p>
                    <p className="text-[#00BCD4] text-[10px] font-black uppercase tracking-tighter">Acceso total + Contenido exclusivo</p>
                  </div>
                  <Crown size={20} className="text-[#FD0083]" />
                </div>
              </div>
              <button 
                onClick={handleFinalize}
                disabled={loading}
                className="w-full bg-[#FD0083] text-white font-black py-5 rounded-full shadow-xl disabled:opacity-50 uppercase tracking-[0.2em] transition-all"
              >
                {loading ? 'Validando Datos...' : 'Finalizar Registro'}
              </button>
            </div>
          )}

        </div>
      </div>

      <button onClick={onBackToLogin} className="mt-8 text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-[#00BCD4] transition-colors underline underline-offset-4 outline-none">
        Volver al inicio de sesión
      </button>
    </div>
  );
};