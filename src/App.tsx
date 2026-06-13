import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Feed } from './components/Feed';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { RegisterStepOne } from './components/RegisterStepOne';
import { VipChannel } from './components/VipChat';
import { AddCard } from './components/AddCard';
import { ModelCarousel } from './components/ModelCarrusel'; // 1. Importamos el carrusel

function App() {
  // --- ESTADOS DE NAVEGACIÓN Y AUTH ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [currentView, setCurrentView] = useState<'inicio' | 'vip-chat' | 'tarjeta'>('inicio');
  
  // --- ESTADOS DE CONTENIDO ---
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);

  const handlePostClick = (id: string) => {
    setViewingPostId(prevId => prevId === id ? null : id);
  };

  // 1. PANTALLA DE ACCESO
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#013440] flex items-center justify-center">
        {authMode === 'login' ? (
          <Login 
            onLoginSuccess={() => setIsAuthenticated(true)} 
            onShowRegister={() => setAuthMode('register')} 
          />
        ) : (
          <Register 
            onBackToLogin={() => setAuthMode('login')} 
            onRegisterSuccess={() => setAuthMode('login')} 
          />
        )}
      </div>
    );
  }

  // 2. PANTALLA DE SELECCIÓN DE PAÍS
  if (!selectedCatalogId) {
    return (
      <div className="min-h-screen bg-[#013440]">
        <RegisterStepOne onSelectionComplete={(id) => setSelectedCatalogId(id)} />
      </div>
    );
  }

  // 3. ESTRUCTURA PRINCIPAL (DASHBOARD)
  return (
    <div className="flex min-h-screen bg-[#013440] dark:bg-[#010d11] text-white overflow-hidden font-sans transition-colors duration-500">
      
      {/* Sidebar con navegación */}
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={(view) => {
          setCurrentView(view as any);
          setIsMenuOpen(false);
        }}
        currentView={currentView}
      />

      {/* Contenedor de Contenido */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        
        {/* Header Superior */}
        <header className="p-4 border-b border-white/5 bg-[#012a33]/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
          
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-white hover:bg-white/5 rounded-lg md:hidden"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <h1 className="md:hidden text-[#FD0083] font-black italic text-xl tracking-tighter">VP</h1>

          <div className="relative w-full max-w-[280px] ml-auto">
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full bg-[#013440] border border-white/10 rounded-full px-5 py-1.5 text-sm text-white focus:outline-none focus:border-[#00BCD4] transition-all"
            />
          </div>
        </header>

        {/* Lógica de Renderizado de Vistas */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#012a33] to-[#013440] dark:from-[#010d11] dark:to-[#011a22] no-scrollbar transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-4 py-8">
            
            {currentView === 'inicio' && (
              <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
                {/* 2. Insertamos el carrusel aquí, arriba del Feed */}
                <div className="mb-10">
                  <h2 className="text-white/40 font-black italic text-[10px] uppercase tracking-[0.4em] mb-4 ml-4">
                    Nuestras <span className="text-[#FD0083]">chicas</span>
                  </h2>
                  <ModelCarousel />
                </div>

                <Feed 
                  catalogId={selectedCatalogId} 
                  onPostClick={handlePostClick} 
                  viewingPostId={viewingPostId} 
                />
              </div>
            )}

            {currentView === 'vip-chat' && (
              <div className="animate-in zoom-in-95 duration-300 h-full">
                <VipChannel />
              </div>
            )}

            {currentView === 'tarjeta' && (
              <div className="animate-in slide-in-from-right-8 duration-500">
                <AddCard />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;