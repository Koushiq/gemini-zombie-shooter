/**
 * @fileoverview Unit tests for the public/input.js file.
 * This file tests the input handling logic, including keyboard and mouse events.
 */

import { movement, setupInput, playerAngle } from '../public/input.js';

describe('Input Handler', () => {
  let gameCanvas;
  let socket;
  let getPlayer;
  let assetLoader;

  beforeEach(() => {
    // Mock DOM elements and functions
    gameCanvas = document.createElement('canvas');
    jest.spyOn(gameCanvas, 'addEventListener');
    jest.spyOn(gameCanvas, 'removeEventListener');

    socket = {
      emit: jest.fn(),
    };

    getPlayer = jest.fn(() => ({
      x: 100,
      y: 100,
      weapon: 'pistol',
      state: 'idle',
      angle: 0,
    }));

    assetLoader = {
      assets: {
        pistolSound: { play: jest.fn(), currentTime: 0 },
        machineGunSound: { play: jest.fn(), currentTime: 0 },
        emptyGunSound: { play: jest.fn(), currentTime: 0 },
        pistolReloadSound: { play: jest.fn(), currentTime: 0 },
        rifleReloadSound: { play: jest.fn(), currentTime: 0 },
      },
    };

    // Reset movement state before each test
    movement.up = false;
    movement.down = false;
    movement.left = false;
    movement.right = false;

    setupInput(gameCanvas, socket, getPlayer, assetLoader);
  });

  // Test case for keyboard movement (keydown)
  it('should update movement state on keydown (WASD)', () => {
    const keydownEventW = new KeyboardEvent('keydown', { key: 'w' });
    document.dispatchEvent(keydownEventW);
    expect(movement.up).toBe(true);

    const keydownEventA = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(keydownEventA);
    expect(movement.left).toBe(true);
  });

  // Test case for keyboard movement (keyup)
  it('should reset movement state on keyup (WASD)', () => {
    // Simulate keydown first
    const keydownEventW = new KeyboardEvent('keydown', { key: 'w' });
    document.dispatchEvent(keydownEventW);
    expect(movement.up).toBe(true);

    const keyupEventW = new KeyboardEvent('keyup', { key: 'w' });
    document.dispatchEvent(keyupEventW);
    expect(movement.up).toBe(false);
  });

  // Test case for player rotation on mousemove
  it('should emit playerRotation on mousemove', () => {
    const mousemoveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 200 });
    gameCanvas.dispatchEvent(mousemoveEvent);
    expect(socket.emit).toHaveBeenCalledWith('playerRotation', expect.any(Number));
  });

  // Test case for weapon switching
  it('should switch weapon and emit playerState on keydown (1 or 2)', () => {
    const keydownEvent1 = new KeyboardEvent('keydown', { key: '1' });
    document.dispatchEvent(keydownEvent1);
    expect(getPlayer().weapon).toBe('pistol');
    expect(socket.emit).toHaveBeenCalledWith('playerState', { state: 'idle', weapon: 'pistol' });

    const keydownEvent2 = new KeyboardEvent('keydown', { key: '2' });
    document.dispatchEvent(keydownEvent2);
    expect(getPlayer().weapon).toBe('rifle');
    expect(socket.emit).toHaveBeenCalledWith('playerState', { state: 'idle', weapon: 'rifle' });
  });

  // Test case for reload action
  it('should play reload sound and emit playerState on keydown (r)', () => {
    const keydownEventR = new KeyboardEvent('keydown', { key: 'r' });
    document.dispatchEvent(keydownEventR);

    expect(assetLoader.assets.pistolReloadSound.play).toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('playerState', { state: 'reload', weapon: 'pistol' });

    // Simulate timeout for idle state
    jest.runAllTimers();
    expect(socket.emit).toHaveBeenCalledWith('playerState', { state: 'idle', weapon: 'pistol' });
  });

  // Test case for shoot action
  it('should play shoot sound and emit shoot event on click', () => {
    const clickEvent = new MouseEvent('click');
    gameCanvas.dispatchEvent(clickEvent);

    expect(assetLoader.assets.pistolSound.play).toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('shoot', expect.any(Object));

    // Simulate timeout for idle state
    jest.runAllTimers();
    expect(socket.emit).toHaveBeenCalledWith('playerState', { state: 'idle', weapon: 'pistol' });
  });
});