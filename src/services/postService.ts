import apiClient from '../api/apiClient';

export interface PostDetail {
  id: string;
  modelAlias: string;
  title: string;
  description: string;
  coverPhotoUrl: string;
  price: {
    amount: number;
    currency: string;
  };
  modelContents: {
    id: string;
    contentUrl: string;
    contentType: 'IMAGE' | 'VIDEO';
  }[];
  modelContactMethods: {
    app: string;
    value: string;
  }[];
  services: string[];
}

export const getPostById = async (postId: string): Promise<PostDetail | null> => {
  try {
    const response = await apiClient.get(`/v1/posts/${postId}`);
    // Según tu respuesta: { data: { data: { ... } } }
    return response.data.data;
  } catch (error) {
    console.error("Error al obtener detalle:", error);
    return null;
  }
};