import { describe, it, expect } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA Manifest', () => {
  it('deve fornecer metadados válidos e lista de ícones obrigatórios', () => {
    const config = manifest();
    expect(config.name).toContain('SGH');
    expect(config.display).toBe('standalone');
    expect(config.icons).toBeDefined();
    expect(config.icons!.length).toBeGreaterThanOrEqual(3);

    const icon192 = config.icons!.find((i) => i.sizes === '192x192');
    const icon512 = config.icons!.find((i) => i.sizes === '512x512');
    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
  });
});
