import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HdegisChat from '../views/HdegisChat.vue'
import HdetrfSpec from '../views/HdetrfSpec.vue'
import HdermdSpec from '../views/HdermdSpec.vue'
import HdeintgAnalysis from '../views/HdeintgAnalysis.vue'
import ServicePending from '../views/ServicePending.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/hdegis-chat', name: 'HdegisChat', component: HdegisChat },
  { path: '/hdetrf-spec', name: 'HdetrfSpec', component: HdetrfSpec },
  { path: '/hdermd-spec', name: 'HdermdSpec', component: HdermdSpec },
  { path: '/hdeintg-analysis', name: 'HdeintgAnalysis', component: HdeintgAnalysis },
  { path: '/pending', name: 'service-pending', component: ServicePending },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const layoutClass = to.name === 'HdegisChat' ? 'layout-fullscreen' : 'layout-default'
  document.body.className = layoutClass
  next()
})

export default router
