<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { getBeastById } from '@/data/beasts'
import { RARITY_NAMES, ELEMENT_NAMES, RARITY_COLORS, ELEMENT_COLORS } from '@/types'

const gameStore = useGameStore()
const selectedBeastId = ref<string | null>(null)

const selectedBeast = computed(() => {
  if (!selectedBeastId.value || !gameStore.player) return null
  return gameStore.player.ownedBeasts.find(b => b.instanceId === selectedBeastId.value) || null
})

const selectedBeastData = computed(() => {
  if (!selectedBeast.value) return null
  return getBeastById(selectedBeast.value.beastId)
})

const selectBeast = (instanceId: string) => {
  selectedBeastId.value = instanceId
}

const getUnlockCost = (skillIndex: number): number => {
  return 100 * (skillIndex + 1)
}

const getUpgradeCost = (skillLevel: number, skillIndex: number): number => {
  return 50 * skillLevel * (skillIndex + 1)
}

const getRequiredLevel = (skillIndex: number): number => {
  return (skillIndex + 1) * 5
}

const unlockSkill = (skillIndex: number) => {
  if (!selectedBeastId.value) return
  gameStore.unlockSkill(selectedBeastId.value, skillIndex)
}

const upgradeSkill = (skillIndex: number) => {
  if (!selectedBeastId.value) return
  gameStore.upgradeSkill(selectedBeastId.value, skillIndex)
}

const getSkillDamage = (skill: any): number => {
  if (!selectedBeast.value) return skill.damage
  return skill.damage + selectedBeast.value.attack
}
</script>

<template>
  <div class="skills-container" v-if="gameStore.player">
    <div class="empty-state card" v-if="gameStore.player.ownedBeasts.length === 0">
      <div class="empty-icon">⚡</div>
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
            <div class="skill-count">
              {{ beast.skills.filter(s => s.unlocked).length }}/{{ beast.skills.length }} 技能
            </div>
          </div>
        </div>
      </div>

      <div class="skills-detail card" v-if="selectedBeast && selectedBeastData">
        <div class="beast-header">
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

        <div class="beast-lore" v-if="selectedBeastData.lore">
          <span class="lore-icon">📜</span>
          <p class="lore-text">{{ selectedBeastData.lore }}</p>
        </div>

        <div class="skills-header">
          <span class="skills-title">⚡ 技能列表</span>
          <span class="skills-hint">升级技能可提升伤害</span>
        </div>

        <div class="skills-list">
          <div 
            v-for="(skill, index) in selectedBeast.skills" 
            :key="skill.id"
            class="skill-item"
            :class="{ locked: !skill.unlocked, 'max-level': skill.level >= 10 }"
          >
            <div class="skill-icon" :style="{ backgroundColor: ELEMENT_COLORS[skill.element] + '30' }">
              {{ skill.icon }}
            </div>
            <div class="skill-info">
              <div class="skill-header-row">
                <span class="skill-name">{{ skill.name }}</span>
                <span 
                  class="skill-element badge badge-element"
                  :style="{ 
                    backgroundColor: ELEMENT_COLORS[skill.element] + '40',
                    color: ELEMENT_COLORS[skill.element]
                  }"
                >
                  {{ ELEMENT_NAMES[skill.element] }}
                </span>
              </div>
              <div class="skill-desc">{{ skill.description }}</div>
              <div class="skill-stats">
                <span class="stat">
                  <span class="stat-label">伤害:</span>
                  <span class="stat-value text-glow" :style="{ color: ELEMENT_COLORS[skill.element] }">
                    {{ getSkillDamage(skill) }}
                  </span>
                </span>
                <span class="stat">
                  <span class="stat-label">等级:</span>
                  <span class="stat-value">Lv.{{ skill.level }}</span>
                </span>
                <span class="stat">
                  <span class="stat-label">冷却:</span>
                  <span class="stat-value">{{ skill.cooldown }}回合</span>
                </span>
              </div>
            </div>
            <div class="skill-action">
              <template v-if="!skill.unlocked">
                <div class="unlock-req" v-if="selectedBeast.level < getRequiredLevel(index)">
                  需要 Lv.{{ getRequiredLevel(index) }}
                </div>
                <button 
                  v-else
                  class="btn btn-primary btn-small"
                  :disabled="gameStore.player!.gold < getUnlockCost(index)"
                  @click="unlockSkill(index)"
                >
                  解锁<br/>{{ getUnlockCost(index) }}💰
                </button>
              </template>
              <template v-else-if="skill.level < 10">
                <button 
                  class="btn btn-success btn-small"
                  :disabled="gameStore.player!.spiritStone < getUpgradeCost(skill.level, index)"
                  @click="upgradeSkill(index)"
                >
                  升级<br/>{{ getUpgradeCost(skill.level, index) }}💎
                </button>
              </template>
              <span v-else class="max-badge">MAX</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skills-container {
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

.skill-count {
  font-size: 11px;
  color: var(--accent-color);
  background: rgba(255, 215, 0, 0.1);
  padding: 4px 8px;
  border-radius: 8px;
}

.beast-header {
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

.beast-lore {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 3px solid var(--accent-color);
}

.lore-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.lore-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  font-style: italic;
}

.skills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skills-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--accent-color);
}

.skills-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.skill-item:hover {
  border-color: var(--border-color);
}

.skill-item.locked {
  opacity: 0.6;
}

.skill-item.max-level {
  border-color: var(--accent-color);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
}

.skill-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border-radius: 12px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
  min-width: 0;
}

.skill-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.skill-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-primary);
}

.skill-element {
  padding: 1px 6px;
  font-size: 10px;
}

.skill-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  line-height: 1.4;
}

.skill-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.skill-stats .stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  color: var(--text-muted);
}

.stat-value {
  color: var(--text-primary);
  font-weight: bold;
}

.skill-action {
  flex-shrink: 0;
  text-align: center;
}

.btn-small {
  padding: 8px 12px;
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
}

.unlock-req {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.max-badge {
  display: inline-block;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--accent-color), #F59E0B);
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

@media (max-width: 480px) {
  .skill-item {
    flex-wrap: wrap;
  }
  
  .skill-action {
    width: 100%;
    margin-top: 8px;
  }
  
  .skill-action .btn {
    width: 100%;
  }
}
</style>
