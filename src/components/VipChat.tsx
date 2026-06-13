"use client";



// Contenido exclusivo del canal
const CHANNEL_POSTS = [
  {
    id: 1,
    type: 'text',
    content: '¡Bienvenidos a mi espacio privado! Aquí subiré lo que Instagram no me deja... 😈',
    time: '10:00 AM',
    views: '1.2k'
  },
  {
    id: 2,
    type: 'image',
    content: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500',
    caption: 'Recién salida de la ducha. ¿Les gusta el nuevo conjunto? 💦',
    time: '12:45 PM',
    views: '950'
  },
  {
    id: 3,
    type: 'voice',
    duration: '0:15',
    content: 'Escucha mi secreto de hoy...',
    time: '03:20 PM',
    views: '2.1k'
  }
];

export const VipChannel = () => {
  return (
    <div className="flex h-[calc(100vh-120px)] w-full max-w-4xl mx-auto bg-[#001b26] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl flex-col">
      
      {/* HEADER DEL CANAL */}
      <div className="p-6 border-b border-white/10 bg-[#001b26]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200" 
              className="w-12 h-12 rounded-full object-cover border-2 border-[#FD0083]" 
              alt="Sofia" 
            />
          </div>
          <div>
            <h3 className="text-white font-black italic uppercase tracking-tight">Sofia Luna VIP 💎</h3>
            <p className="text-[#00BCD4] text-[10px] font-bold uppercase tracking-widest">2,458 suscriptores</p>
          </div>
        </div>
        <button className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-white transition-all">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      {/* ÁREA DE POSTS (SCROLL) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#001b26]">
        {CHANNEL_POSTS.map((post) => (
          <div key={post.id} className="max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#002736] border border-white/5 rounded-[2rem] rounded-tl-none overflow-hidden shadow-xl">
              
              {/* Contenido según tipo */}
              {post.type === 'image' && (
                <img src={post.content} className="w-full h-auto object-cover border-b border-white/5" alt="Exclusivo" />
              )}

              <div className="p-5">
                {post.type === 'voice' && (
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                    <button className="w-10 h-10 bg-[#FD0083] rounded-full flex items-center justify-center text-white">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                      <div className="absolute h-full w-1/3 bg-[#00BCD4] rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-bold text-[#00BCD4]">{post.duration}</span>
                  </div>
                )}

                <p className="text-white/90 text-sm leading-relaxed mt-2">{post.type === 'image' ? post.caption : post.content}</p>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold italic uppercase">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {post.views} vistas
                  </div>
                  <span className="text-slate-600 text-[10px] font-medium">{post.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BARRA INFERIOR (SOLO LECTURA) */}
      <div className="p-6 bg-[#001b26] border-t border-white/5 text-center">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">
          Solo los suscriptores VIP pueden ver este contenido
        </p>
      </div>
    </div>
  );
};