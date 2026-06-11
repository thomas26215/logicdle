<template>
  <div class="game-view">
    <header class="game-header">
      <button class="back-btn" @click="handleBack">← Retour</button>
      <h2 class="mode-title" :style="{ color: modeColor }">{{ modeLabel }}</h2>
      <div class="header-right">
        <span class="score-display">{{ store.sessionScore }} pts</span>
        <button class="theme-toggle" @click="theme.toggle()">{{ theme.isDark ? '☀️' : '🌙' }}</button>
      </div>
    </header>

    <!-- Stepper daily uniquement -->
    <div v-if="store.mode === 'daily'" class="stepper">
      <template v-for="(step, i) in DAILY_STEPS" :key="i">
        <div class="step-circle" :class="{ done: i < stepIndex, active: i === stepIndex }">
          <span v-if="i < stepIndex">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div v-if="i < DAILY_STEPS.length - 1" class="step-line" :class="{ done: i < stepIndex }" />
      </template>
      <p class="step-label">{{ DAILY_STEPS[stepIndex]?.label }}</p>
    </div>

    <!-- Timer bar -->
    <div v-if="showTimer" class="timer-bar-wrap">
      <div class="timer-bar" :style="{ width: timerPct + '%' }" :class="{ urgent: store.timeLeft <= 5 }" />
    </div>

    <!-- Vies -->
    <div v-if="store.mode === 'survival'" class="lives">
      <span v-for="n in 3" :key="n" :class="['heart', { lost: n > store.lives }]">❤️</span>
    </div>

    <!-- Phases -->
    <Transition name="phase" mode="out-in">
      <QuestionPhase  v-if="store.phase === 'question'"  key="q" />
      <EstimatePhase  v-else-if="store.phase === 'estimate'" key="e" />
      <ResultPhase    v-else-if="store.phase === 'result'"   key="r" @home="goHome" />
      <GameOverPhase  v-else-if="store.phase === 'gameover'" key="go" @home="goHome" @retry="retry" />
    </Transition>
  </div>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'
import { useThemeStore } from '@/stores/themeStore.js'
import { useAuthStore } from '@/stores/authStore.js'
import QuestionPhase from '@/components/phases/QuestionPhase.vue'
import EstimatePhase from '@/components/phases/EstimatePhase.vue'
import ResultPhase   from '@/components/phases/ResultPhase.vue'
import GameOverPhase from '@/components/phases/GameOverPhase.vue'

const router = useRouter()
const store  = useGameStore()
const theme  = useThemeStore()
const authStore = useAuthStore()

const DAILY_STEPS = [
  { label: 'Étape 1 — Question' },
  { label: 'Étape 2 — Estimation %' },
  { label: 'Étape 3 — Résultats' },
]
const stepIndex = computed(() =>
  store.phase === 'question' ? 0 : store.phase === 'estimate' ? 1 : 2
)

const MODE_META = {
  daily:    { label: 'Quotidien',    color: 'var(--daily-color)' },
  endless:  { label: 'Endless',      color: 'var(--endless-color)' },
  express:  { label: 'Défi Express', color: 'var(--express-color)' },
  expert:   { label: 'Mode Expert',  color: 'var(--expert-color)' },
  survival: { label: 'Survie',       color: 'var(--survival-color)' },
}
const modeLabel = computed(() => MODE_META[store.mode]?.label ?? '')
const modeColor = computed(() => MODE_META[store.mode]?.color ?? 'var(--purple)')

const showTimer = computed(() => ['express', 'survival'].includes(store.mode))
const maxTime   = computed(() => store.mode === 'express' ? 20 : 30)
const timerPct  = computed(() => (store.timeLeft / maxTime.value) * 100)

let timerInterval = null
function startTimer() {
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (store.phase !== 'question' || store.isAnswered) return
    store.timeLeft--
    if (store.timeLeft <= 0) { clearInterval(timerInterval); store.submitAnswer(-1) }
  }, 1000)
}
watch(() => store.phase, (p) => {
  if (p === 'question' && showTimer.value) startTimer()
  else clearInterval(timerInterval)
}, { immediate: true })
onUnmounted(() => clearInterval(timerInterval))

async function goHome() {
  // Sauvegarder dans Firebase si connecté
  if (authStore.user) {
    await store.syncToFirebase(authStore.user.uid)
  }
  store.quit()
  router.push('/')
}
function handleBack() { if (confirm('Quitter la partie ?')) goHome() }
async function retry() { await store.startMode(store.mode) }
</script>

<style scoped>
.game-view { min-height: 100dvh; display: flex; flex-direction: column; background: var(--bg); }

.game-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; background: var(--surface); border-bottom: 1.5px solid var(--border);
  position: sticky; top: 0; z-index: 10;
}
.back-btn { background: none; border: none; font-family: var(--font-body); font-size: 0.9rem; color: var(--text-muted); cursor: pointer; transition: color 0.15s; }
.back-btn:hover { color: var(--purple); }
.mode-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
.header-right { display: flex; align-items: center; gap: 10px; }
.score-display { font-family: var(--font-display); font-size: 1rem; color: var(--purple); font-weight: 700; }

/* Stepper */
.stepper {
  display: flex; align-items: center; justify-content: center;
  padding: 18px 20px 8px; gap: 0; flex-wrap: wrap; row-gap: 8px;
}
.step-circle {
  width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--border);
  background: var(--surface); display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 0.9rem; color: var(--text-muted); transition: all 0.3s;
}
.step-circle.done { background: var(--purple); border-color: var(--purple); color: #fff; }
.step-circle.active { border-color: var(--purple); color: var(--purple); box-shadow: 0 0 0 4px var(--purple-glow); }
.step-line { width: 50px; height: 2px; background: var(--border); transition: background 0.3s; }
.step-line.done { background: var(--purple); }
.step-label { width: 100%; text-align: center; font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-top: 4px; }

/* Timer */
.timer-bar-wrap { height: 5px; background: var(--border); }
.timer-bar { height: 100%; background: var(--purple); transition: width 1s linear, background 0.3s; border-radius: 0 3px 3px 0; }
.timer-bar.urgent { background: var(--wrong); }

/* Vies */
.lives { display: flex; justify-content: center; gap: 6px; padding: 10px; }
.heart { font-size: 1.3rem; transition: all 0.3s; }
.heart.lost { filter: grayscale(1); opacity: 0.3; }

/* Transitions */
.phase-enter-active, .phase-leave-active { transition: opacity 0.2s, transform 0.2s; }
.phase-enter-from { opacity: 0; transform: translateY(10px); }
.phase-leave-to   { opacity: 0; transform: translateY(-10px); }
</style>
