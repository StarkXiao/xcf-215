<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { getBeastById } from '@/data/beasts'
import { RARITY_COLORS, ELEMENT_COLORS, ELEMENT_NAMES, RARITY_NAMES, BOND_CATEGORY_COLORS } from '@/types'
import type { BondEffect } from '@/types'

const router = useRouter()
const gameStore = useGameStore()

const activeBeastData = computed(() => {
  if (!gameStore.activeBeast) return null
  return getBeastById(gameStore.activeBeast.beastId)
})

const canBattle = computed(() => {
  return gameStore.activeBeast && gameStore.activeBeast.hp > 0
})

const activeBeastBondBonus = computed<BondEffect | null>(() => {
  if (!gameStore.activeBeast) return null
  return gameStore.getBeastBondBonus(gameStore.activeBeast.beastId)
})

const activeBeastBondList = computed(() => {
  if (!gameStore.activeBeast) return []
  return gameStore.activeBondList.filter(b => b.matchedBeastIds.includes(gameStore.activeBeast!.beastId))
})

const hasBondBonus = computed(() => {
  if (!activeBeastBondBonus.value) return false
  const b = activeBeastBondBonus.value
  return b.hpPercent > 0 || b.attackPercent > 0 || b.defensePercent > 0 || b.speedPercent > 0
})

const startBattle = (stageId: string) => {
  if (!canBattle.value) return
  
  const success = gameStore.startBattle(stageId)
  if (success) {
    router.push('/battle-scene')
  }
}

const getStageEnemiesText = (enemies: any[]): string => {
  return enemies.map(e => e.name).join('、')
}
</script>

<template>
  <div class="battle-container" v-if="gameStore.player">
    <div class="current-beast card" v-if="gameStore.activeBeast && activeBeastData">
      <div class="card-header">
        <span class="card-title">当前出战灵兽</span>
      </div>
      <div class="beast-display">
        <div class="beast-avatar" :style="{ borderColor: RARITY_COLORS[activeBeastData.rarity] }">
          {{ activeBeastData.element === 'fire' ? '🔥' : activeBeastData.element === 'water' ? '💧' : activeBeastData.element === 'thunder' ? '⚡' : activeBeastData.element === 'wood' ? '🌿' : activeBeastData.element === 'earth' ? '🪨' : activeBeastData.element === 'metal' ? '⚙️' : activeBeastData.element === 'wind' ? '💨' : '❄️' }}
        </div>
        <div class="beast-info">
          <div class="beast-name-row">
            <span class="beast-name" :style="{ color: RARITY_COLORS[activeBeastData.rarity] }">
              {{ gameStore.activeBeast.name }}
            </span>
            <span class="beast-level">Lv.{{ gameStore.activeBeast.level }}</span>
          </div>
          <div class="beast-badges">
            <span class="badge badge-rarity" :style="{ color: RARITY_COLORS[activeBeastData.rarity] }">
              {{ RARITY_NAMES[activeBeastData.rarity] }}
            </span>
            <span 
              class="badge badge-element"
              :style="{ 
                backgroundColor: ELEMENT_COLORS[activeBeastData.element] + '40',
                color: ELEMENT_COLORS[activeBeastData.element]
              }"
            >
              {{ ELEMENT_NAMES[activeBeastData.element] }}系
            </span>
          </div>
          <div class="beast-hp">
            <span class="hp-label">❤️ HP</span>
            <div class="progress-bar">
              <div 
                class="progress-fill progress-hp" 
                :style="{ width: (gameStore.activeBeast.hp / gameStore.activeBeast.maxHp * 100) + '%' }"
              ></div>
            </div>
            <span class="hp-value">{{ gameStore.activeBeast.hp }}/{{ gameStore.activeBeast.maxHp }}</span>
          </div>
          <div class="beast-attrs">
            <span>⚔️ {{ gameStore.activeBeast.attack }}<span class="bond-plus" v-if="activeBeastBondBonus && activeBeastBondBonus.attackPercent > 0">(+{{ activeBeastBondBonus.attackPercent }}%)</span></span>
            <span>🛡️ {{ gameStore.activeBeast.defense }}<span class="bond-plus" v-if="activeBeastBondBonus && activeBeastBondBonus.defensePercent > 0">(+{{ activeBeastBondBonus.defensePercent }}%)</span></span>
            <span>💨 {{ gameStore.activeBeast.speed }}<span class="bond-plus" v-if="activeBeastBondBonus && activeBeastBondBonus.speedPercent > 0">(+{{ activeBeastBondBonus.speedPercent }}%)</span></span>
          </div>
        </div>
      </div>
      <div class="bond-bonus-bar" v-if="hasBondBonus">
        <span class="bond-bar-label">🔗 羁绊加成</span>
        <div class="bond-bar-tags">
          <span class="bond-tag" v-if="activeBeastBondBonus && activeBeastBondBonus.hpPercent > 0">❤️+{{ activeBeastBondBonus.hpPercent }}%</span>
          <span class="bond-tag" v-if="activeBeastBondBonus && activeBeastBondBonus.attackPercent > 0">⚔️+{{ activeBeastBondBonus.attackPercent }}%</span>
          <span class="bond-tag" v-if="activeBeastBondBonus && activeBeastBondBonus.defensePercent > 0">🛡️+{{ activeBeastBondBonus.defensePercent }}%</span>
          <span class="bond-tag" v-if="activeBeastBondBonus && activeBeastBondBonus.speedPercent > 0">💨+{{ activeBeastBondBonus.speedPercent }}%</span>
        </div>
      </div>
      <div class="bond-detail-list" v-if="activeBeastBondList.length > 0">
        <div 
          v-for="bond in activeBeastBondList" 
          :key="bond.config.id"
          class="bond-detail-item"
        >
          <span class="bond-detail-icon">{{ bond.config.icon }}</span>
          <span class="bond-detail-name" :style="{ color: BOND_CATEGORY_COLORS[bond.config.category] }">{{ bond.config.name }}</span>
        </div>
      </div>
      <div class="beast-warning" v-if="gameStore.activeBeast.hp <= 0">
        ⚠️ 灵兽已受伤，请先治疗再出战！
      </div>
    </div>

    <div class="no-beast card" v-else>
      <div class="no-beast-icon">🐾</div>
      <p class="no-beast-text">还没有出战灵兽</p>
      <p class="no-beast-desc">先去孵化并培养一只灵兽吧！</p>
      <button class="btn btn-primary" @click="router.push('/hatch')">
        🥚 前往孵化
      </button>
    </div>

    <div class="stages-section card">
      <div class="card-header">
        <span class="card-title">⚔️ 秘境列表</span>
      </div>
      <div class="stages-list">
        <div 
          v-for="(stage, index) in gameStore.stages" 
          :key="stage.id"
          class="stage-item"
          :class="{ 
            locked: !stage.unlocked, 
            completed: stage.completed,
            active: stage.unlocked
          }"
        >
          <div class="stage-header">
            <div class="stage-number" :style="{ backgroundColor: stage.background + '40' }">
              {{ index + 1 }}
            </div>
            <div class="stage-info">
              <div class="stage-name">{{ stage.name }}</div>
              <div class="stage-desc">{{ stage.description }}</div>
            </div>
            <div class="stage-status">
              <span v-if="stage.completed" class="completed-badge">✓</span>
              <span v-else-if="!stage.unlocked" class="locked-icon">🔒</span>
              <span v-else class="recommended-level">
                推荐 Lv.{{ stage.recommendedLevel }}
              </span>
            </div>
          </div>
          
          <div class="stage-enemies">
            <span class="enemies-label">敌人:</span>
            <span class="enemies-list">{{ getStageEnemiesText(stage.enemies) }}</span>
          </div>
          
          <div class="stage-rewards">
            <span class="rewards-label">奖励:</span>
            <div class="rewards-list">
              <span 
                v-for="(reward, rIndex) in stage.rewards" 
                :key="rIndex"
                class="reward-item"
              >
                {{ reward.type === 'gold' ? '💰' : reward.type === 'spiritStone' ? '💎' : reward.type === 'exp' ? '✨' : reward.type === 'egg' ? '🥚' : '🍎' }}
                x{{ reward.amount }}
              </span>
            </div>
          </div>
          
          <button 
            class="btn btn-primary stage-btn"
            :disabled="!stage.unlocked || !canBattle"
            @click="startBattle(stage.id)"
          >
            {{ !stage.unlocked ? '未解锁' : stage.completed ? '再次挑战' : '开始挑战' }}
          </button>
        </div>
      </div>
    </div>

    <div class="battle-tips card">
      <div class="tip-icon">💡</div>
      <div class="tip-content">
        <p class="tip-title">战斗提示</p>
        <ul class="tip-list">
          <li>• 速度快的灵兽优先出手</li>
          <li>• 技能等级越高，伤害越大</li>
          <li>• 暴击可造成1.5倍伤害</li>
          <li>• 战败后灵兽会保留20%血量</li>
          <li>• 通关上一秘境解锁下一秘境</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
}

.beast-display {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.beast-avatar {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: 3px solid;
  flex-shrink: 0;
}

.beast-info {
  flex: 1;
  min-width: 0;
}

.beast-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.beast-name {
  font-size: 18px;
  font-weight: bold;
}

.beast-level {
  padding: 2px 10px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.beast-badges {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.beast-hp {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hp-label {
  font-size: 12px;
  color: var(--text-secondary);
  width: 50px;
}

.beast-hp .progress-bar {
  flex: 1;
}

.hp-value {
  font-size: 12px;
  color: var(--text-primary);
  min-width: 60px;
  text-align: right;
}

.beast-attrs {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-primary);
}

.beast-warning {
  margin-top: 12px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  color: #F87171;
}

.no-beast {
  text-align: center;
  padding: 40px 20px;
}

.no-beast-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-beast-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.no-beast-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.stages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-item {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.stage-item.active:hover {
  border-color: var(--border-color);
}

.stage-item.locked {
  opacity: 0.5;
}

.stage-item.completed {
  border-color: rgba(34, 197, 94, 0.3);
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.stage-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  color: var(--accent-color);
  flex-shrink: 0;
}

.stage-info {
  flex: 1;
  min-width: 0;
}

.stage-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.stage-desc {
  font-size: 11px;
  color: var(--text-secondary);
}

.stage-status {
  flex-shrink: 0;
}

.completed-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(34, 197, 94, 0.3);
  border-radius: 50%;
  color: #22C55E;
  font-weight: bold;
}

.locked-icon {
  font-size: 24px;
}

.recommended-level {
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  font-size: 11px;
  color: var(--text-secondary);
}

.stage-enemies {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.enemies-label {
  color: var(--text-muted);
  flex-shrink: 0;
}

.enemies-list {
  color: var(--text-secondary);
}

.stage-rewards {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
}

.rewards-label {
  color: var(--text-muted);
  flex-shrink: 0;
}

.rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-item {
  padding: 2px 8px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  color: var(--accent-color);
  font-size: 11px;
}

.stage-btn {
  width: 100%;
}

.bond-plus {
  font-size: 11px;
  color: #22C55E;
  font-weight: bold;
}

.bond-bonus-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(255, 215, 0, 0.1));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  margin-top: 10px;
}

.bond-bar-label {
  font-size: 12px;
  font-weight: bold;
  color: var(--accent-color);
  white-space: nowrap;
}

.bond-bar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bond-tag {
  padding: 2px 6px;
  background: rgba(255, 215, 0, 0.15);
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
  color: var(--accent-color);
  white-space: nowrap;
}

.bond-detail-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.bond-detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.bond-detail-icon {
  font-size: 14px;
}

.bond-detail-name {
  font-size: 11px;
  font-weight: bold;
}

.battle-tips {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border-color: rgba(59, 130, 246, 0.3);
}

.tip-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.tip-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 8px;
}

.tip-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tip-list li {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  line-height: 1.5;
}

@media (max-width: 480px) {
  .beast-display {
    flex-direction: column;
    align-items: center;
  }
  
  .beast-avatar {
    width: 70px;
    height: 70px;
    font-size: 40px;
  }
  
  .beast-info {
    width: 100%;
  }
  
  .beast-name {
    font-size: 16px;
  }
  
  .stage-header {
    gap: 8px;
  }
  
  .stage-number {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .stage-name {
    font-size: 14px;
  }
}
</style>
