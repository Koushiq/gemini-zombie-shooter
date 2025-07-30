const gameLogic = require('../gameLogic');

describe('gameLogic', () => {
  it('should create a zombie with the correct properties', () => {
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const { createZombie } = gameLogic(logger);
    const lobbyId = 'test-lobby';
    const zombie = createZombie(lobbyId);

    expect(zombie).toHaveProperty('id');
    expect(zombie).toHaveProperty('x');
    expect(zombie).toHaveProperty('y');
    expect(zombie).toHaveProperty('health');
    expect(zombie.lobbyId).toBe(lobbyId);
  });
});
