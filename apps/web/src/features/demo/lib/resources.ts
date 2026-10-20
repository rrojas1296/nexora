import { notFound } from "next/navigation";

export const resourceModules = ["products", "clients", "stores", "orders"] as const;
export type ResourceModule = (typeof resourceModules)[number];
export function validateResource(module: string): ResourceModule {
  const resource = resourceModules.find((value) => value === module);
  if (!resource) notFound();
  return resource;
}
