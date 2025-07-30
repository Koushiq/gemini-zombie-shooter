/**
 * @fileoverview Unit tests for the server-side constants.js file.
 * This file ensures that all game constants are correctly defined and exported.
 */

const constants = require('../constants');

describe('Server-side Constants', () => {
  // Test case for PLAYER_SPEED constant
  it('should define PLAYER_SPEED', () => {
    expect(constants.PLAYER_SPEED).toBeDefined();
    expect(typeof constants.PLAYER_SPEED).toBe('number');
    expect(constants.PLAYER_SPEED).toBe(3); // Assuming default value is 3
  });

  // Test case for BULLET_SPEED constant
  it('should define BULLET_SPEED', () => {
    expect(constants.BULLET_SPEED).toBeDefined();
    expect(typeof constants.BULLET_SPEED).toBe('number');
    expect(constants.BULLET_SPEED).toBe(10); // Assuming default value is 10
  });

  // Test case for PLAYER_HEALTH constant
  it('should define PLAYER_HEALTH', () => {
    expect(constants.PLAYER_HEALTH).toBeDefined();
    expect(typeof constants.PLAYER_HEALTH).toBe('number');
    expect(constants.PLAYER_HEALTH).toBe(100); // Assuming default value is 100
  });

  // Test case for ZOMBIE_HEALTH constant
  it('should define ZOMBIE_HEALTH', () => {
    expect(constants.ZOMBIE_HEALTH).toBeDefined();
    expect(typeof constants.ZOMBIE_HEALTH).toBe('number');
    expect(constants.ZOMBIE_HEALTH).toBe(100); // Assuming default value is 100
  });

  // Test case for ZOMBIE_DAMAGE constant
  it('should define ZOMBIE_DAMAGE', () => {
    expect(constants.ZOMBIE_DAMAGE).toBeDefined();
    expect(typeof constants.ZOMBIE_DAMAGE).toBe('number');
    expect(constants.ZOMBIE_DAMAGE).toBe(1); // Assuming default value is 1
  });

  // Test case for BULLET_DAMAGE constant
  it('should define BULLET_DAMAGE', () => {
    expect(constants.BULLET_DAMAGE).toBeDefined();
    expect(typeof constants.BULLET_DAMAGE).toBe('number');
    expect(constants.BULLET_DAMAGE).toBe(20); // Assuming default value is 20
  });

  // Test case for ZOMBIES_PER_WAVE constant
  it('should define ZOMBIES_PER_WAVE', () => {
    expect(constants.ZOMBIES_PER_WAVE).toBeDefined();
    expect(typeof constants.ZOMBIES_PER_WAVE).toBe('number');
    expect(constants.ZOMBIES_PER_WAVE).toBe(5); // Assuming default value is 5
  });

  // Test case for GAME_TICK constant
  it('should define GAME_TICK', () => {
    expect(constants.GAME_TICK).toBeDefined();
    expect(typeof constants.GAME_TICK).toBe('number');
    expect(constants.GAME_TICK).toBe(1000 / 60); // Assuming default value is 1000/60
  });

  // Test case for MAP_WIDTH constant
  it('should define MAP_WIDTH', () => {
    expect(constants.MAP_WIDTH).toBeDefined();
    expect(typeof constants.MAP_WIDTH).toBe('number');
    expect(constants.MAP_WIDTH).toBe(800); // Assuming default value is 800
  });

  // Test case for MAP_HEIGHT constant
  it('should define MAP_HEIGHT', () => {
    expect(constants.MAP_HEIGHT).toBeDefined();
    expect(typeof constants.MAP_HEIGHT).toBe('number');
    expect(constants.MAP_HEIGHT).toBe(600); // Assuming default value is 600
  });
});