export interface EggPool {
  id: string
  name: string
  description: string
  rarity: string
  price: number
  currency: 'gold' | 'spiritStone'
  possibleBeasts: string[]
  weights: number[]
  icon: string
}

export const EGG_POOLS: EggPool[] = [
  {
    id: 'egg_common',
    name: '凡品灵兽蛋',
    description: '普通的灵兽蛋，可能孵化出凡品或良品灵兽',
    rarity: 'common',
    price: 100,
    currency: 'gold',
    possibleBeasts: ['snake', 'wolf', 'crane'],
    weights: [60, 30, 10],
    icon: '🥚'
  },
  {
    id: 'egg_rare',
    name: '良品灵兽蛋',
    description: '蕴含灵气的灵兽蛋，可能孵化出良品或极品灵兽',
    rarity: 'rare',
    price: 500,
    currency: 'gold',
    possibleBeasts: ['wolf', 'bear', 'fox', 'crane'],
    weights: [20, 30, 35, 15],
    icon: '🥚'
  },
  {
    id: 'egg_epic',
    name: '极品灵兽蛋',
    description: '散发异香的灵兽蛋，必定孵化出极品以上灵兽',
    rarity: 'epic',
    price: 50,
    currency: 'spiritStone',
    possibleBeasts: ['fox', 'crane', 'fish', 'monkey'],
    weights: [25, 25, 25, 25],
    icon: '🥚'
  },
  {
    id: 'egg_legendary',
    name: '仙品灵兽蛋',
    description: '神光环绕的灵兽蛋，有机会孵化出传说中的神兽',
    rarity: 'legendary',
    price: 200,
    currency: 'spiritStone',
    possibleBeasts: ['phoenix', 'turtle', 'tiger', 'fish', 'monkey'],
    weights: [20, 20, 20, 20, 20],
    icon: '🥚'
  },
  {
    id: 'egg_mythic',
    name: '神品灵兽蛋',
    description: '传说中的神蛋，蕴含神兽血脉',
    rarity: 'mythic',
    price: 500,
    currency: 'spiritStone',
    possibleBeasts: ['dragon', 'qilin', 'phoenix', 'turtle', 'tiger'],
    weights: [15, 15, 25, 22, 23],
    icon: '🥚'
  }
]

export const getEggPoolById = (id: string): EggPool | undefined => {
  return EGG_POOLS.find(e => e.id === id)
}

export const selectRandomBeast = (pool: EggPool): string => {
  const totalWeight = pool.weights.reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  
  for (let i = 0; i < pool.possibleBeasts.length; i++) {
    random -= pool.weights[i]
    if (random <= 0) {
      return pool.possibleBeasts[i]
    }
  }
  
  return pool.possibleBeasts[pool.possibleBeasts.length - 1]
}
