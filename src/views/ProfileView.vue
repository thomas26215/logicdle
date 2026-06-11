<template>
  <div class="profile-view">
    <header class="profile-header">
      <button class="back-btn" @click="$router.push('/')">← Retour</button>
      <h2 class="profile-title">Mon Profil</h2>
      <button class="theme-toggle" @click="theme.toggle()">{{ theme.isDark ? '☀️' : '🌙' }}</button>
    </header>

    <main class="profile-main">
      <div class="avatar-section">
        <div class="avatar">🧠</div>
        <h1 class="player-name">{{ authStore.user?.email?.split('@')[0] ?? 'Logicien' }}</h1>
        <div class="player-email">{{ authStore.user?.email }}</div>
        <div class="player-streak">🔥 {{ store.streak }} jour{{ store.streak !== 1 ? 's' : '' }} de suite</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card card">
          <span class="stat-val">{{ store.totalScore }}</span>
          <span class="stat-label">Score total</span>
        </div>
        <div class="stat-card card">
          <span class="stat-val">{{ store.history.length }}</span>
          <span class="stat-label">Parties jouées</span>
        </div>
        <div class="stat-card card">
          <span class="stat-val">{{ store.streak }}</span>
          <span class="stat-label">Série actuelle</span>
        </div>
        <div class="stat-card card">
          <span class="stat-val">{{ bestScore }}</span>
          <span class="stat-label">Meilleur score</span>
        </div>
      </div>

      <div class="history-section">
        <h3 class="history-title">📅 Historique Calendrier</h3>
        
        <div class="calendar-header">
          <h4 class="calendar-month">{{ monthYear }}</h4>
        </div>

        <div class="calendar-weekdays">
          <div v-for="day in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']" :key="day" class="weekday">
            {{ day }}
          </div>
        </div>

        <div v-if="!store.history.length" class="history-empty">Aucune partie jouée pour l'instant.</div>
        
        <div v-else class="calendar-grid">
          <div v-for="day in calendarDays" :key="day.date" class="calendar-day" :class="{ played: day.played }">
            <div class="day-number">{{ day.dayOfMonth }}</div>
            <div v-if="day.played" class="day-points">{{ day.points }}pts</div>
          </div>
        </div>
      </div>

      <button class="btn btn-ghost dev-btn" @click="store.devResetDaily()">🔧 Reset daily (dev)</button>
      <button class="btn btn-primary logout-btn" @click="handleLogout()">Se déconnecter</button>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import { useThemeStore } from '@/stores/themeStore.js'
import { useAuthStore } from '@/stores/authStore.js'
import { setAuthState } from '@/router/index.js'

const router = useRouter()
const store = useGameStore()
const theme = useThemeStore()
const authStore = useAuthStore()

const bestScore = computed(() => store.history.length ? Math.max(...store.history.map(h => h.points)) : 0)

const monthYear = computed(() => {
  const now = new Date()
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`
})

const historyByDate = computed(() => {
  const map = {}
  store.history.forEach(entry => {
    map[entry.date] = entry
  })
  return map
})

const calendarDays = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  // Obtenir le nombre de jours dans ce mois
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Créer un array pour tous les jours du mois
  const days = []
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    const dateStr = date.toISOString().split('T')[0] // Format YYYY-MM-DD
    const entry = historyByDate.value[dateStr]
    
    days.push({
      dayOfMonth: i,
      date: dateStr,
      played: !!entry,
      points: entry?.points || 0,
      questionId: entry?.questionId || null
    })
  }
  
  return days
})

async function handleLogout() {
  try {
    console.log('Déconnexion en cours...')
    
    // Nettoyer le localStorage
    store.clearStorage()
    console.log('Données locales effacées')
    
    const result = await authStore.logout()
    console.log('Résultat logout:', result)
    if (result.success) {
      console.log('Déconnexion réussie, mise à jour du state...')
      setAuthState(null, false)
      console.log('Redirection...')
      router.push('/auth')
    } else {
      console.error('Erreur déconnexion:', result.error)
    }
  } catch (error) {
    console.error('Erreur handleLogout:', error)
  }
}
</script>

<style scoped>
.profile-view { min-height: 100dvh; background: var(--bg); display: flex; flex-direction: column; }

.profile-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; background: var(--surface); border-bottom: 1.5px solid var(--border);
}
.back-btn { background: none; border: none; font-family: var(--font-body); font-size: 0.9rem; color: var(--text-muted); cursor: pointer; transition: color 0.15s; }
.back-btn:hover { color: var(--purple); }
.profile-title { font-family: var(--font-display); font-size: 1.1rem; }

.profile-main { max-width: 560px; width: 100%; margin: 0 auto; padding: 28px 16px 40px; display: flex; flex-direction: column; gap: 24px; }

.avatar-section { text-align: center; }
.avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--purple-bg); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 12px; border: 3px solid var(--purple-glow); }
.player-name { font-family: var(--font-display); font-size: 1.6rem; margin-bottom: 4px; }
.player-email { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; }
.player-streak { display: inline-block; background: var(--purple-bg); color: var(--purple); font-size: 0.85rem; font-weight: 700; padding: 5px 14px; border-radius: 99px; }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.stat-card { padding: 18px; text-align: center; display: flex; flex-direction: column; gap: 4px; }
.stat-val { font-family: var(--font-display); font-size: 2rem; color: var(--purple); }
.stat-label { font-size: 0.78rem; color: var(--text-muted); }

.history-title { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 15px; }
.history-empty { color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 20px; }

.calendar-header { margin-bottom: 15px; }
.calendar-month { font-family: var(--font-display); font-size: 1rem; color: var(--text); font-weight: 600; text-align: center; }

.calendar-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 10px; }
.weekday { text-align: center; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); padding: 8px 0; }

.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.calendar-day { 
  aspect-ratio: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.85rem;
}
.calendar-day:hover { border-color: var(--text-muted); }
.calendar-day.played {
  background: var(--purple-bg);
  border-color: var(--purple);
}

.day-number { font-weight: 600; color: var(--text); }
.calendar-day.played .day-number { color: var(--purple); font-weight: 700; }

.day-points { font-size: 0.7rem; font-weight: 700; color: var(--purple); }

.dev-btn { width: 100%; font-size: 0.82rem; color: var(--text-light); }
.logout-btn { width: 100%; }
</style>
