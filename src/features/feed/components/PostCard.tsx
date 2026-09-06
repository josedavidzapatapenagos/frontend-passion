import { useEffect, useState } from 'react';
import type { Post } from '@/features/feed/services/catalogService';
import { getVipAreaInfoCached } from '@/features/vip-area/services/vipAreaService';
import type { VipAreaInfo } from '@/features/vip-area/types/vipArea';

interface PostCardProps {
  post: Post;
  onSelect: (id: string) => void;
}

export const PostCard = ({ post, onSelect }: PostCardProps) => {
  const [vipInfo, setVipInfo] = useState<VipAreaInfo | null>(null);
  const [vipInfoLoading, setVipInfoLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!post.vipAreaId) {
      setVipInfo(null);
      setVipInfoLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setVipInfoLoading(true);

    getVipAreaInfoCached(post.vipAreaId)
      .then((info) => {
        if (!isMounted) {
          return;
        }

        setVipInfo(info);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setVipInfo(null);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setVipInfoLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [post.vipAreaId]);

  const modelName = post.title.replace('Experiencia con ', '');
  const primaryContent = post.modelContents?.[0];
  const mediaSrc = post.coverPhotoUrl || primaryContent?.contentUrl || '';
  const isPrimaryVideo = primaryContent?.contentType === 'VIDEO' && primaryContent.contentUrl === mediaSrc;

  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div 
      onClick={() => onSelect(post.id)}
      className="relative z-10 flex items-center w-full bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#012a33] rounded-[3rem] p-6 cursor-pointer shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] hover:scale-[1.01] transition-all duration-300 group border border-slate-200 dark:border-white/5"
    >
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-[#FD0083] overflow-hidden flex-shrink-0 shadow-md group-hover:border-[#00BCD4] transition-colors duration-500">
        {isPrimaryVideo ? (
          <video
            src={mediaSrc}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img
            src={mediaSrc}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={modelName}
          />
        )}
      </div>
      
      <div className="ml-8 text-left flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="text-[#00BCD4] font-black text-3xl md:text-4xl uppercase italic tracking-tighter leading-none">
            {modelName}
          </h3>
          {post.hasPremium && (
            <span className="bg-[#FD0083] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md tracking-wider">
              PREMIUM
            </span>
          )}
          <span className="text-slate-900 dark:text-white font-black text-xl ml-auto bg-slate-100 dark:bg-white/5 px-5 py-2 rounded-2xl transition-colors border border-slate-200 dark:border-white/10">
            ${post.price.amount} <span className="text-xs opacity-60">{post.price.currency}</span>
          </span>
        </div>
        
        <p className="text-slate-600 dark:text-white/60 font-medium text-lg max-w-4xl leading-snug line-clamp-2 transition-colors">
          {post.description}
        </p>

        {vipInfo && (
          <div className="mt-4 rounded-2xl border border-[#00BCD4]/35 bg-gradient-to-r from-[#04162a] via-[#0a1e3a] to-[#1a1240] px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#FD0083] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                Area VIP
              </span>
              <span className="text-sm font-black text-[#7be8ff]">{vipInfo.alias}</span>
              <span className="text-sm font-black text-white/95">
                {formatMoney(vipInfo.monthlyPrice.amount, vipInfo.monthlyPrice.currency)} / mes
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#9ed6f8]">
              <span>{vipInfo.photoCount} fotos</span>
              <span>{vipInfo.videoCount} videos</span>
              <span>{vipInfo.unlockableCount} unlockables</span>
            </div>
          </div>
        )}

        {vipInfoLoading && !vipInfo && post.vipAreaId && (
          <div className="mt-4 h-14 animate-pulse rounded-2xl border border-[#00BCD4]/20 bg-[#031327]/60" />
        )}

        <div className="mt-4 flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="text-slate-500 dark:text-[#00BCD4]/80 font-bold text-xs uppercase tracking-[0.2em] transition-colors">
            Disponible ahora
          </span>
        </div>
      </div>
    </div>
  );
};