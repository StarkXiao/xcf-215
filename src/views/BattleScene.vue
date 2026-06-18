<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { getBeastById } from '@/data/beasts'
import { getStageById } from '@/data/stages'
import { BattleScene as PixiBattleScene } from '@/utils/pixi'
import { ELEMENT_COLORS, RARITY_COLORS, BOND_CATEGORY_COLORS } from '@/types'
import type { BondEffect } from '@/types'

const router = useRouter()
const gameStore = useGameStore()
const pixiContainer = ref<HTMLElement | null>(null)
const showResult = ref(false)
const battleEnded = ref(false)
let battleScene: PixiBattleScene | null = null
let logScrollInterval: number | null = null

const playerBeastData = () => {
  if (!gameStore.battle.playerBeast) return null
  return getBeastById(gameStore.battle.playerBeast.beastId)
}

const currentStage = () => {
  if (!gameStore.battle.stageId) return null
  return getStageById(gameStore.battle.stageId)
}

const playerHpPercent = () => {
  if (!gameStore.battle.playerBeast) return 0
  return (gameStore.battle.playerHp / gameStore.battle.playerBeast.maxHp) * 100
}

const enemyHpPercent = () => {
  if (!gameStore.battle.enemy) return 0
  return (gameStore.battle.enemyHp / gameStore.battle.enemy.maxHp) * 100
}

const availableSkills = () => {
  if (!gameStore.battle.playerBeast) return []
  return gameStore.battle.playerBeast.skills
    .map((skill, index) => ({ ...skill, index }))
    .filter(skill => skill.unlocked)
}

const battleBondBonus = computed<BondEffect | null>(() => {
  if (!gameStore.battle.playerBeast) return null
  return gameStore.getBeastBondBonus(gameStore.battle.playerBeast.beastId)
})

const battleBondList = computed(() => {
  if (!gameStore.battle.playerBeast) return []
  return gameStore.activeBondList.filter(b => b.matchedBeastIds.includes(gameStore.battle.playerBeast!.beastId))
})

const hasBattleBond = computed(() => {
  if (!battleBondBonus.value) return false
  const b = battleBondBonus.value
  return b.hpPercent > 0 || b.attackPercent > 0 || b.defensePercent > 0 || b.speedPercent > 0
})

onMounted(() => {
  if (!gameStore.battle.inBattle) {
    router.push('/battle')
    return
  }
  
  nextTick(() => {
    initBattleScene()
  })
  
  logScrollInterval = window.setInterval(() => {
    const logContainer = document.querySelector('.battle-log')
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight
    }
  }, 100)
})

onUnmounted(() => {
  if (battleScene) {
    battleScene.destroy()
  }
  if (logScrollInterval) {
    clearInterval(logScrollInterval)
  }
})

const initBattleScene = () => {
  if (!pixiContainer.value) return
  
  const rect = pixiContainer.value.getBoundingClientRect()
  battleScene = new PixiBattleScene(pixiContainer.value, rect.width, rect.height)
  
  const stage = currentStage()
  if (stage) {
    battleScene.setBackground(stage.background)
  }
  
  const playerData = playerBeastData()
  if (playerData && gameStore.battle.playerBeast) {
    battleScene.setPlayerBeast(
      gameStore.battle.playerBeast.beastId,
      playerData.element,
      playerData.rarity
    )
  }
  
  if (gameStore.battle.enemy) {
    battleScene.setEnemy(
      gameStore.battle.enemy.icon,
      gameStore.battle.enemy.element
    )
  }
  
  const handleResize = () => {
    if (pixiContainer.value && battleScene) {
      const rect = pixiContainer.value.getBoundingClientRect()
      battleScene.resize(rect.width, rect.height)
    }
  }
  
  window.addEventListener('resize', handleResize)
}

const useSkill = (skillIndex: number) => {
  if (gameStore.battle.turn !== 'player' || battleEnded.value) return
  
  const log = gameStore.playerAttack(skillIndex)
  const scene = battleScene
  
  if (scene) {
    scene.playerAttack(() => {
      const isCrit = log.includes('暴击')
      const damageMatch = log.match(/(\d+)\s*点伤害/)
      const damage = damageMatch ? parseInt(damageMatch[1]) : 0
      
      if (gameStore.battle.enemy && scene.enemySprite) {
        scene.createDamageText(
          damage,
          scene.enemySprite.x,
          scene.enemySprite.y - 30,
          isCrit
        )
      }
    })
  }
  
  checkBattleEnd()
}

const flee = () => {
  gameStore.fleeBattle()
  router.push('/battle')
}

const checkBattleEnd = () => {
  setTimeout(() => {
    if (!gameStore.battle.inBattle && !battleEnded.value) {
      battleEnded.value = true
      showResult.value = true
    }
  }, 1500)
}

watch(() => gameStore.battle.inBattle, (inBattle) => {
  if (!inBattle && !battleEnded.value) {
    battleEnded.value = true
    setTimeout(() => {
      showResult.value = true
    }, 500)
  }
})

watch(() => gameStore.battle.turn, (turn) => {
  const scene = battleScene
  if (turn === 'enemy' && scene && !battleEnded.value) {
    setTimeout(() => {
      if (gameStore.battle.inBattle && gameStore.battle.enemy) {
        scene.enemyAttack()
        const damageMatch = gameStore.battle.battleLog[gameStore.battle.battleLog.length - 1]?.match(/(\d+)\s*点伤害/)
        const damage = damageMatch ? parseInt(damageMatch[1]) : 0
        
        if (scene.playerSprite) {
          scene.createDamageText(
            damage,
            scene.playerSprite.x,
            scene.playerSprite.y - 30,
            false
          )
        }
        
        setTimeout(() => {
          checkBattleEnd()
        }, 800)
      }
    }, 1200)
  }
})

const closeResult = () => {
  showResult.value = false
  router.push('/battle')
}

const getRewardText = (reward: any) => {
  const icon = reward.type === 'gold' ? '💰' : 
               reward.type === 'spiritStone' ? '💎' : 
               reward.type === 'exp' ? '✨' : 
               reward.type === 'egg' ? '🥚' : '🍎'
  return `${icon} x${reward.amount}`
}
</script>

<template>
  <div class="battle-scene-container" v-if="gameStore.battle.inBattle || showResult">
    <div class="battle-topbar">
      <div class="stage-info" v-if="currentStage()">
        <span class="stage-name">{{ currentStage()!.name }}</span>
        <span class="wave-info">
          第 {{ gameStore.currentEnemyIndex + 1 }} / {{ currentStage()!.enemies.length }} 波
        </span>
      </div>
      <button class="btn-flee" @click="flee">
        🏃 逃跑
      </button>
    </div>

    <div class="battle-arena">
      <div class="combatant player-side">
        <div class="combatant-info" v-if="gameStore.battle.playerBeast">
          <div class="combatant-name">
            {{ gameStore.battle.playerBeast.name }}
            <span class="combatant-level">Lv.{{ gameStore.battle.playerBeast.level }}</span>
          </div>
          <div class="hp-bar-container">
            <div class="hp-bar">
              <div 
                class="hp-fill player-hp" 
                :style="{ width: playerHpPercent() + '%' }"
              ></div>
            </div>
            <span class="hp-text">{{ gameStore.battle.playerHp }}/{{ gameStore.battle.playerBeast.maxHp }}</span>
          </div>
        </div>
      </div>

      <div class="pixi-container" ref="pixiContainer"></div>

      <div class="combatant enemy-side">
        <div class="combatant-info" v-if="gameStore.battle.enemy">
          <div class="combatant-name">
            {{ gameStore.battle.enemy.name }}
            <span class="combatant-level">Lv.{{ gameStore.battle.enemy.level }}</span>
          </div>
          <div class="hp-bar-container">
            <div class="hp-bar">
              <div 
                class="hp-fill enemy-hp" 
                :style="{ width: enemyHpPercent() + '%' }"
              ></div>
            </div>
            <span class="hp-text">{{ gameStore.battle.enemyHp }}/{{ gameStore.battle.enemy.maxHp }}</span>
          </div>
        </div>
      </div>

      <div class="turn-indicator" :class="{ 'player-turn': gameStore.battle.turn === 'player' }">
        {{ gameStore.battle.turn === 'player' ? '⚡ 你的回合' : '⏳ 敌方回合' }}
      </div>
      <div class="bond-indicator" v-if="hasBattleBond">
        <span class="bond-indicator-icon">🔗</span>
        <span class="bond-indicator-text" v-if="battleBondBonus">
          <span v-if="battleBondBonus.attackPercent > 0">⚔️+{{ battleBondBonus.attackPercent }}% </span>
          <span v-if="battleBondBonus.defensePercent > 0">🛡️+{{ battleBondBonus.defensePercent }}% </span>
          <span v-if="battleBondBonus.speedPercent > 0">💨+{{ battleBondBonus.speedPercent }}% </span>
        </span>
      </div>
    </div>

    <div class="battle-log" ref="logContainer">
      <div 
        v-for="(log, index) in gameStore.battle.battleLog" 
        :key="index"
        class="log-item"
        :class="{ 
          'player-action': log.includes(gameStore.battle.playerBeast?.name || ''),
          'enemy-action': log.includes(gameStore.battle.enemy?.name || ''),
          'victory': log.includes('胜利'),
          'defeat': log.includes('失败')
        }"
      >
        {{ log }}
      </div>
    </div>

    <div class="skill-panel">
      <div class="skill-header">
        <span class="skill-title">⚔️ 选择技能</span>
        <span v-if="gameStore.battle.turn !== 'player'" class="waiting-text">
          等待敌方行动...
        </span>
      </div>
      <div class="skill-buttons">
        <button 
          v-for="skill in availableSkills()" 
          :key="skill.id"
          class="skill-btn"
          :disabled="gameStore.battle.turn !== 'player' || battleEnded"
          :style="{ 
            '--skill-color': ELEMENT_COLORS[skill.element],
            borderColor: ELEMENT_COLORS[skill.element] + '60'
          }"
          @click="useSkill(skill.index)"
        >
          <span class="skill-icon">{{ skill.icon }}</span>
          <span class="skill-name">{{ skill.name }}</span>
          <span class="skill-damage">
            {{ skill.damage + (gameStore.battle.playerBeast?.attack || 0) }}
          </span>
          <span class="skill-level">Lv.{{ skill.level }}</span>
        </button>
      </div>
    </div>

    <div class="modal-overlay result-overlay" v-if="showResult">
      <div class="modal result-modal">
        <div class="result-header" :class="{ victory: gameStore.battle.rewards.length > 0, defeat: gameStore.battle.rewards.length === 0 }">
          <span class="result-icon">
            {{ gameStore.battle.rewards.length > 0 ? '🏆' : '💀' }}
          </span>
          <h2 class="result-title">
            {{ gameStore.battle.rewards.length > 0 ? '战斗胜利！' : '战斗失败...' }}
          </h2>
        </div>
        
        <div class="result-content" v-if="gameStore.battle.rewards.length > 0">
          <p class="result-desc">恭喜你完成了挑战！</p>
          <div class="rewards-list">
            <h3 class="rewards-title">获得奖励</h3>
            <div class="rewards-grid">
              <div 
                v-for="(reward, index) in gameStore.battle.rewards" 
                :key="index"
                class="reward-item"
              >
                {{ getRewardText(reward) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="result-content" v-else>
          <p class="result-desc">你的灵兽受伤了，下次再来挑战吧！</p>
          <p class="result-tip">💡 提示：可以在喂养页面治疗灵兽</p>
        </div>
        
        <button class="btn btn-primary result-btn" @click="closeResult">
          {{ gameStore.battle.rewards.length > 0 ? '太棒了！' : '我知道了' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-scene-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-medium) 50%, var(--bg-light) 100%);
  z-index: 100;
}

.battle-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95));
  border-bottom: 2px solid var(--border-color);
}

.stage-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stage-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--accent-color);
}

.wave-info {
  font-size: 12px;
  color: var(--text-secondary);
}

.btn-flee {
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.8);
  border: 1px solid #EF4444;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-flee:hover {
  background: rgba(239, 68, 68, 1);
}

.battle-arena {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.combatant {
  position: absolute;
  top: 20px;
  width: 45%;
  z-index: 10;
}

.player-side {
  left: 10px;
}

.enemy-side {
  right: 10px;
}

.combatant-info {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  padding: 10px 12px;
  backdrop-filter: blur(5px);
  border: 1px solid var(--border-color);
}

.combatant-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.combatant-level {
  font-size: 11px;
  color: var(--accent-color);
  margin-left: 6px;
  font-weight: normal;
}

.hp-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hp-bar {
  flex: 1;
  height: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hp-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 5px;
}

.player-hp {
  background: linear-gradient(90deg, #22C55E, #16A34A);
}

.enemy-hp {
  background: linear-gradient(90deg, #EF4444, #DC2626);
}

.hp-text {
  font-size: 11px;
  color: var(--text-primary);
  min-width: 60px;
  text-align: right;
}

.pixi-container {
  width: 100%;
  height: 100%;
  max-height: 300px;
}

.turn-indicator {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.turn-indicator.player-turn {
  color: var(--accent-color);
  border-color: var(--accent-color);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.bond-indicator {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  font-size: 11px;
  font-weight: bold;
  color: var(--accent-color);
  white-space: nowrap;
}

.bond-indicator-icon {
  font-size: 12px;
}

.bond-indicator-text {
  display: flex;
  gap: 4px;
}

.battle-log {
  height: 100px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.5);
  margin: 0 16px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.log-item {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  line-height: 1.5;
  padding: 2px 6px;
  border-radius: 4px;
}

.log-item.player-action {
  color: #60A5FA;
  background: rgba(59, 130, 246, 0.1);
}

.log-item.enemy-action {
  color: #F87171;
  background: rgba(239, 68, 68, 0.1);
}

.log-item.victory {
  color: #34D399;
  background: rgba(34, 197, 94, 0.1);
  font-weight: bold;
}

.log-item.defeat {
  color: #F87171;
  background: rgba(239, 68, 68, 0.1);
  font-weight: bold;
}

.skill-panel {
  padding: 12px 16px 20px;
  background: linear-gradient(0deg, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95));
  border-top: 2px solid var(--border-color);
}

.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.skill-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
}

.waiting-text {
  font-size: 12px;
  color: var(--text-muted);
  animation: pulse 1s infinite;
}

.skill-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.skill-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid;
  border-radius: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.skill-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 20px var(--skill-color);
  background: rgba(0, 0, 0, 0.5);
}

.skill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-icon {
  font-size: 24px;
}

.skill-name {
  flex: 1;
  font-size: 13px;
  font-weight: bold;
  text-align: left;
}

.skill-damage {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
}

.skill-level {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 10px;
  color: var(--text-muted);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.result-overlay {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-modal {
  background: linear-gradient(135deg, var(--bg-dark), var(--bg-medium));
  border: 2px solid var(--secondary-color);
  border-radius: 20px;
  padding: 0;
  max-width: 90%;
  width: 360px;
  overflow: hidden;
  animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-header {
  padding: 30px 24px;
  text-align: center;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
  border-bottom: 2px solid rgba(34, 197, 94, 0.3);
}

.result-header.defeat {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
  border-bottom-color: rgba(239, 68, 68, 0.3);
}

.result-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 12px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.result-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--accent-color);
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.result-header.defeat .result-title {
  color: #EF4444;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}

.result-content {
  padding: 24px;
  text-align: center;
}

.result-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.result-tip {
  font-size: 12px;
  color: var(--text-muted);
  padding: 10px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  margin-top: 12px;
}

.rewards-list {
  margin-top: 16px;
}

.rewards-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 12px;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.rewards-grid .reward-item {
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  color: var(--text-primary);
}

.result-btn {
  width: calc(100% - 48px);
  margin: 0 24px 24px;
}

@media (max-width: 480px) {
  .skill-buttons {
    grid-template-columns: 1fr;
  }
  
  .combatant-info {
    padding: 8px 10px;
  }
  
  .combatant-name {
    font-size: 12px;
  }
  
  .hp-text {
    font-size: 10px;
    min-width: 45px;
  }
}
</style>
