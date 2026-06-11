<template>
  <div class="estimate-phase">
    <div class="est-header">
      <h2 class="est-title">🎯 Estimez le pourcentage</h2>
      <p class="est-sub">Quel <strong>% de Français</strong> a répondu correctement ?</p>
    </div>

    <div class="q-recap card">
      <p class="q-recap-text">{{ store.currentQuestion?.text }}</p>
      <div class="q-recap-answer">
        <span class="check">✓</span>
        <strong>{{ store.currentQuestion?.options[store.currentQuestion?.answer] }}</strong>
      </div>
    </div>

    <div class="slider-wrap" :class="{ locked: store.estimateLocked }">
      <div class="slider-value">
        <span class="val-number">{{ store.estimateValue }}</span><span class="val-percent">%</span>
      </div>
      <div class="slider-track">
        <div class="slider-fill" :style="{ width: store.estimateValue + '%' }" />
        <input type="range" min="1" max="100" :value="store.estimateValue"
          :disabled="store.estimateLocked"
          @input="e => store.estimateValue = +e.target.value"
          class="slider-input" />
      </div>
      <div class="slider-labels">
        <span>1% — Ultra rare</span><span>50%</span><span>100% — Tout le monde</span>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="store.estimateLocked" class="est-result card">
        <div class="est-result-grid">
          <div class="est-block">
            <p class="est-block-label">Votre estimation</p>
            <p class="est-block-val">{{ store.estimateValue }}%</p>
          </div>
          <div class="est-block">
            <p class="est-block-label">Vrai %</p>
            <p class="est-block-val accent">{{ store.currentQuestion?.percent }}%</p>
          </div>
          <div class="est-block">
            <p class="est-block-label">Points gagnés</p>
            <p class="est-block-val" :class="store.estimateScore > 0 ? 'color-correct' : 'color-wrong'">+{{ store.estimateScore }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <button v-if="!store.estimateLocked" class="btn btn-primary validate-btn" @click="store.submitEstimate()">
      Valider mon estimation →
    </button>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore.js'
const store = useGameStore()
</script>

<style scoped>
.estimate-phase { flex: 1; max-width: 600px; margin: 0 auto; width: 100%; padding: 28px 16px; display: flex; flex-direction: column; gap: 20px; }

.est-header { text-align: center; }
.est-title { font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 6px; }
.est-sub { font-size: 0.9rem; color: var(--text-muted); }
.est-sub strong { color: var(--purple); }

.q-recap { padding: 16px 18px; }
.q-recap-text { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px; }
.q-recap-answer { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 700; }
.check { color: var(--correct); font-size: 1.1rem; }

.slider-wrap { display: flex; flex-direction: column; gap: 12px; }
.slider-wrap.locked { pointer-events: none; }
.slider-value { text-align: center; line-height: 1; }
.val-number { font-family: var(--font-display); font-size: 3.5rem; font-weight: 800; color: var(--purple); }
.val-percent { font-family: var(--font-display); font-size: 1.8rem; color: var(--purple); opacity: 0.7; }

.slider-track { position: relative; height: 10px; background: var(--border); border-radius: 99px; margin: 8px 0; }
.slider-fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--purple); border-radius: 99px; transition: width 0.05s; }
.slider-input { position: absolute; inset: -12px 0; width: 100%; opacity: 0; cursor: pointer; height: 34px; }
.slider-labels { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-light); }

.est-result { padding: 18px; }
.est-result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center; }
.est-block-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
.est-block-val { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text); }
.est-block-val.accent { color: var(--purple); }
.est-block-val.color-correct { color: var(--correct); }
.est-block-val.color-wrong   { color: var(--wrong); }

.validate-btn { width: 100%; padding: 16px; font-size: 1rem; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
