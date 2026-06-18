import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/hatch',
    name: 'Hatch',
    component: () => import('@/views/Hatch.vue')
  },
  {
    path: '/feed',
    name: 'Feed',
    component: () => import('@/views/Feed.vue')
  },
  {
    path: '/skills',
    name: 'Skills',
    component: () => import('@/views/Skills.vue')
  },
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('@/views/Battle.vue')
  },
  {
    path: '/collection',
    name: 'Collection',
    component: () => import('@/views/Collection.vue')
  },
  {
    path: '/battle-scene',
    name: 'BattleScene',
    component: () => import('@/views/BattleScene.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
