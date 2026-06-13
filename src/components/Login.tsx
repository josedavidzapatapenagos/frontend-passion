"use client";

import { useState } from 'react';
import { login } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (role: string) => void;
  onShowRegister: () => void; // Prop para cambiar a la vista de registro
}

export const Login = ({ onLoginSuccess, onShowRegister }: LoginProps) => {
  const [email, setEmail] = useState('sofia.luna@test.com');
  const [password, setPassword] = useState('123456789');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(email, password);
      const userRole = response.data?.role || 'VISITANTE'; 
      onLoginSuccess(userRole); 
    } catch (err: any) {
      setError(
        err.response?.status === 401 
          ? "Credenciales inválidas." 
          : "Error de conexión con el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 w-full bg-[#002736]">
      <form 
        onSubmit={handleLogin}
        className="flex flex-col gap-6 p-10 bg-[#001b26] rounded-3xl shadow-2xl w-full max-w-md border border-white/5"
      >
        <div className="text-center mb-2">
          <h2 className="text-white text-3xl font-extrabold tracking-tight italic">Virtual Passion</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-[0.2em]">Panel de Acceso</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Correo Electrónico</label>
          <input 
            type="email"
            required
            className="p-4 rounded-xl bg-[#002736]/50 border border-white/10 text-white focus:outline-none focus:border-[#FD0083] transition-all outline-none"
            placeholder="nombre@ejemplo.com"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Contraseña</label>
          <input 
            type="password"
            required
            className="p-4 rounded-xl bg-[#002736]/50 border border-white/10 text-white focus:outline-none focus:border-[#FD0083] transition-all outline-none"
            placeholder="••••••••"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>

        {error && (
          <div className="animate-fade-in bg-red-500/10 border-l-4 border-red-500 text-red-400 p-3 rounded-r-lg text-xs font-medium italic">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className={`mt-4 p-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-lg text-white ${
            loading ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-[#FD0083] hover:shadow-[#FD0083]/40 hover:scale-[1.02] active:scale-95'
          }`}
        >
          {loading ? 'Validando...' : 'BIENVENIDO'}
        </button>

        {/* BOTÓN PARA IR AL REGISTRO */}
        <div className="text-center mt-2">
          <button 
            type="button"
            onClick={onShowRegister}
            className="text-slate-400 text-[11px] font-bold uppercase tracking-widest hover:text-[#00BCD4] transition-colors"
          >
            ¿No tienes cuenta? <span className="underline ml-1 text-[#00BCD4]">Regístrate</span>
          </button>
        </div>

        <p className="text-slate-600 text-[10px] text-center mt-2 leading-tight uppercase tracking-tighter">
          Acceso Restringido.
        </p>
      </form>
    </div>
  );
};