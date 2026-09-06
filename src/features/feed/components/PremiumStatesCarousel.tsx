import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCatalogPremiumStates,
  type PremiumCatalogState,
} from "@/features/feed/services/premiumCatalogService";

type Props = {
  catalogId: string;
  onSelectPost: (postId: string) => void;
};

const MIN_TRACK_ITEMS = 8;

const buildMarqueeTrack = (states: PremiumCatalogState[]): PremiumCatalogState[] => {
  if (states.length === 0) {
    return [];
  }

  const base: PremiumCatalogState[] = [];
  while (base.length < MIN_TRACK_ITEMS) {
    base.push(...states);
  }

  // Duplicated track so the -50% keyframe loops without a visible jump.
  return [...base, ...base];
};

const PremiumStateItem = ({
  state,
  onOpen,
}: {
  state: PremiumCatalogState;
  onOpen: (state: PremiumCatalogState) => void;
}) => {
  const label = state.modelAlias || state.modelName;

  return (
    <button
      type="button"
      onClick={() => onOpen(state)}
      title={label}
      className="group w-[170px] shrink-0 will-change-transform focus:outline-none"
    >
      <span className="block rounded-xl bg-gradient-to-br from-[#FD0083] via-[#b31a8a] to-[#00BCD4] p-[2px] shadow-[0_12px_30px_rgba(253,0,131,0.18)]">
        <span className="relative block h-[230px] w-full overflow-hidden rounded-[0.6rem] bg-slate-100 dark:bg-[#012a33]">
          {state.mediaType === "VIDEO" ? (
            <video
              src={state.mediaUrl}
              className="h-full w-full object-cover"
              muted
              autoPlay
              loop
              playsInline
            />
          ) : (
            <img
              src={state.profilePhotoUrl || state.mediaUrl}
              alt={label}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}

          <span className="absolute inset-0 bg-gradient-to-t from-[#011a22]/80 via-transparent to-transparent" />
          <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[#FD0083] shadow-[0_0_10px_#FD0083]" />
        </span>
      </span>

      <span className="mt-2 block w-full truncate text-center text-xs font-semibold tracking-tight text-[#00BCD4] dark:text-[#7be8ff]">
        {label}
      </span>
    </button>
  );
};

const PremiumStatesSkeleton = () => (
  <div className="flex items-center gap-5 overflow-hidden py-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={`premium-state-skeleton-${index}`} className="w-[170px] shrink-0">
        <div className="h-[230px] w-full animate-pulse rounded-xl bg-gradient-to-br from-[#FD0083]/20 to-[#00BCD4]/20" />
        <div className="mx-auto mt-2 h-2.5 w-20 animate-pulse rounded-full bg-[#00BCD4]/25" />
      </div>
    ))}
  </div>
);

export const PremiumStatesCarousel = ({ catalogId, onSelectPost }: Props) => {
  const [states, setStates] = useState<PremiumCatalogState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!catalogId) {
      setStates([]);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    getCatalogPremiumStates(catalogId)
      .then((response) => {
        if (isActive) {
          setStates(response.activeStates);
        }
      })
      .catch(() => {
        if (isActive) {
          setStates([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [catalogId]);

  const trackItems = useMemo(() => buildMarqueeTrack(states), [states]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (isLoading || !viewport || !track) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;

    // Scales each card by its distance to the viewport center while the marquee moves.
    const paint = () => {
      const bounds = viewport.getBoundingClientRect();
      const center = bounds.left + bounds.width / 2;
      const range = bounds.width / 2 || 1;

      for (const child of Array.from(track.children) as HTMLElement[]) {
        const rect = child.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        const proximity = Math.max(0, 1 - distance / range);

        child.style.transform = `scale(${(0.84 + proximity * 0.3).toFixed(3)})`;
        child.style.opacity = `${(0.5 + proximity * 0.5).toFixed(3)}`;
      }

      frame = requestAnimationFrame(paint);
    };

    frame = requestAnimationFrame(paint);

    return () => cancelAnimationFrame(frame);
  }, [isLoading, trackItems]);

  const handleOpenState = (state: PremiumCatalogState) => {
    if (state.postId) {
      onSelectPost(state.postId);
    }
  };

  if (!isLoading && states.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#00BCD4]/20 bg-[linear-gradient(120deg,_rgba(253,0,131,0.08)_0%,_rgba(255,255,255,0.9)_45%,_rgba(0,188,212,0.12)_100%)] px-5 py-4 dark:border-white/10 dark:bg-[linear-gradient(120deg,_rgba(253,0,131,0.16)_0%,_#012a33_50%,_rgba(0,188,212,0.18)_100%)]">
      <p className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#FD0083]">
        <span className="h-2 w-2 rounded-full bg-[#FD0083] shadow-[0_0_10px_#FD0083]" />
        Estados premium
      </p>

      {isLoading ? (
        <PremiumStatesSkeleton />
      ) : (
        <div ref={viewportRef} className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-[#012a33] dark:via-[#012a33]/70" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white via-white/70 to-transparent dark:from-[#012a33] dark:via-[#012a33]/70" />

          <div ref={trackRef} className="animate-scroll-infinite items-center gap-5 py-6">
            {trackItems.map((state, index) => (
              <PremiumStateItem
                key={`${state.id}-${index}`}
                state={state}
                onOpen={handleOpenState}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};