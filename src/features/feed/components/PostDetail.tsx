import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPostById, type PostDetail } from '@/features/feed/services/postService';
import type { Post } from '@/features/feed/services/catalogService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getVipAreaInfoCached } from '@/features/vip-area/services/vipAreaService';
import type { VipAreaInfo } from '@/features/vip-area/types/vipArea';

export const PostDetailView = ({
  postId,
  fallbackPost,
}: {
  postId: string;
  fallbackPost?: Post;
}) => {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [vipInfo, setVipInfo] = useState<VipAreaInfo | null>(null);
  const [vipInfoLoading, setVipInfoLoading] = useState(false);
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (postId) {
      getPostById(postId, { isPublicRequest: true }).then(setPost);
    }
  }, [postId]);

  const services = post?.services || fallbackPost?.services || [];
  const modelContents = post?.modelContents || fallbackPost?.modelContents || [];
  const fallbackWhatsapp =
    fallbackPost?.modelContactMethods?.find((method) => method.app === 'WHATSAPP')?.value ||
    (fallbackPost as Post & { whatsapp?: string; whatsappNumber?: string; contactPhone?: string; phone?: string })?.whatsapp ||
    (fallbackPost as Post & { whatsapp?: string; whatsappNumber?: string; contactPhone?: string; phone?: string })?.whatsappNumber ||
    (fallbackPost as Post & { whatsapp?: string; whatsappNumber?: string; contactPhone?: string; phone?: string })?.contactPhone ||
    (fallbackPost as Post & { whatsapp?: string; whatsappNumber?: string; contactPhone?: string; phone?: string })?.phone;

  const whatsapp =
    post?.modelContactMethods?.find((method) => method.app === 'WHATSAPP')?.value ||
    fallbackWhatsapp;
  const normalizedWhatsapp = (whatsapp || '').replace(/[^\d]/g, '');

  const title = post?.title || fallbackPost?.title || 'Detalle';
  const vipAreaId = post?.vipAreaId || fallbackPost?.vipAreaId || null;
  const canShowVipButton = role !== 'MODEL';

  useEffect(() => {
    let isMounted = true;

    if (!canShowVipButton || !vipAreaId) {
      setVipInfo(null);
      setVipInfoLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setVipInfoLoading(true);

    getVipAreaInfoCached(vipAreaId)
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
  }, [canShowVipButton, vipAreaId]);

  if (!post && !fallbackPost) {
    return (
      <div className="p-20 text-center text-[#FD0083] font-black animate-pulse">
        CARGANDO...
      </div>
    );
  }

  return (
    <div className="px-16 w-full text-left bg-slate-50 dark:bg-[#012a33] text-slate-900 dark:text-white pb-12 transition-colors">
      <div className="flex justify-between items-start mb-10 gap-4">
        <div className="space-y-8">
          {/* Sección de Servicios */}
          <div>
            <h4 className="text-[#012a33] dark:text-[#00BCD4] font-black text-xl mb-4 uppercase italic transition-colors">Servicios Virtuales</h4>
            <div className="flex flex-wrap gap-2">
              {services.map(service => (
                <span key={service} className="bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-slate-300 dark:border-white/10 transition-colors">
                  {service.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          {/* Botón LLAMAME estilo WhatsApp oficial */}
          {normalizedWhatsapp ? (
            <a 
              href={`https://wa.me/${normalizedWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20ba5a] hover:scale-105 transition-all text-white px-10 py-5 rounded-full font-black text-2xl flex items-center gap-4 shadow-[0_15px_30px_rgba(37,211,102,0.4)]"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                className="w-10 h-10" 
                alt="WhatsApp Icon" 
              />
              LLAMAME...
            </a>
          ) : (
            <div className="px-6 py-4 rounded-2xl vp-surface-soft vp-text-primary font-semibold border vp-border transition-colors">
              Contacto no disponible
            </div>
          )}

          {canShowVipButton && vipInfo && vipAreaId && (
            <button
              type="button"
              onClick={() => {
                navigate(`/vip/${vipAreaId}`);
              }}
              className="min-w-56 rounded-2xl border border-[#00BCD4]/60 bg-gradient-to-r from-[#00BCD4] to-[#00e1ff] px-7 py-4 text-lg font-black uppercase tracking-[0.14em] text-[#022036] shadow-[0_12px_30px_rgba(0,188,212,0.35)] transition hover:brightness-110"
            >
              CHAT VIP
            </button>
          )}

          {canShowVipButton && vipInfoLoading && (
            <div className="h-14 w-56 animate-pulse rounded-2xl border border-[#00BCD4]/25 bg-[#032033]/55" />
          )}
        </div>
      </div>

      {/* Galería de fotos GIGANTES alineada a la izquierda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {(modelContents.length > 0
          ? modelContents
          : [{
              id: fallbackPost?.id || postId,
              contentUrl: fallbackPost?.coverPhotoUrl || '',
              contentType: 'IMAGE' as const,
            }]
        ).map((content) => (
          <div key={content.id} className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 transition-colors">
            {content.contentType === 'VIDEO' ? (
              <video 
                src={content.contentUrl} 
                className="w-full h-full object-cover" 
                controls 
              />
            ) : (
              <img 
                src={content.contentUrl} 
                className="w-full h-full object-cover" 
                alt={title}
              />
            )}
          </div>
        ))}
      </div>

    </div>
  );
};