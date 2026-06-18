<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { RARITY_COLORS, RARITY_NAMES } from '@/types'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const showOfflineModal = ref(false)
const showResetConfirm = ref(false)

const navItems = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/hatch', name: '孵化', icon: '🥚' },
  { path: '/feed', name: '喂养', icon: '🍖' },
  { path: '/skills', name: '技能', icon: '⚡' },
  { path: '/battle', name: '秘境', icon: '⚔️' },
  { path: '/collection', name: '图鉴', icon: '📖' }
]

onMounted(() => {
  gameStore.initGame()
  if (gameStore.offlineRewards) {
    showOfflineModal.value = true
  }
})

const collectRewards = () => {
  gameStore.collectOfflineRewards()
  showOfflineModal.value = false
}

const formatDuration = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}小时${minutes}分钟`
}

const resetGame = () => {
  gameStore.resetGame()
  showResetConfirm.value = false
  router.push('/')
}
</script>

<template>
  <div class="app-container">
    <header class="app-header" v-if="gameStore.player">
      <div class="header-left">
        <span class="player-name">{{ gameStore.player.name }}</span>
        <span class="player-level">Lv.{{ gameStore.player.level }}</span>
      </div>
      <div class="header-center">
        <div class="currency gold">
          <span class="currency-icon">💰</span>
          <span class="currency-value">{{ gameStore.player.gold.toLocaleString() }}</span>
        </div>
        <div class="currency spirit">
          <span class="currency-icon">💎</span>
          <span class="currency-value">{{ gameStore.player.spiritStone.toLocaleString() }}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn-reset" @click="showResetConfirm = true" title="重置游戏">
          🔄
        </button>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <nav class="app-nav" v-if="gameStore.player && route.name !== 'BattleScene'">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="modal-overlay" v-if="showOfflineModal" @click.self="showOfflineModal = false">
      <div class="modal offline-modal">
        <h2 class="modal-title">🌙 离线收益</h2>
        <p class="modal-subtitle">
          您已离线 {{ formatDuration(gameStore.offlineRewards?.duration || 0) }}
        </p>
        <div class="rewards-list" v-if="gameStore.offlineRewards">
          <div class="reward-item">
            <span class="reward-icon">💰</span>
            <span class="reward-text">金币 +{{ gameStore.offlineRewards.gold }}</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">✨</span>
            <span class="reward-text">经验 +{{ gameStore.offlineRewards.exp }}</span>
          </div>
          <div 
            v-for="(amount, foodId) in gameStore.offlineRewards.foodItems" 
            :key="foodId"
            class="reward-item"
          >
            <span class="reward-icon">🍎</span>
            <span class="reward-text">食物 x{{ amount }}</span>
          </div>
        </div>
        <button class="btn btn-primary" @click="collectRewards">
          领取奖励
        </button>
      </div>
    </div>

    <div class="modal-overlay" v-if="showResetConfirm" @click.self="showResetConfirm = false">
      <div class="modal">
        <h2 class="modal-title">⚠️ 确认重置</h2>
        <p class="modal-subtitle">重置后所有游戏进度将丢失，确定要重置吗？</p>
        <div class="modal-actions">
          <button class="btn" @click="showResetConfirm = false">取消</button>
          <button class="btn btn-danger" @click="resetGame">确定重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border-bottom: 2px solid var(--border-color);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
}

.player-level {
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.header-center {
  display: flex;
  gap: 16px;
}

.currency {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.currency-icon {
  font-size: 16px;
}

.currency-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
}

.btn-reset {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s ease;
}

.btn-reset:hover {
  background: rgba(220, 20, 60, 0.5);
  transform: rotate(180deg);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
}

.app-nav {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  background: linear-gradient(0deg, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95));
  border-top: 2px solid var(--border-color);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  text-decoration: none;
  color: var(--text-muted);
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 50px;
}

.nav-item.active {
  color: var(--accent-color);
  background: rgba(255, 215, 0, 0.1);
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.nav-text {
  font-size: 11px;
  font-weight: bold;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal {
  background: linear-gradient(135deg, var(--bg-dark), var(--bg-medium));
  border: 2px solid var(--secondary-color);
  border-radius: 16px;
  padding: 24px;
  max-width: 90%;
  width: 360px;
  text-align: center;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.2);
}

.modal-title {
  font-size: 20px;
  color: var(--accent-color);
  margin-bottom: 8px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.modal-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.rewards-list {
  margin-bottom: 20px;
}

.reward-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.reward-icon {
  font-size: 20px;
}

.reward-text {
  font-size: 14px;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.offline-modal {
  animation: float 0.5s ease-out;
}

@keyframes float {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 8px 12px;
  }
  
  .header-center {
    gap: 8px;
  }
  
  .currency {
    padding: 3px 8px;
  }
  
  .currency-value {
    font-size: 12px;
  }
  
  .app-main {
    padding: 12px;
  }
  
  .nav-item {
    padding: 6px 8px;
  }
  
  .nav-icon {
    font-size: 20px;
  }
  
  .nav-text {
    font-size: 10px;
  }
}
</style>
