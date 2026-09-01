import axios from 'axios';
import type { Bounty } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const bountiesApi = {
  getBounties: async (): Promise<Bounty[]> => {
    const response = await apiClient.get<Bounty[]>('/bounties');
    return response.data;
  },
  getHealth: async (): Promise<{ status: string; service: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};
