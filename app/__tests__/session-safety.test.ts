/**
 * Session Safety Tests
 *
 * Ensures that no code path uses authClient.getSession() where it can
 * invalidate the local session on failure. Only getCookie() should be
 * used for attaching auth to requests.
 *
 * Background: better-auth's getSession() calls the backend. If the call
 * fails (network, 401, 500), the session atom is set to data:null,
 * logging the user out. getCookie() reads from local SecureStore only
 * and never triggers a backend call.
 */

const mockGetSession = jest.fn().mockResolvedValue({ data: null });
const mockGetCookie = jest.fn().mockReturnValue('; deuceleague.session_token=abc123');

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: mockGetSession,
    getCookie: mockGetCookie,
    signIn: jest.fn(),
    signOut: jest.fn(),
    useSession: jest.fn(() => ({ data: null, isPending: false })),
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({ data: null, isPending: false })),
}));

jest.mock('@/config/network', () => ({
  getBackendBaseURL: () => 'http://localhost:3001',
  logNetworkConfig: jest.fn(),
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connected: false,
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

const fs = require('fs');
const path = require('path');

// ---------- socket-service tests ----------

describe('SocketService.connect() must not call getSession()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('connect uses getCookie instead of getSession for auth', async () => {
    const { SocketService } = require('@/lib/socket-service');
    const service = SocketService.getInstance();

    await service.connect();

    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockGetCookie).toHaveBeenCalled();
  });
});

// ---------- onboarding API source check ----------

describe('QuestionnaireAPI must not call getSession()', () => {
  test('onboarding/api.ts does not invoke authClient.getSession()', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/features/onboarding/services/api.ts'),
      'utf-8'
    );

    const getSessionCalls = source.match(/authClient\.getSession\(\)/g) || [];
    expect(getSessionCalls.length).toBe(0);
  });
});

// ---------- useProfileImageUpload source check ----------

describe('Profile image upload must not call getSession()', () => {
  test('useProfileImageUpload.ts does not invoke authClient.getSession()', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/shared/hooks/useProfileImageUpload.ts'),
      'utf-8'
    );

    const getSessionCalls = source.match(/authClient\.getSession\(\)/g) || [];
    expect(getSessionCalls.length).toBe(0);
  });
});

// ---------- verifyEmail source check ----------

describe('verifyEmail must not poll getSession()', () => {
  test('verifyEmail.tsx does not invoke authClient.getSession()', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../verifyEmail.tsx'),
      'utf-8'
    );

    const getSessionCalls = source.match(/authClient\.getSession\(\)/g) || [];
    expect(getSessionCalls.length).toBe(0);
  });
});

// ---------- auth-client config tests ----------

describe('auth-client must disable refetchOnWindowFocus', () => {
  test('createAuthClient config contains refetchOnWindowFocus: false', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../lib/auth-client.ts'),
      'utf-8'
    );

    expect(source).toMatch(/refetchOnWindowFocus\s*:\s*false/);
  });
});

// ---------- codebase-wide regression guard ----------

describe('Codebase-wide getSession() regression guard', () => {
  test('no production source file calls authClient.getSession()', () => {
    const glob = require('glob');
    const projectRoot = path.resolve(__dirname, '../..');
    const sourceFiles: string[] = glob.sync('**/*.{ts,tsx}', {
      cwd: projectRoot,
      ignore: ['**/node_modules/**', '**/scripts/**', '**/__tests__/**', '**/app/__tests__/**'],
    });

    const violations: string[] = [];
    for (const file of sourceFiles) {
      const content = fs.readFileSync(path.resolve(projectRoot, file), 'utf-8');
      if (/authClient\.getSession\(\)/.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});

// ---------- NavigationInterceptor 401 tests ----------

describe('NavigationInterceptor must not call signOut on 401', () => {
  test('401 handler does not destroy session via signOut()', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/core/navigation/NavigationInterceptor.tsx'),
      'utf-8'
    );

    // Find the 401 handling block and check it does NOT contain signOut
    const lines = source.split('\n');
    let in401Block = false;
    let braceDepth = 0;
    let signOutIn401 = false;

    for (const line of lines) {
      if (line.includes('status === 401')) {
        in401Block = true;
        braceDepth = 0;
      }

      if (in401Block) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;

        if (line.includes('signOut(') && !line.trim().startsWith('//')) {
          signOutIn401 = true;
        }

        // Exited the 401 block
        if (braceDepth < 0 || line.includes('status === 429')) {
          break;
        }
      }
    }

    expect(signOutIn401).toBe(false);
  });
});
