import { ASSETS_TO_LOAD } from './constants.js';

let playerAnimationFrame = 0;
let zombieAnimationFrame = 0;
let ping = 0;

export const dirtPatches = [
    { x: 100, y: 100, width: 150, height: 150 },
    { x: 400, y: 200, width: 200, height: 100 },
    { x: 250, y: 400, width: 100, height: 200 }
];



function getPlayerImage(assetLoader, player) {
    const state = player.state || 'idle';
    const weapon = player.weapon || 'pistol';
    const frame = player.animationFrame || 0; // Default to frame 0 if null

    // Capitalize the first letter of the weapon for the asset key
    const capitalizedWeapon = weapon.charAt(0).toUpperCase() + weapon.slice(1);

    switch (state) {
        case 'shoot':
            const shootAssetKey = `playerShoot${capitalizedWeapon}_${frame}`;
            console.log(`Attempting to load shoot image with key: ${shootAssetKey}`);
            const shootAsset = assetLoader.assets[shootAssetKey];
            console.log(`Asset found: ${shootAsset}`);
            return shootAsset;
        case 'reload':
            const reloadAssetKey = `playerReload${capitalizedWeapon}_${frame}`;
            console.log(`Attempting to load reload image with key: ${reloadAssetKey}`);
            const reloadAsset = assetLoader.assets[reloadAssetKey];
            console.log(`Asset found: ${reloadAsset}`);
            return reloadAsset;
        default:
            const idleAssetKey = `playerIdle${capitalizedWeapon}_${frame}`;
            console.log(`Attempting to load idle image with key: ${idleAssetKey}`);
            const idleAsset = assetLoader.assets[idleAssetKey];
            console.log(`Asset found: ${idleAsset}`);
            return idleAsset;
    }
}

function getZombieImage(assetLoader, zombie) {
    const state = zombie.state || 'walk';
    return assetLoader.assets[`zombie${state.charAt(0).toUpperCase() + state.slice(1)}_${zombie.animationFrame}`];
}

export function drawGame(ctx, currentLobby, socketId, assetLoader, playerHealthDiv, pingDiv, waveInfoDiv, currentPing) {
    if (!currentLobby) return;

    // Update the global ping variable for display
    ping = currentPing;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(assetLoader.assets.grass, 0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw dirt patches with a simple blending effect
    dirtPatches.forEach(patch => {
        // Main dirt patch
        ctx.drawImage(assetLoader.assets.dirt, patch.x, patch.y, patch.width, patch.height);

        // Simple blending: draw slightly smaller, semi-transparent dirt around the edges
        const blendOffset = 5; // How far the blend extends
        const blendAlpha = 0.5; // Transparency for blending layers

        ctx.globalAlpha = blendAlpha;
        ctx.drawImage(assetLoader.assets.dirt, patch.x - blendOffset, patch.y - blendOffset, patch.width + 2 * blendOffset, patch.height + 2 * blendOffset);
        ctx.drawImage(assetLoader.assets.dirt, patch.x + blendOffset, patch.y - blendOffset, patch.width - 2 * blendOffset, patch.height + 2 * blendOffset);
        ctx.drawImage(assetLoader.assets.dirt, patch.x - blendOffset, patch.y + blendOffset, patch.width + 2 * blendOffset, patch.height - 2 * blendOffset);
        ctx.drawImage(assetLoader.assets.dirt, patch.x + blendOffset, patch.y + blendOffset, patch.width - 2 * blendOffset, patch.height - 2 * blendOffset);
        ctx.globalAlpha = 1.0; // Reset alpha
    });

    // Draw trees within dirt patches
    dirtPatches.forEach((patch, index) => {
        // Place tree roughly in the center of the patch
        const treeImage = assetLoader.assets[`tree${index % 4}`];
        const treeX = patch.x + (patch.width / 2) - (treeImage.width / 2);
        const treeY = patch.y + (patch.height / 2) - (treeImage.height / 2);
        ctx.drawImage(treeImage, treeX, treeY);
    });

    for (const playerId in currentLobby.players) {
        const player = currentLobby.players[playerId];
        const playerImage = getPlayerImage(assetLoader, player);
        if (playerImage) {
            ctx.save(); // Save the current canvas state
            ctx.translate(player.x + playerImage.width / 2, player.y + playerImage.height / 2); // Move origin to player center
            ctx.rotate(player.angle); // Rotate the canvas
            ctx.drawImage(playerImage, -playerImage.width / 2, -playerImage.height / 2); // Draw image centered
            ctx.restore(); // Restore the canvas state
        }
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(player.name, player.x, player.y - 10);

        // Draw player health bar
        const playerHealthBarWidth = 50;
        const playerHealthBarHeight = 5;
        const playerHealthBarX = player.x + (playerImage ? playerImage.width / 2 : 25) - (playerHealthBarWidth / 2);
        const playerHealthBarY = player.y - 15; // A bit higher than the name

        ctx.fillStyle = 'red';
        ctx.fillRect(playerHealthBarX, playerHealthBarY, playerHealthBarWidth, playerHealthBarHeight);

        ctx.fillStyle = 'green';
        const currentPlayerHealthWidth = (player.health / 100) * playerHealthBarWidth;
        ctx.fillRect(playerHealthBarX, playerHealthBarY, currentPlayerHealthWidth, playerHealthBarHeight);
    }

    for (const zombieId in currentLobby.zombies) {
        const zombie = currentLobby.zombies[zombieId];
        const zombieImage = getZombieImage(assetLoader, zombie);
        if (zombieImage) {
            ctx.drawImage(zombieImage, zombie.x, zombie.y);
        }

        const healthBarWidth = 50;
        const healthBarHeight = 5;
        const healthBarX = zombie.x + (zombieImage ? zombieImage.width / 2 : 25) - (healthBarWidth / 2);
        const healthBarY = zombie.y - 10;

        ctx.fillStyle = 'red';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        ctx.fillStyle = 'green';
        const currentHealthWidth = (zombie.health / 100) * healthBarWidth;
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
    }

    for (const bullet of currentLobby.bullets) {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    const me = currentLobby.players[socketId];
    if (me) {
        playerHealthDiv.textContent = `Health: ${me.health}`;
    }
    pingDiv.textContent = `Ping: ${ping}ms`;
    waveInfoDiv.textContent = `Wave: ${currentLobby.wave} / Zombies: ${Object.keys(currentLobby.zombies).length}`;
}

    