import pino from 'pino';

// Structured logger with PII redaction. Use `logger.child({ module: 'foo' })`
// in callers so grep-by-module works.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'password',
      'passwordHash',
      'apiKey',
      'encryptedKey',
      'decryptedKey',
      'authorization',
      'cookie',
      'email',
      '*.password',
      '*.passwordHash',
      '*.apiKey',
      '*.encryptedKey',
      '*.decryptedKey',
      '*.authorization',
      '*.cookie',
      '*.email',
      'user.email',
      'user.passwordHash',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  base: { service: 'learnenglish-web' },
});
