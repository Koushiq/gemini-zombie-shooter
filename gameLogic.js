const { PLAYER_SPEED, BULLET_SPEED, PLAYER_HEALTH, ZOMBIE_HEALTH, ZOMBIE_DAMAGE, BULLET_DAMAGE, ZOMBIES_PER_WAVE, MAP_WIDTH, MAP_HEIGHT } = require('./constants');

module.exports = (logger) => {
    const TREE_COLLISION_SIZE = 40; // Approximate collision size for a tree

    function checkTreeCollision(playerX, playerY, playerSize, dirtPatches) {
        for (const patch of dirtPatches) {
            // Assuming tree is centered within the dirt patch for collision purposes
            const treeX = patch.x + (patch.width / 2) - (TREE_COLLISION_SIZE / 2);
            const treeY = patch.y + (patch.height / 2) - (TREE_COLLISION_SIZE / 2);

            if (playerX < treeX + TREE_COLLISION_SIZE &&
                playerX + playerSize > treeX &&
                playerY < treeY + TREE_COLLISION_SIZE &&
                playerY + playerSize > treeY) {
                return true; // Collision detected with a tree
            }
        }
        return false;
    }

    function createZombie(lobbyId) {
        const zombie = {
            id: Date.now() + Math.random(),
            x: Math.random() * MAP_WIDTH,
            y: Math.random() * MAP_HEIGHT,
            health: ZOMBIE_HEALTH,
            lobbyId: lobbyId
        };
        logger.debug({ message: 'Zombie created', zombieId: zombie.id, lobbyId: lobbyId, x: zombie.x, y: zombie.y });
        return zombie;
    }

    function spawnWave(lobby) {
        const numZombies = lobby.wave * ZOMBIES_PER_WAVE;
        lobby.zombiesRemaining = numZombies;
        logger.info({ message: 'Spawning new wave', lobbyId: lobby.id, wave: lobby.wave, numZombies: numZombies });
        for (let i = 0; i < numZombies; i++) {
            const zombie = createZombie(lobby.id);
            lobby.zombies[zombie.id] = zombie;
        }
    }

    function updateGame(lobby) {
        // Move zombies
        for (const zombieId in lobby.zombies) {
            const zombie = lobby.zombies[zombieId];
            let closestPlayer = null;
            let minDistance = Infinity;

            for (const playerId in lobby.players) {
                const player = lobby.players[playerId];
                const distance = Math.sqrt(Math.pow(player.x - zombie.x, 2) + Math.pow(player.y - zombie.y, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlayer = player;
                }
            }

            if (closestPlayer) {
                const angle = Math.atan2(closestPlayer.y - zombie.y, closestPlayer.x - zombie.x);
                zombie.x += Math.cos(angle);
                zombie.y += Math.sin(angle);
                logger.debug({ message: 'Zombie moving towards player', lobbyId: lobby.id, zombieId: zombie.id, targetPlayerId: closestPlayer.id, newX: zombie.x, newY: zombie.y });

                if (minDistance < 20) {
                    closestPlayer.health -= ZOMBIE_DAMAGE;
                    logger.info({ message: 'Player damaged by zombie', lobbyId: lobby.id, playerId: closestPlayer.id, zombieId: zombie.id, damage: ZOMBIE_DAMAGE, currentHealth: closestPlayer.health });
                    // Emit event for zombie bite sound
                    lobby.events.push({ type: 'zombieBite', playerId: closestPlayer.id });
                    if (closestPlayer.health <= 0) {
                        logger.info({ message: 'Player defeated by zombie', lobbyId: lobby.id, playerId: closestPlayer.id, zombieId: zombie.id });
                        // Player died - handled in server.js now
                    }
                }
            }
        }

        // Move bullets and check for collisions
        for (let i = lobby.bullets.length - 1; i >= 0; i--) {
            const bullet = lobby.bullets[i];
            bullet.x += bullet.speedX;
            bullet.y += bullet.speedY;
            logger.debug({ message: 'Bullet moving', lobbyId: lobby.id, bulletId: bullet.id, newX: bullet.x, newY: bullet.y });

            let hit = false;
            for (const zombieId in lobby.zombies) {
                const zombie = lobby.zombies[zombieId];
                const distance = Math.sqrt(Math.pow(bullet.x - zombie.x, 2) + Math.pow(bullet.y - zombie.y, 2));
                if (distance < 20) {
                    zombie.health -= BULLET_DAMAGE;
                    logger.info({ message: 'Zombie damaged by bullet', lobbyId: lobby.id, zombieId: zombie.id, bulletId: bullet.id, damage: BULLET_DAMAGE, currentHealth: zombie.health });
                    // Emit event for zombie hit sound
                    lobby.events.push({ type: 'zombieHit', zombieId: zombie.id });
                    if (zombie.health <= 0) {
                        logger.info({ message: 'Zombie defeated', lobbyId: lobby.id, zombieId: zombie.id });
                        delete lobby.zombies[zombieId];
                        lobby.zombiesRemaining--;
                    }
                    hit = true;
                    break;
                }
            }

            // Check for player collisions (friendly fire enabled)
            for (const playerId in lobby.players) {
                const player = lobby.players[playerId];
                // Prevent a bullet from hitting the player who fired it
                if (bullet.ownerId === playerId) {
                    continue;
                }
                const distance = Math.sqrt(Math.pow(bullet.x - player.x, 2) + Math.pow(bullet.y - player.y, 2));
                if (distance < 20) {
                    player.health -= BULLET_DAMAGE;
                    logger.info({ message: 'Player damaged by bullet from another player', lobbyId: lobby.id, playerId: player.id, bulletId: bullet.id, damage: BULLET_DAMAGE, currentHealth: player.health });
                    hit = true;
                    break;
                }
            }

            if (hit || bullet.x < 0 || bullet.x > MAP_WIDTH || bullet.y < 0 || bullet.y > MAP_HEIGHT) {
                logger.debug({ message: 'Bullet removed', lobbyId: lobby.id, bulletId: bullet.id, hit: hit, outOfBounds: !hit });
                lobby.bullets.splice(i, 1);
            }
        }

        // Check win/lose conditions
        if (lobby.gameStarted) {
            if (Object.keys(lobby.players).length === 0) {
                logger.info({ message: 'Game over - all players defeated', lobbyId: lobby.id });
                return 'lose'; // All players died
            } else if (lobby.zombiesRemaining === 0 && Object.keys(lobby.zombies).length === 0) {
                lobby.wave++;
                spawnWave(lobby);
                logger.info({ message: 'Wave complete, starting next wave', lobbyId: lobby.id, newWave: lobby.wave });
                return 'waveComplete';
            }
        }
        return null;
    }

    return {
        createZombie,
        spawnWave,
        updateGame,
        checkTreeCollision
    };
};