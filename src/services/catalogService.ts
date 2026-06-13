import apiClient from '../api/apiClient';

export interface Post {
  id: string;
  title: string;
  description: string;
  coverPhotoUrl: string;
  price: {
    amount: number;
    currency: string;
  };
  isOnline: boolean;
  hasPremium: boolean;
}

// Añadimos 'page' con valor por defecto 0
export const getCatalogPosts = async (catalogId: string, page: number = 0): Promise<Post[]> => {
  try {
    const response = await apiClient.get(`/v1/posts/catalog/${catalogId}`, {
      // Ahora usamos la variable 'page' en lugar de dejar el 0 fijo
      params: { 
        page: page,
        size: 15 // O el tamaño que prefieras por carga
      }
    });
    
    return response.data.data.content;
  } catch (error) {
    console.error("Error al obtener modelos:", error);
    return [];
  }
};