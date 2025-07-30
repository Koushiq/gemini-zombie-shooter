/**
 * @fileoverview Unit tests for the public/rendering.js file.
 * This file tests the game rendering logic, including drawing players, zombies, and bullets.
 */

import { drawGame, dirtPatches } from '../public/rendering.js';
import { ASSETS_TO_LOAD } from '../public/constants.js';

describe('Rendering', () => {
  let mockCtx;
  let mockAssetLoader;
  let mockPlayerHealthDiv;
  let mockPingDiv;
  let mockWaveInfoDiv;

  beforeEach(() => {
    // Mock CanvasRenderingContext2D
    mockCtx = {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      fillStyle: '',
      font: '',
      fillText: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      fillRect: jest.fn(),
      canvas: { width: 800, height: 600 },
      globalAlpha: 1.0,
    };

    // Mock assetLoader
    mockAssetLoader = {
      assets: {
        grass: { width: 800, height: 600 },
        dirt: { width: 100, height: 100 },
        tree0: { width: 50, height: 50 },
        tree1: { width: 50, height: 50 },
        tree2: { width: 50, height: 50 },
        tree3: { width: 50, height: 50 },
        playerIdlePistol_0: { width: 50, height: 50 },
        playerShootPistol_0: { width: 50, height: 50 },
        playerReloadPistol_0: { width: 50, height: 50 },
        playerIdleRifle_0: { width: 50, height: 50 },
        playerShootRifle_0: { width: 50, height: 50 },
        playerReloadRifle_0: { width: 50, height: 50 },
        zombieWalk_0: { width: 50, height: 50 },
        zombieAttack_0: { width: 50, height: 50 },
      },
    };

    // Mock DOM elements for displaying info
    mockPlayerHealthDiv = { textContent: '' };
    mockPingDiv = { textContent: '' };
    mockWaveInfoDiv = { textContent: '' };
  });

  // Test case for drawing an empty game state
  it('should clear canvas and draw grass background even with no lobby', () => {
    drawGame(mockCtx, null, 'socketId', mockAssetLoader, mockPlayerHealthDiv, mockPingDiv, mockWaveInfoDiv, 0);
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, mockCtx.canvas.width, mockCtx.canvas.height);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockAssetLoader.assets.grass, 0, 0, mockCtx.canvas.width, mockCtx.canvas.height);
  });

  // Test case for drawing players
  it('should draw players with correct images and positions', () => {
    const currentLobby = {
      players: {
        'player1': { id: 'player1', x: 100, y: 100, angle: 0, health: 100, name: 'TestPlayer', state: 'idle', weapon: 'pistol', animationFrame: 0 },
      },
      zombies: {},
      bullets: [],
      wave: 1,
    };
    drawGame(mockCtx, currentLobby, 'player1', mockAssetLoader, mockPlayerHealthDiv, mockPingDiv, mockWaveInfoDiv, 50);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.translate).toHaveBeenCalledWith(100 + 25, 100 + 25); // Player center
    expect(mockCtx.rotate).toHaveBeenCalledWith(0);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockAssetLoader.assets.playerIdlePistol_0, -25, -25);
    expect(mockCtx.restore).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalledWith('TestPlayer', 100, 90);
    expect(mockCtx.fillRect).toHaveBeenCalled(); // For health bar
  });

  // Test case for drawing zombies
  it('should draw zombies with correct images and health bars', () => {
    const currentLobby = {
      players: {},
      zombies: {
        'zombie1': { id: 'zombie1', x: 200, y: 200, health: 75, state: 'walk', animationFrame: 0 },
      },
      bullets: [],
      wave: 1,
    };
    drawGame(mockCtx, currentLobby, 'socketId', mockAssetLoader, mockPlayerHealthDiv, mockPingDiv, mockWaveInfoDiv, 50);

    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockAssetLoader.assets.zombieWalk_0, 200, 200);
    expect(mockCtx.fillRect).toHaveBeenCalled(); // For health bar
  });

  // Test case for drawing bullets
  it('should draw bullets as circles', () => {
    const currentLobby = {
      players: {},
      zombies: {},
      bullets: [
        { x: 300, y: 300 },
      ],
      wave: 1,
    };
    drawGame(mockCtx, currentLobby, 'socketId', mockAssetLoader, mockPlayerHealthDiv, mockPingDiv, mockWaveInfoDiv, 50);

    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalledWith(300, 300, 5, 0, 2 * Math.PI);
    expect(mockCtx.fill).toHaveBeenCalled();
  });

  // Test case for updating UI elements
  it('should update player health, ping, and wave info divs', () => {
    const currentLobby = {
      players: {
        'player1': { id: 'player1', x: 0, y: 0, health: 80, name: 'TestPlayer', state: 'idle', weapon: 'pistol', animationFrame: 0 },
      },
      zombies: {},
      bullets: [],
      wave: 5,
    };
    drawGame(mockCtx, currentLobby, 'player1', mockAssetLoader, mockPlayerHealthDiv, mockPingDiv, mockWaveInfoDiv, 25);

    expect(mockPlayerHealthDiv.textContent).toBe('Health: 80');
    expect(mockPingDiv.textContent).toBe('Ping: 25ms');
    expect(mockWaveInfoDiv.textContent).toBe('Wave: 5 / Zombies: 0');
  });

  // Test case for drawing dirt patches and trees
  it('should draw dirt patches and trees', () => {
    const currentLobby = {
      players: {},
      zombies: {},
      bullets: [],
      wave: 1,
    };
    drawGame(mockCtx, currentLobby, 'socketId', mockAssetLoader, mockPlayerHealthDiv, mockPingDiv, mockWaveInfoDiv, 0);

    // Expect drawImage to be called for dirt patches and trees
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockAssetLoader.assets.dirt, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number));
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockAssetLoader.assets.tree0, expect.any(Number), expect.any(Number));
  });
});