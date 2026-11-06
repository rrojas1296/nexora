export interface AddressInput {
  label: string;
  address: string;
  reference: string;
  country: string;
  city: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}
export interface AddressView extends AddressInput {
  id: string;
  version: number;
}
