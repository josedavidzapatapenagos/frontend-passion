import { useState } from "react";

import { ProfileImagesGallery } from "./components/ProfileImagesGallery";
import { UploadImagesCard } from "./components/UploadImagesCard";

export const ModelProfilePhotosPage = () => {
  const [galleryRefreshToken, setGalleryRefreshToken] = useState(0);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#022f3a] p-6 md:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/70 dark:shadow-black/20">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/75 p-3 dark:border-white/10 dark:bg-white/5">
          <span className="rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-white/70">
            perfil
          </span>

          <span className="rounded-xl border-2 border-[#9924D3] bg-fuchsia-50/70 px-4 py-2 text-sm font-black uppercase tracking-wide text-[#9924D3] dark:border-[#b45ce4] dark:bg-[#9924D3]/20 dark:text-fuchsia-100">
            fotos
          </span>
        </div>

        <header className="mt-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">Sube las fotos de tu perfil</h2>
          <p className="mt-3 text-slate-600 dark:text-white/75">
            Estas fotografias seran visibles para los usuarios cuando visiten tu perfil.
          </p>
          <p className="mt-1 text-slate-600 dark:text-white/75">
            Puedes subir varias imagenes al mismo tiempo.
          </p>
        </header>

        <UploadImagesCard
          onUploadSuccess={() => {
            setGalleryRefreshToken((currentToken) => currentToken + 1);
          }}
        />

        <div className="mt-6">
          <ProfileImagesGallery refreshToken={galleryRefreshToken} />
        </div>
      </div>
    </div>
  );
};
