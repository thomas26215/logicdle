<template>
  <div class="result-phase">
    <div class="result-hero">
      <div class="result-emoji">{{ emoji }}</div>
      <h2 class="result-title" :style="{ color: titleColor }">{{ title }}</h2>
      <p class="result-sub">Score du jour</p>
      <div class="result-score">{{ store.sessionScore }}</div>
    </div>

    <div class="score-breakdown card">
      <!-- Daily : détail bonne réponse + estimation -->
      <div v-if="store.mode === 'daily' && stat" class="score-row-daily">
        <div class="score-col" :class="stat.correct ? 'green' : 'red'">
          <p class="score-col-label">Bonne réponse</p>
          <div class="score-col-icon">{{ stat.correct ? '✓' : '✗' }}</div>
          <p class="score-col-pts">{{ stat.correct ? '+500 pts' : '0 pt' }}</p>
        </div>
        <div class="score-col">
          <p class="score-col-label">Estimation %</p>
          <div class="score-col-icon">⭐</div>
          <p class="score-col-pts green-text">+{{ stat.estimateScore ?? 0 }} pts</p>
        </div>
      </div>

      <!-- Autres modes : résumé -->
      <div v-else class="session-summary">
        <div class="summary-stat"><span class="s-val">{{ correct }}</span><span class="s-label">Correctes</span></div>
        <div class="summary-stat"><span class="s-val">{{ store.sessionStats.length }}</span><span class="s-label">Total</span></div>
        <div class="summary-stat"><span class="s-val">{{ accuracy }}%</span><span class="s-label">Précision</span></div>
      </div>
    </div>

    <!-- Explication (daily uniquement) -->
    <div v-if="store.mode === 'daily' && stat" class="explanation card">
      <p class="expl-label">EXPLICATION</p>
      <p class="expl-text">{{ stat.question.explanation }}</p>
    </div>

    <div v-if="store.mode === 'daily'" class="streak-badge">
      🔥 Série de <strong>{{ store.streak }}</strong> jour{{ store.streak > 1 ? 's' : '' }}
    </div>

    <div class="result-actions">
      <button class="btn btn-primary share-btn" @click="share">📤 Partager mon score</button>
      <button class="btn btn-ghost" @click="$emit('home')">Retour à l'accueil</button>
    </div>

    <p v-if="store.mode === 'daily'" class="next-hint">Revenez demain pour une nouvelle question !</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

defineEmits(['home'])
const store = useGameStore()

const stat    = computed(() => store.sessionStats[0] ?? null)
const correct = computed(() => store.sessionStats.filter(s => s.correct).length)
const accuracy = computed(() => store.sessionStats.length ? Math.round((correct.value / store.sessionStats.length) * 100) : 0)

const emoji = computed(() => {
  if (store.mode === 'daily') return store.sessionScore >= 900 ? '🧠' : store.sessionScore >= 500 ? '👍' : '😅'
  return accuracy.value >= 80 ? '🏆' : accuracy.value >= 50 ? '👏' : '💪'
})
const title = computed(() => {
  if (store.mode === 'daily') {
    if (store.sessionScore >= 900) return 'Logicien parfait !'
    if (store.sessionScore >= 600) return 'Excellent !'
    if (store.sessionScore >= 500) return 'Bien joué !'
    return 'Pas mal !'
  }
  return `${correct.value} / ${store.sessionStats.length} correcte${correct.value > 1 ? 's' : ''}`
})
const titleColor = computed(() => store.sessionScore >= 800 ? 'var(--correct)' : 'var(--purple)')

function share() {
  const text = `J'ai scoré ${store.sessionScore} pts sur LogicDle ! 🧠\n#LogicDle #100Logique`
  if (navigator.share) navigator.share({ title: 'LogicDle', text })
  else { navigator.clipboard.writeText(text); alert('Score copié dans le presse-papier !') }
}
</script>

<style scoped>
.result-phase { flex: 1; max-width: 560px; margin: 0 auto; width: 100%; padding: 28px 16px 40px; display: flex; flex-direction: column; gap: 18px; align-items: center; }

.result-hero { text-align: center; }
.result-emoji { font-size: 3rem; animation: pop 0.5s ease; }
@keyframes pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
.result-title { font-family: var(--font-display); font-size: 2rem; margin: 8px 0 4px; }
.result-sub { font-size: 0.85rem; color: var(--text-muted); }
.result-score { font-family: var(--font-display); font-size: 4rem; font-weight: 800; color: var(--text); line-height: 1; margin-top: 4px; }

.score-breakdown { width: 100%; padding: 18px; }
.score-row-daily { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.score-col { background: var(--surface-2); border-radius: var(--radius-sm); padding: 14px; text-align: center; }
.score-col.green { background: var(--correct-bg); }
.score-col.red   { background: var(--wrong-bg); }
.score-col-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 6px; }
.score-col-icon  { font-size: 1.4rem; margin-bottom: 4px; }
.score-col-pts   { font-weight: 700; font-size: 0.9rem; color: var(--text-muted); }
.green-text { color: var(--correct) !important; }

.session-summary { display: flex; justify-content: space-around; }
.summary-stat { text-align: center; }
.s-val { display: block; font-family: var(--font-display); font-size: 2rem; color: var(--purple); }
.s-label { font-size: 0.75rem; color: var(--text-muted); }

.explanation { width: 100%; padding: 16px 18px; }
.expl-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; color: var(--text-light); margin-bottom: 6px; }
.expl-text  { font-size: 0.9rem; color: var(--text); line-height: 1.5; }

.streak-badge { background: var(--purple-bg); border: 1.5px solid var(--purple-glow); border-radius: 99px; padding: 8px 18px; font-size: 0.88rem; color: var(--purple); }

.result-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.share-btn { width: 100%; padding: 16px; font-size: 1rem; }
.btn-ghost { width: 100%; padding: 14px; }
.next-hint { font-size: 0.8rem; color: var(--text-light); text-align: center; }
</style>
