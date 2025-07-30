/**
 * @fileoverview Integration tests for the server.js file.
 * This file tests the server's core functionalities, including lobby management, player interactions, and game state updates.
 */

const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const winston = require('winston');

// Mock gameLogic to isolate server tests
jest.mock('../gameLogic', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return jest.fn(() => ({
    createZombie: jest.fn((lobbyId) => ({ id: `zombie-${Date.now()}`, lobbyId, x: 0, y: 0, health: 100 })),
    spawnWave: jest.fn((lobby) => {
      lobby.zombiesRemaining = 5; // Mock 5 zombies per wave
      for (let i = 0; i < 5; i++) {
        const zombie = { id: `zombie-${i}`, health: 100 };
        lobby.zombies[zombie.id] = zombie;
      }
    }),
    updateGame: jest.fn((lobby) => {
      // Mock game update logic
      if (Object.keys(lobby.players).length === 0) return 'lose';
      if (lobby.zombiesRemaining === 0 && Object.keys(lobby.zombies).length === 0) {
        lobby.wave++;
        return 'waveComplete';
      }
      return null;
    }),
    checkTreeCollision: jest.fn(() => false), // Always no collision for tests
  }));
});

// Mock constants
jest.mock('../constants', () => ({
  GAME_TICK: 10, // Faster tick for tests
  PLAYER_SPEED: 3,
  MAP_WIDTH: 800,
  MAP_HEIGHT: 600,
  PLAYER_IDLE_FRAME_COUNT: 1,
  PLAYER_RELOAD_PISTOL_FRAME_COUNT: 1,
  PLAYER_RELOAD_RIFLE_FRAME_COUNT: 1,
  PLAYER_SHOOT_FRAME_COUNT: 1,
  ZOMBIE_WALK_FRAME_COUNT: 1,
}));

describe('Server', () => {
  let io, serverSocket, clientSocket;
  let httpServer;
  let addr;

  beforeAll((done) => {
    // Import server.js after mocks are set up
    const app = require('../server');
    httpServer = http.createServer(app);
    io = new Server(httpServer);
    httpServer.listen(() => {
      addr = httpServer.address();
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach((done) => {
    // Connect a new client for each test
    clientSocket = new Client(`http://localhost:${addr.port}`);
    io.on('connection', (socket) => {
      serverSocket = socket;
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.close();
  });

  // Test case for client connection
  it('should handle a new client connection', (done) => {
    expect(serverSocket).toBeDefined();
    done();
  });

  // Test case for lobby creation
  it('should create a new lobby', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'TestLobby', playerName: 'HostPlayer' });
    clientSocket.on('lobbyCreated', (data) => {
      expect(data.lobby).toBeDefined();
      expect(data.lobby.name).toBe('TestLobby');
      expect(data.lobby.players[clientSocket.id]).toBeDefined();
      done();
    });
  });

  // Test case for joining a lobby
  it('should allow a player to join an existing lobby', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'JoinableLobby', playerName: 'HostPlayer' });
    clientSocket.on('lobbyCreated', (hostData) => {
      const hostLobbyId = hostData.lobby.id;
      const client2 = new Client(`http://localhost:${addr.port}`);
      client2.on('connect', () => {
        client2.emit('joinLobby', { lobbyId: hostLobbyId, playerName: 'JoiningPlayer' });
        serverSocket.on('joinRequest', ({ playerId, playerName, lobbyId }) => {
          io.to(hostLobbyId).emit('approveJoin', { playerId, lobbyId, playerName });
        });
        client2.on('joinApproved', (data) => {
          expect(data.lobby.players[client2.id]).toBeDefined();
          client2.close();
          done();
        });
      });
    });
  });

  // Test case for player movement
  it('should update player position on playerMovement event', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'MoveLobby', playerName: 'MovingPlayer' });
    clientSocket.on('lobbyCreated', (data) => {
      const lobbyId = data.lobby.id;
      clientSocket.emit('playerMovement', { up: true, down: false, left: false, right: false });
      io.to(lobbyId).emit('updateLobby', data.lobby); // Manually trigger update for test
      clientSocket.on('updateLobby', (updatedLobby) => {
        expect(updatedLobby.players[clientSocket.id].y).toBeLessThan(data.lobby.players[clientSocket.id].y); // Y should decrease for 'up'
        done();
      });
    });
  });

  // Test case for player rotation
  it('should update player angle on playerRotation event', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'RotateLobby', playerName: 'RotatingPlayer' });
    clientSocket.on('lobbyCreated', (data) => {
      const lobbyId = data.lobby.id;
      const newAngle = Math.PI / 2;
      clientSocket.emit('playerRotation', newAngle);
      io.to(lobbyId).emit('updateLobby', data.lobby); // Manually trigger update for test
      clientSocket.on('updateLobby', (updatedLobby) => {
        expect(updatedLobby.players[clientSocket.id].angle).toBe(newAngle);
        done();
      });
    });
  });

  // Test case for player state change
  it('should update player state and weapon on playerState event', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'StateLobby', playerName: 'StatePlayer' });
    clientSocket.on('lobbyCreated', (data) => {
      const lobbyId = data.lobby.id;
      clientSocket.emit('playerState', { state: 'shoot', weapon: 'rifle' });
      io.to(lobbyId).emit('updateLobby', data.lobby); // Manually trigger update for test
      clientSocket.on('updateLobby', (updatedLobby) => {
        expect(updatedLobby.players[clientSocket.id].state).toBe('shoot');
        expect(updatedLobby.players[clientSocket.id].weapon).toBe('rifle');
        expect(updatedLobby.players[clientSocket.id].animationFrame).toBe(0); // Should reset
        done();
      });
    });
  });

  // Test case for shoot event
  it('should add a bullet to the lobby on shoot event', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'ShootLobby', playerName: 'ShootingPlayer' });
    clientSocket.on('lobbyCreated', (data) => {
      const lobbyId = data.lobby.id;
      const bulletData = { x: 10, y: 10, speedX: 1, speedY: 1 };
      clientSocket.emit('shoot', bulletData);
      io.to(lobbyId).emit('updateLobby', data.lobby); // Manually trigger update for test
      clientSocket.on('updateLobby', (updatedLobby) => {
        expect(updatedLobby.bullets.length).toBe(1);
        expect(updatedLobby.bullets[0].ownerId).toBe(clientSocket.id);
        done();
      });
    });
  });

  // Test case for game start
  it('should start the game and spawn zombies', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'StartGameLobby', playerName: 'AdminPlayer' });
    clientSocket.on('lobbyCreated', (data) => {
      const lobbyId = data.lobby.id;
      clientSocket.emit('startGame', lobbyId);
      clientSocket.on('gameStarted', (startedLobby) => {
        expect(startedLobby.gameStarted).toBe(true);
        expect(startedLobby.wave).toBe(1);
        expect(Object.keys(startedLobby.zombies).length).toBeGreaterThan(0);
        done();
      });
    });
  });

  // Test case for player disconnect
  it('should remove player from lobby on disconnect', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'DisconnectLobby', playerName: 'DisconnectingPlayer' });
    clientSocket.on('lobbyCreated', (data) => {
      const lobbyId = data.lobby.id;
      clientSocket.disconnect();
      // Wait for server to process disconnect
      setTimeout(() => {
        io.to(lobbyId).emit('updateLobby', data.lobby); // Manually trigger update
        clientSocket.on('updateLobby', (updatedLobby) => {
          expect(updatedLobby.players[clientSocket.id]).toBeUndefined();
          done();
        });
      }, 100);
    });
  });

  // Test case for admin disconnect (lobby closed)
  it('should close lobby if admin disconnects', (done) => {
    clientSocket.emit('createLobby', { lobbyName: 'AdminDisconnectLobby', playerName: 'AdminPlayer' });
    clientSocket.on('lobbyCreated', (data) => {
      const lobbyId = data.lobby.id;
      clientSocket.disconnect();
      // Wait for server to process disconnect
      setTimeout(() => {
        // Check if lobby is deleted on server side
        expect(io.sockets.adapter.rooms.get(lobbyId)).toBeUndefined();
        done();
      }, 100);
    });
  });
});