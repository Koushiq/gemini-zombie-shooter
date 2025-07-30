export const movement = { up: false, down: false, left: false, right: false };
export let playerAngle = 0; // Angle in radians

export function setupInput(gameCanvas, socket, getPlayer, assetLoader) {
    // Mouse movement for rotation (still an option)
    gameCanvas.addEventListener('mousemove', (event) => {
        const player = getPlayer();
        if (!player) return;

        const rect = gameCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        playerAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
        socket.emit('playerRotation', playerAngle);
    });

    document.addEventListener('keydown', (event) => {
        const player = getPlayer();
        if (!player) return;

        switch (event.key) {
            // Movement (WASD)
            case 'w':
                movement.up = true;
                break;
            case 's':
                movement.down = true;
                break;
            case 'a':
                movement.left = true;
                break;
            case 'd':
                movement.right = true;
                break;

            // Rotation (Arrow Keys)
            case 'ArrowUp':
                playerAngle = -Math.PI / 2; // Up
                socket.emit('playerRotation', playerAngle);
                break;
            case 'ArrowDown':
                playerAngle = Math.PI / 2; // Down
                socket.emit('playerRotation', playerAngle);
                break;
            case 'ArrowLeft':
                playerAngle = Math.PI; // Left
                socket.emit('playerRotation', playerAngle);
                break;
            case 'ArrowRight':
                playerAngle = 0; // Right
                socket.emit('playerRotation', playerAngle);
                break;

            // Weapon Switching
            case '1':
                player.weapon = 'pistol';
                socket.emit('playerState', { state: player.state, weapon: 'pistol' });
                break;
            case '2':
                player.weapon = 'rifle';
                socket.emit('playerState', { state: player.state, weapon: 'rifle' });
                break;

            // Reload
            case 'r':
                // Play reload sound based on current weapon
                if (player.weapon === 'pistol' && assetLoader.assets.pistolReloadSound) {
                    assetLoader.assets.pistolReloadSound.currentTime = 0;
                    assetLoader.assets.pistolReloadSound.play();
                } else if (player.weapon === 'rifle' && assetLoader.assets.rifleReloadSound) {
                    assetLoader.assets.rifleReloadSound.currentTime = 0;
                    assetLoader.assets.rifleReloadSound.play();
                }

                // Update player state for reloading animation
                socket.emit('playerState', { state: 'reload', weapon: player.weapon });
                setTimeout(() => {
                    socket.emit('playerState', { state: 'idle', weapon: player.weapon });
                }, 1500); // Assuming reload animation lasts 1500ms
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        const player = getPlayer();
        if (!player) return;

        switch (event.key) {
            case 'w':
                movement.up = false;
                break;
            case 's':
                movement.down = false;
                break;
            case 'a':
                movement.left = false;
                break;
            case 'd':
                movement.right = false;
                break;
        }
    });

    gameCanvas.addEventListener('click', (event) => {
        const player = getPlayer();
        if (!player) return;

        // Play shoot sound based on current weapon
        if (player.weapon === 'pistol' && assetLoader.assets.pistolSound) {
            assetLoader.assets.pistolSound.currentTime = 0;
            assetLoader.assets.pistolSound.play();
        } else if (player.weapon === 'rifle' && assetLoader.assets.machineGunSound) {
            assetLoader.assets.machineGunSound.currentTime = 0;
            assetLoader.assets.machineGunSound.play();
        } else if (assetLoader.assets.emptyGunSound) {
            assetLoader.assets.emptyGunSound.currentTime = 0;
            assetLoader.assets.emptyGunSound.play();
        }

        const angle = player.angle; // Use player's current rotation angle
        const speed = 10;
        const playerWidth = 50; // Assuming player width for offset calculation
        const playerHeight = 50; // Assuming player height for offset calculation
        const bulletOffset = 30; // Distance from player center

        // Calculate bullet origin slightly forward from player's center based on their rotation
        const bulletX = player.x + (playerWidth / 2) + Math.cos(angle) * bulletOffset;
        const bulletY = player.y + (playerHeight / 2) + Math.sin(angle) * bulletOffset;

        socket.emit('shoot', {
            x: bulletX,
            y: bulletY,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed
        });

        // Update player state for shooting animation
        socket.emit('playerState', { state: 'shoot', weapon: player.weapon });
        setTimeout(() => {
            socket.emit('playerState', { state: 'idle', weapon: player.weapon });
        }, 300); // Assuming shoot animation lasts 300ms
    });
}