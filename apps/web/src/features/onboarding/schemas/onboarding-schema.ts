import { z } from "zod";

import { currencies } from "@/lib/config/currency";
import { getCallingCode, phoneCountries } from "../config/phone-countries";
import { timezones } from "../config/timezones";

export { currencies } from "@/lib/config/currency";
export { timezones } from "../config/timezones";
export const agentTones = ["friendly", "professional", "concise"] as const;
export type OnboardingValidation = {
  name: string;
  businessName: string;
  description: string;
  instructions: string;
  required: string;
  phone: string;
  hours: string;
};

export function createOnboardingSchema(messages: OnboardingValidation) {
  const name = z.string().trim().min(2, messages.name).max(80, messages.name);
  const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, messages.hours);
  return z
    .object({
      businessName: z.string().trim().min(1, messages.businessName).max(120, messages.businessName),
      businessDescription: z
        .string()
        .trim()
        .min(10, messages.description)
        .max(500, messages.description),
      storeName: name,
      currency: z.enum(currencies, { error: messages.required }),
      timezone: z.enum(timezones, { error: messages.required }),
      openingTime: time,
      closingTime: time,
      agentName: name,
      agentTone: z.enum(agentTones, { error: messages.required }),
      agentInstructions: z
        .string()
        .trim()
        .min(20, messages.instructions)
        .max(2000, messages.instructions),
      whatsappCountry: z.enum(
        phoneCountries.map(({ country }) => country),
        {
          error: messages.required,
        },
      ),
      whatsappPhone: z
        .string()
        .trim()
        .refine((value) => value === "" || /^\+[1-9]\d{7,14}$/.test(value), messages.phone),
      whatsappPreview: z.boolean(),
    })
    .refine(
      (value) =>
        value.whatsappPhone === "" ||
        (value.whatsappPhone.startsWith(getCallingCode(value.whatsappCountry)) &&
          /^\d{6,}$/.test(value.whatsappPhone.slice(getCallingCode(value.whatsappCountry).length))),
      { path: ["whatsappPhone"], message: messages.phone },
    )
    .refine((value) => value.closingTime > value.openingTime, {
      path: ["closingTime"],
      message: messages.hours,
    });
}

export type OnboardingValues = z.infer<ReturnType<typeof createOnboardingSchema>>;
