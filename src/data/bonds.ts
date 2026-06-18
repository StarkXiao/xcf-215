import type { BondConfig } from '@/types'

export const BONDS_DATA: BondConfig[] = [
  {
    id: 'element_fire_2',
    name: '烈焰共鸣·壹',
    description: '2只火系灵兽共鸣，攻击与防御小幅提升',
    category: 'element',
    icon: '🔥',
    effects: { hpPercent: 0, attackPercent: 5, defensePercent: 5, speedPercent: 0 },
    condition: 'fire',
    requiredCount: 2
  },
  {
    id: 'element_fire_3',
    name: '烈焰共鸣·贰',
    description: '3只火系灵兽共鸣，攻击与防御大幅提升，速度提升',
    category: 'element',
    icon: '🔥',
    effects: { hpPercent: 5, attackPercent: 10, defensePercent: 10, speedPercent: 5 },
    condition: 'fire',
    requiredCount: 3
  },
  {
    id: 'element_water_2',
    name: '碧波共鸣·壹',
    description: '2只水系灵兽共鸣，生命与防御小幅提升',
    category: 'element',
    icon: '💧',
    effects: { hpPercent: 5, attackPercent: 0, defensePercent: 5, speedPercent: 0 },
    condition: 'water',
    requiredCount: 2
  },
  {
    id: 'element_water_3',
    name: '碧波共鸣·贰',
    description: '3只水系灵兽共鸣，生命与防御大幅提升，速度提升',
    category: 'element',
    icon: '💧',
    effects: { hpPercent: 10, attackPercent: 5, defensePercent: 10, speedPercent: 5 },
    condition: 'water',
    requiredCount: 3
  },
  {
    id: 'element_wood_2',
    name: '翠林共鸣·壹',
    description: '2只木系灵兽共鸣，攻击与速度小幅提升',
    category: 'element',
    icon: '🌿',
    effects: { hpPercent: 0, attackPercent: 5, defensePercent: 0, speedPercent: 5 },
    condition: 'wood',
    requiredCount: 2
  },
  {
    id: 'element_wood_3',
    name: '翠林共鸣·贰',
    description: '3只木系灵兽共鸣，攻击与速度大幅提升，生命提升',
    category: 'element',
    icon: '🌿',
    effects: { hpPercent: 5, attackPercent: 10, defensePercent: 5, speedPercent: 10 },
    condition: 'wood',
    requiredCount: 3
  },
  {
    id: 'element_earth_2',
    name: '厚土共鸣·壹',
    description: '2只土系灵兽共鸣，生命与防御小幅提升',
    category: 'element',
    icon: '🪨',
    effects: { hpPercent: 5, attackPercent: 0, defensePercent: 5, speedPercent: 0 },
    condition: 'earth',
    requiredCount: 2
  },
  {
    id: 'element_earth_3',
    name: '厚土共鸣·贰',
    description: '3只土系灵兽共鸣，生命与防御大幅提升',
    category: 'element',
    icon: '🪨',
    effects: { hpPercent: 10, attackPercent: 5, defensePercent: 10, speedPercent: 5 },
    condition: 'earth',
    requiredCount: 3
  },
  {
    id: 'element_metal_2',
    name: '锐金共鸣·壹',
    description: '2只金系灵兽共鸣，攻击与速度小幅提升',
    category: 'element',
    icon: '⚙️',
    effects: { hpPercent: 0, attackPercent: 5, defensePercent: 0, speedPercent: 5 },
    condition: 'metal',
    requiredCount: 2
  },
  {
    id: 'element_metal_3',
    name: '锐金共鸣·贰',
    description: '3只金系灵兽共鸣，攻击与速度大幅提升',
    category: 'element',
    icon: '⚙️',
    effects: { hpPercent: 5, attackPercent: 10, defensePercent: 5, speedPercent: 10 },
    condition: 'metal',
    requiredCount: 3
  },
  {
    id: 'element_thunder_2',
    name: '雷霆共鸣·壹',
    description: '2只雷系灵兽共鸣，攻击与速度小幅提升',
    category: 'element',
    icon: '⚡',
    effects: { hpPercent: 0, attackPercent: 5, defensePercent: 0, speedPercent: 5 },
    condition: 'thunder',
    requiredCount: 2
  },
  {
    id: 'element_thunder_3',
    name: '雷霆共鸣·贰',
    description: '3只雷系灵兽共鸣，攻击与速度大幅提升，防御提升',
    category: 'element',
    icon: '⚡',
    effects: { hpPercent: 5, attackPercent: 10, defensePercent: 5, speedPercent: 10 },
    condition: 'thunder',
    requiredCount: 3
  },
  {
    id: 'element_wind_2',
    name: '疾风共鸣·壹',
    description: '2只风系灵兽共鸣，速度与攻击小幅提升',
    category: 'element',
    icon: '💨',
    effects: { hpPercent: 0, attackPercent: 5, defensePercent: 0, speedPercent: 5 },
    condition: 'wind',
    requiredCount: 2
  },
  {
    id: 'element_wind_3',
    name: '疾风共鸣·贰',
    description: '3只风系灵兽共鸣，速度与攻击大幅提升',
    category: 'element',
    icon: '💨',
    effects: { hpPercent: 5, attackPercent: 10, defensePercent: 5, speedPercent: 10 },
    condition: 'wind',
    requiredCount: 3
  },
  {
    id: 'element_ice_2',
    name: '寒冰共鸣·壹',
    description: '2只冰系灵兽共鸣，防御与速度小幅提升',
    category: 'element',
    icon: '❄️',
    effects: { hpPercent: 0, attackPercent: 0, defensePercent: 5, speedPercent: 5 },
    condition: 'ice',
    requiredCount: 2
  },
  {
    id: 'element_ice_3',
    name: '寒冰共鸣·贰',
    description: '3只冰系灵兽共鸣，防御与速度大幅提升，攻击提升',
    category: 'element',
    icon: '❄️',
    effects: { hpPercent: 5, attackPercent: 5, defensePercent: 10, speedPercent: 10 },
    condition: 'ice',
    requiredCount: 3
  },
  {
    id: 'rarity_common_3',
    name: '凡骨铸仙',
    description: '3只凡品灵兽齐心，生命与防御提升',
    category: 'rarity',
    icon: '🪨',
    effects: { hpPercent: 10, attackPercent: 0, defensePercent: 8, speedPercent: 0 },
    condition: 'common',
    requiredCount: 3
  },
  {
    id: 'rarity_rare_3',
    name: '良材美质',
    description: '3只良品灵兽共鸣，全属性小幅提升',
    category: 'rarity',
    icon: '💎',
    effects: { hpPercent: 5, attackPercent: 5, defensePercent: 5, speedPercent: 5 },
    condition: 'rare',
    requiredCount: 3
  },
  {
    id: 'rarity_epic_3',
    name: '极品之耀',
    description: '3只极品灵兽共鸣，攻击与速度大幅提升',
    category: 'rarity',
    icon: '💫',
    effects: { hpPercent: 5, attackPercent: 10, defensePercent: 5, speedPercent: 10 },
    condition: 'epic',
    requiredCount: 3
  },
  {
    id: 'rarity_legendary_2',
    name: '仙灵之契',
    description: '2只仙品灵兽共鸣，全属性提升',
    category: 'rarity',
    icon: '🌟',
    effects: { hpPercent: 8, attackPercent: 8, defensePercent: 8, speedPercent: 8 },
    condition: 'legendary',
    requiredCount: 2
  },
  {
    id: 'rarity_legendary_3',
    name: '仙灵圣约',
    description: '3只仙品灵兽共鸣，全属性大幅提升',
    category: 'rarity',
    icon: '🌟',
    effects: { hpPercent: 12, attackPercent: 12, defensePercent: 12, speedPercent: 12 },
    condition: 'legendary',
    requiredCount: 3
  },
  {
    id: 'rarity_mythic_2',
    name: '神兽降临',
    description: '2只神品灵兽共鸣，攻击与速度大幅提升',
    category: 'rarity',
    icon: '👑',
    effects: { hpPercent: 5, attackPercent: 15, defensePercent: 5, speedPercent: 10 },
    condition: 'mythic',
    requiredCount: 2
  },
  {
    id: 'special_four_symbols',
    name: '四灵镇守',
    description: '青龙、朱雀、白虎、玄武齐聚，全属性大幅提升',
    category: 'special',
    icon: '🌀',
    effects: { hpPercent: 20, attackPercent: 20, defensePercent: 20, speedPercent: 20 },
    condition: ['dragon', 'phoenix', 'tiger', 'turtle'],
    requiredCount: 4
  },
  {
    id: 'special_five_elements',
    name: '五行相生',
    description: '拥有5种不同系别灵兽，全属性提升',
    category: 'special',
    icon: '☯️',
    effects: { hpPercent: 8, attackPercent: 8, defensePercent: 8, speedPercent: 8 },
    condition: ['fire', 'water', 'wood', 'earth', 'metal'],
    requiredCount: 5
  },
  {
    id: 'special_all_elements',
    name: '万象归一',
    description: '拥有全部8种系别灵兽，全属性大幅提升',
    category: 'special',
    icon: '🌈',
    effects: { hpPercent: 15, attackPercent: 15, defensePercent: 15, speedPercent: 15 },
    condition: ['fire', 'water', 'wood', 'earth', 'metal', 'thunder', 'wind', 'ice'],
    requiredCount: 8
  },
  {
    id: 'special_qilin_fox',
    name: '祥瑞双灵',
    description: '麒麟与九尾狐同阵，攻击与速度提升',
    category: 'special',
    icon: '✨',
    effects: { hpPercent: 0, attackPercent: 10, defensePercent: 0, speedPercent: 10 },
    condition: ['qilin', 'fox'],
    requiredCount: 2
  },
  {
    id: 'special_dragon_fish',
    name: '龙跃化鲤',
    description: '青龙与龙鲤同阵，生命与攻击提升',
    category: 'special',
    icon: '🐉',
    effects: { hpPercent: 10, attackPercent: 10, defensePercent: 0, speedPercent: 0 },
    condition: ['dragon', 'fish'],
    requiredCount: 2
  },
  {
    id: 'special_bear_phoenix',
    name: '炎火双灵',
    description: '赤焰熊与朱雀同阵，攻击大幅提升',
    category: 'special',
    icon: '🔥',
    effects: { hpPercent: 0, attackPercent: 15, defensePercent: 5, speedPercent: 0 },
    condition: ['bear', 'phoenix'],
    requiredCount: 2
  },
  {
    id: 'special_monkey_crane',
    name: '灵猴仙鹤',
    description: '灵明石猴与仙鹤同阵，速度与攻击提升',
    category: 'special',
    icon: '🏔️',
    effects: { hpPercent: 0, attackPercent: 8, defensePercent: 0, speedPercent: 12 },
    condition: ['monkey', 'crane'],
    requiredCount: 2
  }
]

export const getBondById = (id: string): BondConfig | undefined => {
  return BONDS_DATA.find(b => b.id === id)
}
