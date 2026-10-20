import axios from "axios";
import { apiConfig } from "./config";

// Business services will use this instance once their real endpoints exist.
// Do not add token storage or a mock refresh interceptor here.
export const apiClient = axios.create({
  baseURL: apiConfig.apiUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});
