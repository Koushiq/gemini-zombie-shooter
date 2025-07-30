/**
 * @fileoverview Unit tests for the public/network.js file.
 * This file tests the network communication logic, including socket event handling and lobby management.
 */

import { initNetwork } from '../public/network.js';

describe('Network', () => {
  let mockSocket;
  let mockLobbyList;
  let mockPlayerNameInput;
  let mockLobbyNameInput;
  let mockCallbacks;

  beforeEach(() => {
    // Mock the socket.io client
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
    };

    // Mock DOM elements
    mockLobbyList = {
      innerHTML: '',
      appendChild: jest.fn(),
    };
    mockPlayerNameInput = {
      value: 'testPlayer',
    };
    mockLobbyNameInput = {
      value: 'testLobby',
    };

    // Mock callback functions
    mockCallbacks = {
      lobbyCreated: jest.fn(),
      joinApproved: jest.fn(),
      updateLobby: jest.fn(),
      lobbyClosed: jest.fn(),
      playerDied: jest.fn(),
      gameStarted: jest.fn(),
      waveComplete: jest.fn(),
      gameOver: jest.fn(),
      pong: jest.fn(),
    };

    // Initialize network with mocks
    initNetwork(mockSocket, mockLobbyList, mockPlayerNameInput, mockLobbyNameInput, mockCallbacks);
  });

  // Test case for initial network setup
  it('should set up socket event listeners and request lobbies on initialization', () => {
    expect(mockSocket.on).toHaveBeenCalledWith('lobbies', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('lobbyCreated', mockCallbacks.lobbyCreated);
    expect(mockSocket.on).toHaveBeenCalledWith('joinRequest', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('joinApproved', mockCallbacks.joinApproved);
    expect(mockSocket.on).toHaveBeenCalledWith('updateLobby', mockCallbacks.updateLobby);
    expect(mockSocket.on).toHaveBeenCalledWith('lobbyClosed', mockCallbacks.lobbyClosed);
    expect(mockSocket.on).toHaveBeenCalledWith('playerDied', mockCallbacks.playerDied);
    expect(mockSocket.on).toHaveBeenCalledWith('gameStarted', mockCallbacks.gameStarted);
    expect(mockSocket.on).toHaveBeenCalledWith('waveComplete', mockCallbacks.waveComplete);
    expect(mockSocket.on).toHaveBeenCalledWith('gameOver', mockCallbacks.gameOver);
    expect(mockSocket.on).toHaveBeenCalledWith('pong', expect.any(Function));
    expect(mockSocket.emit).toHaveBeenCalledWith('requestLobbies');
  });

  // Test case for handling 'lobbies' event
  it('should render lobbies correctly when "lobbies" event is received', () => {
    const lobbiesData = {
      'lobby1': { id: 'lobby1', name: 'Lobby One', players: { 'player1': {} } },
      'lobby2': { id: 'lobby2', name: 'Lobby Two', players: { 'playerA': {}, 'playerB': {} } },
    };

    // Trigger the 'lobbies' event handler
    const lobbiesHandler = mockSocket.on.mock.calls.find(call => call[0] === 'lobbies')[1];
    lobbiesHandler(lobbiesData);

    expect(mockLobbyList.innerHTML).not.toBe('');
    expect(mockLobbyList.appendChild).toHaveBeenCalledTimes(2); // For two lobbies
    expect(mockLobbyList.appendChild.mock.calls[0][0].innerHTML).toContain('Lobby One - 1 players');
    expect(mockLobbyList.appendChild.mock.calls[1][0].innerHTML).toContain('Lobby Two - 2 players');
  });

  // Test case for handling 'joinRequest' event (auto-approval)
  it('should auto-approve join requests and emit 'approveJoin'', () => {
    const joinRequestData = { playerId: 'newPlayer', playerName: 'New Player', lobbyId: 'someLobby' };

    // Trigger the 'joinRequest' event handler
    const joinRequestHandler = mockSocket.on.mock.calls.find(call => call[0] === 'joinRequest')[1];
    joinRequestHandler(joinRequestData);

    expect(mockSocket.emit).toHaveBeenCalledWith('approveJoin', joinRequestData);
  });

  // Test case for handling 'pong' event
  it('should call pong callback with calculated ping on 'pong' event', () => {
    const startTime = Date.now() - 100; // Simulate 100ms ping

    // Trigger the 'pong' event handler
    const pongHandler = mockSocket.on.mock.calls.find(call => call[0] === 'pong')[1];
    pongHandler(startTime);

    expect(mockCallbacks.pong).toHaveBeenCalledWith(expect.any(Number));
    expect(mockCallbacks.pong.mock.calls[0][0]).toBeGreaterThanOrEqual(100); // Should be around 100ms
  });

  // Test case for ping interval
  it('should emit 'ping' event at regular intervals', () => {
    jest.useFakeTimers();
    // Clear previous calls from initialization
    mockSocket.emit.mockClear();

    // Fast-forward timers by 2 seconds (ping interval)
    jest.advanceTimersByTime(2000);
    expect(mockSocket.emit).toHaveBeenCalledWith('ping', expect.any(Number));

    jest.advanceTimersByTime(2000);
    expect(mockSocket.emit).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});