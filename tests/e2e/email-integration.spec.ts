import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Email Integration', () => {
  test('Email module file exists and exports sendEmail', async () => {
    const filePath = path.resolve(__dirname, '../../src/lib/email.ts');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export async function sendEmail');
    expect(content).toContain('RESEND_API_KEY');
    expect(content).toContain('noreply@reason.guru');
  });

  test('Email templates file exports all required functions', async () => {
    const filePath = path.resolve(__dirname, '../../src/lib/email-templates.ts');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export function welcomeEmail');
    expect(content).toContain('export function sessionCompletedEmail');
    expect(content).toContain('export function documentReadyEmail');
    expect(content).toContain('export function lowBalanceEmail');
    expect(content).toContain('export function paymentReceivedEmail');
  });

  test('Welcome email template contains required brand elements', async () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/lib/email-templates.ts'),
      'utf-8'
    );
    expect(content).toContain('#B8860B');       // gold accent
    expect(content).toContain('#0A1128');        // navy background
    expect(content).toContain('reason.guru');    // brand link
    expect(content).toContain('Bienvenido a Reason'); // welcome subject
    expect(content).toContain('Crear mi primer proyecto'); // CTA
  });

  test('All endpoints integrate sendEmail', async () => {
    const filesToCheck = [
      { file: 'src/app/api/auth/setup/route.ts', fn: 'welcomeEmail' },
      { file: 'src/app/api/session/resolve/route.ts', fn: 'documentReadyEmail' },
      { file: 'src/app/api/session/resolve/route.ts', fn: 'sessionCompletedEmail' },
      { file: 'src/lib/usage.ts', fn: 'lowBalanceEmail' },
      { file: 'src/app/api/stripe/webhook/route.ts', fn: 'paymentReceivedEmail' },
    ];

    for (const { file, fn } of filesToCheck) {
      const fullPath = path.resolve(__dirname, '../../', file);
      expect(fs.existsSync(fullPath), `File not found: ${file}`).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content, `${fn} not found in ${file}`).toContain(fn);
      expect(content, `sendEmail not imported in ${file}`).toContain('sendEmail');
    }
  });

  test('RESEND_API_KEY is documented in .env.example', async () => {
    const envExample = fs.readFileSync(
      path.resolve(__dirname, '../../.env.example'),
      'utf-8'
    );
    expect(envExample).toContain('RESEND_API_KEY');
  });
});
