export function passwordRequirements(value: string) {
  return {
    length: [...value].length >= 8,
    letter: /\p{L}/u.test(value),
    number: /\p{Nd}/u.test(value),
    byteLimit: new TextEncoder().encode(value).byteLength <= 72,
  };
}

export function meetsPasswordRequirements(value: string): boolean {
  return Object.values(passwordRequirements(value)).every(Boolean);
}

// Local guidance based on composition and length, not an entropy or breach check.
export function passwordStrength(value: string): 0 | 1 | 2 | 3 {
  if (!value) return 0;
  if (!meetsPasswordRequirements(value)) return 1;
  return [...value].length >= 12 && /[^\p{L}\p{Nd}\s]/u.test(value) ? 3 : 2;
}
