import { useState, useEffect, useRef } from 'react';
import { getCatalogPosts, type Post } from '../services/catalogService';
import { getUserFacingErrorMessage } from '../services/errorMapper';
import { useNotification } from '../hooks/useNotification';
import { PostCard } from './PostCard';
import { PostDetailView } from './PostDetail';

interface FeedProps {
  catalogId: string;
  onPostClick: (id: string) => void;
  viewingPostId: string | null;
}

export const Feed = ({ catalogId, onPostClick, viewingPostId }: FeedProps) => {
  const { error: notifyError } = useNotification();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosts([]);
    setPage(0);
    setHasMore(true);
    hasMoreRef.current = true;
    isLoadingRef.current = false;
  }, [catalogId]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (!catalogId || !hasMoreRef.current || isLoadingRef.current) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    getCatalogPosts(catalogId, page)
      .then(newPosts => {
        if (newPosts.length === 0) {
          setHasMore(false);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewPosts];
          });
        }
      })
      .catch((error: unknown) => {
        notifyError({
          title: "No pudimos cargar el catálogo",
          description: getUserFacingErrorMessage(error, {
            defaultMessage: "No pudimos cargar el catálogo en este momento.",
            forbiddenMessage: "No tienes permisos para ver este catálogo.",
          }),
        });

        setHasMore(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [catalogId, page]);


  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // Si el sensor es visible Y no estamos cargando ya algo, pedimos la siguiente página
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  return (
    <div className="max-w-7xl mx-auto px-6 mt-12 space-y-10">
      {posts.map((post) => (
        <div key={post.id} className="w-full flex flex-col items-start">
          <PostCard 
            post={post} 
            onSelect={onPostClick} 
          />
          

          {viewingPostId === post.id && (
            <div className="w-full bg-slate-50 dark:bg-[#012a33] rounded-b-[5rem] -mt-16 pt-24 pb-12 shadow-2xl z-0 animate-in fade-in slide-in-from-top-4 duration-500 border border-slate-200 dark:border-white/10 border-t-0 transition-colors">
               <PostDetailView
                 postId={post.id}
                 fallbackPost={post}
               />
            </div>
          )}
        </div>
      ))}


      <div ref={loaderRef} className="py-20 flex justify-center w-full">
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#FD0083]"></div>
            <span className="text-[#FD0083] font-black uppercase tracking-tighter animate-pulse">
              Cargando más modelos...
            </span>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-white/40 font-bold uppercase tracking-widest italic">
            — Fin del catálogo —
          </p>
        )}
      </div>
    </div>
  );
};