import { useState, useEffect, useRef } from 'react';
import { getCatalogPosts, type Post } from '../services/catalogService';
import { PostCard } from './PostCard';
import { PostDetailView } from './PostDetail';

interface FeedProps {
  catalogId: string;
  onPostClick: (id: string) => void;
  viewingPostId: string | null;
}

export const Feed = ({ catalogId, onPostClick, viewingPostId }: FeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Efecto para Resetear cuando cambias de país/catálogo
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
  }, [catalogId]);

  // Carga de Datos con Filtro Anti-Duplicados
  useEffect(() => {
    if (!catalogId || !hasMore || isLoading) return;

    setIsLoading(true);
    getCatalogPosts(catalogId, page).then(newPosts => {
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => {
          // Filtro de seguridad: Solo agregamos posts cuyo ID no esté ya en la lista
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }
      setIsLoading(false);
    });
  }, [catalogId, page]);

  // Detector de Scroll (Intersection Observer)
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
          
          {/* Despliegue del detalle con efecto de continuidad */}
          {viewingPostId === post.id && (
            <div className="w-full bg-white rounded-b-[5rem] -mt-16 pt-24 pb-12 shadow-2xl z-0 animate-in fade-in slide-in-from-top-4 duration-500">
               <PostDetailView postId={post.id} />
            </div>
          )}
        </div>
      ))}

      {/* Sensor de Scroll e Indicador de Carga */}
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