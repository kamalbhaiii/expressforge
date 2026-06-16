import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert any string to kebab-case */
export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Validate a kebab-case project name */
export function isValidProjectName(name: string): boolean {
  return /^[a-z0-9-]+$/.test(name) && name.length >= 1 && name.length <= 64;
}
