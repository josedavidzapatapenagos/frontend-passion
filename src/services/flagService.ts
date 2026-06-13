import apiClient from '../api/apiClient';

export interface Catalog {
  id: string;
  name: string;
  countryIsoCode: string;
  countryFlagUrl: string; // <-- La propiedad que usaremos
  currency: string;
}

export interface CatalogResponse {
  data: Catalog[];
  message: string;
  status: string;
}

export const getCatalogs = async () => {
  const response = await apiClient.get<CatalogResponse>('/v1/catalogs');
  return response.data;
};