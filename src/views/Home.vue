<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { getBeastById } from '@/data/beasts'
import { BeastDisplay } from '@/utils/pixi'
import { RARITY_NAMES, ELEMENT_NAMES, RARITY_COLORS, ELEMENT_COLORS, BOND_CATEGORY_NAMES, BOND_CATEGORY_COLORS, TEAM_SIZE } from '@/types'
import type { ActiveBond, BondEffect, OwnedBeast, TeamSlot } from '@/types'

const router = useRouter()
const gameStore = useGameStore()
const pixiContainer = ref<HTMLElement | null>(null)
let beastDisplay: BeastDisplay | null = null
let updateInterval: number | null = null

const currentBeast = computed(() => {
  if (!gameStore.activeBeast) return null
  return getBeastById(gameStore.activeBeast.beastId)
})

const currentBeastBondBonus = computed<BondEffect | null>(() => {
  if (!gameStore.activeBeast) return null
  return gameStore.getBeastBondBonus(gameStore.activeBeast.beastId)
})

const formatBondEffect = (effect: BondEffect): string => {
  const parts: string[] = []
  if (effect.hpPercent > 0) parts.push(`❤️+${effect.hpPercent}%`)
  if (effect.attackPercent > 0) parts.push(`⚔️+${effect.attackPercent}%`)
  if (effect.defensePercent > 0) parts.push(`🛡️+${effect.defensePercent}%`)
  if (effect.speedPercent > 0) parts.push(`💨+${effect.speedPercent}%`)
  return parts.join(' ')
}

const teamSlotLabels = ['主战位', '辅位·壹', '辅位·贰']
const teamSlotColors = ['#F59E0B', '#3B82F6', '#8B5CF6']

const showTeamModal = ref(false)
const editingSlot = ref<TeamSlot | null>(null)

const availableBeastsForEdit = computed(() => {
  if (!gameStore.player) return []
  const teamSet = new Set(gameStore.player.team.filter(Boolean))
  return gameStore.player.ownedBeasts.filter(b => !teamSet.has(b.instanceId))
})

const openTeamSlotEditor = (slot: TeamSlot) => {
  editingSlot.value = slot
  showTeamModal.value = true
}

const selectBeastForSlot = (beast: OwnedBeast) => {
  if (editingSlot.value === null) return
  gameStore.setTeamMember(editingSlot.value, beast.instanceId)
  closeTeamModal()
}

const clearSlot = (slot: TeamSlot) => {
  gameStore.clearTeamSlot(slot)
}

const closeTeamModal = () => {
  showTeamModal.value = false
  editingSlot.value = null
}

const getSlotBeastData = (slot: TeamSlot) => {
  const beast = gameStore.teamBeasts[slot]
  if (!beast) return null
  const data = getBeastById(beast.beastId)
  return data ? { beast, data } : null
}

const getSlotData = (slot: TeamSlot) => getSlotBeastData(slot)

const slotData = (slot: TeamSlot) => {
  const sd = getSlotData(slot)
  if (!sd) return null
  return sd
}

const elementEmoji = (element: string): string => {
  const map: Record<string, string> = {
    fire: '🔥', water: '💧', wood: '🌿', earth: '🪨', metal: '⚙️', thunder: '⚡', wind: '💨', ice: '❄️'
  }
  return map[element] || '🐾'
}

const quickActions = [
  { name: '灵兽孵化', icon: '🥚', path: '/hatch', color: '#F59E0B' },
  { name: '喂养成长', icon: '🍖', path: '/feed', color: '#22C55E' },
  { name: '技能觉醒', icon: '⚡', path: '/skills', color: '#8B5CF6' },
  { name: '秘境挑战', icon: '⚔️', path: '/battle', color: '#EF4444' },
  { name: '图鉴收集', icon: '📖', path: '/collection', color: '#3B82F6' },
  { name: '灵兽列表', icon: '🐾', path: '/feed', color: '#06B6D4' }
]

onMounted(() => {
  if (pixiContainer.value && gameStore.activeBeast && currentBeast.value) {
    const rect = pixiContainer.value.getBoundingClientRect()
    beastDisplay = new BeastDisplay(pixiContainer.value, rect.width, rect.height)
    beastDisplay.setBeast(
      gameStore.activeBeast.beastId,
      currentBeast.value.element,
      currentBeast.value.rarity
    )
  }
  
  updateInterval = window.setInterval(() => {
    gameStore.updateAllEggs()
  }, 1000)
  
  const handleResize = () => {
    if (pixiContainer.value && beastDisplay) {
      const rect = pixiContainer.value.getBoundingClientRect()
      beastDisplay.resize(rect.width, rect.height)
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (beastDisplay) {
    beastDisplay.destroy()
  }
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

const navigateTo = (path: string) => {
  router.push(path)
}

const selectBeast = (beastId: string) => {
  gameStore.setActiveBeast(beastId)
  
  if (beastDisplay && currentBeast.value && gameStore.player) {
    const activeBeast = gameStore.player.ownedBeasts.find((b: { instanceId: string }) => b.instanceId === beastId)
    if (activeBeast) {
      const beastData = getBeastById(activeBeast.beastId)
      if (beastData) {
        beastDisplay.setBeast(activeBeast.beastId, beastData.element, beastData.rarity)
      }
    }
  }
}
</script>

<template>
  <div class="home-container" v-if="gameStore.player">
    <div class="welcome-section card" v-if="!gameStore.activeBeast">
      <div class="welcome-icon">🐉</div>
      <h2 class="welcome-title">欢迎来到仙灵兽域</h2>
      <p class="welcome-desc">
        这里是灵兽的世界，您可以培育属于自己的仙兽，
        探索神秘秘境，收集传说中的神兽！
      </p>
      <button class="btn btn-primary" @click="navigateTo('/hatch')">
        🥚 前往孵化灵兽
      </button>
    </div>

    <div class="beast-display-section" v-else>
      <div class="beast-info card">
        <div class="beast-header">
          <span class="beast-name">{{ gameStore.activeBeast.name }}</span>
          <span class="beast-level">Lv.{{ gameStore.activeBeast.level }}</span>
        </div>
        <div class="beast-badges" v-if="currentBeast">
          <span 
            class="badge badge-rarity" 
            :style="{ color: RARITY_COLORS[currentBeast.rarity] }"
          >
            {{ RARITY_NAMES[currentBeast.rarity] }}
          </span>
          <span 
            class="badge badge-element"
            :style="{ backgroundColor: ELEMENT_COLORS[currentBeast.element] + '40', color: ELEMENT_COLORS[currentBeast.element] }"
          >
            {{ ELEMENT_NAMES[currentBeast.element] }}系
          </span>
        </div>
        <div class="beast-stats">
          <div class="stat-row">
            <span class="stat-label">❤️ 生命</span>
            <div class="progress-bar">
              <div 
                class="progress-fill progress-hp" 
                :style="{ width: (gameStore.activeBeast.hp / gameStore.activeBeast.maxHp * 100) + '%' }"
              ></div>
            </div>
            <span class="stat-value">{{ gameStore.activeBeast.hp }}/{{ gameStore.activeBeast.maxHp }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">✨ 经验</span>
            <div class="progress-bar">
              <div 
                class="progress-fill progress-exp" 
                :style="{ width: (gameStore.activeBeast.exp / gameStore.activeBeast.expToNext * 100) + '%' }"
              ></div>
            </div>
            <span class="stat-value">{{ gameStore.activeBeast.exp }}/{{ gameStore.activeBeast.expToNext }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">💕 亲密度</span>
            <div class="progress-bar">
              <div 
                class="progress-fill progress-intimacy" 
                :style="{ width: (gameStore.activeBeast.intimacy / 10) + '%' }"
              ></div>
            </div>
            <span class="stat-value">{{ gameStore.activeBeast.intimacy }}/1000</span>
          </div>
        </div>
        <div class="beast-attrs">
          <div class="attr-item">
            <span class="attr-icon">⚔️</span>
            <span class="attr-value">{{ gameStore.activeBeast.attack }}</span>
            <span class="attr-bonus" v-if="currentBeastBondBonus && currentBeastBondBonus.attackPercent > 0">+{{ currentBeastBondBonus.attackPercent }}%</span>
          </div>
          <div class="attr-item">
            <span class="attr-icon">🛡️</span>
            <span class="attr-value">{{ gameStore.activeBeast.defense }}</span>
            <span class="attr-bonus" v-if="currentBeastBondBonus && currentBeastBondBonus.defensePercent > 0">+{{ currentBeastBondBonus.defensePercent }}%</span>
          </div>
          <div class="attr-item">
            <span class="attr-icon">💨</span>
            <span class="attr-value">{{ gameStore.activeBeast.speed }}</span>
            <span class="attr-bonus" v-if="currentBeastBondBonus && currentBeastBondBonus.speedPercent > 0">+{{ currentBeastBondBonus.speedPercent }}%</span>
          </div>
        </div>
      </div>
      
      <div class="pixi-container" ref="pixiContainer"></div>
    </div>

    <div class="team-section card" v-if="gameStore.player.ownedBeasts.length > 0">
      <div class="card-header">
        <span class="card-title">⚔️ 出战队伍</span>
        <span class="team-subtitle">羁绊仅在出战队伍中生效</span>
      </div>
      <div class="team-slots">
        <div 
          v-for="(slot, index) in TEAM_SIZE" 
          :key="'home-slot-' + index"
          class="team-slot"
          :style="{ '--slot-color': teamSlotColors[index] }"
          @click="openTeamSlotEditor(index as TeamSlot)"
        >
          <div class="slot-label" :style="{ color: teamSlotColors[index] }">{{ teamSlotLabels[index] }}</div>
          <template v-for="sd in [getSlotBeastData(index as TeamSlot)]" :key="index + '-data'">
            <template v-if="sd">
              <div class="slot-avatar" :style="{ borderColor: teamSlotColors[index] }">
                {{ elementEmoji(sd.data.element) }}
              </div>
              <div class="slot-info">
                <div class="slot-name">{{ sd.beast.name }}</div>
                <div class="slot-meta">
                  <span :style="{ color: RARITY_COLORS[sd.data.rarity] }">
                    {{ RARITY_NAMES[sd.data.rarity] }}
                  </span>
                  <span>Lv.{{ sd.beast.level }}</span>
                </div>
              </div>
              <button class="slot-clear" @click.stop="clearSlot(index as TeamSlot)" v-if="gameStore.teamBeasts.filter(b => b).length > 1">✕</button>
            </template>
            <template v-else>
              <div class="slot-placeholder">
                <span class="plus-icon">+</span>
              </div>
              <div class="slot-empty-tip">点击选择灵兽</div>
            </template>
          </template>
        </div>
      </div>
    </div>

    <div class="beast-selector card" v-if="gameStore.player.ownedBeasts.length > 0">
      <div class="card-header">
        <span class="card-title">我的灵兽</span>
        <span class="beast-count">{{ gameStore.player.ownedBeasts.length }} 只</span>
      </div>
      <div class="beast-list">
        <div 
          v-for="beast in gameStore.player.ownedBeasts" 
          :key="beast.instanceId"
          class="beast-item"
          :class="{ active: beast.instanceId === gameStore.player.activeBeastId }"
          @click="selectBeast(beast.instanceId)"
        >
          <div class="beast-avatar">
            {{ getBeastById(beast.beastId) ? (getBeastById(beast.beastId)!.element === 'fire' ? '🔥' : getBeastById(beast.beastId)!.element === 'water' ? '💧' : getBeastById(beast.beastId)!.element === 'thunder' ? '⚡' : getBeastById(beast.beastId)!.element === 'wood' ? '🌿' : getBeastById(beast.beastId)!.element === 'earth' ? '🪨' : getBeastById(beast.beastId)!.element === 'metal' ? '⚙️' : getBeastById(beast.beastId)!.element === 'wind' ? '💨' : '❄️') : '🐾' }}
          </div>
          <div class="beast-item-info">
            <div class="beast-item-name">{{ beast.name }}</div>
            <div class="beast-item-level">Lv.{{ beast.level }}</div>
          </div>
          <div class="beast-hp-mini">
            <div 
              class="hp-fill" 
              :style="{ width: (beast.hp / beast.maxHp * 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="bond-section card" v-if="gameStore.activeBonds.length > 0">
      <div class="card-header">
        <span class="card-title">🔗 灵兽羁绊</span>
        <span class="bond-active-count" v-if="gameStore.activeBondList.length > 0">
          {{ gameStore.activeBondList.length }} 个激活
        </span>
      </div>
      <div class="bond-list">
        <div 
          v-for="bond in gameStore.activeBonds" 
          :key="bond.config.id"
          class="bond-item"
          :class="{ active: bond.active }"
        >
          <div class="bond-icon" :style="{ 
            backgroundColor: bond.active ? BOND_CATEGORY_COLORS[bond.config.category] + '30' : 'rgba(0,0,0,0.2)',
            borderColor: bond.active ? BOND_CATEGORY_COLORS[bond.config.category] : 'transparent'
          }">
            {{ bond.config.icon }}
          </div>
          <div class="bond-info">
            <div class="bond-name" :style="{ color: bond.active ? BOND_CATEGORY_COLORS[bond.config.category] : 'var(--text-muted)' }">
              {{ bond.config.name }}
            </div>
            <div class="bond-progress">
              <span class="bond-count" :class="{ fulfilled: bond.active }">
                {{ bond.currentCount }}/{{ bond.config.requiredCount }}
              </span>
              <div class="bond-progress-bar">
                <div 
                  class="bond-progress-fill"
                  :style="{ 
                    width: Math.min(100, (bond.currentCount / bond.config.requiredCount) * 100) + '%',
                    backgroundColor: BOND_CATEGORY_COLORS[bond.config.category]
                  }"
                ></div>
              </div>
            </div>
          </div>
          <div class="bond-effects" v-if="bond.active">
            <span class="effect-tag" v-if="bond.config.effects.hpPercent > 0">❤️+{{ bond.config.effects.hpPercent }}%</span>
            <span class="effect-tag" v-if="bond.config.effects.attackPercent > 0">⚔️+{{ bond.config.effects.attackPercent }}%</span>
            <span class="effect-tag" v-if="bond.config.effects.defensePercent > 0">🛡️+{{ bond.config.effects.defensePercent }}%</span>
            <span class="effect-tag" v-if="bond.config.effects.speedPercent > 0">💨+{{ bond.config.effects.speedPercent }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-actions card">
      <div class="card-header">
        <span class="card-title">快捷操作</span>
      </div>
      <div class="action-grid">
        <div 
          v-for="action in quickActions" 
          :key="action.path"
          class="action-item"
          @click="navigateTo(action.path)"
        >
          <div class="action-icon" :style="{ backgroundColor: action.color + '30', color: action.color }">
            {{ action.icon }}
          </div>
          <span class="action-name">{{ action.name }}</span>
        </div>
      </div>
    </div>

    <div class="tips-section card" v-if="gameStore.player.eggs.length > 0">
      <div class="tip-icon">🥚</div>
      <div class="tip-content">
        <span class="tip-text">您有 {{ gameStore.player.eggs.length }} 个灵兽蛋正在孵化中</span>
        <button class="btn btn-primary btn-small" @click="navigateTo('/hatch')">
          查看
        </button>
      </div>
    </div>

    <div class="modal-overlay" v-if="showTeamModal" @click="closeTeamModal">
      <div class="modal team-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-title">
            选择放入「{{ editingSlot !== null ? teamSlotLabels[editingSlot] : '' }}」的灵兽
          </span>
          <button class="modal-close" @click="closeTeamModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="team-modal-empty" v-if="availableBeastsForEdit.length === 0">
            <span class="empty-icon">🐾</span>
            <p class="empty-text">没有可加入的灵兽了，请到「喂养成长」查看所有灵兽</p>
          </div>
          <div class="team-modal-list" v-else>
            <div 
              v-for="beast in availableBeastsForEdit" 
              :key="beast.instanceId"
              class="team-modal-item"
              @click="selectBeastForSlot(beast)"
            >
              <div class="team-modal-avatar" :style="{ borderColor: RARITY_COLORS[getBeastById(beast.beastId)!.rarity] }">
                {{ elementEmoji(getBeastById(beast.beastId)!.element) }}
              </div>
              <div class="team-modal-info">
                <div class="team-modal-name">{{ beast.name }}</div>
                <div class="team-modal-meta">
                  <span :style="{ color: RARITY_COLORS[getBeastById(beast.beastId)!.rarity] }">
                    {{ RARITY_NAMES[getBeastById(beast.beastId)!.rarity] }}
                  </span>
                  <span style="color: var(--text-muted)">·</span>
                  <span style="color: ELEMENT_COLORS[getBeastById(beast.beastId)!.element]">
                    {{ ELEMENT_NAMES[getBeastById(beast.beastId)!.element] }}系
                  </span>
                  <span>Lv.{{ beast.level }}</span>
                </div>
              </div>
              <div class="team-modal-stats">
                <span>⚔️{{ beast.attack }}</span>
                <span>🛡️{{ beast.defense }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
}

.welcome-section {
  text-align: center;
  padding: 32px 20px;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.welcome-title {
  font-size: 24px;
  color: var(--accent-color);
  margin-bottom: 12px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.welcome-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
}

.beast-display-section {
  position: relative;
}

.beast-info {
  position: relative;
  z-index: 10;
}

.beast-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.beast-name {
  font-size: 20px;
  font-weight: bold;
  color: var(--accent-color);
}

.beast-level {
  padding: 4px 12px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.beast-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.beast-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  width: 60px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-row .progress-bar {
  flex: 1;
}

.stat-value {
  width: 80px;
  text-align: right;
  font-size: 12px;
  color: var(--text-primary);
}

.beast-attrs {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.attr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.attr-icon {
  font-size: 20px;
}

.attr-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
}

.pixi-container {
  width: 100%;
  height: 200px;
  margin-top: -20px;
  position: relative;
}

.beast-selector {
  overflow-x: auto;
}

.beast-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.beast-list {
  display: flex;
  gap: 12px;
  padding: 4px;
}

.beast-item {
  flex-shrink: 0;
  width: 100px;
  padding: 12px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.beast-item:hover {
  transform: translateY(-2px);
}

.beast-item.active {
  border-color: var(--accent-color);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.beast-avatar {
  font-size: 32px;
  margin-bottom: 4px;
}

.beast-item-info {
  margin-bottom: 4px;
}

.beast-item-name {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-primary);
}

.beast-item-level {
  font-size: 10px;
  color: var(--text-secondary);
}

.beast-hp-mini {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #22C55E, #16A34A);
  transition: width 0.3s ease;
}

.quick-actions {
  margin-top: 0;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 215, 0, 0.1);
}

.action-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 24px;
  margin-bottom: 8px;
}

.action-name {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: bold;
}

.tips-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2));
  border-color: rgba(245, 158, 11, 0.5);
}

.tip-icon {
  font-size: 32px;
  animation: pulse 2s infinite;
}

.tip-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tip-text {
  font-size: 14px;
  color: var(--text-primary);
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.bond-active-count {
  font-size: 12px;
  color: #22C55E;
  font-weight: bold;
}

.bond-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.bond-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.bond-item.active {
  border-color: rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.05);
}

.bond-item:not(.active) {
  opacity: 0.6;
}

.bond-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 22px;
  border: 2px solid;
  flex-shrink: 0;
}

.bond-info {
  flex: 1;
  min-width: 0;
}

.bond-name {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 4px;
}

.bond-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bond-count {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 30px;
}

.bond-count.fulfilled {
  color: #22C55E;
  font-weight: bold;
}

.bond-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 2px;
  overflow: hidden;
}

.bond-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.bond-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-shrink: 0;
}

.effect-tag {
  padding: 2px 6px;
  background: rgba(255, 215, 0, 0.15);
  border-radius: 6px;
  font-size: 10px;
  font-weight: bold;
  color: var(--accent-color);
  white-space: nowrap;
}

.attr-bonus {
  font-size: 10px;
  color: #22C55E;
  font-weight: bold;
}

.team-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

.team-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.team-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 2px solid var(--slot-color, #666);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.team-slot:hover {
  background: rgba(0, 0, 0, 0.35);
  transform: translateY(-2px);
}

.slot-label {
  font-size: 11px;
  font-weight: bold;
}

.slot-avatar {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 3px solid;
  background: rgba(0, 0, 0, 0.4);
  font-size: 26px;
}

.slot-info {
  text-align: center;
  min-width: 0;
  width: 100%;
}

.slot-name {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-meta {
  font-size: 10px;
  display: flex;
  justify-content: center;
  gap: 4px;
  color: var(--text-secondary);
}

.slot-clear {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-placeholder {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.2);
}

.plus-icon {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: bold;
}

.slot-empty-tip {
  font-size: 10px;
  color: var(--text-muted);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 400px;
  max-height: 85vh;
  background: var(--bg-primary);
  border: 2px solid var(--accent-color);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  color: var(--text-secondary);
  cursor: pointer;
}

.modal-body {
  padding: 14px;
  overflow-y: auto;
  flex: 1;
}

.team-modal-empty {
  text-align: center;
  padding: 30px 10px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 13px;
  color: var(--text-muted);
}

.team-modal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-modal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.team-modal-item:hover {
  border-color: var(--accent-color);
  background: rgba(255, 215, 0, 0.05);
}

.team-modal-avatar {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid;
  background: rgba(0, 0, 0, 0.4);
  font-size: 22px;
  flex-shrink: 0;
}

.team-modal-info {
  flex: 1;
  min-width: 0;
}

.team-modal-name {
  font-size: 13px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.team-modal-meta {
  font-size: 11px;
  display: flex;
  gap: 4px;
  align-items: center;
  color: var(--text-secondary);
}

.team-modal-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: var(--text-secondary);
  text-align: right;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 20px;
  }
  
  .pixi-container {
    height: 160px;
  }
  
  .action-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .action-item {
    padding: 12px 4px;
  }
  
  .action-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .action-name {
    font-size: 11px;
  }
}
</style>
