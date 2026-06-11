import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import GameView from '@/views/GameView.vue'
import ProfileView from '@/views/ProfileView.vue'
import AuthView from '@/views/AuthView.vue'
import CreateQuestionView from '@/views/CreateQuestionView.vue'
import VersusLobbyView from '@/views/VersusLobbyView.vue'
import VersusGameView from '@/views/VersusGameView.vue'

const routes = [
  { path: '/auth',             name: 'auth',              component: AuthView },
  { path: '/',                 name: 'home',              component: HomeView, meta: { requiresAuth: true } },
  { path: '/game',             name: 'game',              component: GameView, meta: { requiresAuth: true } },
  { path: '/profile',          name: 'profile',           component: ProfileView, meta: { requiresAuth: true } },
  { path: '/create-question',  name: 'create-question',   component: CreateQuestionView, meta: { requiresAuth: true } },
  { path: '/versus-lobby',     name: 'versus-lobby',      component: VersusLobbyView, meta: { requiresAuth: true } },
  { path: '/versus-game',      name: 'versus-game',       component: VersusGameView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Garder une référence de l'état d'auth qui sera mis à jour par App.vue
let currentUser = null
let authLoading = true

export function setAuthState(user, loading) {
  currentUser = user
  authLoading = loading
}

// Guard pour protéger les routes
router.beforeEach((to, from, next) => {
  // Attendre la vérification de l'auth si elle est en cours
  if (authLoading && to.meta.requiresAuth) {
    next()
    return
  }

  if (to.meta.requiresAuth && !currentUser) {
    // Route protégée mais pas connecté
    next('/auth')
  } else if (to.path === '/auth' && currentUser && !authLoading) {
    // Connecté et chargement terminé
    next('/')
  } else {
    next()
  }
})

export default router

