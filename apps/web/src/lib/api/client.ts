import axios from "axios";
import { apiConfig } from "./config";

// Auth uses cookies. Never store JWTs or automatically replay mutations here.
export const apiClient = axios.create({
  baseURL: apiConfig.apiUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});
