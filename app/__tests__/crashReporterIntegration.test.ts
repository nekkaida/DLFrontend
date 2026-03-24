import * as fs from 'fs';
import * as path from 'path';

describe('Crash reporter integration in root layout', () => {
  const layoutPath = path.join(__dirname, '../_layout.tsx');
  const layoutCode = fs.readFileSync(layoutPath, 'utf-8');

  it('should import ErrorBoundary', () => {
    expect(layoutCode).toMatch(/import.*ErrorBoundary/);
  });

  it('should import crashReporter functions', () => {
    expect(layoutCode).toMatch(/import.*reportRenderError|import.*reportJSError/);
  });

  it('should wrap NavigationInterceptor with ErrorBoundary', () => {
    const boundaryIdx = layoutCode.indexOf('<ErrorBoundary');
    const interceptorIdx = layoutCode.indexOf('<NavigationInterceptor');
    expect(boundaryIdx).toBeGreaterThan(-1);
    expect(interceptorIdx).toBeGreaterThan(-1);
    expect(boundaryIdx).toBeLessThan(interceptorIdx);
  });

  it('should declare ErrorUtils as global (NOT import from react-native)', () => {
    expect(layoutCode).toMatch(/declare const ErrorUtils/);
    expect(layoutCode).not.toMatch(/import.*ErrorUtils.*from.*react-native/);
  });

  it('should pass onError to ErrorBoundary', () => {
    expect(layoutCode).toMatch(/onError.*=.*\{.*reportRenderError/s);
  });
});
