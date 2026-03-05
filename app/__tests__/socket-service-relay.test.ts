/**
 * Socket Service Event Relay Tests
 *
 * Verifies that socket events from the server are properly relayed
 * through SocketService to internal listeners.
 *
 * BUG: achievement_revoked is emitted by the backend but never
 * registered as a relay handler in socket-service.ts, so internal
 * listeners never receive it.
 */

// ============================================================
// Mock setup (must be before imports)
// ============================================================

// Capture handlers registered on the raw socket.
// Uses plain functions (not jest.fn) to survive resetMocks: true in jest config.
const mockSocketHandlers: Record<string, Function> = {};

const mockSocket = {
  on: (event: string, handler: Function) => {
    mockSocketHandlers[event] = handler;
  },
  once: () => {},
  emit: () => {},
  disconnect: () => {},
  connected: false,
};

jest.mock('socket.io-client', () => ({
  io: () => mockSocket,
}));

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getCookie: () => 'better-auth.session_token=test123',
  },
}));

jest.mock('@/config/network', () => ({
  getBackendBaseURL: () => 'http://localhost:3000',
}));

// ============================================================
// Import AFTER mocks
// ============================================================

import { SocketService } from '@/lib/socket-service';

// ============================================================
// Tests
// ============================================================

describe('SocketService event relay', () => {
  let service: SocketService;

  beforeEach(async () => {
    // Clear captured handlers from previous test
    for (const key of Object.keys(mockSocketHandlers)) {
      delete mockSocketHandlers[key];
    }

    // Reset singleton socket state and reconnect
    service = SocketService.getInstance();
    service.disconnect();
    await service.connect();
  });

  test('relays achievement_revoked from server to internal listeners', () => {
    // Register an internal listener
    const callback = jest.fn();
    service.on('achievement_revoked', callback);

    // Simulate server emitting achievement_revoked
    const payload = {
      achievementId: 'ach-123',
      title: 'Match Streak',
      category: 'MATCH_STREAK',
    };
    mockSocketHandlers['achievement_revoked']?.(payload);

    // Internal listener should receive the data
    expect(callback).toHaveBeenCalledWith(payload);
  });

  test('relays achievement_unlocked from server to internal listeners', () => {
    // Control test: achievement_unlocked already works
    const callback = jest.fn();
    service.on('achievement_unlocked', callback);

    const payload = {
      achievementId: 'ach-456',
      title: 'First Win',
      description: 'Win your first match',
      icon: 'trophy',
      tier: 'NONE',
      category: 'WINNING',
      points: 5,
    };
    mockSocketHandlers['achievement_unlocked']?.(payload);

    expect(callback).toHaveBeenCalledWith(payload);
  });
});
