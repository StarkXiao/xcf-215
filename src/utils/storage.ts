import type { PlayerData, OwnedBeast, Egg } from '@/types'
import { BEASTS_DATA } from '@/data/beasts'

const STORAGE_KEY = 'xianxia_spirit_beast_save'

export const saveGame = (data: PlayerData): void => {
  try {
    data.lastLoginAt = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存游戏失败:', e)
  }
}

export const loadGame = (): PlayerData | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('加载游戏失败:', e)
  }
  return null
}

export const clearGame = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

export const calculateOfflineEarnings = (lastLogin: number): {
  gold: number
  exp: number
  foodItems: { [key: string]: number }
  duration: number
} => {
  const now = Date.now()
  const duration = now - lastLogin
  const maxDuration = 8 * 60 * 60 * 1000
  const effectiveDuration = Math.min(duration, maxDuration)
  const hours = effectiveDuration / (60 * 60 * 1000)
  
  const baseGoldPerHour = 50
  const baseExpPerHour = 20
  
  const gold = Math.floor(baseGoldPerHour * hours * (1 + Math.random() * 0.5))
  const exp = Math.floor(baseExpPerHour * hours * (1 + Math.random() * 0.5))
  
  const foodItems: { [key: string]: number } = {}
  if (hours >= 1) {
    foodItems['spirit_fruit'] = Math.floor(hours * 2)
  }
  if (hours >= 3) {
    foodItems['spirit_peach'] = Math.floor(hours * 0.5)
  }
  
  return { gold, exp, foodItems, duration: effectiveDuration }
}

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const calculateExpToNext = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export const calculateBeastStats = (
  baseHp: number,
  baseAtk: number,
  baseDef: number,
  baseSpeed: number,
  level: number,
  evolutionStage: number,
  intimacy: number
) => {
  const levelMultiplier = 1 + (level - 1) * 0.1
  const evolutionMultiplier = 1 + (evolutionStage - 1) * 0.3
  const intimacyBonus = 1 + intimacy / 1000
  
  return {
    maxHp: Math.floor(baseHp * levelMultiplier * evolutionMultiplier * intimacyBonus),
    attack: Math.floor(baseAtk * levelMultiplier * evolutionMultiplier * intimacyBonus),
    defense: Math.floor(baseDef * levelMultiplier * evolutionMultiplier * intimacyBonus),
    speed: Math.floor(baseSpeed * levelMultiplier * evolutionMultiplier * intimacyBonus)
  }
}

export const checkLevelUp = (beast: OwnedBeast): OwnedBeast => {
  let newBeast = { ...beast }
  
  while (newBeast.exp >= newBeast.expToNext && newBeast.level < 100) {
    newBeast.exp -= newBeast.expToNext
    newBeast.level += 1
    newBeast.expToNext = calculateExpToNext(newBeast.level)
    
    const baseData = getBaseBeastData(newBeast.beastId)
    if (baseData) {
      const stats = calculateBeastStats(
        baseData.baseHp,
        baseData.baseAttack,
        baseData.baseDefense,
        baseData.baseSpeed,
        newBeast.level,
        newBeast.evolutionStage,
        newBeast.intimacy
      )
      newBeast.maxHp = stats.maxHp
      newBeast.hp = stats.maxHp
      newBeast.attack = stats.attack
      newBeast.defense = stats.defense
      newBeast.speed = stats.speed
    }
  }
  
  return newBeast
}

const getBaseBeastData = (beastId: string) => {
  return BEASTS_DATA.find((b: any) => b.id === beastId)
}

export const updateEggProgress = (egg: Egg): Egg => {
  const now = Date.now()
  const elapsed = now - egg.startTime
  const progress = Math.min(100, (elapsed / egg.hatchTime) * 100)
  
  return {
    ...egg,
    hatchProgress: progress
  }
}
