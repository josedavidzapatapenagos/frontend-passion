export interface Catalog {
  id: string;
  name: string;
  countryIsoCode: string;
  countryFlagUrl: string;
  currency: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  at: string;
  status: string;
}