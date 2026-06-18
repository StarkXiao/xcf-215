<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { RARITY_NAMES, ELEMENT_NAMES, RARITY_COLORS, ELEMENT_COLORS, BOND_CATEGORY_NAMES, BOND_CATEGORY_COLORS } from '@/types'
import type { BeastData, Rarity, Element, ActiveBond } from '@/types'

const gameStore = useGameStore()
const selectedBeast = ref<(BeastData & { discovered: boolean }) | null>(null)
const showDetail = ref(false)
const filterRarity = ref<string>('all')
const filterElement = ref<string>('all')

const filteredBeasts = computed(() => {
  return gameStore.discoveredBeasts.filter(beast => {
    if (filterRarity.value !== 'all' && beast.rarity !== filterRarity.value) return false
    if (filterElement.value !== 'all' && beast.element !== filterElement.value) return false
    return true
  })
})

const collectionProgress = computed(() => {
  if (!gameStore.player) return { discovered: 0, total: 0, percentage: 0 }
  const total = gameStore.discoveredBeasts.length
  const discovered = gameStore.discoveredBeasts.filter(b => b.discovered).length
  return {
    discovered,
    total,
    percentage: Math.floor((discovered / total) * 100)
  }
})

const ownedCount = computed(() => {
  if (!gameStore.player) return 0
  const beastIds = new Set(gameStore.player.ownedBeasts.map(b => b.beastId))
  return beastIds.size
})

const openDetail = (beast: any) => {
  if (!beast.discovered) return
  selectedBeast.value = beast
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  selectedBeast.value = null
}

const isOwned = (beastId: string): boolean => {
  if (!gameStore.player) return false
  return gameStore.player.ownedBeasts.some(b => b.beastId === beastId)
}

const getOwnedCount = (beastId: string): number => {
  if (!gameStore.player) return 0
  return gameStore.player.ownedBeasts.filter(b => b.beastId === beastId).length
}

const getHighestLevel = (beastId: string): number => {
  if (!gameStore.player) return 0
  const owned = gameStore.player.ownedBeasts.filter(b => b.beastId === beastId)
  if (owned.length === 0) return 0
  return Math.max(...owned.map(b => b.level))
}

const rarityOptions = [
  { value: 'all', label: '全部' },
  { value: 'common', label: '凡品' },
  { value: 'rare', label: '良品' },
  { value: 'epic', label: '极品' },
  { value: 'legendary', label: '仙品' },
  { value: 'mythic', label: '神品' }
]

const elementOptions = [
  { value: 'all', label: '全部' },
  { value: 'fire', label: '火' },
  { value: 'water', label: '水' },
  { value: 'wood', label: '木' },
  { value: 'earth', label: '土' },
  { value: 'metal', label: '金' },
  { value: 'thunder', label: '雷' },
  { value: 'wind', label: '风' },
  { value: 'ice', label: '冰' }
]

const bondProgress = computed(() => {
  const total = gameStore.ownedBonds.length
  const ownActive = gameStore.ownedBonds.filter(b => b.active).length
  const teamActive = gameStore.activeBondList.length
  return { 
    total, 
    ownActive, 
    teamActive, 
    percentage: total > 0 ? Math.floor((ownActive / total) * 100) : 0 
  }
})

const bondsByCategory = computed(() => {
  const activeSet = new Set(gameStore.activeBondList.map(b => b.config.id))
  const categories: { 
    key: string; 
    label: string; 
    color: string; 
    bonds: (ActiveBond & { activeInTeam: boolean })[] 
  }[] = []
  for (const cat of ['element', 'rarity', 'special'] as const) {
    const bonds = gameStore.ownedBonds
      .filter(b => b.config.category === cat)
      .map(b => ({ ...b, activeInTeam: activeSet.has(b.config.id) }))
    if (bonds.length > 0) {
      categories.push({
        key: cat,
        label: BOND_CATEGORY_NAMES[cat],
        color: BOND_CATEGORY_COLORS[cat],
        bonds
      })
    }
  }
  return categories
})
</script>

<template>
  <div class="collection-container" v-if="gameStore.player">
    <div class="progress-card card">
      <div class="card-header">
        <span class="card-title">📖 收集进度</span>
      </div>
      <div class="progress-content">
        <div class="progress-main">
          <div class="progress-circle">
            <svg viewBox="0 0 100 100" class="progress-svg">
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="rgba(0,0,0,0.3)" 
                stroke-width="8"
              />
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="url(#gradient)" 
                stroke-width="8"
                :stroke-dasharray="`${collectionProgress.percentage * 2.51} 251`"
                stroke-linecap="round"
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FFD700"/>
                  <stop offset="100%" stop-color="#F59E0B"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="progress-text">
              <span class="percentage">{{ collectionProgress.percentage }}%</span>
              <span class="count">{{ collectionProgress.discovered }}/{{ collectionProgress.total }}</span>
            </div>
          </div>
          <div class="progress-stats">
            <div class="stat-item">
              <span class="stat-icon">🐾</span>
              <span class="stat-value">{{ ownedCount }}</span>
              <span class="stat-label">已拥有种类</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">👥</span>
              <span class="stat-value">{{ gameStore.player.ownedBeasts.length }}</span>
              <span class="stat-label">灵兽总数</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-section card">
      <div class="filter-group">
        <span class="filter-label">稀有度:</span>
        <div class="filter-options">
          <button 
            v-for="option in rarityOptions" 
            :key="option.value"
            class="filter-btn"
            :class="{ active: filterRarity === option.value }"
            @click="filterRarity = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">元素:</span>
        <div class="filter-options">
          <button 
            v-for="option in elementOptions" 
            :key="option.value"
            class="filter-btn element-btn"
            :class="{ active: filterElement === option.value }"
            @click="filterElement = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="bond-codex card" v-if="gameStore.ownedBonds.length > 0">
      <div class="card-header">
        <span class="card-title">🔗 羁绊图鉴</span>
        <div class="bond-progress-texts">
          <span class="bond-progress-text owned">
            拥有 {{ bondProgress.ownActive }}/{{ bondProgress.total }}
          </span>
          <span class="bond-progress-text team" v-if="bondProgress.teamActive > 0">
            出战 {{ bondProgress.teamActive }}
          </span>
        </div>
      </div>
      <div class="bond-overview">
        <div class="bond-overview-bar">
          <div 
            class="bond-overview-fill" 
            :style="{ width: bondProgress.percentage + '%' }"
          ></div>
        </div>
        <span class="bond-overview-percent">{{ bondProgress.percentage }}%</span>
      </div>
      <div 
        v-for="category in bondsByCategory" 
        :key="category.key"
        class="bond-category"
      >
        <div class="bond-category-header">
          <span class="bond-category-dot" :style="{ backgroundColor: category.color }"></span>
          <span class="bond-category-name" :style="{ color: category.color }">{{ category.label }}</span>
          <span class="bond-category-count">
            {{ category.bonds.filter(b => b.active).length }}/{{ category.bonds.length }}
          </span>
        </div>
        <div class="bond-category-list">
          <div 
            v-for="bond in category.bonds" 
            :key="bond.config.id"
            class="bond-codex-item"
            :class="{ active: bond.active, 'team-active': bond.activeInTeam }"
          >
            <div class="bond-codex-icon" :style="{ 
              backgroundColor: bond.active ? category.color + '20' : 'rgba(0,0,0,0.2)',
              borderColor: bond.active ? category.color : 'transparent'
            }">
              {{ bond.config.icon }}
              <span class="team-badge" v-if="bond.activeInTeam">战</span>
            </div>
            <div class="bond-codex-info">
              <div class="bond-codex-name" :style="{ color: bond.active ? category.color : 'var(--text-muted)' }">
                {{ bond.config.name }}
                <span class="team-active-tag" v-if="bond.activeInTeam">出战已激活</span>
              </div>
              <div class="bond-codex-desc">{{ bond.config.description }}</div>
              <div class="bond-codex-progress">
                <span class="bond-codex-count" :class="{ fulfilled: bond.active }">
                  {{ bond.currentCount }}/{{ bond.config.requiredCount }}
                </span>
                <div class="bond-codex-bar">
                  <div 
                    class="bond-codex-fill"
                    :style="{ 
                      width: Math.min(100, (bond.currentCount / bond.config.requiredCount) * 100) + '%',
                      backgroundColor: category.color
                    }"
                  ></div>
                </div>
              </div>
              <div class="bond-codex-effects" v-if="bond.active">
                <span class="codex-effect" v-if="bond.config.effects.hpPercent > 0">❤️+{{ bond.config.effects.hpPercent }}%</span>
                <span class="codex-effect" v-if="bond.config.effects.attackPercent > 0">⚔️+{{ bond.config.effects.attackPercent }}%</span>
                <span class="codex-effect" v-if="bond.config.effects.defensePercent > 0">🛡️+{{ bond.config.effects.defensePercent }}%</span>
                <span class="codex-effect" v-if="bond.config.effects.speedPercent > 0">💨+{{ bond.config.effects.speedPercent }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="beasts-grid">
      <div 
        v-for="beast in filteredBeasts" 
        :key="beast.id"
        class="beast-card"
        :class="{ 
          discovered: beast.discovered, 
          owned: isOwned(beast.id),
          [`rarity-${beast.rarity}`]: true
        }"
        @click="openDetail(beast)"
      >
        <div class="beast-avatar" :style="{ borderColor: beast.discovered ? RARITY_COLORS[beast.rarity] : 'var(--text-muted)' }">
          <template v-if="beast.discovered">
            {{ beast.element === 'fire' ? '🔥' : beast.element === 'water' ? '💧' : beast.element === 'thunder' ? '⚡' : beast.element === 'wood' ? '🌿' : beast.element === 'earth' ? '🪨' : beast.element === 'metal' ? '⚙️' : beast.element === 'wind' ? '💨' : '❄️' }}
          </template>
          <template v-else>
            ❓
          </template>
        </div>
        <div class="beast-info">
          <div class="beast-name">
            {{ beast.discovered ? beast.name : '???' }}
          </div>
          <div class="beast-badges">
            <span 
              class="badge badge-rarity"
              :style="{ color: beast.discovered ? RARITY_COLORS[beast.rarity] : 'var(--text-muted)' }"
            >
              {{ RARITY_NAMES[beast.rarity] }}
            </span>
          </div>
          <div class="beast-owned" v-if="beast.discovered && isOwned(beast.id)">
            <span class="owned-icon">✓</span>
            <span>拥有 x{{ getOwnedCount(beast.id) }}</span>
            <span class="highest-level">最高 Lv.{{ getHighestLevel(beast.id) }}</span>
          </div>
        </div>
        <div class="beast-corner" v-if="beast.discovered">
          <span 
            class="element-badge"
            :style="{ 
              backgroundColor: ELEMENT_COLORS[beast.element] + '40',
              color: ELEMENT_COLORS[beast.element]
            }"
          >
            {{ ELEMENT_NAMES[beast.element] }}
          </span>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDetail && selectedBeast" @click.self="closeDetail">
      <div class="modal detail-modal">
        <div class="detail-header">
          <div class="detail-avatar" :style="{ borderColor: RARITY_COLORS[selectedBeast.rarity] }">
            {{ selectedBeast.element === 'fire' ? '🔥' : selectedBeast.element === 'water' ? '💧' : selectedBeast.element === 'thunder' ? '⚡' : selectedBeast.element === 'wood' ? '🌿' : selectedBeast.element === 'earth' ? '🪨' : selectedBeast.element === 'metal' ? '⚙️' : selectedBeast.element === 'wind' ? '💨' : '❄️' }}
          </div>
          <div class="detail-title">
            <h2 class="beast-name" :style="{ color: RARITY_COLORS[selectedBeast.rarity] }">
              {{ selectedBeast.name }}
            </h2>
            <div class="beast-badges">
              <span class="badge badge-rarity" :style="{ color: RARITY_COLORS[selectedBeast.rarity] }">
                {{ RARITY_NAMES[selectedBeast.rarity] }}
              </span>
              <span 
                class="badge badge-element"
                :style="{ 
                  backgroundColor: ELEMENT_COLORS[selectedBeast.element] + '40',
                  color: ELEMENT_COLORS[selectedBeast.element]
                }"
              >
                {{ ELEMENT_NAMES[selectedBeast.element] }}系
              </span>
            </div>
          </div>
        </div>
        
        <div class="detail-desc">
          {{ selectedBeast.description }}
        </div>
        
        <div class="detail-lore">
          <span class="lore-title">📜 典故</span>
          <p class="lore-content">{{ selectedBeast.lore }}</p>
        </div>
        
        <div class="detail-stats">
          <div class="stat-row">
            <span class="stat-label">❤️ 生命</span>
            <span class="stat-bar">
              <span class="bar-fill" :style="{ width: (selectedBeast.baseHp / 200 * 100) + '%' }"></span>
            </span>
            <span class="stat-value">{{ selectedBeast.baseHp }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">⚔️ 攻击</span>
            <span class="stat-bar">
              <span class="bar-fill" :style="{ width: (selectedBeast.baseAttack / 50 * 100) + '%' }"></span>
            </span>
            <span class="stat-value">{{ selectedBeast.baseAttack }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">🛡️ 防御</span>
            <span class="stat-bar">
              <span class="bar-fill" :style="{ width: (selectedBeast.baseDefense / 50 * 100) + '%' }"></span>
            </span>
            <span class="stat-value">{{ selectedBeast.baseDefense }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">💨 速度</span>
            <span class="stat-bar">
              <span class="bar-fill" :style="{ width: (selectedBeast.baseSpeed / 50 * 100) + '%' }"></span>
            </span>
            <span class="stat-value">{{ selectedBeast.baseSpeed }}</span>
          </div>
        </div>
        
        <div class="detail-info">
          <div class="info-row">
            <span class="info-label">进化阶段</span>
            <span class="info-value">{{ selectedBeast.evolutionStage }} / {{ selectedBeast.maxEvolutionStage }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">孵化时间</span>
            <span class="info-value">{{ Math.floor(selectedBeast.hatchTime / 1000) }}秒</span>
          </div>
          <div class="info-row">
            <span class="info-label">拥有状态</span>
            <span class="info-value" :class="{ owned: isOwned(selectedBeast.id) }">
              {{ isOwned(selectedBeast.id) ? `已拥有 (x${getOwnedCount(selectedBeast.id)})` : '未拥有' }}
            </span>
          </div>
        </div>
        
        <button class="btn btn-primary" @click="closeDetail">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
}

.progress-content {
  padding: 8px 0;
}

.progress-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.progress-circle {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.percentage {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: var(--accent-color);
}

.count {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--accent-color);
  min-width: 40px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.filter-section {
  padding: 12px 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 50px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-btn {
  padding: 4px 10px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.filter-btn.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.element-btn {
  min-width: 32px;
  text-align: center;
}

.beasts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.beast-card {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.beast-card.discovered:hover {
  transform: translateY(-2px);
  border-color: var(--border-color);
}

.beast-card:not(.discovered) {
  opacity: 0.5;
  cursor: not-allowed;
}

.beast-card.owned {
  border-color: rgba(34, 197, 94, 0.3);
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
  flex-shrink: 0;
}

.beast-info {
  flex: 1;
  min-width: 0;
}

.beast-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.beast-badges {
  margin-bottom: 4px;
}

.beast-owned {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #22C55E;
}

.owned-icon {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #22C55E;
  border-radius: 50%;
  color: white;
  font-size: 8px;
  font-weight: bold;
}

.highest-level {
  margin-left: auto;
  color: var(--accent-color);
}

.beast-corner {
  position: absolute;
  top: 8px;
  right: 8px;
}

.element-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
}

.bond-progress-text {
  font-size: 12px;
  color: #22C55E;
  font-weight: bold;
}

.bond-progress-texts {
  display: flex;
  gap: 8px;
  align-items: center;
}

.bond-progress-text {
  font-size: 11px;
  font-weight: bold;
}

.bond-progress-text.owned {
  color: #22C55E;
}

.bond-progress-text.team {
  padding: 2px 6px;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 6px;
  color: #F59E0B;
}

.bond-codex-item.team-active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(34, 197, 94, 0.05));
  border-color: rgba(245, 158, 11, 0.35);
}

.bond-codex-icon {
  position: relative;
}

.team-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: #F59E0B;
  color: #fff;
  border-radius: 50%;
  font-size: 9px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 1px solid #fff;
}

.team-active-tag {
  margin-left: 6px;
  padding: 1px 5px;
  background: #F59E0B;
  color: #fff;
  border-radius: 4px;
  font-size: 9px;
  font-weight: bold;
  vertical-align: middle;
  white-space: nowrap;
}

.bond-overview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.bond-overview-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
}

.bond-overview-fill {
  height: 100%;
  background: linear-gradient(90deg, #22C55E, #F59E0B);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bond-overview-percent {
  font-size: 13px;
  font-weight: bold;
  color: var(--accent-color);
  min-width: 36px;
  text-align: right;
}

.bond-category {
  margin-bottom: 12px;
}

.bond-category:last-child {
  margin-bottom: 0;
}

.bond-category-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-color);
}

.bond-category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bond-category-name {
  font-size: 13px;
  font-weight: bold;
}

.bond-category-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
}

.bond-category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bond-codex-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.bond-codex-item.active {
  border-color: rgba(255, 215, 0, 0.2);
  background: rgba(255, 215, 0, 0.03);
}

.bond-codex-item:not(.active) {
  opacity: 0.65;
}

.bond-codex-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 20px;
  border: 2px solid;
  flex-shrink: 0;
}

.bond-codex-info {
  flex: 1;
  min-width: 0;
}

.bond-codex-name {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 2px;
}

.bond-codex-desc {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 4px;
}

.bond-codex-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.bond-codex-count {
  font-size: 10px;
  color: var(--text-muted);
  min-width: 28px;
}

.bond-codex-count.fulfilled {
  color: #22C55E;
  font-weight: bold;
}

.bond-codex-bar {
  flex: 1;
  height: 3px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 2px;
  overflow: hidden;
}

.bond-codex-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.bond-codex-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.codex-effect {
  padding: 1px 5px;
  background: rgba(255, 215, 0, 0.12);
  border-radius: 4px;
  font-size: 9px;
  font-weight: bold;
  color: var(--accent-color);
  white-space: nowrap;
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
  padding: 20px;
}

.modal {
  background: linear-gradient(135deg, var(--bg-dark), var(--bg-medium));
  border: 2px solid var(--secondary-color);
  border-radius: 16px;
  padding: 24px;
  max-width: 90%;
  width: 400px;
  max-height: 85vh;
  overflow-y: auto;
}

.detail-modal {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.detail-avatar {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: 3px solid;
  flex-shrink: 0;
}

.detail-title .beast-name {
  font-size: 22px;
  margin-bottom: 6px;
}

.detail-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-lore {
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 3px solid var(--accent-color);
}

.lore-title {
  display: block;
  font-size: 13px;
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 6px;
}

.lore-content {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.7;
  font-style: italic;
}

.detail-stats {
  margin-bottom: 16px;
}

.detail-stats .stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-stats .stat-label {
  width: 70px;
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-stats .stat-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), #F59E0B);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.detail-stats .stat-value {
  width: 40px;
  text-align: right;
  font-size: 13px;
  font-weight: bold;
  color: var(--text-primary);
}

.detail-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  font-weight: bold;
}

.info-value.owned {
  color: #22C55E;
}

.detail-modal .btn {
  width: 100%;
}

@media (max-width: 480px) {
  .progress-main {
    flex-direction: column;
    gap: 16px;
  }
  
  .progress-stats {
    flex-direction: row;
    justify-content: space-around;
    width: 100%;
  }
  
  .stat-item {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
  
  .beasts-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
