// src/services/authService.ts
import apiClient from '../api/apiClient';


export const login = async (email: string, password: string) => {

  return apiClient.post('/authenticate', { email, password });
};


export const logout = async () => {

  return apiClient.post('/logout');
};