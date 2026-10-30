import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to merge Tailwind CSS classes cleanly without specificity / ordering conflicts
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
