<template>
  <div class="gameover-phase">
    <div class="go-hero">
      <div class="go-emoji">💀</div>
      <h2 class="go-title">Game Over !</h2>
      <p class="go-sub">{{ subtitle }}</p>
    </div>

    <div class="go-stats card">
      <div class="go-stat"><span class="go-val">{{ store.sessionScore }}</span><span class="go-label">Points</span></div>
      <div class="go-stat"><span class="go-val">{{ store.sessionStats.length }}</span><span class="go-label">Questions</span></div>
      <div class="go-stat"><span class="go-val">{{ correct }}</span><span class="go-label">Correctes</span></div>
    </div>

    <div v-if="lastWrong" class="last-wrong card">
      <p class="lw-label">❌ Question ratée</p>
      <p class="lw-text">{{ lastWrong.question.text }}</p>
      <p class="lw-answer">Bonne réponse : <strong>{{ lastWrong.question.options[lastWrong.question.answer] }}</strong></p>
      <p class="lw-expl">{{ lastWrong.question.explanation }}</p>
    </div>

    <div class="go-actions">
      <button class="btn btn-primary retry-btn" @click="$emit('retry')">🔄 Rejouer</button>
      <button class="btn btn-ghost" @click="$emit('home')">Retour à l'accueil</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

defineEmits(['home', 'retry'])
const store   = useGameStore()
const correct = computed(() => store.sessionStats.filter(s => s.correct).length)
const lastWrong = computed(() => [...store.sessionStats].reverse().find(s => !s.correct) ?? null)
const subtitle = computed(() => store.mode === 'express' ? 'Mauvaise réponse en Défi Express — perdu !' : 'Vous n\'avez plus de vies !')
</script>

<style scoped>
.gameover-phase { flex: 1; max-width: 540px; margin: 0 auto; width: 100%; padding: 32px 16px 40px; display: flex; flex-direction: column; gap: 18px; align-items: center; }

.go-hero { text-align: center; }
.go-emoji { font-size: 3.5rem; animation: shake 0.5s ease; }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
.go-title { font-family: var(--font-display); font-size: 2.2rem; color: var(--wrong); margin: 10px 0 4px; }
.go-sub { font-size: 0.9rem; color: var(--text-muted); }

.go-stats { width: 100%; padding: 18px; display: flex; justify-content: space-around; }
.go-stat { text-align: center; }
.go-val { display: block; font-family: var(--font-display); font-size: 2.2rem; color: var(--purple); }
.go-label { font-size: 0.78rem; color: var(--text-muted); }

.last-wrong { width: 100%; padding: 16px 18px; }
.lw-label { font-size: 0.75rem; font-weight: 700; color: var(--wrong); margin-bottom: 6px; }
.lw-text  { font-size: 0.9rem; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.lw-answer { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; }
.lw-answer strong { color: var(--correct); }
.lw-expl { font-size: 0.82rem; color: var(--text-muted); font-style: italic; }

.go-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.retry-btn { width: 100%; padding: 16px; font-size: 1rem; }
.btn-ghost { width: 100%; padding: 14px; }
</style>
