import apiClient from "../api/apiClient";

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
    "/model/account",
    data
  );

  return response.data;
};