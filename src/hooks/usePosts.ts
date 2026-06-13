import { useState, useEffect } from 'react';
import { getPostsByCatalog } from '../services/catalogService';
import type { Post } from '../services/catalogService';

export const usePosts = (catalogId: string, page: number) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await getPostsByCatalog(catalogId, page);
        
        if (response.data && response.data.content) {
          // Actualizamos posts
          setPosts(prev => page === 0 ? response.data.content : [...prev, ...response.data.content]);
          
          // Lógica nueva: Si la página actual + 1 es menor que el total de páginas, hay más
          const isLastPage = (response.data.page + 1) >= response.data.totalPages;
          setHasMore(!isLastPage);
          
          setError(null);
        }
      } catch (err: any) {
        if (err.response?.status === 500) {
          setPosts([]);
          setHasMore(false);
          setError(null);
        } else {
          setError('Error de conexión');
        }
      } finally {
        setLoading(false);
      }
    };

    if (catalogId) fetchPosts();
  }, [catalogId, page]);

  return { posts, loading, hasMore, error };
};