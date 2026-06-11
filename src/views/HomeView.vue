<template>
  <div class="home">
    <header class="header">
      <div class="logo">
        <span class="logo-brain">🧠</span>
        <h1 class="logo-title"><span class="logo-logic">LOGIC</span>DLE</h1>
      </div>
      <p class="logo-sub">Le défi logique inspiré de <strong>100% Logique</strong></p>
      <nav class="top-nav">
        <button class="nav-btn" @click="$router.push('/create-question')" title="Créer une nouvelle question">➕ Créer</button>
        <button class="nav-btn" @click="$router.push('/profile')">🏆 Classement</button>
        <button class="nav-btn" @click="$router.push('/profile')">👤 Mon profil</button>
        <button class="theme-toggle" @click="theme.toggle()" :title="theme.isDark ? 'Mode clair' : 'Mode sombre'">
          {{ theme.isDark ? '☀️' : '🌙' }}
        </button>
      </nav>
    </header>

    <main class="main">
      <p class="section-label">CHOISISSEZ UN MODE</p>
      <div class="modes-list">
        <ModeCard
          v-for="mode in MODES" :key="mode.id" :mode="mode"
          :disabled="mode.id === 'daily' && store.dailyDone"
          @click="select(mode)"
        />
        <button class="versus-btn" @click="$router.push('/versus-lobby')">
          <span class="versus-icon">⚔️</span>
          <span class="versus-title">Versus</span>
          <span class="versus-desc">Jouez contre vos amis</span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import { useThemeStore } from '@/stores/themeStore.js'
import { useAuthStore } from '@/stores/authStore.js'
import ModeCard from '@/components/ModeCard.vue'

const router = useRouter()
const store = useGameStore()
const theme = useThemeStore()
const authStore = useAuthStore()

const MODES = [
  { id:'daily',    icon:'📅', color:'var(--daily-color)',    name:'Quotidien',    badge:"Aujourd'hui", badgeIcon:'📅', desc:'1 question par jour — répondez et estimez le % de Français' },
  { id:'endless',  icon:'∞',  color:'var(--endless-color)',  name:'Endless',      badge:'Sans limite',  badgeIcon:'∞',  desc:"Questions à l'infini — enchaînez sans limite !" },
  { id:'express',  icon:'⚡', color:'var(--express-color)',  name:'Défi Express', badge:'20 sec',       badgeIcon:'⚡', desc:'Une question, 20 secondes — une erreur et c\'est fini !' },
  { id:'expert',   icon:'🔴', color:'var(--expert-color)',   name:'Mode Expert',  badge:'Ultra difficile', badgeIcon:'🔴', desc:'Uniquement les questions à 1-20% — système de combos !' },
  { id:'survival', icon:'🛡️', color:'var(--survival-color)', name:'Survie',       badge:'3 vies',       badgeIcon:'❤️', desc:'3 vies, chrono réduit — combien de questions survivrez-vous ?' },
]

onMounted(async () => {
  // Charger les données depuis Firebase si connecté
  if (authStore.user) {
    console.log('Chargement des données depuis Firebase pour:', authStore.user.uid)
    await store.loadFromFirebase(authStore.user.uid)
  }
})

async function select(m) {
  if (m.id === 'daily' && store.dailyDone) return
  await store.startMode(m.id)
  router.push('/game')
}
</script>

<style scoped>
.home { min-height: 100dvh; display: flex; flex-direction: column; background: var(--bg); }

.header { padding: 32px 20px 12px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }

.logo { display: flex; align-items: center; gap: 10px; }
.logo-brain { font-size: 2.2rem; }
.logo-title { font-family: var(--font-display); font-size: 2.6rem; letter-spacing: -0.02em; color: var(--text); font-weight: 800; }
.logo-logic { color: var(--purple); }
.logo-sub { font-size: 0.88rem; color: var(--text-muted); }
.logo-sub strong { color: var(--purple); }

.top-nav { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; justify-content: center; }
.nav-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 99px; border: 1.5px solid var(--border); background: var(--surface); font-family: var(--font-body); font-weight: 600; font-size: 0.85rem; color: var(--text-muted); cursor: pointer; box-shadow: var(--shadow-sm); transition: all 0.18s; }
.nav-btn:hover { border-color: var(--purple); color: var(--purple); }

.main { flex: 1; max-width: 600px; width: 100%; margin: 0 auto; padding: 24px 16px 40px; }
.section-label { font-family: var(--font-display); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; color: var(--text-light); text-align: center; margin-bottom: 14px; }
.modes-list { display: flex; flex-direction: column; gap: 10px; }

.versus-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  border: 2px dashed var(--purple);
  border-radius: 12px;
  background: rgba(147, 112, 219, 0.05);
  cursor: pointer;
  font-family: var(--font-display);
  transition: all 0.2s;
}

.versus-btn:hover {
  background: rgba(147, 112, 219, 0.1);
  box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.2);
  transform: translateY(-2px);
}

.versus-icon {
  font-size: 2rem;
}

.versus-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--purple);
}

.versus-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-body);
}
</style>
