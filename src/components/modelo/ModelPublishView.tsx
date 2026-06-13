"use client";

import { useState } from 'react';
import { Button } from '@heroui/react';

export const ModelPublishView = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  return (
    <div className="p-8 lg:p-12 w-full max-w-7xl mx-auto transition-colors duration-500">
      {/* Header de Bienvenida */}
      <div className="mb-12 text-left">
        <h2 className="text-4xl font-black text-[#012a33] dark:text-white italic uppercase tracking-tighter">
          Panel de <span className="text-[#FD0083]">Creadora</span>
        </h2>
        <p className="text-[#012a33]/60 dark:text-white/50 font-bold uppercase text-xs tracking-[0.2em] mt-2">
          Gestiona tu contenido y aumenta tus suscripciones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Columna Izquierda: Formulario de Carga */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#012a33] p-10 rounded-[4rem] shadow-2xl border border-gray-100 dark:border-white/5">
            <h3 className="text-2xl font-black text-[#00BCD4] italic uppercase mb-6">Nueva Publicación</h3>
            
            {/* Dropzone Estilizado */}
            <label className="border-4 border-dashed border-gray-200 dark:border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center group hover:border-[#FD0083] transition-all cursor-pointer bg-gray-50 dark:bg-white/5">
              <input type="file" multiple className="hidden" onChange={handleFileSelect} />
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📸</span>
              <p className="text-[#012a33] dark:text-white font-bold text-lg">Arrastra tus fotos o videos</p>
              <p className="text-xs text-gray-400 mt-2 uppercase font-black">Máximo 50MB por archivo</p>
            </label>

            {/* Vista previa de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <div className="mt-8 grid grid-cols-4 gap-4">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center text-[10px] font-bold text-[#FD0083] p-2 text-center break-all">
                    {file.name}
                  </div>
                ))}
              </div>
            )}

            <Button 
              className="w-full mt-8 bg-[#FD0083] text-white font-black italic uppercase py-8 rounded-full text-xl shadow-[0_15px_30px_rgba(253,0,131,0.3)]"
            >
              Publicar Contenido
            </Button>
          </div>
        </div>

        {/* Columna Derecha: Estadísticas y Tips */}
        <div className="space-y-6">
          <div className="bg-[#00BCD4] p-8 rounded-[3rem] text-[#013440] shadow-xl">
            <h4 className="font-black italic uppercase text-sm mb-4">Rendimiento Total</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-4xl font-black tracking-tighter">1,284</span>
                <span className="text-[10px] font-bold uppercase mb-2">Vistas</span>
              </div>
              <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-[#013440]"></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#012a33] p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl">
            <h4 className="font-black italic uppercase text-xs text-[#FD0083] mb-4 tracking-widest">Consejo del día</h4>
            <p className="text-sm text-[#012a33] dark:text-white/80 font-medium leading-relaxed">
              "Sube contenido los viernes por la noche. Es cuando los usuarios Premium están más activos en el Chat VIP."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};