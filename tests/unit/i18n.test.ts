import { describe, it, expect } from 'vitest';
// @ts-expect-error — red phase
import { t, setLocale, getLocale } from '@/lib/i18n';

describe('i18n toggle', () => {
  it('should return PT-BR strings by default', () => {
    setLocale('pt-BR');

    expect(getLocale()).toBe('pt-BR');
    expect(t('dashboard.title')).toMatch(/Painel|Início/);
  });

  it('should return EN strings after switching locale', () => {
    setLocale('en');

    expect(getLocale()).toBe('en');
    expect(t('dashboard.title')).toMatch(/Dashboard|Home/);
  });

  it('should fall back to the key when a translation is missing', () => {
    setLocale('en');

    expect(t('nonexistent.key.xyz')).toBe('nonexistent.key.xyz');
  });
});
