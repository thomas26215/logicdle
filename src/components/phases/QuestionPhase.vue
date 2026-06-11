<template>
  <div class="question-phase" v-if="q">
    <div class="q-meta">
      <span class="q-category">{{ q.category }}</span>
      <span v-if="store.mode !== 'daily'" class="q-percent-hint">Question à <strong>{{ q.percent }}%</strong></span>
    </div>

    <div class="q-card card">
      <p class="q-text">{{ q.text }}</p>
    </div>

    <div class="options-grid">
      <button
        v-for="(opt, i) in q.options" :key="i"
        class="option-btn" :class="optionClass(i)"
        :disabled="store.isAnswered"
        @click="store.submitAnswer(i)"
      >
        <span class="opt-letter">{{ LETTERS[i] }}</span>
        <span class="opt-text">{{ opt }}</span>
        <span v-if="store.isAnswered && i === q.answer" class="opt-icon">✓</span>
        <span v-else-if="store.isAnswered && i === store.selectedOption && i !== q.answer" class="opt-icon wrong-icon">✗</span>
      </button>
    </div>

    <Transition name="fade">
      <div v-if="showFeedback" class="feedback" :class="store.answerCorrect ? 'correct' : 'wrong'">
        <span class="feedback-icon">{{ store.answerCorrect ? '🎉' : '❌' }}</span>
        <div>
          <p class="feedback-title">{{ store.answerCorrect ? 'Bonne réponse !' : 'Mauvaise réponse…' }}</p>
          <p class="feedback-pts">{{ store.answerCorrect ? '+500 pts' : '0 pt' }}</p>
        </div>
      </div>
    </Transition>

    <!-- Explication si mauvaise réponse -->
    <Transition name="fade">
      <div v-if="store.isAnswered && !store.answerCorrect" class="explanation card" :class="{ 'transitioning': isTransitioning }">
      <p class="expl-label">EXPLICATION</p>
      <p class="expl-text">{{ q.explanation }}</p>
      </div>
    </Transition>

    <!-- Bouton suivant pour les modes avec timer ou expert -->
    <Transition name="fade">
      <button v-if="store.isAnswered && ['express', 'survival', 'endless', 'expert'].includes(store.mode)" 
        class="btn btn-primary next-btn" @click="handleNext()">
        Question suivante →
      </button>
    </Transition>

    <div v-if="store.mode !== 'daily'" class="q-counter">
      Question {{ store.currentIndex + 1 }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

const store = useGameStore()
const q = computed(() => store.currentQuestion)
const LETTERS = ['A', 'B', 'C', 'D']
const showFeedback = ref(false)
const isTransitioning = ref(false)

watch(() => store.isAnswered, (answered) => {
  if (answered) {
    showFeedback.value = true
    setTimeout(() => { showFeedback.value = false }, 1400)
  } else {
    showFeedback.value = false
  }
})

function optionClass(i) {
  if (!store.isAnswered) return ''
  if (i === q.value.answer) return 'correct'
  if (i === store.selectedOption) return 'wrong'
  return 'dimmed'
}

function handleNext() {
  isTransitioning.value = true
  setTimeout(() => store.nextQuestion(), 1000)
}
</script>

<style scoped>
.question-phase { flex: 1; max-width: 640px; margin: 0 auto; width: 100%; padding: 24px 16px; display: flex; flex-direction: column; gap: 16px; }

.q-meta { display: flex; align-items: center; justify-content: space-between; }
.q-category { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-light); padding: 3px 10px; background: var(--surface-2); border-radius: 99px; }
.q-percent-hint { font-size: 0.8rem; color: var(--text-muted); }
.q-percent-hint strong { color: var(--purple); }

.q-card { padding: 24px 22px; }
.q-text { font-size: 1.15rem; font-weight: 700; line-height: 1.55; color: var(--text); }

.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.option-btn {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-md); cursor: pointer; text-align: left;
  font-family: var(--font-body); box-shadow: var(--shadow-sm); transition: all 0.15s;
}
.option-btn:hover:not(:disabled) { border-color: var(--purple); background: var(--purple-bg); transform: translateY(-1px); }
.option-btn:disabled { cursor: default; }
.option-btn.correct { border-color: var(--correct); background: var(--correct-bg); }
.option-btn.wrong   { border-color: var(--wrong);   background: var(--wrong-bg); }
.option-btn.dimmed  { opacity: 0.4; }

.opt-letter { width: 28px; height: 28px; border-radius: 8px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; color: var(--text-muted); flex-shrink: 0; font-family: var(--font-display); }
.option-btn.correct .opt-letter { background: var(--correct); color: #fff; }
.option-btn.wrong   .opt-letter { background: var(--wrong);   color: #fff; }
.opt-text { flex: 1; font-size: 0.9rem; font-weight: 700; color: var(--text); }
.opt-icon { font-weight: 900; color: var(--correct); }
.wrong-icon { color: var(--wrong); }

.feedback { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: var(--radius-md); border: 1.5px solid; }
.feedback.correct { background: var(--correct-bg); border-color: var(--correct); }
.feedback.wrong   { background: var(--wrong-bg);   border-color: var(--wrong); }
.feedback-icon { font-size: 1.8rem; }
.feedback-title { font-weight: 700; font-size: 0.95rem; color: var(--text); }
.feedback-pts { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
.feedback.correct .feedback-pts { color: var(--correct); }

.q-counter { text-align: center; font-size: 0.8rem; color: var(--text-light); }

.explanation { padding: 16px 18px; background: var(--surface-2); border-left: 4px solid var(--purple); }
.expl-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 6px; }
.expl-text { font-size: 0.9rem; color: var(--text); line-height: 1.5; }

.next-btn { width: 100%; padding: 14px; font-size: 0.95rem; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
