import type { VipAreaInfo } from "@/features/vip-area/types/vipArea";

type Props = {
  info: VipAreaInfo;
};

export const VipAreaSummaryBar = ({ info }: Props) => {
  return (
    <section className="vp-vip-card rounded-[1.8rem] border p-5 backdrop-blur-sm">
      <div className="flex gap-4">
        <div className="vp-vip-card-strong h-24 w-24 shrink-0 overflow-hidden rounded-[1.2rem] border-2 border-[#FD0083]/65">
          {info.coverPhotoUrl ? (
            <img
              src={info.coverPhotoUrl}
              alt={`Portada de ${info.alias}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="vp-vip-muted flex h-full items-center justify-center text-sm font-semibold">
              foto
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <p className="vp-text-primary truncate text-xl font-black">{info.alias}</p>
          <p className="vp-vip-muted line-clamp-2 text-sm">{info.description || "Sin descripcion"}</p>

          <div className="vp-text-primary flex flex-wrap items-center gap-4 pt-1 text-2xl font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="8" cy="10" r="1.5" />
                <path d="m21 16-5-5-6 6-3-3-4 4" />
              </svg>
              {info.photoCount}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m10 9 5 3-5 3V9Z" />
              </svg>
              {info.videoCount}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {info.unlockableCount}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
