// src/services/authService.ts

import apiClient from "../api/apiClient";

export const login = async (
  email: string,
  password: string
) => {
  return apiClient.post("/authenticate", {
    email,
    password,
  });
};

export const verifyEmail = async (
  token: string
) => {
  return apiClient.post(
    `/model/account/verify-email?token=${token}`
  );
};

export const logout = async () => {
  return apiClient.post("/logout");
};