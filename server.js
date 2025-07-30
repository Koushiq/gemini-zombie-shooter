const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const winston = require('winston');
const { GAME_TICK, PLAYER_SPEED, MAP_WIDTH, MAP_HEIGHT, PLAYER_IDLE_FRAME_COUNT, PLAYER_RELOAD_PISTOL_FRAME_COUNT, PLAYER_RELOAD_RIFLE_FRAME_COUNT, PLAYER_SHOOT_FRAME_COUNT, ZOMBIE_WALK_FRAME_COUNT } = require('./constants');

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'app.log' })
    ]
});

// If not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const { createZombie, spawnWave, updateGame, checkTreeCollision } = require('./gameLogic')(logger);

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname + '/public'));

let lobbies = {};

io.on('connection', (socket) => {
    logger.info({ message: 'A user connected', sessionId: socket.id });

    

    socket.on('requestLobbies', () => {
        socket.emit('lobbies', lobbies);
        logger.debug({ message: 'Sent lobbies list to requesting client', sessionId: socket.id });
    });

    socket.on('initGameData', ({ dirtPatches }) => {
        // Assuming the client sends this data once they are in a lobby
        // We need to associate this data with the correct lobby.
        // For simplicity, let's assume the client sends this after joining/creating a lobby.
        // A more robust solution might involve sending this data with the createLobby/joinLobby event.
        let playerLobbyId = null;
        for (const lobbyId in lobbies) {
            if (lobbies[lobbyId].players[socket.id]) {
                playerLobbyId = lobbyId;
                break;
            }
        }
        if (playerLobbyId) {
            lobbies[playerLobbyId].dirtPatches = dirtPatches;
            logger.info({ message: 'Received initGameData for lobby', lobbyId: playerLobbyId });
        } else {
            logger.warn({ message: 'Received initGameData from client not in a lobby', sessionId: socket.id });
        }
    });

    socket.on('createLobby', ({ lobbyName, playerName }) => {
        logger.info({ message: 'Server received createLobby event', sessionId: socket.id, lobbyName, playerName });
        if (!lobbyName || !playerName) {
            logger.warn({ message: 'Attempt to create lobby with missing name or player name', sessionId: socket.id, lobbyName, playerName });
            socket.emit('createLobbyError', 'Lobby name and player name are required.');
            logger.info({ message: 'Server: Emitting createLobbyError.', sessionId: socket.id });
            return;
        }

        let uniqueLobbyName = lobbyName;
        let postfix = 1;
        while (Object.values(lobbies).some(l => l.name === uniqueLobbyName)) {
            uniqueLobbyName = `${lobbyName}_${postfix}`;
            postfix++;
        }

        const lobbyId = socket.id; // Admin's socket ID is the lobby ID
        lobbies[lobbyId] = {
            id: lobbyId,
            name: uniqueLobbyName,
            players: {},
            zombies: {},
            bullets: [],
            admin: socket.id,
            wave: 0,
            zombiesRemaining: 0,
            gameStarted: false,
            events: [],
            dirtPatches: []
        };
        const newPlayer = {
            id: socket.id,
            name: playerName,
            x: 0,
            y: 0,
            health: 100,
            angle: 0, // Initial angle
            state: 'idle',
            weapon: 'pistol',
            animationFrame: 0,
            width: 50, // Default player width
            height: 50 // Default player height
        };
        logger.debug({ message: 'New player created in createLobby', player: newPlayer });
        assignRandomCoordinates(newPlayer, lobbies[lobbyId].players);
        lobbies[lobbyId].players[socket.id] = newPlayer;
        socket.join(lobbyId);
        io.emit('lobbies', lobbies);
        logger.info({ message: 'Server: Emitting lobbyCreated event for lobby', lobbyName: lobbies[lobbyId].name, sessionId: socket.id });
        socket.emit('lobbyCreated', { lobby: lobbies[lobbyId], originalName: lobbyName });
        logger.info({ message: 'Lobby created successfully', sessionId: socket.id, lobbyId, uniqueLobbyName, playerName });
    });

    function assignRandomCoordinates(player, existingPlayers) {
        const PLAYER_SIZE = 50; // Assuming a player size for collision detection
        let newX, newY, collision;
        do {
            newX = Math.random() * (MAP_WIDTH - PLAYER_SIZE);
            newY = Math.random() * (MAP_HEIGHT - PLAYER_SIZE);
            collision = false;
            for (const playerId in existingPlayers) {
                const existingPlayer = existingPlayers[playerId];
                if (checkCollision(newX, newY, PLAYER_SIZE, existingPlayer.x, existingPlayer.y, PLAYER_SIZE)) {
                    collision = true;
                    break;
                }
            }
        } while (collision);
        player.x = newX;
        player.y = newY;
    }

    function checkCollision(x1, y1, size1, x2, y2, size2) {
        return x1 < x2 + size2 &&
               x1 + size1 > x2 &&
               y1 < y2 + size2 &&
               y1 + size1 > y2;
    }

    socket.on('startGame', (lobbyId) => {
        logger.info({ message: 'Server received startGame event', sessionId: socket.id, lobbyId });
        const lobby = lobbies[lobbyId];
        if (!lobby) {
            logger.warn({ message: 'Attempt to start game for non-existent lobby', sessionId: socket.id, lobbyId });
            return;
        }
        if (lobby.admin !== socket.id) {
            logger.warn({ message: 'Unauthorized attempt to start game', sessionId: socket.id, lobbyId, requestedBy: socket.id, adminId: lobby.admin });
            return;
        }
        if (lobby.gameStarted) {
            logger.warn({ message: 'Attempt to start already started game', sessionId: socket.id, lobbyId });
            return;
        }

        lobby.gameStarted = true;
        lobby.wave = 1;
        spawnWave(lobby);
        io.to(lobbyId).emit('gameStarted', lobby);
        logger.info({ message: 'Game started', sessionId: socket.id, lobbyId, initialWave: lobby.wave });
    });

    socket.on('joinLobby', ({ lobbyId, playerName }) => {
        logger.info({ message: 'Server received joinLobby event', sessionId: socket.id, lobbyId, playerName });
        const lobby = lobbies[lobbyId];
        if (!lobby) {
            logger.warn({ message: 'Attempt to join non-existent lobby', sessionId: socket.id, lobbyId, playerName });
            socket.emit('joinLobbyError', 'Lobby does not exist.');
            return;
        }
        if (Object.values(lobby.players).some(p => p.name === playerName)) {
            logger.warn({ message: 'Attempt to join lobby with duplicate player name', sessionId: socket.id, lobbyId, playerName });
            socket.emit('joinLobbyError', 'Player name already taken in this lobby.');
            return;
        }

        io.to(lobby.admin).emit('joinRequest', {playerId: socket.id, playerName, lobbyId: lobbyId});
        logger.info({ message: 'Join request sent to lobby admin', sessionId: socket.id, lobbyId, playerName });
    });

    socket.on('approveJoin', ({playerId, lobbyId, playerName}) => {
        logger.info({ message: 'Server received approveJoin event', sessionId: socket.id, playerId, lobbyId, playerName });
        const lobby = lobbies[lobbyId];
        if (!lobby) {
            logger.warn({ message: 'Attempt to approve join for non-existent lobby', sessionId: socket.id, playerId, lobbyId, playerName });
            return;
        }
        if (lobby.admin !== socket.id) {
            logger.warn({ message: 'Unauthorized attempt to approve join', sessionId: socket.id, playerId, lobbyId, requestedBy: socket.id, adminId: lobby.admin });
            return;
        }

        const playerSocket = io.sockets.sockets.get(playerId);
        if (!playerSocket) {
            logger.warn({ message: 'Attempt to approve join for disconnected player', sessionId: socket.id, playerId, lobbyId });
            return;
        }

        let uniqueName = playerName;
        let postfix = 1;
        while (Object.values(lobby.players).some(p => p.name === uniqueName)) {
            uniqueName = `${playerName}_${postfix}`;
            postfix++;
        }

        playerSocket.join(lobbyId);
        const newPlayer = {
            id: playerId,
            name: uniqueName,
            x: 0,
            y: 0,
            health: 100,
            angle: 0, // Initial angle
            state: 'idle',
            weapon: 'pistol',
            animationFrame: 0,
            width: 50, // Default player width
            height: 50 // Default player height
        };
        logger.debug({ message: 'New player created in approveJoin', player: newPlayer });
        assignRandomCoordinates(newPlayer, lobbies[lobbyId].players);
        lobbies[lobbyId].players[playerId] = newPlayer;
        io.to(playerId).emit('joinApproved', { lobby, playerName: uniqueName });
        io.to(lobbyId).emit('updateLobby', lobbies[lobbyId]);
        io.emit('lobbies', lobbies);
        logger.info({ message: 'Player join approved', sessionId: socket.id, playerId, lobbyId, uniqueName });
    });

    socket.on('playerRotation', (angle) => {
        let playerLobbyId = null;
        for (const lobbyId in lobbies) {
            if (lobbies[lobbyId].players[socket.id]) {
                playerLobbyId = lobbyId;
                break;
            }
        }
        if (playerLobbyId) {
            const player = lobbies[playerLobbyId].players[socket.id];
            if (player) {
                player.angle = angle;
                logger.debug({ message: 'Player rotation updated', sessionId: socket.id, lobbyId: playerLobbyId, angle });
            }
        }
    });

    socket.on('playerMovement', (movement) => {
        let playerLobbyId = null;
        for (const lobbyId in lobbies) {
            if (lobbies[lobbyId].players[socket.id]) {
                playerLobbyId = lobbyId;
                break;
            }
        }

        if (playerLobbyId) {
            const lobby = lobbies[playerLobbyId];
            const player = lobby.players[socket.id];
            if (player) {
                const oldX = player.x;
                const oldY = player.y;

                let newX = player.x;
                let newY = player.y;

                if (movement.left) newX -= PLAYER_SPEED;
                if (movement.up) newY -= PLAYER_SPEED;
                if (movement.right) newX += PLAYER_SPEED;
                if (movement.down) newY += PLAYER_SPEED;

                const PLAYER_SIZE = 50; // Assuming player size for collision

                // Check for collision with trees before updating position
                if (!checkTreeCollision(newX, newY, PLAYER_SIZE, lobby.dirtPatches)) {
                    player.x = newX;
                    player.y = newY;
                } else {
                    logger.debug({ message: 'Player movement blocked by tree collision', sessionId: socket.id, lobbyId: playerLobbyId, playerId: socket.id });
                }
                logger.debug({ message: 'Player movement', sessionId: socket.id, lobbyId: playerLobbyId, playerId: socket.id, oldX, oldY, newX: player.x, newY: player.y, movement });
            } else {
                logger.warn({ message: 'Player movement for non-existent player', sessionId: socket.id, lobbyId: playerLobbyId });
            }
        } else {
            logger.warn({ message: 'Player movement for player not in any lobby', sessionId: socket.id });
        }
    });

    socket.on('playerState', ({ state, weapon }) => {
        let playerLobbyId = null;
        for (const lobbyId in lobbies) {
            if (lobbies[lobbyId].players[socket.id]) {
                playerLobbyId = lobbyId;
                break;
            }
        }
        if (playerLobbyId) {
            const player = lobbies[playerLobbyId].players[socket.id];
            if (player) {
                player.state = state;
                player.weapon = weapon;
                player.animationFrame = 0; // Always reset animation frame on state change
                logger.debug({ message: 'Player animationFrame reset on state change', playerId: player.id, state, weapon, animationFrame: player.animationFrame });
                logger.debug({ message: 'Player state updated', sessionId: socket.id, lobbyId: playerLobbyId, state, weapon });
            }
        }
    });

    socket.on('shoot', (bullet) => {
        let playerLobbyId = null;
        for (const lobbyId in lobbies) {
            if (lobbies[lobbyId].players[socket.id]) {
                playerLobbyId = lobbyId;
                break;
            }
        }
        if (playerLobbyId) {
            const player = lobbies[playerLobbyId].players[socket.id];
            if (player) {
                lobbies[playerLobbyId].bullets.push({ ...bullet, ownerId: socket.id });
                logger.debug({ message: 'Bullet shot', sessionId: socket.id, lobbyId: playerLobbyId, bullet });
            }
        } else {
            logger.warn({ message: 'Shoot event from player not in any lobby', sessionId: socket.id });
        }
    });

    socket.on('ping', (startTime) => {
        socket.emit('pong', startTime);
        logger.debug({ message: 'Ping-pong', sessionId: socket.id, latency: Date.now() - startTime });
    });

    socket.on('disconnect', () => {
        logger.info({ message: 'A user disconnected', sessionId: socket.id });
        let lobbyIdToRemove = null;
        let lobbyToUpdateId = null;

        for (const lobbyId in lobbies) {
            if (lobbies[lobbyId].admin === socket.id) {
                lobbyIdToRemove = lobbyId;
                break;
            }
            if (lobbies[lobbyId].players[socket.id]) {
                delete lobbies[lobbyId].players[socket.id];
                lobbyToUpdateId = lobbyId;
                break;
            }
        }

        if (lobbyIdToRemove) {
            io.to(lobbyIdToRemove).emit('lobbyClosed');
            delete lobbies[lobbyIdToRemove];
            logger.info({ message: 'Lobby closed due to admin disconnect', sessionId: socket.id, lobbyId: lobbyIdToRemove });
        } else if (lobbyToUpdateId) {
            io.to(lobbyToUpdateId).emit('updateLobby', lobbies[lobbyToUpdateId]);
            logger.info({ message: 'Player disconnected from lobby', sessionId: socket.id, lobbyId: lobbyToUpdateId });
        } else {
            logger.info({ message: 'Disconnected user was not in any active lobby', sessionId: socket.id });
        }
        io.emit('lobbies', lobbies);
    });

    socket.on('error', (err) => {
        logger.error({ message: 'Socket error', sessionId: socket.id, error: err.message, stack: err.stack });
    });
});

setInterval(() => {
    for (const lobbyId in lobbies) {
        const lobby = lobbies[lobbyId];
        try {
            const gameResult = updateGame(lobby);

            // Update animation frames for players
            for (const playerId in lobby.players) {
                const player = lobby.players[playerId];
                let frameCount = PLAYER_IDLE_FRAME_COUNT; // Default to idle frame count

                if (player.state === 'shoot') {
                    frameCount = PLAYER_SHOOT_FRAME_COUNT;
                } else if (player.state === 'reload') {
                    if (player.weapon === 'pistol') {
                        frameCount = PLAYER_RELOAD_PISTOL_FRAME_COUNT;
                    } else if (player.weapon === 'rifle') {
                        frameCount = PLAYER_RELOAD_RIFLE_FRAME_COUNT;
                    }
                }

                // Ensure animationFrame is a number before incrementing
                logger.debug({ message: 'Player animation frame BEFORE update', playerId, animationFrameBefore: player.animationFrame, state: player.state, weapon: player.weapon, frameCount });
                if (typeof player.animationFrame !== 'number' || isNaN(player.animationFrame)) {
                    player.animationFrame = 0;
                }
                player.animationFrame = (player.animationFrame + 1) % frameCount;
                logger.debug({ message: 'Player animation frame AFTER update', playerId, animationFrameAfter: player.animationFrame });
            }

            // Update animation frames for zombies
            for (const zombieId in lobby.zombies) {
                const zombie = lobby.zombies[zombieId];
                // Ensure animationFrame exists and update it
                zombie.animationFrame = (zombie.animationFrame + 1) % ZOMBIE_WALK_FRAME_COUNT; // Assuming walk animation for now
            }

            if (gameResult === 'lose') {
                io.to(lobbyId).emit('gameOver', 'lose');
                delete lobbies[lobbyId];
                logger.info({ message: 'Game over - lose', lobbyId });
            } else if (gameResult === 'waveComplete') {
                io.to(lobbyId).emit('waveComplete', lobby.wave);
                logger.info({ message: 'Wave complete', lobbyId, wave: lobby.wave });
            }

            // Handle player death (moved from gameLogic to server to emit socket event)
            for (const playerId in lobby.players) {
                const player = lobby.players[playerId];
                if (player.health <= 0) {
                    io.to(player.id).emit('playerDied');
                    delete lobby.players[player.id];
                    logger.info({ message: 'Player died', playerId, lobbyId });
                }
            }

            logger.info({ message: 'Lobby state before emitting updateLobby', lobbyId, lobby: JSON.stringify(lobby) });
            io.to(lobbyId).emit('updateLobby', lobby);

            // Emit and clear events
            lobby.events.forEach(event => {
                io.to(lobbyId).emit(event.type, event);
            });
            lobby.events = [];

            logger.debug({ message: 'Lobby state updated', lobbyId });
        } catch (error) {
            logger.error({ message: 'Error during game update interval', lobbyId, error: error.message, stack: error.stack });
        }
    }
}, GAME_TICK);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});