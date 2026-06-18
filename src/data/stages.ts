import type { Stage, Enemy, Element } from '@/types'

const createEnemy = (id: string, name: string, level: number, element: Element, icon: string): Enemy => {
  const baseHp = 80 + level * 20
  const baseAtk = 15 + level * 5
  const baseDef = 8 + level * 3
  return {
    id,
    name,
    level,
    hp: baseHp,
    maxHp: baseHp,
    attack: baseAtk,
    defense: baseDef,
    element,
    icon
  }
}

export const STAGES_DATA: Stage[] = [
  {
    id: 'stage_1',
    name: '青竹林',
    description: '幽静的竹林，低阶灵兽的栖息地',
    recommendedLevel: 1,
    enemies: [
      createEnemy('enemy_1_1', '青竹蛇', 1, 'wood', '🐍'),
      createEnemy('enemy_1_2', '竹鼠', 2, 'wood', '🐭')
    ],
    rewards: [
      { type: 'gold', amount: 50 },
      { type: 'exp', amount: 30 },
      { type: 'food', amount: 2, itemId: 'spirit_fruit' }
    ],
    unlocked: true,
    completed: false,
    background: '#228B22'
  },
  {
    id: 'stage_2',
    name: '流花溪',
    description: '潺潺溪水，水中灵兽出没',
    recommendedLevel: 3,
    enemies: [
      createEnemy('enemy_2_1', '锦鲤精', 3, 'water', '🐟'),
      createEnemy('enemy_2_2', '水蛇', 4, 'water', '🐍'),
      createEnemy('enemy_2_3', '河蚌', 5, 'water', '🐚')
    ],
    rewards: [
      { type: 'gold', amount: 100 },
      { type: 'exp', amount: 60 },
      { type: 'food', amount: 1, itemId: 'mystic_water' }
    ],
    unlocked: false,
    completed: false,
    background: '#1E90FF'
  },
  {
    id: 'stage_3',
    name: '火焰山',
    description: '炽热的火山地带，火系灵兽横行',
    recommendedLevel: 5,
    enemies: [
      createEnemy('enemy_3_1', '火蜥蜴', 5, 'fire', '🦎'),
      createEnemy('enemy_3_2', '熔岩犬', 6, 'fire', '🐕'),
      createEnemy('enemy_3_3', '火焰狮', 7, 'fire', '🦁')
    ],
    rewards: [
      { type: 'gold', amount: 200 },
      { type: 'exp', amount: 120 },
      { type: 'food', amount: 1, itemId: 'fire_fruit' },
      { type: 'spiritStone', amount: 10 }
    ],
    unlocked: false,
    completed: false,
    background: '#DC143C'
  },
  {
    id: 'stage_4',
    name: '寒冰洞',
    description: '万年寒冰洞穴，冰系灵兽盘踞',
    recommendedLevel: 8,
    enemies: [
      createEnemy('enemy_4_1', '冰狐', 8, 'ice', '🦊'),
      createEnemy('enemy_4_2', '雪狼', 9, 'ice', '🐺'),
      createEnemy('enemy_4_3', '冰熊', 10, 'ice', '🐻')
    ],
    rewards: [
      { type: 'gold', amount: 350 },
      { type: 'exp', amount: 200 },
      { type: 'food', amount: 2, itemId: 'ice_meat' },
      { type: 'spiritStone', amount: 25 }
    ],
    unlocked: false,
    completed: false,
    background: '#87CEEB'
  },
  {
    id: 'stage_5',
    name: '雷神殿',
    description: '雷电交加的古殿，雷系灵兽守护',
    recommendedLevel: 12,
    enemies: [
      createEnemy('enemy_5_1', '雷鸟', 12, 'thunder', '🦅'),
      createEnemy('enemy_5_2', '闪电豹', 13, 'thunder', '🐆'),
      createEnemy('enemy_5_3', '雷兽', 15, 'thunder', '🐂')
    ],
    rewards: [
      { type: 'gold', amount: 500 },
      { type: 'exp', amount: 350 },
      { type: 'spiritStone', amount: 50 },
      { type: 'egg', amount: 1, itemId: 'egg_rare' }
    ],
    unlocked: false,
    completed: false,
    background: '#9932CC'
  },
  {
    id: 'stage_6',
    name: '万兽谷',
    description: '传说中的灵兽秘境，神兽出没',
    recommendedLevel: 18,
    enemies: [
      createEnemy('enemy_6_1', '穷奇', 18, 'metal', '🐯'),
      createEnemy('enemy_6_2', '饕餮', 20, 'earth', '🐲'),
      createEnemy('enemy_6_3', '混沌', 22, 'wind', '🌪️')
    ],
    rewards: [
      { type: 'gold', amount: 1000 },
      { type: 'exp', amount: 600 },
      { type: 'spiritStone', amount: 100 },
      { type: 'egg', amount: 1, itemId: 'egg_legendary' }
    ],
    unlocked: false,
    completed: false,
    background: '#4B0082'
  }
]

export const getStageById = (id: string): Stage | undefined => {
  return STAGES_DATA.find(s => s.id === id)
}
