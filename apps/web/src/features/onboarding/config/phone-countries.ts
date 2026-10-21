export const phoneCountries = [
  { country: "PE", callingCode: "+51" },
  { country: "AR", callingCode: "+54" },
  { country: "BO", callingCode: "+591" },
  { country: "BR", callingCode: "+55" },
  { country: "CL", callingCode: "+56" },
  { country: "CO", callingCode: "+57" },
  { country: "CR", callingCode: "+506" },
  { country: "CU", callingCode: "+53" },
  { country: "EC", callingCode: "+593" },
  { country: "SV", callingCode: "+503" },
  { country: "GT", callingCode: "+502" },
  { country: "HN", callingCode: "+504" },
  { country: "MX", callingCode: "+52" },
  { country: "NI", callingCode: "+505" },
  { country: "PA", callingCode: "+507" },
  { country: "PY", callingCode: "+595" },
  { country: "PR", callingCode: "+1" },
  { country: "DO", callingCode: "+1" },
  { country: "UY", callingCode: "+598" },
  { country: "VE", callingCode: "+58" },
  { country: "BZ", callingCode: "+501" },
  { country: "HT", callingCode: "+509" },
  { country: "GY", callingCode: "+592" },
  { country: "SR", callingCode: "+597" },
  { country: "US", callingCode: "+1" },
  { country: "ES", callingCode: "+34" },
] as const;

export type PhoneCountry = (typeof phoneCountries)[number]["country"];

export function getCallingCode(country: PhoneCountry): string {
  return phoneCountries.find((option) => option.country === country)!.callingCode;
}
