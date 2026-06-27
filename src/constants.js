// ========== 娓告垙甯搁噺 ==========

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const TILE_SIZE = 32;

// 鐗╃悊
export const GRAVITY = 800;
export const PLAYER_SPEED = 180;
export const PLAYER_JUMP = -450;        // 浠?-380 璋冨埌 -450锛岃烦寰楁洿楂?export const PLAYER_ROLL_SPEED = 400;
export const PLAYER_ROLL_DURATION = 300; // ms

// 鏀诲嚮
export const ATTACK_DURATION = 150;     // ms
export const ATTACK_RANGE = 45;
export const ATTACK_DAMAGE = 1;

// 鍦板浘
export const ROOM_WIDTH = 20;
export const ROOM_HEIGHT = 14;
export const MAX_ROOMS = 5;

// 棰滆壊鏂规锛堝崰浣嶏紝鍚庨潰鏇挎崲绱犳潗锛?export const COLORS = {
    player: 0x3498db,
    playerHit: 0xe74c3c,
    ground: 0x2c3e50,
    platform: 0x7f8c8d,
    wall: 0x34495e,
    enemy: 0xe74c3c,
    coin: 0xf1c40f,
    door: 0x2ecc71,
    bg: 0x1a1a2e,
};
