"use client";

const MOCK_STORIES = [
  { id: 1, name: 'dayana__', status: 'Inactiva', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500' },
  { id: 2, name: 'Lobita69', status: 'Activa', img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=500' },
  { id: 3, name: 'Sol Fernanda', status: 'Activa', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500' },
  { id: 4, name: 'Jenny123', status: 'Inactiva', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=500' },
  { id: 5, name: 'Andrea007', status: 'Inactiva', img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=500' },
  { id: 6, name: 'Micaela_Hot', status: 'Activa', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500' },
];

// Duplicamos la lista para crear el efecto de loop infinito
const INFINITE_STORIES = [...MOCK_STORIES, ...MOCK_STORIES];

export const ModelCarousel = () => {
  return (
    <div className="w-full mb-10 overflow-hidden relative">
      {/* Gradientes laterales para suavizar la entrada/salida */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#012a33] to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#013440] to-transparent z-10"></div>

      {/* Contenedor animado */}
      <div className="flex gap-4 animate-scroll-infinite hover:pause-animation">
        {INFINITE_STORIES.map((model, index) => (
          <div 
            key={`${model.id}-${index}`} 
            className="relative min-w-[200px] h-[280px] rounded-[2rem] overflow-hidden shadow-xl group cursor-pointer"
          >
            <img 
              src={model.img} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              alt={model.name}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white font-black text-lg italic tracking-tighter uppercase">
                {model.name}
              </p>
              
              <div className="flex items-center justify-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${model.status === 'Activa' ? 'bg-[#FD0083] shadow-[0_0_8px_#FD0083]' : 'bg-gray-500'}`}></div>
                <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest">
                  {model.status}
                </span>
              </div>
            </div>

            <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#FD0083] rounded-[2rem] transition-all"></div>
          </div>
        ))}
      </div>
    </div>
  );
};