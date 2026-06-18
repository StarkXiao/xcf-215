import type { Food } from '@/types'

export const FOODS_DATA: Food[] = [
  {
    id: 'spirit_peach',
    name: '灵桃',
    description: '吸收日月精华的仙桃',
    rarity: 'rare',
    expBonus: 50,
    intimacyBonus: 10,
    hungerRestore: 30,
    price: 100,
    icon: '🍑'
  },
  {
    id: 'fire_fruit',
    name: '火灵果',
    description: '生长在火山口的神奇果实',
    rarity: 'epic',
    expBonus: 100,
    intimacyBonus: 20,
    hungerRestore: 50,
    price: 300,
    icon: '🔥'
  },
  {
    id: 'dragon_grass',
    name: '龙须草',
    description: '传说由真龙胡须幻化而成',
    rarity: 'legendary',
    expBonus: 200,
    intimacyBonus: 35,
    hungerRestore: 60,
    price: 800,
    icon: '🌿'
  },
  {
    id: 'mystic_water',
    name: '玄水',
    description: '来自极北冰原的纯净水',
    rarity: 'epic',
    expBonus: 80,
    intimacyBonus: 15,
    hungerRestore: 40,
    price: 250,
    icon: '💧'
  },
  {
    id: 'iron_bone',
    name: '铁骨兽肉',
    description: '坚硬如铁的异兽肉',
    rarity: 'rare',
    expBonus: 60,
    intimacyBonus: 8,
    hungerRestore: 45,
    price: 150,
    icon: '🍖'
  },
  {
    id: 'spirit_fruit',
    name: '灵果',
    description: '山林中常见的灵气果实',
    rarity: 'common',
    expBonus: 20,
    intimacyBonus: 5,
    hungerRestore: 20,
    price: 30,
    icon: '🍎'
  },
  {
    id: 'cloud_grass',
    name: '云芝草',
    description: '生长在云端的灵草',
    rarity: 'rare',
    expBonus: 45,
    intimacyBonus: 12,
    hungerRestore: 25,
    price: 120,
    icon: '☁️'
  },
  {
    id: 'ice_meat',
    name: '冰晶兽肉',
    description: '冰冻千年的异兽肉',
    rarity: 'rare',
    expBonus: 55,
    intimacyBonus: 10,
    hungerRestore: 50,
    price: 180,
    icon: '🧊'
  },
  {
    id: 'poison_frog',
    name: '剧毒蛙',
    description: '以毒攻毒的奇异食材',
    rarity: 'common',
    expBonus: 25,
    intimacyBonus: 3,
    hungerRestore: 35,
    price: 50,
    icon: '🐸'
  },
  {
    id: 'fire_honey',
    name: '火焰蜂蜜',
    description: '火蜂酿造的蜂蜜',
    rarity: 'epic',
    expBonus: 90,
    intimacyBonus: 25,
    hungerRestore: 40,
    price: 280,
    icon: '🍯'
  },
  {
    id: 'pearl',
    name: '夜明珠',
    description: '深海巨蚌孕育的宝珠',
    rarity: 'legendary',
    expBonus: 180,
    intimacyBonus: 30,
    hungerRestore: 30,
    price: 600,
    icon: '🔮'
  },
  {
    id: 'mountain_peach',
    name: '仙桃',
    description: '三千年一熟的蟠桃',
    rarity: 'mythic',
    expBonus: 500,
    intimacyBonus: 50,
    hungerRestore: 100,
    price: 2000,
    icon: '🌸'
  }
]

export const getFoodById = (id: string): Food | undefined => {
  return FOODS_DATA.find(f => f.id === id)
}
