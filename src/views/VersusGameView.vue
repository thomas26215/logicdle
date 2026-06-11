<template>
  <div class="versus-game">
    <header class="game-header">
      <div class="header-score">
        <div :class="['score-box', { winner: versusStore.currentRoom?.winner === authStore.user.uid }]">
          <span class="player-name">Vous</span>
          <span class="score">{{ youScore }}</span>
        </div>
        <div class="vs-divider">⚔️</div>
        <div :class="['score-box', { winner: versusStore.currentRoom?.winner === versusStore.currentRoom?.opponentId }]">
          <span class="player-name">{{ versusStore.currentRoom?.opponentName || 'Adversaire' }}</span>
          <span class="score">{{ opponentScore }}</span>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="progress-text">Question {{ versusStore.progress.current }}/{{ versusStore.progress.total }}</div>
    </header>

    <main class="game-main">
      <!-- Affichage du jeu -->
      <div v-if="versusStore.currentQuestion && !versusStore.gameFinished && !playerFinished" class="question-container">
        <div class="timer">
          <span class="timer-label">Temps:</span>
          <span class="timer-value">{{ Math.ceil((10000 - elapsedTime) / 1000) }}s</span>
        </div>

        <div class="question-box card">
          <div class="question-text">{{ versusStore.currentQuestion.text }}</div>
          <div class="options-grid">
            <button 
              v-for="(option, index) in versusStore.currentQuestion.options" 
              :key="index"
              @click="selectAnswer(index)"
              :class="['option', { selected: selectedAnswer === index }]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <button 
          v-if="selectedAnswer !== null"
          class="btn btn-primary btn-lg submit-btn"
          @click="submitCurrentAnswer"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? '⏳ Envoi...' : '✅ Valider' }}
        </button>
      </div>

      <!-- Attente de l'adversaire -->
      <div v-else-if="playerFinished && !versusStore.gameFinished" class="waiting-container">
        <div class="waiting-content">
          <div class="waiting-icon">⏳</div>
          <h2 class="waiting-title">Vous avez terminé!</h2>
          <p class="waiting-text">Attente de {{ versusStore.currentRoom?.opponentName || 'l\'adversaire' }}...</p>
          <div class="opponent-progress">
            <div class="progress-indicator">
              <span class="progress-dot"></span>
              <span class="progress-label">{{ versusStore.currentRoom?.opponentName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Affichage des résultats -->
      <div v-else-if="versusStore.gameFinished" class="results-container">
        <h2 class="results-title">
          {{ versusStore.currentRoom?.winner === authStore.user.uid ? '🎉 Vous avez gagné!' : versusStore.currentRoom?.winner === null ? '🤝 Égalité!' : '😢 Vous avez perdu' }}
        </h2>

        <div class="final-scores">
          <div class="final-score">
            <span class="final-name">Vous</span>
            <span class="final-score-value">{{ youScore }}</span>
          </div>
          <div class="final-score opponent">
            <span class="final-name">{{ versusStore.currentRoom?.opponentName }}</span>
            <span class="final-score-value">{{ opponentScore }}</span>
          </div>
        </div>

        <div class="results-details">
          <h3>📊 Statistiques</h3>
          <div class="stats-row">
            <span>Temps moyen par réponse:</span>
            <span>{{ avgTimePerQuestion }}s</span>
          </div>
          <div class="stats-row">
            <span>Précision:</span>
            <span>{{ accuracyPercent }}%</span>
          </div>
        </div>

        <div class="game-actions">
          <button class="btn btn-primary" @click="backToHome">🏠 Retour accueil</button>
          <button class="btn btn-ghost" @click="rematch">🔄 Rejouer</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVersusStore } from '@/stores/versusStore.js'
import { useThemeStore } from '@/stores/themeStore.js'
import { useAuthStore } from '@/stores/authStore.js'

const router = useRouter()
const versusStore = useVersusStore()
const theme = useThemeStore()
const authStore = useAuthStore()

const selectedAnswer = ref(null)
const isSubmitting = ref(false)
const elapsedTime = ref(0)
const questionStartTime = ref(Date.now())
let timerInterval = null

// Computed
const progressPercent = computed(() => {
  return (versusStore.progress.current / versusStore.progress.total) * 100
})

const youScore = computed(() => {
  if (!versusStore.currentRoom) return 0
  if (versusStore.isCreator) {
    return versusStore.currentRoom.creatorScore || 0
  } else {
    return versusStore.currentRoom.opponentScore || 0
  }
})

const opponentScore = computed(() => {
  if (!versusStore.currentRoom) return 0
  if (versusStore.isCreator) {
    return versusStore.currentRoom.opponentScore || 0
  } else {
    return versusStore.currentRoom.creatorScore || 0
  }
})

const playerFinished = computed(() => {
  if (!versusStore.currentRoom) return false
  if (versusStore.isCreator) {
    return versusStore.currentRoom.creatorFinished || false
  } else {
    return versusStore.currentRoom.opponentFinished || false
  }
})

const avgTimePerQuestion = computed(() => {
  const answers = versusStore.isCreator 
    ? versusStore.currentRoom?.creatorAnswers || [] 
    : versusStore.currentRoom?.opponentAnswers || []
  
  if (answers.length === 0) return '0.0'
  const totalTime = answers.reduce((sum, a) => sum + a.timeMs, 0)
  return (totalTime / answers.length / 1000).toFixed(1)
})

const accuracyPercent = computed(() => {
  const answers = versusStore.isCreator 
    ? versusStore.currentRoom?.creatorAnswers || [] 
    : versusStore.currentRoom?.opponentAnswers || []
  
  if (answers.length === 0) return 0
  const correct = answers.filter(a => a.isCorrect).length
  return Math.round((correct / answers.length) * 100)
})

// Méthodes
function selectAnswer(index) {
  selectedAnswer.value = index
}

async function submitCurrentAnswer() {
  try {
    isSubmitting.value = true
    
    const question = versusStore.currentQuestion
    const isCorrect = selectedAnswer.value === question.answer
    
    const result = await versusStore.submitAnswerToQuestion(selectedAnswer.value, isCorrect)
    
    if (result.success) {
      // Réinitialiser pour la prochaine question
      selectedAnswer.value = null
      questionStartTime.value = Date.now()
    }
  } finally {
    isSubmitting.value = false
  }
}

function backToHome() {
  versusStore.leaveRoom()
  router.push('/')
}

function rematch() {
  versusStore.leaveRoom()
  router.push('/versus-lobby')
}

// Mise à jour du timer
onMounted(() => {
  timerInterval = setInterval(() => {
    elapsedTime.value = Date.now() - questionStartTime.value
    
    // Auto-soumettre après 10 secondes
    if (elapsedTime.value > 10000 && selectedAnswer.value !== null && !isSubmitting.value) {
      submitCurrentAnswer()
    }
  }, 100)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.versus-game {
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

.game-header {
  background: var(--surface);
  border-bottom: 1.5px solid var(--border);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-score {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  flex: 1;
  min-width: 100px;
}

.score-box.winner {
  background: rgba(74, 222, 128, 0.1);
  border-color: #4ade80;
}

.player-name {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.score {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--purple);
}

.vs-divider {
  font-size: 1.2rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--purple);
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.game-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
}

.question-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--surface);
  border-radius: 8px;
  border: 1.5px solid var(--border);
}

.timer-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
}

.timer-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--purple);
}

.question-box {
  background: var(--surface);
  border: 1.5px solid var(--border);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.5;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.option {
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  color: var(--text);
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.option:hover {
  border-color: var(--purple);
  background: rgba(147, 112, 219, 0.05);
}

.option.selected {
  border-color: var(--purple);
  background: rgba(147, 112, 219, 0.15);
}

.submit-btn {
  width: 100%;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-primary {
  background: var(--purple);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(147, 112, 219, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 1rem;
}

.btn-ghost {
  background: var(--border);
  color: var(--text);
}

.btn-ghost:hover {
  background: var(--border);
}

.results-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 16px;
  text-align: center;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
}

.final-scores {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.final-score {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 8px;
}

.final-score.opponent {
  border-color: var(--border);
}

.final-name {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
}

.final-score-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--purple);
}

.results-details {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results-details h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}

.stats-row:last-child {
  border-bottom: none;
}

.game-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.waiting-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 40px 20px;
  text-align: center;
}

.waiting-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.waiting-icon {
  font-size: 3.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.waiting-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}

.waiting-text {
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0;
}

.opponent-progress {
  width: 100%;
  display: flex;
  justify-content: center;
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 8px;
}

.progress-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: var(--purple);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.progress-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@media (max-width: 600px) {
  .header-score {
    flex-wrap: wrap;
  }

  .score-box {
    flex: 0 1 calc(50% - 6px);
  }

  .question-container {
    max-width: 100%;
  }
}
</style>
