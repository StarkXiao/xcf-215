export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export type Element = 'fire' | 'water' | 'wood' | 'earth' | 'metal' | 'thunder' | 'wind' | 'ice'

export interface Skill {
  id: string
  name: string
  description: string
  damage: number
  unlocked: boolean
  level: number
  element: Element
  cooldown: number
  icon: string
}

export interface BeastData {
  id: string
  name: string
  description: string
  element: Element
  rarity: Rarity
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpeed: number
  skills: Skill[]
  evolutionStage: number
  maxEvolutionStage: number
  unlocked: boolean
  discovered: boolean
  hatchTime: number
  favoriteFood: string[]
  lore: string
}

export interface OwnedBeast {
  instanceId: string
  beastId: string
  name: string
  level: number
  exp: number
  expToNext: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  intimacy: number
  hunger: number
  evolutionStage: number
  skills: Skill[]
  createdAt: number
  lastFedAt: number
}

export interface Egg {
  id: string
  beastId: string
  rarity: Rarity
  hatchProgress: number
  hatchTime: number
  startTime: number
}

export interface Food {
  id: string
  name: string
  description: string
  rarity: Rarity
  expBonus: number
  intimacyBonus: number
  hungerRestore: number
  price: number
  icon: string
}

export interface Stage {
  id: string
  name: string
  description: string
  recommendedLevel: number
  enemies: Enemy[]
  rewards: Reward[]
  unlocked: boolean
  completed: boolean
  background: string
}

export interface Enemy {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  element: Element
  icon: string
}

export interface Reward {
  type: 'gold' | 'spiritStone' | 'egg' | 'food' | 'exp'
  amount: number
  itemId?: string
}

export interface PlayerData {
  name: string
  level: number
  exp: number
  expToNext: number
  gold: number
  spiritStone: number
  eggs: Egg[]
  ownedBeasts: OwnedBeast[]
  activeBeastId: string | null
  inventory: {
    foods: { [foodId: string]: number }
    materials: { [materialId: string]: number }
  }
  discoveredBeasts: string[]
  completedStages: string[]
  totalPlayTime: number
  lastLoginAt: number
  createdAt: number
  offlineEarningsCollected: boolean
}

export interface BattleState {
  inBattle: boolean
  playerBeast: OwnedBeast | null
  enemy: Enemy | null
  turn: 'player' | 'enemy'
  battleLog: string[]
  playerHp: number
  enemyHp: number
  stageId: string | null
  rewards: Reward[]
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
  mythic: '#EF4444'
}

export const RARITY_NAMES: Record<Rarity, string> = {
  common: '凡品',
  rare: '良品',
  epic: '极品',
  legendary: '仙品',
  mythic: '神品'
}

export const ELEMENT_NAMES: Record<Element, string> = {
  fire: '火',
  water: '水',
  wood: '木',
  earth: '土',
  metal: '金',
  thunder: '雷',
  wind: '风',
  ice: '冰'
}

export const ELEMENT_COLORS: Record<Element, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  wood: '#22C55E',
  earth: '#A16207',
  metal: '#9CA3AF',
  thunder: '#A855F7',
  wind: '#06B6D4',
  ice: '#0EA5E9'
}
