import apiClient from "../api/apiClient";
import axios from "axios";

type ApiEnvelope<T> = {
  data: T;
  message: string;
  at: string;
  status: string;
};

export type ModelAccountMe = {
  name: string;
  lastname: string;
  email: string;
  status: string;
  createdAt: string;
};

export type UpdateModelPasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const getModelAccountMeApi = async () => {
  return apiClient.get<ApiEnvelope<ModelAccountMe>>("/v1/models/accounts/me", {
    headers: {
      accept: "*/*",
    },
  });
};

export const updateModelPassword = async (
  payload: UpdateModelPasswordPayload
) => {
  const response = await axios.patch<ApiEnvelope<null>>(
    "/api/v1/models/accounts/me/password",
    payload,
    {
      withCredentials: true,
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
