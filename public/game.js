console.log('game.js loaded and executing.');
import { movement, setupInput } from './input.js';
import { drawGame } from './rendering.js';
import { initNetwork } from './network.js';
import { ASSETS_TO_LOAD, TARGET_FPS } from './constants.js';
import { assetLoader } from './assetLoader.js';
import { dirtPatches } from './rendering.js';


const socket = io();

const lobbyContainer = document.getElementById('lobbyContainer');
const createLobbyBtn = document.getElementById('createLobbyBtn');
console.log('createLobbyBtn element:', createLobbyBtn);
const lobbyNameInput = document.getElementById('lobbyNameInput');
const playerNameInput = document.getElementById('playerNameInput');
const lobbyList = document.getElementById('lobbyList');
const gameContainer = document.getElementById('gameContainer');
const gameCanvas = document.getElementById('gameCanvas');
gameCanvas.width = 800;
gameCanvas.height = 600;
const ctx = gameCanvas.getContext('2d');
const playerHealthDiv = document.getElementById('player-health');
const pingDiv = document.getElementById('ping');
const waveInfoDiv = document.getElementById('wave-info');
const fpsDiv = document.getElementById('fps');
const startGameBtn = document.getElementById('startGameBtn');

let currentLobby = null;
let ping = 0;

let then = performance.now();
const interval = 1000 / TARGET_FPS;

let lastFrameTime = 0;
let frameCount = 0;
let fps = 0;

// Callbacks for network events to update game state
const networkCallbacks = {
    updateLobby: (lobby) => {
        currentLobby = lobby;
        console.log('Lobby updated from server:', currentLobby);
        if (currentLobby.players[socket.id]) {
            console.log('Player animationFrame in updateLobby:', currentLobby.players[socket.id].animationFrame);
        }
        if (currentLobby.gameStarted) {
            startGameBtn.style.display = 'none';
        }
    },
    lobbyCreated: ({ lobby, originalName }) => {
        console.log('Lobby created callback received. Lobby:', lobby, 'Original Name:', originalName);
        lobbyContainer.style.display = 'none';
        gameContainer.style.display = 'block';
        currentLobby = lobby;
        if (lobby.name !== originalName) {
            alert(`Lobby name "${originalName}" was already taken. Your lobby is now named "${lobby.name}".`);
        }
        if (currentLobby.admin === socket.id) {
            startGameBtn.style.display = 'block';
        }
        window.dispatchEvent(new Event('resize')); // Trigger resize to fit canvas
        gameLoop();
    },
    joinApproved: ({ lobby, playerName }) => {
        console.log('joinApproved callback received. Lobby:', lobby, 'Player Name:', playerName);
        lobbyContainer.style.display = 'none';
        gameContainer.style.display = 'block';
        currentLobby = lobby;
        alert(`You have joined the lobby as ${playerName}`);
        window.dispatchEvent(new Event('resize')); // Trigger resize to fit canvas
        gameLoop();
    },
    lobbyClosed: () => {
        alert('The lobby has been closed by the admin.');
        lobbyContainer.style.display = 'block';
        gameContainer.style.display = 'none';
        currentLobby = null;
        startGameBtn.style.display = 'none';
    },
    playerDied: () => {
        alert('You died!');
        lobbyContainer.style.display = 'block';
        gameContainer.style.display = 'none';
        currentLobby = null;
        startGameBtn.style.display = 'none';
    },
    gameStarted: (lobby) => {
        currentLobby = lobby;
        startGameBtn.style.display = 'none';
        alert('Game Started!');
    },
    waveComplete: (wave) => {
        alert(`Wave ${wave - 1} complete! Starting Wave ${wave}...`);
    },
    gameOver: (result) => {
        if (result === 'win') {
            alert('You won!');
        } else {
            alert('Game Over! You lost.');
        }
        lobbyContainer.style.display = 'block';
        gameContainer.style.display = 'none';
        currentLobby = null;
        startGameBtn.style.display = 'none';
    },
    pong: (newPing) => {
        ping = newPing;
    },
    zombieBite: () => {
        if (assetLoader.assets.zombieBiteSound) {
            assetLoader.assets.zombieBiteSound.currentTime = 0;
            assetLoader.assets.zombieBiteSound.play();
        }
    },
    zombieHit: () => {
        if (assetLoader.assets.zombieHitSound) {
            assetLoader.assets.zombieHitSound.currentTime = 0;
            assetLoader.assets.zombieHitSound.play();
        }
    }
};

assetLoader.load(ASSETS_TO_LOAD, () => {
    console.log('assetLoader.load callback executed. Attaching event listeners...');
    initNetwork(socket, lobbyList, playerNameInput, lobbyNameInput, networkCallbacks);

    

    setupInput(gameCanvas, socket, () => {
        if (currentLobby && currentLobby.players) {
            return currentLobby.players[socket.id];
        }
        return null;
    }, assetLoader);

    createLobbyBtn.addEventListener('click', () => {
        console.log('Click event detected on Create Lobby button.');
        const lobbyName = lobbyNameInput.value;
        const playerName = playerNameInput.value;
        console.log('Create Lobby button clicked. Lobby Name:', lobbyName, 'Player Name:', playerName);
        if (lobbyName && playerName) {
            socket.emit('createLobby', { lobbyName, playerName });
            console.log('Emitted createLobby event to server.');
        } else {
            console.log('Lobby name or player name is missing. Not emitting createLobby.');
            alert('Please enter both a lobby name and your player name.');
        }
    });

    startGameBtn.addEventListener('click', () => {
        if (currentLobby && currentLobby.admin === socket.id) {
            socket.emit('startGame', currentLobby.id);
        }
    });

    gameLoop();
});

socket.emit('initGameData', { dirtPatches });

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const now = currentTime;
    const elapsed = now - then;

    if (elapsed > interval) {
        then = now - (elapsed % interval);

        if (!currentLobby) {
            return;
        }

        // Calculate FPS
        frameCount++;
        if (now > lastFrameTime + 1000) {
            fps = Math.round(frameCount * 1000 / (now - lastFrameTime));
            lastFrameTime = now;
            frameCount = 0;
        }
        fpsDiv.textContent = `FPS: ${fps}`;

        socket.emit('playerMovement', movement);
        const player = currentLobby.players[socket.id];
        console.log('Player object before drawGame:', player);
        drawGame(ctx, currentLobby, socket.id, assetLoader, playerHealthDiv, pingDiv, waveInfoDiv, ping);
    }
}

