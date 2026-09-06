"use client";

export const FeedSkeleton = () => {
  // Generamos 4 para llenar más espacio vertical como en tu imagen
  const skeletons = Array.from({ length: 4 });

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6 space-y-4">
      {skeletons.map((_, index) => (
        <div 
          key={`skeleton-${index}`}
          className="flex items-center bg-slate-100 dark:bg-white/5 rounded-[4rem] p-4 animate-pulse border border-slate-200 dark:border-white/5"
        >
          {/* Círculo de la foto */}
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-white/10 flex-shrink-0" />

          {/* Contenido de texto al lado */}
          <div className="ml-6 flex-1 space-y-3">
            <div className="flex items-center gap-3">
              {/* Nombre de la modelo */}
              <div className="h-6 w-32 bg-[#00BCD4]/20 rounded-full" />
              {/* Badge Premium */}
              <div className="h-4 w-16 bg-[#FD0183]/20 rounded-full" />
            </div>
            {/* Descripción corta (Línea de texto) */}
            <div className="h-3 w-3/4 bg-slate-200 dark:bg-white/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};