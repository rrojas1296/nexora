export interface WhatsappAuthorizedAsset {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
}

export interface WhatsappAuthorizationAttempt {
  id: string;
  locale: "es" | "en";
  status: string;
  expiresAt: Date;
  encryptedAccessToken: string | null;
  assets: WhatsappAuthorizedAsset[];
}
