<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { getBeastById } from '@/data/beasts'
import { EGG_POOLS, getEggPoolById } from '@/data/eggs'
import { RARITY_COLORS, RARITY_NAMES, ELEMENT_NAMES, ELEMENT_COLORS } from '@/types'
import { BeastDisplay } from '@/utils/pixi'

const gameStore = useGameStore()
const showHatchAnimation = ref(false)
const hatchedBeast = ref<any>(null)
const showBuyConfirm = ref(false)
const selectedEggPool = ref<any>(null)
const pixiContainer = ref<HTMLElement | null>(null)
let beastDisplay: BeastDisplay | null = null
let updateInterval: number | null = null

onMounted(() => {
  updateInterval = window.setInterval(() => {
    gameStore.updateAllEggs()
  }, 500)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  if (beastDisplay) {
    beastDisplay.destroy()
  }
})

const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getRemainingTime = (egg: any): number => {
  const elapsed = Date.now() - egg.startTime
  return Math.max(0, egg.hatchTime - elapsed)
}

const openBuyConfirm = (pool: any) => {
  selectedEggPool.value = pool
  showBuyConfirm.value = true
}

const confirmBuy = () => {
  if (!selectedEggPool.value) return
  
  const success = gameStore.buyEgg(selectedEggPool.value.id)
  if (success) {
    showBuyConfirm.value = false
    selectedEggPool.value = null
  }
}

const hatchEgg = (eggId: string) => {
  const beast = gameStore.hatchEgg(eggId)
  if (beast) {
    hatchedBeast.value = beast
    showHatchAnimation.value = true
    
    setTimeout(() => {
      if (pixiContainer.value) {
        const rect = pixiContainer.value.getBoundingClientRect()
        beastDisplay = new BeastDisplay(pixiContainer.value, rect.width, rect.height)
        const beastData = getBeastById(beast.beastId)
        if (beastData) {
          beastDisplay.setBeast(beast.beastId, beastData.element, beastData.rarity, 150)
        }
      }
    }, 100)
  }
}

const closeHatchAnimation = () => {
  showHatchAnimation.value = false
  hatchedBeast.value = null
  if (beastDisplay) {
    beastDisplay.destroy()
    beastDisplay = null
  }
}

const getBeastData = (beastId: string) => {
  return getBeastById(beastId)
}
</script>

<template>
  <div class="hatch-container" v-if="gameStore.player">
    <div class="section-card card">
      <div class="card-header">
        <span class="card-title">🥚 灵兽蛋商店</span>
      </div>
      <div class="egg-shop">
        <div 
          v-for="pool in EGG_POOLS" 
          :key="pool.id"
          class="egg-pool-item"
          :style="{ '--rarity-color': RARITY_COLORS[pool.rarity as keyof typeof RARITY_COLORS] }"
        >
          <div class="egg-icon" :class="`rarity-${pool.rarity}`">
            {{ pool.icon }}
          </div>
          <div class="egg-info">
            <div class="egg-name" :style="{ color: RARITY_COLORS[pool.rarity as keyof typeof RARITY_COLORS] }">
              {{ pool.name }}
            </div>
            <div class="egg-desc">{{ pool.description }}</div>
            <div class="egg-price">
              <span class="price-icon">{{ pool.currency === 'gold' ? '💰' : '💎' }}</span>
              <span class="price-value">{{ pool.price }}</span>
            </div>
          </div>
          <button 
            class="btn btn-primary btn-small"
            :disabled="(pool.currency === 'gold' ? gameStore.player!.gold : gameStore.player!.spiritStone) < pool.price"
            @click="openBuyConfirm(pool)"
          >
            购买
          </button>
        </div>
      </div>
    </div>

    <div class="section-card card">
      <div class="card-header">
        <span class="card-title">🔮 孵化中</span>
        <span class="egg-count">{{ gameStore.player.eggs.length }} 个</span>
      </div>
      
      <div class="empty-state" v-if="gameStore.player.eggs.length === 0">
        <div class="empty-icon">🥚</div>
        <p class="empty-text">暂无正在孵化的灵兽蛋</p>
        <p class="empty-desc">购买灵兽蛋开始孵化吧！</p>
      </div>
      
      <div class="hatching-list" v-else>
        <div 
          v-for="egg in gameStore.player.eggs" 
          :key="egg.id"
          class="hatching-item"
        >
          <div class="hatching-egg" :class="`rarity-${egg.rarity}`">
            <div class="egg-emoji" :class="{ 'animate-shake': egg.hatchProgress < 100 }">
              🥚
            </div>
            <div class="egg-glow" v-if="egg.hatchProgress >= 100"></div>
          </div>
          <div class="hatching-info">
            <div class="hatching-name" :style="{ color: RARITY_COLORS[egg.rarity] }">
              {{ RARITY_NAMES[egg.rarity] }}灵兽蛋
            </div>
            <div class="hatching-beast" v-if="getBeastData(egg.beastId)">
              正在孵化：{{ getBeastData(egg.beastId)!.name }}
              <span 
                class="element-badge"
                :style="{ 
                  backgroundColor: ELEMENT_COLORS[getBeastData(egg.beastId)!.element] + '40',
                  color: ELEMENT_COLORS[getBeastData(egg.beastId)!.element]
                }"
              >
                {{ ELEMENT_NAMES[getBeastData(egg.beastId)!.element] }}
              </span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill progress-hatch" 
                :style="{ width: egg.hatchProgress + '%' }"
              ></div>
            </div>
            <div class="hatching-progress-text">
              <span v-if="egg.hatchProgress < 100">
                剩余时间：{{ formatTime(getRemainingTime(egg)) }}
              </span>
              <span v-else class="ready-text">✨ 孵化完成！</span>
            </div>
          </div>
          <button 
            class="btn btn-success"
            :disabled="egg.hatchProgress < 100"
            @click="hatchEgg(egg.id)"
          >
            {{ egg.hatchProgress >= 100 ? '孵化' : '孵化中' }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showBuyConfirm" @click.self="showBuyConfirm = false">
      <div class="modal">
        <h2 class="modal-title">确认购买</h2>
        <div class="buy-preview" v-if="selectedEggPool">
          <div class="buy-egg-icon" :class="`rarity-${selectedEggPool.rarity}`">
            {{ selectedEggPool.icon }}
          </div>
          <div class="buy-name" :style="{ color: RARITY_COLORS[selectedEggPool.rarity as keyof typeof RARITY_COLORS] }">
            {{ selectedEggPool.name }}
          </div>
          <div class="buy-price">
            <span class="price-icon">{{ selectedEggPool.currency === 'gold' ? '💰' : '💎' }}</span>
            <span class="price-value">{{ selectedEggPool.price }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showBuyConfirm = false">取消</button>
          <button class="btn btn-primary" @click="confirmBuy">确认购买</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay hatch-modal" v-if="showHatchAnimation">
      <div class="hatch-animation-container">
        <div class="hatch-rays"></div>
        <div class="pixi-container" ref="pixiContainer"></div>
        <div class="hatch-info" v-if="hatchedBeast">
          <div class="hatch-title">🎉 恭喜获得灵兽！</div>
          <div class="hatch-beast-name" :style="{ color: RARITY_COLORS[getBeastData(hatchedBeast.beastId)?.rarity || 'common'] }">
            {{ hatchedBeast.name }}
          </div>
          <div class="hatch-beast-info">
            <span 
              class="badge badge-rarity"
              :style="{ color: RARITY_COLORS[getBeastData(hatchedBeast.beastId)?.rarity || 'common'] }"
            >
              {{ RARITY_NAMES[getBeastData(hatchedBeast.beastId)?.rarity || 'common'] }}
            </span>
            <span 
              class="badge badge-element"
              :style="{ 
                backgroundColor: ELEMENT_COLORS[getBeastData(hatchedBeast.beastId)?.element || 'fire'] + '40',
                color: ELEMENT_COLORS[getBeastData(hatchedBeast.beastId)?.element || 'fire']
              }"
            >
              {{ ELEMENT_NAMES[getBeastData(hatchedBeast.beastId)?.element || 'fire'] }}系
            </span>
          </div>
          <div class="hatch-beast-stats">
            <span>❤️ {{ hatchedBeast.maxHp }}</span>
            <span>⚔️ {{ hatchedBeast.attack }}</span>
            <span>🛡️ {{ hatchedBeast.defense }}</span>
            <span>💨 {{ hatchedBeast.speed }}</span>
          </div>
          <button class="btn btn-primary" @click="closeHatchAnimation">
            太好了！
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hatch-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
}

.section-card {
  overflow: hidden;
}

.egg-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.egg-shop {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.egg-pool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.egg-pool-item:hover {
  border-color: var(--rarity-color);
  background: rgba(0, 0, 0, 0.3);
}

.egg-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--rarity-color);
  box-shadow: 0 0 15px var(--rarity-color);
}

.egg-info {
  flex: 1;
}

.egg-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.egg-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.egg-price {
  display: flex;
  align-items: center;
  gap: 4px;
}

.price-icon {
  font-size: 14px;
}

.price-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
}

.btn-small {
  padding: 8px 16px;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.hatching-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hatching-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.hatching-egg {
  position: relative;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--rarity-color, var(--text-muted));
  flex-shrink: 0;
}

.hatching-egg.rarity-common { --rarity-color: var(--rarity-common); }
.hatching-egg.rarity-rare { --rarity-color: var(--rarity-rare); }
.hatching-egg.rarity-epic { --rarity-color: var(--rarity-epic); }
.hatching-egg.rarity-legendary { --rarity-color: var(--rarity-legendary); }
.hatching-egg.rarity-mythic { --rarity-color: var(--rarity-mythic); }

.egg-emoji {
  font-size: 40px;
  z-index: 1;
}

.egg-glow {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--rarity-color) 0%, transparent 70%);
  animation: pulse 1s infinite;
}

.hatching-info {
  flex: 1;
  min-width: 0;
}

.hatching-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.hatching-beast {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.element-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
}

.hatching-progress-text {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.ready-text {
  color: var(--accent-color);
  font-weight: bold;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(135deg, var(--bg-dark), var(--bg-medium));
  border: 2px solid var(--secondary-color);
  border-radius: 16px;
  padding: 24px;
  max-width: 90%;
  width: 320px;
  text-align: center;
}

.modal-title {
  font-size: 18px;
  color: var(--accent-color);
  margin-bottom: 20px;
}

.buy-preview {
  margin-bottom: 20px;
}

.buy-egg-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
}

.buy-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.buy-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.buy-price .price-value {
  font-size: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.hatch-modal {
  background: radial-gradient(circle at center, rgba(139, 69, 19, 0.9), rgba(0, 0, 0, 0.95));
}

.hatch-animation-container {
  position: relative;
  text-align: center;
  padding: 20px;
}

.hatch-rays {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  margin: -150px 0 0 -150px;
  background: conic-gradient(from 0deg, transparent, var(--accent-color), transparent, var(--accent-color), transparent);
  animation: rotate 3s linear infinite;
  opacity: 0.3;
  border-radius: 50%;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pixi-container {
  position: relative;
  z-index: 1;
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
}

.hatch-info {
  position: relative;
  z-index: 1;
}

.hatch-title {
  font-size: 20px;
  color: var(--accent-color);
  margin-bottom: 8px;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.hatch-beast-name {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 12px;
  text-shadow: 0 0 15px currentColor;
}

.hatch-beast-info {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.hatch-beast-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--text-primary);
}

.egg-pool-item.rarity-common { --rarity-color: var(--rarity-common); }
.egg-pool-item.rarity-rare { --rarity-color: var(--rarity-rare); }
.egg-pool-item.rarity-epic { --rarity-color: var(--rarity-epic); }
.egg-pool-item.rarity-legendary { --rarity-color: var(--rarity-legendary); }
.egg-pool-item.rarity-mythic { --rarity-color: var(--rarity-mythic); }

.buy-egg-icon.rarity-common { border-color: var(--rarity-common); }
.buy-egg-icon.rarity-rare { border-color: var(--rarity-rare); }
.buy-egg-icon.rarity-epic { border-color: var(--rarity-epic); }
.buy-egg-icon.rarity-legendary { border-color: var(--rarity-legendary); }
.buy-egg-icon.rarity-mythic { border-color: var(--rarity-mythic); }

@media (max-width: 480px) {
  .egg-pool-item {
    padding: 10px;
    gap: 10px;
  }
  
  .egg-icon {
    width: 50px;
    height: 50px;
    font-size: 28px;
  }
  
  .egg-name {
    font-size: 13px;
  }
  
  .egg-desc {
    font-size: 10px;
  }
  
  .hatching-item {
    padding: 10px;
    gap: 10px;
  }
  
  .hatching-egg {
    width: 60px;
    height: 60px;
  }
  
  .egg-emoji {
    font-size: 32px;
  }
}
</style>
