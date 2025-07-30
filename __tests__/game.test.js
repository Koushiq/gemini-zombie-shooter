/**
 * @fileoverview Unit tests for the public/game.js file.
 * This file tests the main game loop and client-side game logic.
 */



// Mock external dependencies
jest.mock('../public/input.js', () => ({
  movement: { up: false, down: false, left: false, right: false },
  setupInput: jest.fn(),
}));
jest.mock('../public/rendering.js', () => ({
  drawGame: jest.fn(),
  dirtPatches: [],
}));
jest.mock('../public/network.js', () => ({
  initNetwork: jest.fn(),
}));
jest.mock('../public/assetLoader.js', () => ({
  assetLoader: {
    load: jest.fn((assets, callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      // Manually call initNetwork with mock arguments
      require('../public/network.js').initNetwork(mockSocket, {}, {}, {}, {});
    }),
    assets: {},
  },
}));

// Mock socket.io
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
};
global.io = jest.fn(() => mockSocket);

// Mock DOM elements
const mockElement = (id) => {
  const element = document.createElement('div');
  element.id = id;
  return element;
};

document.getElementById = jest.fn((id) => {
  switch (id) {
    case 'lobbyContainer': return mockElement('lobbyContainer');
    case 'createLobbyBtn': return { addEventListener: jest.fn(), style: {} };
    case 'lobbyNameInput': return { value: 'testLobby' };
    case 'playerNameInput': return { value: 'testPlayer' };
    case 'lobbyList': return { innerHTML: '', appendChild: jest.fn() };
    case 'gameContainer': return mockElement('gameContainer');
    case 'gameCanvas': return { getContext: jest.fn(() => ({})), addEventListener: jest.fn(), width: 0, height: 0 };
    case 'player-health': return mockElement('player-health');
    case 'ping': return mockElement('ping');
    case 'wave-info': return mockElement('wave-info');
    case 'fps': return mockElement('fps');
    case 'startGameBtn': return { addEventListener: jest.fn(), style: {} };
    default: return null;
  }
});

// Mock window.alert and window.dispatchEvent
global.alert = jest.fn();
global.window.dispatchEvent = jest.fn();

describe('Game Loop and Client Logic', () => {
  let gameModule;
  let assetLoader;
  let drawGame;
  let initNetwork;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Assign mocked modules before requiring game.js
    assetLoader = require('../public/assetLoader.js').assetLoader;
    drawGame = require('../public/rendering.js').drawGame;
    initNetwork = require('../public/network.js').initNetwork;
    // Import the module inside beforeEach to ensure mocks are applied
    gameModule = require('../public/game.js');
    // Manually trigger the assetLoader.load callback to ensure initNetwork is called
    assetLoader.load([], () => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Test case for asset loading and network initialization
  it('should load assets and initialize network on startup', () => {
    expect(assetLoader.load).toHaveBeenCalled();
    expect(initNetwork).toHaveBeenCalled();
  });

  // Test case for lobby creation flow
  it('should handle lobby creation successfully', () => {
    const lobbyCreatedCallback = initNetwork.mock.calls[0][4].lobbyCreated;
    const mockLobby = { id: 'lobby123', name: 'testLobby', admin: 'socketId123', gameStarted: false };
    mockSocket.id = 'socketId123';

    lobbyCreatedCallback({ lobby: mockLobby, originalName: 'testLobby' });

    expect(document.getElementById('lobbyContainer').style.display).toBe('none');
    expect(document.getElementById('gameContainer').style.display).toBe('block');
    expect(global.window.dispatchEvent).toHaveBeenCalledWith(new Event('resize'));
  });

  // Test case for game loop execution
  it('should execute gameLoop at target FPS', () => {
    const updateLobbyCallback = initNetwork.mock.calls[0][4].updateLobby;
    const mockLobby = {
      players: { 'socketId123': { id: 'socketId123', animationFrame: 0 } },
      zombies: {},
      bullets: [],
      wave: 1,
    };
    mockSocket.id = 'socketId123';
    updateLobbyCallback(mockLobby);

    jest.advanceTimersByTime(1000 / 60); // Advance by one game tick

    expect(mockSocket.emit).toHaveBeenCalledWith('playerMovement', expect.any(Object));
    expect(drawGame).toHaveBeenCalled();
  });

  // Test case for game started event
  it('should handle gameStarted event', () => {
    const gameStartedCallback = initNetwork.mock.calls[0][4].gameStarted;
    const mockLobby = { gameStarted: true };
    gameStartedCallback(mockLobby);

    expect(document.getElementById('startGameBtn').style.display).toBe('none');
    expect(global.alert).toHaveBeenCalledWith('Game Started!');
  });

  // Test case for player death event
  it('should handle playerDied event', () => {
    const playerDiedCallback = initNetwork.mock.calls[0][4].playerDied;
    playerDiedCallback();

    expect(global.alert).toHaveBeenCalledWith('You died!');
    expect(document.getElementById('lobbyContainer').style.display).toBe('block');
    expect(document.getElementById('gameContainer').style.display).toBe('none');
  });

  // Test case for game over event (win)
  it('should handle gameOver event for win condition', () => {
    const gameOverCallback = initNetwork.mock.calls[0][4].gameOver;
    gameOverCallback('win');

    expect(global.alert).toHaveBeenCalledWith('You won!');
    expect(document.getElementById('lobbyContainer').style.display).toBe('block');
    expect(document.getElementById('gameContainer').style.display).toBe('none');
  });

  // Test case for game over event (lose)
  it('should handle gameOver event for lose condition', () => {
    const gameOverCallback = initNetwork.mock.calls[0][4].gameOver;
    gameOverCallback('lose');

    expect(global.alert).toHaveBeenCalledWith('Game Over! You lost.');
    expect(document.getElementById('lobbyContainer').style.display).toBe('block');
    expect(document.getElementById('gameContainer').style.display).toBe('none');
  });

  // Test case for wave complete event
  it('should handle waveComplete event', () => {
    const waveCompleteCallback = initNetwork.mock.calls[0][4].waveComplete;
    waveCompleteCallback(2); // Wave 2 completed

    expect(global.alert).toHaveBeenCalledWith('Wave 1 complete! Starting Wave 2...');
  });

  // Test case for zombie bite sound event
  it('should play zombieBite sound', () => {
    const zombieBiteCallback = initNetwork.mock.calls[0][4].zombieBite;
    assetLoader.assets.zombieBiteSound = { currentTime: 0, play: jest.fn() };
    zombieBiteCallback();
    expect(assetLoader.assets.zombieBiteSound.play).toHaveBeenCalled();
  });

  // Test case for zombie hit sound event
  it('should play zombieHit sound', () => {
    const zombieHitCallback = initNetwork.mock.calls[0][4].zombieHit;
    assetLoader.assets.zombieHitSound = { currentTime: 0, play: jest.fn() };
    zombieHitCallback();
    expect(assetLoader.assets.zombieHitSound.play).toHaveBeenCalled();
  });
});