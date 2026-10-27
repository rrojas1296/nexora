export interface ClientInput {
  name: string;
  email: string | null;
  phone: string;
  company: string;
  taxId: string;
  segment: "retail" | "wholesale" | "vip";
  active: boolean;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string | null;
  language: string;
  notes: string;
  marketingConsent: boolean;
}
export interface ClientView extends ClientInput {
  id: string;
  version: number;
  createdAt: string;
  ordersCount: number;
}
