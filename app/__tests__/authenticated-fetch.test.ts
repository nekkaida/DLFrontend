jest.mock('@/lib/auth-client', () => ({
  authClient: { getCookie: jest.fn() },
}));

jest.mock('@/config/network', () => ({
  getBackendBaseURL: () => 'http://test:82',
  logNetworkConfig: jest.fn(),
}));

import { authClient } from '@/lib/auth-client';
import { authenticatedFetch } from '@/lib/authenticated-fetch';

const mockGetCookie = authClient.getCookie as jest.Mock;

beforeEach(() => {
  mockGetCookie.mockReset();
  (global.fetch as jest.Mock).mockClear();
});

describe('authenticatedFetch', () => {
  test('adds Cookie header with leading "; " stripped', async () => {
    mockGetCookie.mockReturnValue('; better-auth.session_token=abc123');

    await authenticatedFetch('/api/test');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://test:82/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: 'better-auth.session_token=abc123',
        }),
      })
    );
  });

  test('warns when no cookie present', async () => {
    mockGetCookie.mockReturnValue('');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    await authenticatedFetch('/api/test');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No session cookie')
    );
    warnSpy.mockRestore();
  });

  test('preserves existing headers alongside Cookie', async () => {
    mockGetCookie.mockReturnValue('; token=xyz');

    await authenticatedFetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://test:82/api/upload',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Cookie: 'token=xyz',
        }),
      })
    );
  });

  test('passes through non-header options (body, cache, etc.)', async () => {
    mockGetCookie.mockReturnValue('; token=xyz');

    await authenticatedFetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      cache: 'no-cache',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://test:82/api/data',
      expect.objectContaining({
        method: 'POST',
        body: '{"key":"value"}',
        cache: 'no-cache',
      })
    );
  });

  test('does not set Cookie header when getCookie returns empty', async () => {
    mockGetCookie.mockReturnValue('');
    jest.spyOn(console, 'warn').mockImplementation();

    await authenticatedFetch('/api/test');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].headers.Cookie).toBeUndefined();

    (console.warn as jest.Mock).mockRestore();
  });
});
