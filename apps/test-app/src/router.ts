import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: () => import('./components/Home.vue') },
  { path: '/about', name: 'About', component: () => import('./components/About.vue') }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
