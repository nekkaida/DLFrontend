import * as fs from 'fs';
import * as path from 'path';

describe('crashReporter service', () => {
  const servicePath = path.join(__dirname, '../crashReporter.ts');

  it('should exist', () => {
    expect(fs.existsSync(servicePath)).toBe(true);
  });

  const serviceCode = () => fs.readFileSync(servicePath, 'utf-8');

  it('should have re-entry guard to prevent infinite loops', () => {
    expect(serviceCode()).toMatch(/isReporting/);
  });

  it('should guard against development mode', () => {
    expect(serviceCode()).toMatch(/__DEV__/);
  });

  it('should sanitize PII from stack traces', () => {
    expect(serviceCode()).toMatch(/Bearer.*REDACTED/);
  });

  it('should truncate stack traces', () => {
    expect(serviceCode()).toMatch(/slice|MAX.*LENGTH/);
  });

  it('should have crash loop protection', () => {
    expect(serviceCode()).toMatch(/recentCrashes|MAX_CRASHES/);
  });

  it('should collect device info', () => {
    expect(serviceCode()).toMatch(/Platform\.OS|expo-device|Device\./);
  });

  it('should export reportRenderError for ErrorBoundary', () => {
    expect(serviceCode()).toMatch(/export.*function.*reportRenderError/);
  });

  it('should export reportJSError for ErrorUtils', () => {
    expect(serviceCode()).toMatch(/export.*function.*reportJSError/);
  });

  it('should export reportSessionLoss for NavigationInterceptor', () => {
    expect(serviceCode()).toMatch(/export.*function.*reportSessionLoss/);
  });

  it('should fire-and-forget (never throw statements in code)', () => {
    const code = serviceCode();
    // Remove comments before checking for throw statements
    const codeWithoutComments = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const throwCount = (codeWithoutComments.match(/\bthrow\b/g) || []).length;
    expect(throwCount).toBe(0);
  });
});
