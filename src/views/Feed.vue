<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { getBeastById } from '@/data/beasts'
import { FOODS_DATA, getFoodById } from '@/data/foods'
import { BeastDisplay } from '@/utils/pixi'
import { RARITY_NAMES, ELEMENT_NAMES, RARITY_COLORS, ELEMENT_COLORS } from '@/types'

const gameStore = useGameStore()
const selectedBeastId = ref<string | null>(null)
const pixiContainer = ref<HTMLElement | null>(null)
const showHealConfirm = ref(false)
const showShop = ref(false)
let beastDisplay: BeastDisplay | null = null
let updateInterval: number | null = null

const selectedBeast = computed(() => {
  if (!selectedBeastId.value || !gameStore.player) return null
  return gameStore.player.ownedBeasts.find(b => b.instanceId === selectedBeastId.value) || null
})

const selectedBeastData = computed(() => {
  if (!selectedBeast.value) return null
  return getBeastById(selectedBeast.value.beastId)
})

const availableFoods = computed(() => {
  if (!gameStore.player) return []
  return FOODS_DATA.filter(food => {
    const count = gameStore.player!.inventory.foods[food.id] || 0
    return count > 0
  }).map(food => ({
    ...food,
    count: gameStore.player!.inventory.foods[food.id] || 0
  }))
})

const allFoods = computed(() => {
  return FOODS_DATA.map(food => ({
    ...food,
    count: gameStore.player?.inventory.foods[food.id] || 0
  }))
})

onMounted(() => {
  if (gameStore.player && gameStore.player.ownedBeasts.length > 0) {
    selectedBeastId.value = gameStore.player.activeBeastId || gameStore.player.ownedBeasts[0].instanceId
  }
  
  updateInterval = window.setInterval(() => {
    gameStore.updateAllEggs()
  }, 1000)
})

onUnmounted(() => {
  if (beastDisplay) {
    beastDisplay.destroy()
  }
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

const selectBeast = (instanceId: string) => {
  selectedBeastId.value = instanceId
  gameStore.setActiveBeast(instanceId)
  
  if (beastDisplay && selectedBeastData.value) {
    beastDisplay.setBeast(
      selectedBeast.value!.beastId,
      selectedBeastData.value.element,
      selectedBeastData.value.rarity
    )
  }
}

const initPixi = () => {
  if (pixiContainer.value && selectedBeast.value && selectedBeastData.value && !beastDisplay) {
    const rect = pixiContainer.value.getBoundingClientRect()
    beastDisplay = new BeastDisplay(pixiContainer.value, rect.width, rect.height)
    beastDisplay.setBeast(
      selectedBeast.value.beastId,
      selectedBeastData.value.element,
      selectedBeastData.value.rarity
    )
  }
}

const feedBeast = (foodId: string) => {
  if (!selectedBeastId.value) return
  const success = gameStore.feedBeast(selectedBeastId.value, foodId)
  if (success && beastDisplay) {
    beastDisplay.setBeast(
      selectedBeast.value!.beastId,
      selectedBeastData.value!.element,
      selectedBeastData.value!.rarity
    )
  }
}

const healBeast = () => {
  if (!selectedBeastId.value) return
  const success = gameStore.healBeast(selectedBeastId.value)
  if (success) {
    showHealConfirm.value = false
  }
}

const buyFood = (foodId: string, amount: number = 1) => {
  gameStore.buyFood(foodId, amount)
}

const isFavoriteFood = (foodId: string): boolean => {
  if (!selectedBeastData.value) return false
  return selectedBeastData.value.favoriteFood.includes(foodId)
}

const getHealCost = (): number => {
  if (!selectedBeast.value) return 0
  return Math.floor(selectedBeast.value.maxHp * 0.5)
}
</script>

<template>
  <div class="feed-container" v-if="gameStore.player">
    <div class="empty-state card" v-if="gameStore.player.ownedBeasts.length === 0">
      <div class="empty-icon">🐾</div>
      <p class="empty-text">还没有灵兽</p>
      <p class="empty-desc">先去孵化一只灵兽吧！</p>
    </div>

    <template v-else>
      <div class="beast-selector card">
        <div class="card-header">
          <span class="card-title">选择灵兽</span>
        </div>
        <div class="beast-list">
          <div 
            v-for="beast in gameStore.player.ownedBeasts" 
            :key="beast.instanceId"
            class="beast-item"
            :class="{ active: beast.instanceId === selectedBeastId }"
            @click="selectBeast(beast.instanceId)"
          >
            <div class="beast-avatar" :style="{ 
              borderColor: RARITY_COLORS[getBeastById(beast.beastId)?.rarity || 'common']
            }">
              {{ getBeastById(beast.beastId) ? (getBeastById(beast.beastId)!.element === 'fire' ? '🔥' : getBeastById(beast.beastId)!.element === 'water' ? '💧' : getBeastById(beast.beastId)!.element === 'thunder' ? '⚡' : getBeastById(beast.beastId)!.element === 'wood' ? '🌿' : getBeastById(beast.beastId)!.element === 'earth' ? '🪨' : getBeastById(beast.beastId)!.element === 'metal' ? '⚙️' : getBeastById(beast.beastId)!.element === 'wind' ? '💨' : '❄️') : '🐾' }}
            </div>
            <div class="beast-info">
              <div class="beast-name">{{ beast.name }}</div>
              <div class="beast-level">Lv.{{ beast.level }}</div>
            </div>
            <div class="beast-hp">
              <div class="hp-bar">
                <div 
                  class="hp-fill" 
                  :style="{ width: (beast.hp / beast.maxHp * 100) + '%' }"
                ></div>
              </div>
              <span class="hp-text">{{ beast.hp }}/{{ beast.maxHp }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="beast-detail card" v-if="selectedBeast && selectedBeastData">
        <div class="detail-header">
          <div class="beast-title">
            <span class="name" :style="{ color: RARITY_COLORS[selectedBeastData.rarity] }">
              {{ selectedBeast.name }}
            </span>
            <span class="level">Lv.{{ selectedBeast.level }}</span>
          </div>
          <div class="badges">
            <span class="badge badge-rarity" :style="{ color: RARITY_COLORS[selectedBeastData.rarity] }">
              {{ RARITY_NAMES[selectedBeastData.rarity] }}
            </span>
            <span 
              class="badge badge-element"
              :style="{ 
                backgroundColor: ELEMENT_COLORS[selectedBeastData.element] + '40',
                color: ELEMENT_COLORS[selectedBeastData.element]
              }"
            >
              {{ ELEMENT_NAMES[selectedBeastData.element] }}系
            </span>
          </div>
        </div>

        <div class="pixi-wrapper">
          <div class="pixi-container" ref="pixiContainer" v-show="true" @vue:mounted="initPixi"></div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-icon">❤️</span>
            <span class="stat-label">生命</span>
            <div class="stat-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill progress-hp" 
                  :style="{ width: (selectedBeast.hp / selectedBeast.maxHp * 100) + '%' }"
                ></div>
              </div>
            </div>
            <span class="stat-value">{{ selectedBeast.hp }}/{{ selectedBeast.maxHp }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">✨</span>
            <span class="stat-label">经验</span>
            <div class="stat-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill progress-exp" 
                  :style="{ width: (selectedBeast.exp / selectedBeast.expToNext * 100) + '%' }"
                ></div>
              </div>
            </div>
            <span class="stat-value">{{ selectedBeast.exp }}/{{ selectedBeast.expToNext }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💕</span>
            <span class="stat-label">亲密度</span>
            <div class="stat-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill progress-intimacy" 
                  :style="{ width: (selectedBeast.intimacy / 10) + '%' }"
                ></div>
              </div>
            </div>
            <span class="stat-value">{{ selectedBeast.intimacy }}/1000</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🍖</span>
            <span class="stat-label">饱食度</span>
            <div class="stat-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill progress-hunger" 
                  :style="{ width: selectedBeast.hunger + '%' }"
                ></div>
              </div>
            </div>
            <span class="stat-value">{{ selectedBeast.hunger }}/100</span>
          </div>
        </div>

        <div class="attr-grid">
          <div class="attr-card">
            <span class="attr-icon">⚔️</span>
            <span class="attr-value">{{ selectedBeast.attack }}</span>
            <span class="attr-name">攻击</span>
          </div>
          <div class="attr-card">
            <span class="attr-icon">🛡️</span>
            <span class="attr-value">{{ selectedBeast.defense }}</span>
            <span class="attr-name">防御</span>
          </div>
          <div class="attr-card">
            <span class="attr-icon">💨</span>
            <span class="attr-value">{{ selectedBeast.speed }}</span>
            <span class="attr-name">速度</span>
          </div>
        </div>

        <div class="action-buttons">
          <button 
            class="btn btn-danger"
            :disabled="selectedBeast.hp >= selectedBeast.maxHp || gameStore.player.gold < getHealCost()"
            @click="showHealConfirm = true"
          >
            💊 治疗 ({{ getHealCost() }}💰)
          </button>
          <button class="btn btn-primary" @click="showShop = true">
            🛒 商店
          </button>
        </div>
      </div>

      <div class="food-inventory card">
        <div class="card-header">
          <span class="card-title">🍖 食物背包</span>
          <span class="food-tip">喜欢的食物有1.5倍加成</span>
        </div>
        
        <div class="empty-food" v-if="availableFoods.length === 0">
          <p>背包里没有食物了，去商店购买吧！</p>
        </div>
        
        <div class="food-grid" v-else>
          <div 
            v-for="food in availableFoods" 
            :key="food.id"
            class="food-item"
            :class="{ favorite: isFavoriteFood(food.id) }"
            @click="feedBeast(food.id)"
          >
            <div class="food-icon">{{ food.icon }}</div>
            <div class="food-info">
              <div class="food-name">
                {{ food.name }}
                <span v-if="isFavoriteFood(food.id)" class="favorite-tag">❤️</span>
              </div>
              <div class="food-effects">
                <span>+{{ food.expBonus }} EXP</span>
                <span>+{{ food.intimacyBonus }} 亲密</span>
              </div>
            </div>
            <div class="food-count">x{{ food.count }}</div>
          </div>
        </div>
      </div>
    </template>

    <div class="modal-overlay" v-if="showHealConfirm" @click.self="showHealConfirm = false">
      <div class="modal">
        <h2 class="modal-title">💊 确认治疗</h2>
        <p class="modal-subtitle">
          将消耗 {{ getHealCost() }} 金币，恢复 {{ selectedBeast?.name }} 的全部生命值
        </p>
        <div class="modal-actions">
          <button class="btn" @click="showHealConfirm = false">取消</button>
          <button class="btn btn-success" @click="healBeast">确认治疗</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay shop-modal" v-if="showShop" @click.self="showShop = false">
      <div class="modal large-modal">
        <h2 class="modal-title">🛒 食物商店</h2>
        <div class="shop-list">
          <div 
            v-for="food in allFoods" 
            :key="food.id"
            class="shop-item"
          >
            <div class="shop-icon">{{ food.icon }}</div>
            <div class="shop-info">
              <div class="shop-name" :style="{ color: RARITY_COLORS[food.rarity] }">
                {{ food.name }}
                <span class="badge badge-rarity" :style="{ color: RARITY_COLORS[food.rarity] }">
                  {{ RARITY_NAMES[food.rarity] }}
                </span>
              </div>
              <div class="shop-desc">{{ food.description }}</div>
              <div class="shop-effects">
                <span>+{{ food.expBonus }} EXP</span>
                <span>+{{ food.intimacyBonus }} 亲密</span>
                <span>+{{ food.hungerRestore }} 饱食</span>
              </div>
            </div>
            <div class="shop-buy">
              <div class="shop-price">
                <span>💰</span>
                <span>{{ food.price }}</span>
              </div>
              <button 
                class="btn btn-primary btn-small"
                :disabled="gameStore.player!.gold < food.price"
                @click="buyFood(food.id, 1)"
              >
                购买
              </button>
              <div class="owned">拥有: {{ food.count }}</div>
            </div>
          </div>
        </div>
        <button class="btn" @click="showShop = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
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

.beast-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.beast-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.beast-item:hover {
  background: rgba(0, 0, 0, 0.3);
}

.beast-item.active {
  border-color: var(--accent-color);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
}

.beast-avatar {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid;
}

.beast-info {
  flex: 1;
}

.beast-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-primary);
}

.beast-level {
  font-size: 12px;
  color: var(--text-secondary);
}

.beast-hp {
  min-width: 100px;
}

.hp-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 2px;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #22C55E, #16A34A);
  transition: width 0.3s ease;
}

.hp-text {
  font-size: 10px;
  color: var(--text-secondary);
}

.detail-header {
  margin-bottom: 12px;
}

.beast-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.beast-title .name {
  font-size: 20px;
  font-weight: bold;
}

.beast-title .level {
  padding: 2px 10px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.badges {
  display: flex;
  gap: 8px;
}

.pixi-wrapper {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.pixi-container {
  width: 180px;
  height: 180px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  width: 24px;
  font-size: 16px;
}

.stat-label {
  width: 50px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-progress {
  flex: 1;
}

.stat-value {
  width: 80px;
  text-align: right;
  font-size: 12px;
  color: var(--text-primary);
}

.attr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.attr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.attr-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.attr-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--accent-color);
}

.attr-name {
  font-size: 11px;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons .btn {
  flex: 1;
}

.food-tip {
  font-size: 11px;
  color: var(--text-muted);
}

.empty-food {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.food-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.food-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 215, 0, 0.1);
}

.food-item.favorite {
  border-color: #EC4899;
  box-shadow: 0 0 15px rgba(236, 72, 153, 0.2);
}

.food-icon {
  font-size: 32px;
}

.food-info {
  flex: 1;
  min-width: 0;
}

.food-name {
  font-size: 13px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.favorite-tag {
  margin-left: 4px;
}

.food-effects {
  font-size: 10px;
  color: var(--text-secondary);
  display: flex;
  gap: 8px;
}

.food-count {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
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
  width: 340px;
  max-height: 80vh;
  overflow-y: auto;
}

.large-modal {
  width: 90%;
  max-width: 480px;
}

.modal-title {
  font-size: 18px;
  color: var(--accent-color);
  margin-bottom: 16px;
  text-align: center;
}

.modal-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.shop-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.shop-icon {
  font-size: 36px;
}

.shop-info {
  flex: 1;
  min-width: 0;
}

.shop-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.shop-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.shop-effects {
  font-size: 10px;
  color: var(--text-muted);
  display: flex;
  gap: 8px;
}

.shop-buy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.shop-price {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
  color: var(--accent-color);
}

.owned {
  font-size: 10px;
  color: var(--text-muted);
}

@media (max-width: 480px) {
  .food-grid {
    grid-template-columns: 1fr;
  }
  
  .pixi-container {
    width: 150px;
    height: 150px;
  }
}
</style>
