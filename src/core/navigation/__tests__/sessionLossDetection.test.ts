import * as fs from 'fs';
import * as path from 'path';

describe('Session loss detection in NavigationInterceptor', () => {
  const interceptorPath = path.join(__dirname, '../NavigationInterceptor.tsx');
  const code = fs.readFileSync(interceptorPath, 'utf-8');

  it('should import reportSessionLoss from crashReporter', () => {
    expect(code).toMatch(/import.*reportSessionLoss.*crashReporter/);
  });

  it('should call reportSessionLoss on 404 account deletion', () => {
    expect(code).toMatch(/reportSessionLoss.*ACCOUNT_DELETED|reportSessionLoss.*404/);
  });

  it('should call reportSessionLoss on consecutive 401 failures', () => {
    expect(code).toMatch(/reportSessionLoss.*CONSECUTIVE_401|reportSessionLoss.*401/);
  });
});
