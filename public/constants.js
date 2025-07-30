
export const PLAYER_SPEED = 3;
export const BULLET_SPEED = 10;
export const PLAYER_HEALTH = 100;
export const ZOMBIE_HEALTH = 100;
export const ZOMBIE_DAMAGE = 1;
export const BULLET_DAMAGE = 20;
export const ZOMBIES_PER_WAVE = 5;
export const TARGET_FPS = 60;
export const GAME_TICK = 1000 / TARGET_FPS;
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;

export const PLAYER_IDLE_FRAME_COUNT = 1;
export const PLAYER_RELOAD_PISTOL_FRAME_COUNT = 1;
export const PLAYER_RELOAD_RIFLE_FRAME_COUNT = 1;
export const PLAYER_SHOOT_FRAME_COUNT = 1;
export const ZOMBIE_ATTACK_FRAME_COUNT = 1;
export const ZOMBIE_WALK_FRAME_COUNT = 1;

export const ASSETS_TO_LOAD = {
    // Sounds
    backgroundSound: 'sounds/background.wav',
    emptyGunSound: 'sounds/emptygun.wav',
    machineGunSound: 'sounds/machinegun.wav',
    pistolSound: 'sounds/pistol.wav',
    pistolReloadSound: 'sounds/pistolreload.wav',
    rifleReloadSound: 'sounds/rifleReload.wav',
    zombieBiteSound: 'sounds/zombieBite.wav',
    zombieHitSound: 'sounds/zombiehit.wav',

    // Textures
    ak47: 'textures/guns/ak-47.png',
    pistol: 'textures/guns/pistol.png',
    rifleLoader: 'textures/guns/rifleLoader.png',
    mountain: 'textures/mountain/mountain.png',
    tree: 'textures/obstacles/tree.png',
    dirt: 'textures/tiles/dirt.png',
    grass: 'textures/tiles/grass.png',
    tree0: 'textures/tress/tree0.png',
    tree1: 'textures/tress/tree1.png',
    tree2: 'textures/tress/tree2.png',
    tree3: 'textures/tress/tree3.png',
    zombieBlood: 'textures/zombie/blood/bloodsplat.png',
};

// Player animations
for (let i = 0; i < 1; i++) {
    ASSETS_TO_LOAD[`playerIdlePistol_${i}`] = `textures/player/idle/pistolIdle/${i}.png`;
    ASSETS_TO_LOAD[`playerIdleRifle_${i}`] = `textures/player/idle/rifleIdle/${i}.png`;
    ASSETS_TO_LOAD[`playerReloadRifle_${i}`] = `textures/player/reload/rifle/${i}.png`;
}
for (let i = 0; i < 1; i++) {
    ASSETS_TO_LOAD[`playerReloadPistol_${i}`] = `textures/player/reload/pistol/${i}.png`;
}
for (let i = 0; i < 1; i++) {
    ASSETS_TO_LOAD[`playerShootPistol_${i}`] = `textures/player/shoot/pistol/${i}.png`;
    ASSETS_TO_LOAD[`playerShootRifle_${i}`] = `textures/player/shoot/rifle/${i}.png`;
}

// Zombie animations
for (let i = 0; i < 1; i++) {
    ASSETS_TO_LOAD[`zombieAttack_${i}`] = `textures/zombie/attack/${i}.png`;
}
for (let i = 0; i < 1; i++) {
    ASSETS_TO_LOAD[`zombieWalk_${i}`] = `textures/zombie/walk/${i}.png`;
}
