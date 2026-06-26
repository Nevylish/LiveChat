import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function compareUsernames(a: string, b: string): number {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
}
