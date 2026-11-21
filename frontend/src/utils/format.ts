import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Animal, MedicalRecord } from '@/types/shelter';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(
    new Date(Number(year), Number(month) - 1, 1),
  );
}

export function formatRelative(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function todayInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`;
}

export function addDaysInput(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function dueLabel(record: MedicalRecord): string {
  const days = daysUntil(record.nextVaccinationDate);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `In ${days} days`;
}

export function isOverdue(record: MedicalRecord): boolean {
  return daysUntil(record.nextVaccinationDate) < 0 && record.vaccinationStatus !== 'VACCINATED';
}

export function isDueSoon(record: MedicalRecord, days = 7): boolean {
  const remaining = daysUntil(record.nextVaccinationDate);
  return remaining >= 0 && remaining <= days && record.vaccinationStatus !== 'VACCINATED';
}

export function speciesLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function roleLabel(value: string): string {
  if (value === 'VETERINARIAN') return 'Veterinarian';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function statusLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function animalSubtitle(animal: Animal): string {
  if (animal.category === 'DOG') return [animal.breed, animal.size].filter(Boolean).join(' · ') || 'Dog';
  if (animal.category === 'CAT') {
    return [animal.breed, animal.furColor ? `${animal.furColor} fur` : null].filter(Boolean).join(' · ') || 'Cat';
  }
  return [animal.species, animal.wingspan ? `${animal.wingspan}m wingspan` : null].filter(Boolean).join(' · ') || 'Bird';
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function longDate(): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}
