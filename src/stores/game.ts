import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayerData, OwnedBeast, Egg, BattleState, Rarity, Element, ActiveBond, BondEffect, TeamSlot } from '@/types'
import { TEAM_SIZE } from '@/types'
import { 
  saveGame, 
  loadGame, 
  clearGame, 
  generateId, 
  calculateExpToNext, 
  calculateBeastStats,
  checkLevelUp,
  calculateOfflineEarnings,
  updateEggProgress
} from '@/utils/storage'
import { getBeastById, BEASTS_DATA } from '@/data/beasts'
import { getFoodById, FOODS_DATA } from '@/data/foods'
import { STAGES_DATA, getStageById } from '@/data/stages'
import { getEggPoolById, selectRandomBeast } from '@/data/eggs'
import { BONDS_DATA } from '@/data/bonds'

export const useGameStore = defineStore('game', () => {
  const player = ref<PlayerData | null>(null)
  const battle = ref<BattleState>({
    inBattle: false,
    playerBeast: null,
    enemy: null,
    turn: 'player',
    battleLog: [],
    playerHp: 0,
    enemyHp: 0,
    stageId: null,
    rewards: []
  })
  const currentEnemyIndex = ref(0)
  const offlineRewards = ref<{
    gold: number
    exp: number
    foodItems: { [key: string]: number }
    duration: number
  } | null>(null)

  const activeBeast = computed(() => {
    if (!player.value || !player.value.activeBeastId) return null
    const activeId = player.value.activeBeastId
    return player.value.ownedBeasts.find(b => b.instanceId === activeId) || null
  })

  const teamBeasts = computed<(OwnedBeast | null)[]>(() => {
    if (!player.value) return [null, null, null]
    return player.value.team.map(id => {
      if (!id) return null
      return player.value!.ownedBeasts.find(b => b.instanceId === id) || null
    })
  })

  const teamBeastIds = computed(() => {
    return teamBeasts.value.filter(b => b !== null).map(b => b!.beastId)
  })

  const calculateBondsFromBeasts = (beasts: OwnedBeast[]): ActiveBond[] => {
    if (beasts.length === 0) return []

    const beastIds = new Set(beasts.map(b => b.beastId))
    const elements: Element[] = []
    const rarities: Rarity[] = []

    for (const beast of beasts) {
      const data = getBeastById(beast.beastId)
      if (data) {
        elements.push(data.element)
        rarities.push(data.rarity)
      }
    }

    const elementCounts: Partial<Record<Element, number>> = {}
    for (const el of elements) {
      elementCounts[el] = (elementCounts[el] || 0) + 1
    }

    const rarityCounts: Partial<Record<Rarity, number>> = {}
    for (const r of rarities) {
      rarityCounts[r] = (rarityCounts[r] || 0) + 1
    }

    const result: ActiveBond[] = []

    for (const bondConfig of BONDS_DATA) {
      let currentCount = 0
      const matchedBeastIds: string[] = []

      if (bondConfig.category === 'element') {
        const el = bondConfig.condition as Element
        currentCount = elementCounts[el] || 0
        for (const beast of beasts) {
          const data = getBeastById(beast.beastId)
          if (data && data.element === el && !matchedBeastIds.includes(beast.beastId)) {
            matchedBeastIds.push(beast.beastId)
          }
        }
      } else if (bondConfig.category === 'rarity') {
        const r = bondConfig.condition as Rarity
        currentCount = rarityCounts[r] || 0
        for (const beast of beasts) {
          const data = getBeastById(beast.beastId)
          if (data && data.rarity === r && !matchedBeastIds.includes(beast.beastId)) {
            matchedBeastIds.push(beast.beastId)
          }
        }
      } else if (bondConfig.category === 'special') {
        const condArr = bondConfig.condition as string[]

        if (bondConfig.id === 'special_five_elements') {
          const fiveEls = ['fire', 'water', 'wood', 'earth', 'metal'] as Element[]
          let matchCount = 0
          for (const el of fiveEls) {
            if (elementCounts[el] && elementCounts[el]! > 0) {
              matchCount++
              for (const beast of beasts) {
                const data = getBeastById(beast.beastId)
                if (data && data.element === el && !matchedBeastIds.includes(beast.beastId)) {
                  matchedBeastIds.push(beast.beastId)
                  break
                }
              }
            }
          }
          currentCount = matchCount
        } else if (bondConfig.id === 'special_all_elements') {
          const allEls = ['fire', 'water', 'wood', 'earth', 'metal', 'thunder', 'wind', 'ice'] as Element[]
          let matchCount = 0
          for (const el of allEls) {
            if (elementCounts[el] && elementCounts[el]! > 0) {
              matchCount++
              for (const beast of beasts) {
                const data = getBeastById(beast.beastId)
                if (data && data.element === el && !matchedBeastIds.includes(beast.beastId)) {
                  matchedBeastIds.push(beast.beastId)
                  break
                }
              }
            }
          }
          currentCount = matchCount
        } else {
          for (const condId of condArr) {
            if (beastIds.has(condId)) {
              currentCount++
              matchedBeastIds.push(condId)
            }
          }
        }
      }

      result.push({
        config: bondConfig,
        matchedBeastIds,
        currentCount,
        active: currentCount >= bondConfig.requiredCount
      })
    }

    return result
  }

  const ownedBonds = computed<ActiveBond[]>(() => {
    if (!player.value) return []
    return calculateBondsFromBeasts(player.value.ownedBeasts)
  })

  const activeBonds = computed<ActiveBond[]>(() => {
    const inTeam = teamBeasts.value.filter((b): b is OwnedBeast => b !== null)
    return calculateBondsFromBeasts(inTeam)
  })

  const stages = computed(() => {
    if (!player.value) return STAGES_DATA
    return STAGES_DATA.map(stage => ({
      ...stage,
      completed: player.value!.completedStages.includes(stage.id),
      unlocked: stage.id === 'stage_1' || 
        player.value!.completedStages.includes(STAGES_DATA[STAGES_DATA.findIndex(s => s.id === stage.id) - 1]?.id || '')
    }))
  })

  const discoveredBeasts = computed(() => {
    if (!player.value) return []
    return BEASTS_DATA.map(beast => ({
      ...beast,
      discovered: player.value!.discoveredBeasts.includes(beast.id)
    }))
  })

  const totalBondEffects = computed<BondEffect>(() => {
    const total: BondEffect = { hpPercent: 0, attackPercent: 0, defensePercent: 0, speedPercent: 0 }
    for (const bond of activeBonds.value) {
      if (bond.active) {
        total.hpPercent += bond.config.effects.hpPercent
        total.attackPercent += bond.config.effects.attackPercent
        total.defensePercent += bond.config.effects.defensePercent
        total.speedPercent += bond.config.effects.speedPercent
      }
    }
    return total
  })

  const activeBondList = computed(() => {
    return activeBonds.value.filter(b => b.active)
  })

  const getBeastBondBonus = (beastId: string): BondEffect => {
    const total: BondEffect = { hpPercent: 0, attackPercent: 0, defensePercent: 0, speedPercent: 0 }
    for (const bond of activeBonds.value) {
      if (bond.active && bond.matchedBeastIds.includes(beastId)) {
        total.hpPercent += bond.config.effects.hpPercent
        total.attackPercent += bond.config.effects.attackPercent
        total.defensePercent += bond.config.effects.defensePercent
        total.speedPercent += bond.config.effects.speedPercent
      }
    }
    return total
  }

  const applyBondToStats = (beast: OwnedBeast): { 
    hp: number; maxHp: number; attack: number; defense: number; speed: number 
  } => {
    const bonus = getBeastBondBonus(beast.beastId)
    return {
      hp: Math.floor(beast.hp * (1 + bonus.hpPercent / 100)),
      maxHp: Math.floor(beast.maxHp * (1 + bonus.hpPercent / 100)),
      attack: Math.floor(beast.attack * (1 + bonus.attackPercent / 100)),
      defense: Math.floor(beast.defense * (1 + bonus.defensePercent / 100)),
      speed: Math.floor(beast.speed * (1 + bonus.speedPercent / 100))
    }
  }

  const initGame = () => {
    const saved = loadGame()
    if (saved) {
      player.value = saved
      ensureTeamData()
      const earnings = calculateOfflineEarnings(saved.lastLoginAt)
      if (earnings.duration > 60000) {
        offlineRewards.value = earnings
      }
      updateAllEggs()
    } else {
      createNewGame()
    }
  }

  const createNewGame = () => {
    const now = Date.now()
    player.value = {
      name: '修仙者',
      level: 1,
      exp: 0,
      expToNext: calculateExpToNext(1),
      gold: 500,
      spiritStone: 50,
      eggs: [],
      ownedBeasts: [],
      activeBeastId: null,
      team: [null, null, null],
      inventory: {
        foods: {
          'spirit_fruit': 10,
          'poison_frog': 5
        },
        materials: {}
      },
      discoveredBeasts: ['snake', 'wolf', 'crane', 'fox', 'bear', 'phoenix'],
      completedStages: [],
      totalPlayTime: 0,
      lastLoginAt: now,
      createdAt: now,
      offlineEarningsCollected: false
    }
    
    giveEgg('egg_common')
    
    saveCurrentGame()
  }

  const ensureTeamData = () => {
    if (!player.value) return
    if (!player.value.team || player.value.team.length !== TEAM_SIZE) {
      player.value.team = [null, null, null]
      if (player.value.activeBeastId) {
        player.value.team[0] = player.value.activeBeastId
      }
      saveCurrentGame()
    }
  }

  const saveCurrentGame = () => {
    if (player.value) {
      saveGame(player.value)
    }
  }

  const collectOfflineRewards = () => {
    if (!player.value || !offlineRewards.value) return
    
    const rewards = offlineRewards.value
    player.value.gold += rewards.gold
    player.value.exp += rewards.exp
    
    for (const [foodId, amount] of Object.entries(rewards.foodItems)) {
      player.value.inventory.foods[foodId] = (player.value.inventory.foods[foodId] || 0) + amount
    }
    
    while (player.value.exp >= player.value.expToNext) {
      player.value.exp -= player.value.expToNext
      player.value.level += 1
      player.value.expToNext = calculateExpToNext(player.value.level)
    }
    
    offlineRewards.value = null
    saveCurrentGame()
  }

  const giveEgg = (eggPoolId: string) => {
    const pool = getEggPoolById(eggPoolId)
    if (!pool || !player.value) return
    
    const beastId = selectRandomBeast(pool)
    const beastData = getBeastById(beastId)
    if (!beastData) return
    
    const egg: Egg = {
      id: generateId(),
      beastId,
      rarity: pool.rarity as Rarity,
      hatchProgress: 0,
      hatchTime: beastData.hatchTime,
      startTime: Date.now()
    }
    
    player.value.eggs.push(egg)
    saveCurrentGame()
  }

  const buyEgg = (eggPoolId: string): boolean => {
    const pool = getEggPoolById(eggPoolId)
    if (!pool || !player.value) return false
    
    if (pool.currency === 'gold' && player.value.gold < pool.price) return false
    if (pool.currency === 'spiritStone' && player.value.spiritStone < pool.price) return false
    
    if (pool.currency === 'gold') {
      player.value.gold -= pool.price
    } else {
      player.value.spiritStone -= pool.price
    }
    
    giveEgg(eggPoolId)
    return true
  }

  const updateAllEggs = () => {
    if (!player.value) return
    player.value.eggs = player.value.eggs.map(egg => updateEggProgress(egg))
  }

  const hatchEgg = (eggId: string): OwnedBeast | null => {
    if (!player.value) return null
    
    const eggIndex = player.value.eggs.findIndex(e => e.id === eggId)
    if (eggIndex === -1) return null
    
    const egg = player.value.eggs[eggIndex]
    if (egg.hatchProgress < 100) return null
    
    const beastData = getBeastById(egg.beastId)
    if (!beastData) return null
    
    const stats = calculateBeastStats(
      beastData.baseHp,
      beastData.baseAttack,
      beastData.baseDefense,
      beastData.baseSpeed,
      1,
      1,
      0
    )
    
    const newBeast: OwnedBeast = {
      instanceId: generateId(),
      beastId: egg.beastId,
      name: beastData.name,
      level: 1,
      exp: 0,
      expToNext: calculateExpToNext(1),
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      intimacy: 0,
      hunger: 100,
      evolutionStage: 1,
      skills: beastData.skills.map(s => ({ ...s })),
      createdAt: Date.now(),
      lastFedAt: Date.now()
    }
    
    player.value.ownedBeasts.push(newBeast)
    
    if (!player.value.discoveredBeasts.includes(egg.beastId)) {
      player.value.discoveredBeasts.push(egg.beastId)
    }
    
    if (!player.value.activeBeastId) {
      player.value.activeBeastId = newBeast.instanceId
    }
    
    if (!player.value.team[0]) {
      player.value.team[0] = newBeast.instanceId
    } else if (!player.value.team[1]) {
      if (player.value.team[0] !== newBeast.instanceId) {
        player.value.team[1] = newBeast.instanceId
      }
    } else if (!player.value.team[2]) {
      if (player.value.team[0] !== newBeast.instanceId && player.value.team[1] !== newBeast.instanceId) {
        player.value.team[2] = newBeast.instanceId
      }
    }
    
    player.value.eggs.splice(eggIndex, 1)
    
    saveCurrentGame()
    return newBeast
  }

  const setActiveBeast = (instanceId: string) => {
    if (!player.value) return
    const beast = player.value.ownedBeasts.find(b => b.instanceId === instanceId)
    if (!beast) return
    player.value.activeBeastId = instanceId
    const currentTeamSet = new Set(player.value.team.filter(Boolean))
    if (!currentTeamSet.has(instanceId)) {
      let placed = false
      for (let i = 0; i < TEAM_SIZE; i++) {
        if (!player.value.team[i]) {
          player.value.team[i] = instanceId
          placed = true
          break
        }
      }
      if (!placed) {
        player.value.team[0] = instanceId
      }
    }
    saveCurrentGame()
  }

  const setTeamMember = (slot: TeamSlot, instanceId: string | null): boolean => {
    if (!player.value) return false
    if (slot < 0 || slot >= TEAM_SIZE) return false
    if (instanceId !== null) {
      const beast = player.value.ownedBeasts.find(b => b.instanceId === instanceId)
      if (!beast) return false
      for (let i = 0; i < TEAM_SIZE; i++) {
        if (i !== slot && player.value.team[i] === instanceId) {
          player.value.team[i] = null
        }
      }
    }
    player.value.team[slot] = instanceId
    if (slot === 0 && instanceId) {
      player.value.activeBeastId = instanceId
    }
    if (!player.value.team[0]) {
      const firstInTeam = player.value.team.find((id, i) => i > 0 && id)
      if (firstInTeam) {
        player.value.team[0] = firstInTeam
        player.value.team[player.value.team.indexOf(firstInTeam)] = null
        player.value.activeBeastId = firstInTeam
      } else {
        player.value.activeBeastId = null
      }
    } else {
      if (!player.value.activeBeastId || !player.value.team.includes(player.value.activeBeastId)) {
        player.value.activeBeastId = player.value.team[0]
      }
    }
    saveCurrentGame()
    return true
  }

  const clearTeamSlot = (slot: TeamSlot) => {
    setTeamMember(slot, null)
  }

  const swapTeamMembers = (slotA: TeamSlot, slotB: TeamSlot) => {
    if (!player.value) return
    if (slotA < 0 || slotA >= TEAM_SIZE || slotB < 0 || slotB >= TEAM_SIZE) return
    const temp = player.value.team[slotA]
    player.value.team[slotA] = player.value.team[slotB]
    player.value.team[slotB] = temp
    if (slotA === 0 && player.value.team[0]) {
      player.value.activeBeastId = player.value.team[0]
    } else if (slotB === 0 && player.value.team[0]) {
      player.value.activeBeastId = player.value.team[0]
    } else if (!player.value.team[0]) {
      player.value.activeBeastId = null
    }
    saveCurrentGame()
  }

  const feedBeast = (beastInstanceId: string, foodId: string): boolean => {
    if (!player.value) return false
    
    const beastIndex = player.value.ownedBeasts.findIndex(b => b.instanceId === beastInstanceId)
    if (beastIndex === -1) return false
    
    const foodCount = player.value.inventory.foods[foodId] || 0
    if (foodCount <= 0) return false
    
    const food = getFoodById(foodId)
    if (!food) return false
    
    const beast = player.value.ownedBeasts[beastIndex]
    const beastData = getBeastById(beast.beastId)
    
    let bonusMultiplier = 1
    if (beastData && beastData.favoriteFood.includes(foodId)) {
      bonusMultiplier = 1.5
    }
    
    beast.exp += Math.floor(food.expBonus * bonusMultiplier)
    beast.intimacy = Math.min(1000, beast.intimacy + Math.floor(food.intimacyBonus * bonusMultiplier))
    beast.hunger = Math.min(100, beast.hunger + food.hungerRestore)
    beast.lastFedAt = Date.now()
    
    player.value.ownedBeasts[beastIndex] = checkLevelUp(beast)
    player.value.inventory.foods[foodId] -= 1
    
    saveCurrentGame()
    return true
  }

  const unlockSkill = (beastInstanceId: string, skillIndex: number): boolean => {
    if (!player.value) return false
    
    const beast = player.value.ownedBeasts.find(b => b.instanceId === beastInstanceId)
    if (!beast || !beast.skills[skillIndex]) return false
    
    const skill = beast.skills[skillIndex]
    if (skill.unlocked) return false
    
    const requiredLevel = (skillIndex + 1) * 5
    if (beast.level < requiredLevel) return false
    
    const cost = 100 * (skillIndex + 1)
    if (player.value.gold < cost) return false
    
    player.value.gold -= cost
    beast.skills[skillIndex].unlocked = true
    
    saveCurrentGame()
    return true
  }

  const upgradeSkill = (beastInstanceId: string, skillIndex: number): boolean => {
    if (!player.value) return false
    
    const beast = player.value.ownedBeasts.find(b => b.instanceId === beastInstanceId)
    if (!beast || !beast.skills[skillIndex]) return false
    
    const skill = beast.skills[skillIndex]
    if (!skill.unlocked) return false
    if (skill.level >= 10) return false
    
    const cost = 50 * skill.level * (skillIndex + 1)
    if (player.value.spiritStone < cost) return false
    
    player.value.spiritStone -= cost
    skill.level += 1
    skill.damage = Math.floor(skill.damage * 1.2)
    
    saveCurrentGame()
    return true
  }

  const startBattle = (stageId: string): boolean => {
    if (!player.value || !player.value.activeBeastId) return false
    if (battle.value.inBattle) return false
    
    const stage = getStageById(stageId)
    const playerBeast = player.value.ownedBeasts.find(b => b.instanceId === player.value!.activeBeastId)
    
    if (!stage || !playerBeast || playerBeast.hp <= 0) return false

    const bondStats = applyBondToStats(playerBeast)
    
    currentEnemyIndex.value = 0
    const firstEnemy = { ...stage.enemies[0] }
    
    const battleBeast: OwnedBeast = {
      ...playerBeast,
      hp: bondStats.hp,
      maxHp: bondStats.maxHp,
      attack: bondStats.attack,
      defense: bondStats.defense,
      speed: bondStats.speed
    }
    
    battle.value = {
      inBattle: true,
      playerBeast: battleBeast,
      enemy: firstEnemy,
      turn: battleBeast.speed >= firstEnemy.speed ? 'player' : 'enemy',
      battleLog: [`⚔️ 进入 ${stage.name}！遭遇 ${firstEnemy.name}！`],
      playerHp: battleBeast.hp,
      enemyHp: firstEnemy.hp,
      stageId,
      rewards: []
    }
    
    return true
  }

  const playerAttack = (skillIndex: number = 0): string => {
    if (!battle.value.inBattle || battle.value.turn !== 'player') return ''
    if (!battle.value.playerBeast || !battle.value.enemy) return ''
    
    const skill = battle.value.playerBeast.skills[skillIndex]
    if (!skill || !skill.unlocked) return ''
    
    const baseDamage = skill.damage + battle.value.playerBeast.attack
    const defense = battle.value.enemy.defense
    const damage = Math.max(1, baseDamage - defense * 0.5)
    const critChance = Math.random()
    const isCrit = critChance > 0.85
    const finalDamage = Math.floor(isCrit ? damage * 1.5 : damage)
    
    battle.value.enemyHp = Math.max(0, battle.value.enemyHp - finalDamage)
    
    const log = isCrit 
      ? `💥 暴击！${battle.value.playerBeast.name} 使用 ${skill.name} 造成 ${finalDamage} 点伤害！`
      : `⚡ ${battle.value.playerBeast.name} 使用 ${skill.name} 造成 ${finalDamage} 点伤害！`
    
    battle.value.battleLog.push(log)
    
    if (battle.value.enemyHp <= 0) {
      handleEnemyDefeated()
    } else {
      battle.value.turn = 'enemy'
      setTimeout(() => enemyAttack(), 1000)
    }
    
    return log
  }

  const enemyAttack = () => {
    if (!battle.value.inBattle || battle.value.turn !== 'enemy') return
    if (!battle.value.playerBeast || !battle.value.enemy) return
    
    const baseDamage = battle.value.enemy.attack
    const defense = battle.value.playerBeast.defense
    const damage = Math.max(1, baseDamage - defense * 0.5)
    const finalDamage = Math.floor(damage)
    
    battle.value.playerHp = Math.max(0, battle.value.playerHp - finalDamage)
    
    battle.value.battleLog.push(`👹 ${battle.value.enemy.name} 发动攻击，造成 ${finalDamage} 点伤害！`)
    
    if (battle.value.playerHp <= 0) {
      handleBattleLost()
    } else {
      battle.value.turn = 'player'
    }
  }

  const handleEnemyDefeated = () => {
    if (!battle.value.stageId || !player.value) return
    
    const stage = getStageById(battle.value.stageId)
    if (!stage) return
    
    battle.value.battleLog.push(`🎉 击败了 ${battle.value.enemy?.name}！`)
    
    currentEnemyIndex.value += 1
    
    if (currentEnemyIndex.value >= stage.enemies.length) {
      handleBattleWon()
    } else {
      const nextEnemy = { ...stage.enemies[currentEnemyIndex.value] }
      battle.value.enemy = nextEnemy
      battle.value.enemyHp = nextEnemy.hp
      battle.value.battleLog.push(`⚔️ 新的敌人出现：${nextEnemy.name}！`)
      
      battle.value.turn = battle.value.playerBeast!.speed >= nextEnemy.speed ? 'player' : 'enemy'
      if (battle.value.turn === 'enemy') {
        setTimeout(() => enemyAttack(), 1000)
      }
    }
  }

  const handleBattleWon = () => {
    if (!battle.value.stageId || !player.value || !battle.value.playerBeast) return
    
    const stage = getStageById(battle.value.stageId)
    if (!stage) return
    
    battle.value.battleLog.push('🏆 战斗胜利！')
    
    battle.value.rewards = [...stage.rewards]
    
    for (const reward of stage.rewards) {
      if (reward.type === 'gold') {
        player.value.gold += reward.amount
      } else if (reward.type === 'spiritStone') {
        player.value.spiritStone += reward.amount
      } else if (reward.type === 'exp') {
        const beastIndex = player.value.ownedBeasts.findIndex(b => b.instanceId === battle.value!.playerBeast!.instanceId)
        if (beastIndex !== -1) {
          player.value.ownedBeasts[beastIndex].exp += reward.amount
          player.value.ownedBeasts[beastIndex] = checkLevelUp(player.value.ownedBeasts[beastIndex])
        }
        player.value.exp += Math.floor(reward.amount * 0.5)
        while (player.value.exp >= player.value.expToNext) {
          player.value.exp -= player.value.expToNext
          player.value.level += 1
          player.value.expToNext = calculateExpToNext(player.value.level)
        }
      } else if (reward.type === 'food' && reward.itemId) {
        player.value.inventory.foods[reward.itemId] = (player.value.inventory.foods[reward.itemId] || 0) + reward.amount
      } else if (reward.type === 'egg' && reward.itemId) {
        giveEgg(reward.itemId)
      }
    }
    
    const beastIndex = player.value.ownedBeasts.findIndex(b => b.instanceId === battle.value!.playerBeast!.instanceId)
    if (beastIndex !== -1) {
      player.value.ownedBeasts[beastIndex].hp = battle.value.playerHp
    }
    
    if (!player.value.completedStages.includes(stage.id)) {
      player.value.completedStages.push(stage.id)
    }
    
    battle.value.inBattle = false
    saveCurrentGame()
  }

  const handleBattleLost = () => {
    if (!player.value || !battle.value.playerBeast) return
    
    battle.value.battleLog.push('💀 战斗失败...')
    
    const beastIndex = player.value.ownedBeasts.findIndex(b => b.instanceId === battle.value!.playerBeast!.instanceId)
    if (beastIndex !== -1) {
      player.value.ownedBeasts[beastIndex].hp = Math.floor(player.value.ownedBeasts[beastIndex].maxHp * 0.2)
    }
    
    battle.value.inBattle = false
    battle.value.rewards = []
    saveCurrentGame()
  }

  const fleeBattle = () => {
    if (!battle.value.inBattle || !player.value || !battle.value.playerBeast) return
    
    battle.value.battleLog.push('🏃 成功逃离战斗！')
    
    const beastIndex = player.value.ownedBeasts.findIndex(b => b.instanceId === battle.value!.playerBeast!.instanceId)
    if (beastIndex !== -1) {
      player.value.ownedBeasts[beastIndex].hp = battle.value.playerHp
    }
    
    battle.value.inBattle = false
    battle.value.rewards = []
    saveCurrentGame()
  }

  const healBeast = (beastInstanceId: string): boolean => {
    if (!player.value) return false
    
    const beast = player.value.ownedBeasts.find(b => b.instanceId === beastInstanceId)
    if (!beast) return false
    
    const healCost = Math.floor(beast.maxHp * 0.5)
    if (player.value.gold < healCost) return false
    
    player.value.gold -= healCost
    beast.hp = beast.maxHp
    
    saveCurrentGame()
    return true
  }

  const buyFood = (foodId: string, amount: number = 1): boolean => {
    const food = getFoodById(foodId)
    if (!food || !player.value) return false
    
    const totalCost = food.price * amount
    if (player.value.gold < totalCost) return false
    
    player.value.gold -= totalCost
    player.value.inventory.foods[foodId] = (player.value.inventory.foods[foodId] || 0) + amount
    
    saveCurrentGame()
    return true
  }

  const resetGame = () => {
    clearGame()
    battle.value = {
      inBattle: false,
      playerBeast: null,
      enemy: null,
      turn: 'player',
      battleLog: [],
      playerHp: 0,
      enemyHp: 0,
      stageId: null,
      rewards: []
    }
    offlineRewards.value = null
    createNewGame()
  }

  return {
    player,
    battle,
    activeBeast,
    stages,
    discoveredBeasts,
    offlineRewards,
    currentEnemyIndex,
    activeBonds,
    ownedBonds,
    totalBondEffects,
    activeBondList,
    teamBeasts,
    teamBeastIds,
    initGame,
    saveCurrentGame,
    collectOfflineRewards,
    buyEgg,
    giveEgg,
    updateAllEggs,
    hatchEgg,
    setActiveBeast,
    setTeamMember,
    clearTeamSlot,
    swapTeamMembers,
    feedBeast,
    unlockSkill,
    upgradeSkill,
    startBattle,
    playerAttack,
    fleeBattle,
    healBeast,
    buyFood,
    resetGame,
    getBeastBondBonus,
    applyBondToStats
  }
})
