<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { getBeastById } from '@/data/beasts'
import { BeastDisplay } from '@/utils/pixi'
import { RARITY_NAMES, ELEMENT_NAMES, RARITY_COLORS, ELEMENT_COLORS } from '@/types'

const router = useRouter()
const gameStore = useGameStore()
const pixiContainer = ref<HTMLElement | null>(null)
let beastDisplay: BeastDisplay | null = null
let updateInterval: number | null = null

const currentBeast = computed(() => {
  if (!gameStore.activeBeast) return null
  return getBeastById(gameStore.activeBeast.beastId)
})

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
  
  if (beastDisplay && currentBeast.value) {
    const activeBeast = gameStore.ownedBeasts?.find(b => b.instanceId === beastId)
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
          </div>
          <div class="attr-item">
            <span class="attr-icon">🛡️</span>
            <span class="attr-value">{{ gameStore.activeBeast.defense }}</span>
          </div>
          <div class="attr-item">
            <span class="attr-icon">💨</span>
            <span class="attr-value">{{ gameStore.activeBeast.speed }}</span>
          </div>
        </div>
      </div>
      
      <div class="pixi-container" ref="pixiContainer"></div>
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
