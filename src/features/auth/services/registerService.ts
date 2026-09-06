import apiClient from "@/services/apiClient";

export interface RegisterRequest {
  name: string;
  lastname: string;
  email: string;
  password: string;
}

export const registerModel = async (
  data: RegisterRequest
) => {
  const response = await apiClient.post(
    "/v1/models/accounts",
    data
  );

  return response.data;
};

export const registerClientVip = async (
  data: RegisterRequest
) => {
  const response = await apiClient.post(
    "/v1/clients/accounts",
    data
  );

  return response.data;
};