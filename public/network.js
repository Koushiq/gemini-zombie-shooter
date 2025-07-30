import { movement } from './input.js';

export function initNetwork(socket, lobbyList, playerNameInput, lobbyNameInput, callbacks) {

    socket.on('lobbies', (lobbies) => {
        lobbyList.innerHTML = '';
        for (const lobbyId in lobbies) {
            const lobby = lobbies[lobbyId];
            const li = document.createElement('li');
            li.innerHTML = `<span>${lobby.name} - ${Object.keys(lobby.players).length} players</span>`;
            const joinBtn = document.createElement('button');
            joinBtn.textContent = 'Join';
            joinBtn.addEventListener('click', () => {
                const playerName = playerNameInput.value;
                if (playerName) {
                    console.log(`Attempting to join lobby ${lobby.id} as ${playerName}`);
                    socket.emit('joinLobby', { lobbyId: lobby.id, playerName });
                } else {
                    alert('Please enter your player name to join a lobby.');
                }
            });
            li.appendChild(joinBtn);
            lobbyList.appendChild(li);
        }
    });

    socket.emit('requestLobbies');

    socket.on('lobbyCreated', callbacks.lobbyCreated);

    socket.on('joinRequest', ({playerId, playerName, lobbyId}) => {
        console.log(`Join request received from ${playerName} for lobby ${lobbyId}. Auto-approving.`);
        alert(`Player ${playerName} wants to join your lobby. Auto-approving for now.`);
        socket.emit('approveJoin', {playerId, lobbyId, playerName});
    });

    socket.on('joinApproved', callbacks.joinApproved);

    socket.on('updateLobby', callbacks.updateLobby);

    socket.on('lobbyClosed', callbacks.lobbyClosed);

    socket.on('playerDied', callbacks.playerDied);

    socket.on('gameStarted', callbacks.gameStarted);

    socket.on('waveComplete', callbacks.waveComplete);

    socket.on('gameOver', callbacks.gameOver);

    socket.on('pong', (startTime) => {
        callbacks.pong(Date.now() - startTime);
    });

    setInterval(() => {
        const startTime = Date.now();
        socket.emit('ping', startTime);
    }, 2000);
}