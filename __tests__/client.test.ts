/// <reference types="node" />
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('supabase client environment initialization', () => {
  const helperPath = path.resolve(__dirname, 'client-test-helper.js');
  const envPath = path.resolve(__dirname, '../.env');
  let originalEnv = '';

  beforeAll(() => {
    if (fs.existsSync(envPath)) {
      originalEnv = fs.readFileSync(envPath, 'utf8');
    }
  });

  afterAll(() => {
    if (originalEnv && fs.existsSync(envPath)) {
      try {
        fs.writeFileSync(envPath, originalEnv, 'utf8');
      } catch {}
    }
  });

  it('lancia errore se SUPABASE_URL manca', () => {
    // Scrive temporaneamente .env senza URL
    fs.writeFileSync(envPath, 'SUPABASE_URL=\nSUPABASE_ANON_KEY=test-key\n', 'utf8');

    let error: any;
    try {
      execSync(`node "${helperPath}"`, { stdio: 'pipe' });
    } catch (e: any) {
      error = e;
    } finally {
      // Ripristina l'env
      fs.writeFileSync(envPath, originalEnv, 'utf8');
    }

    expect(error).toBeDefined();
    const stderr = error.stderr.toString();
    expect(stderr).toContain('SUPABASE_URL mancante in .env');
  });

  it('lancia errore se SUPABASE_ANON_KEY manca', () => {
    // Scrive temporaneamente .env senza KEY
    fs.writeFileSync(envPath, 'SUPABASE_URL=https://example.supabase.co\nSUPABASE_ANON_KEY=\n', 'utf8');

    let error: any;
    try {
      execSync(`node "${helperPath}"`, { stdio: 'pipe' });
    } catch (e: any) {
      error = e;
    } finally {
      // Ripristina l'env
      fs.writeFileSync(envPath, originalEnv, 'utf8');
    }

    expect(error).toBeDefined();
    const stderr = error.stderr.toString();
    expect(stderr).toContain('SUPABASE_ANON_KEY mancante in .env');
  });
});
