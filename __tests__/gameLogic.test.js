const gameLogic = require('../gameLogic');

describe('gameLogic', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const { createZombie, spawnWave, checkTreeCollision } = gameLogic(logger);

  beforeEach(() => {
    // Clear mock calls before each test
    logger.debug.mockClear();
    logger.info.mockClear();
    logger.warn.mockClear();
    logger.error.mockClear();
  });

  it('should create a zombie with the correct properties', () => {
    const lobbyId = 'test-lobby';
    const zombie = createZombie(lobbyId);

    expect(zombie).toHaveProperty('id');
    expect(zombie).toHaveProperty('x');
    expect(zombie).toHaveProperty('y');
    expect(zombie).toHaveProperty('health');
    expect(zombie.lobbyId).toBe(lobbyId);
    expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: 'Zombie created' }));
  });

  it('should spawn the correct number of zombies for a wave', () => {
    const lobby = {
      id: 'test-lobby',
      wave: 1,
      zombies: {},
      zombiesRemaining: 0,
    };
    spawnWave(lobby);

    expect(Object.keys(lobby.zombies).length).toBe(5); // ZOMBIES_PER_WAVE is 5
    expect(lobby.zombiesRemaining).toBe(5);
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: 'Spawning new wave' }));
  });

  it('should detect collision with a tree', () => {
    const playerX = 100;
    const playerY = 100;
    const playerSize = 50;
    const dirtPatches = [
      { x: 80, y: 80, width: 40, height: 40 }, // Tree within player bounds
    ];
    const collision = checkTreeCollision(playerX, playerY, playerSize, dirtPatches);
    expect(collision).toBe(true);
  });

  it('should not detect collision with a tree if far away', () => {
    const playerX = 100;
    const playerY = 100;
    const playerSize = 50;
    const dirtPatches = [
      { x: 500, y: 500, width: 40, height: 40 }, // Tree far away
    ];
    const collision = checkTreeCollision(playerX, playerY, playerSize, dirtPatches);
    expect(collision).toBe(false);
  });
});