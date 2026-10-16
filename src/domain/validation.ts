export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidGstin = (v: string) => GSTIN_PATTERN.test(v.trim().toUpperCase());
export const isValidPan = (v: string) => PAN_PATTERN.test(v.trim().toUpperCase());
export const isValidEmail = (v: string) => v.trim() === '' || EMAIL_PATTERN.test(v.trim());

export type FieldErrors<K extends string> = Partial<Record<K, string>>;
