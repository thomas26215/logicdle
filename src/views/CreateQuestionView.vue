<template>
  <div class="create-view">
    <header class="create-header">
      <button class="back-btn" @click="$router.push('/')">← Retour</button>
      <h2 class="create-title">➕ Créer une Question</h2>
      <button class="theme-toggle" @click="theme.toggle()">{{ theme.isDark ? '☀️' : '🌙' }}</button>
    </header>

    <main class="create-main">
      <form @submit.prevent="submitQuestion" class="form">
        
        <!-- Texte de la question -->
        <div class="form-group">
          <label for="text">📝 Texte de la question</label>
          <textarea 
            id="text" 
            v-model="form.text" 
            placeholder="Entrez le texte de votre question..."
            required
            rows="3"
            class="input"
          ></textarea>
        </div>

        <!-- Catégorie -->
        <div class="form-group">
          <label for="category">📂 Catégorie</label>
          <select id="category" v-model="form.category" required class="input">
            <option value="">-- Choisir une catégorie --</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Options de réponse -->
        <div class="form-group">
          <label>🎯 Options de réponse (4 options)</label>
          <div class="options-grid">
            <div v-for="(option, index) in form.options" :key="index" class="option-wrapper">
              <input 
                v-model="form.options[index]" 
                :placeholder="`Option ${String.fromCharCode(65 + index)}`"
                required
                class="input"
              />
              <button 
                v-if="form.answer === index" 
                type="button" 
                class="btn btn-answer-active"
                @click="form.answer = null"
                title="Bonne réponse"
              >
                ✓
              </button>
              <button 
                v-else 
                type="button" 
                class="btn btn-answer"
                @click="form.answer = index"
                :title="`Réponse correcte (Option ${String.fromCharCode(65 + index)})`"
              >
                ✓
              </button>
            </div>
          </div>
        </div>

        <!-- Taux de réussite -->
        <div class="form-group">
          <label for="success-rate">📊 Taux de réussite (%)</label>
          <div class="slider-wrapper">
            <input 
              id="success-rate" 
              type="range" 
              v-model.number="form.successRate" 
              min="0" 
              max="100" 
              step="1"
              class="slider"
            />
            <span class="slider-value">{{ form.successRate }}%</span>
          </div>
        </div>

        <!-- Nombre d'attempts -->
        <div class="form-group">
          <label for="total-attempts">📈 Nombre d'attempts total</label>
          <input 
            id="total-attempts" 
            type="number" 
            v-model.number="form.totalAttempts" 
            min="10" 
            max="1000"
            step="10"
            required
            class="input"
          />
        </div>

        <!-- Aperçu des statistiques -->
        <div class="stats-card card">
          <h3 class="stats-title">📊 Statistiques calculées</h3>
          <div class="stats-values">
            <div class="stat-row">
              <span class="stat-label">Réponses correctes:</span>
              <span class="stat-num">{{ calculatedStats.correctCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Mauvaises réponses:</span>
              <span class="stat-num">{{ calculatedStats.wrongCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Pourcentage:</span>
              <span class="stat-num">{{ calculatedStats.realPercent }}%</span>
            </div>
          </div>
        </div>

        <!-- Message de statut -->
        <div v-if="statusMessage" :class="['status-msg', statusMessage.type]">
          {{ statusMessage.text }}
        </div>

        <!-- Boutons d'action -->
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="$router.push('/')">Annuler</button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid || isLoading">
            {{ isLoading ? '⏳ En cours...' : '✅ Créer la question' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore.js'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase.js'

const router = useRouter()
const theme = useThemeStore()

const categories = ['logique', 'code', 'matrice', 'déduction', 'suite', 'raisonnement', 'piège', 'intrus', 'analogie']

const form = reactive({
  text: '',
  category: '',
  options: ['', '', '', ''],
  answer: null,
  successRate: 50,
  totalAttempts: 100
})

const state = reactive({
  isLoading: false,
  statusMessage: null
})

const calculatedStats = computed(() => {
  const correctCount = Math.round((form.successRate / 100) * form.totalAttempts)
  const wrongCount = form.totalAttempts - correctCount
  const realPercent = form.totalAttempts > 0 
    ? Math.round((correctCount / form.totalAttempts) * 100)
    : 0
  return { correctCount, wrongCount, realPercent }
})

const isFormValid = computed(() => {
  return (
    form.text.trim().length > 0 &&
    form.category !== '' &&
    form.options.every(opt => opt.trim().length > 0) &&
    form.answer !== null &&
    form.totalAttempts >= 10
  )
})

const isLoading = computed(() => state.isLoading)
const statusMessage = computed(() => state.statusMessage)

async function submitQuestion() {
  try {
    state.isLoading = true
    state.statusMessage = null

    const questionData = {
      text: form.text.trim(),
      category: form.category,
      options: form.options,
      answer: form.answer,
      correctCount: calculatedStats.value.correctCount,
      wrongCount: calculatedStats.value.wrongCount,
      percent: form.successRate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const questionsRef = collection(db, 'questions')
    const docRef = await addDoc(questionsRef, questionData)

    state.statusMessage = {
      type: 'success',
      text: `✅ Question créée avec succès!`
    }

    form.text = ''
    form.category = ''
    form.options = ['', '', '', '']
    form.answer = null
    form.successRate = 50
    form.totalAttempts = 100

    setTimeout(() => {
      router.push('/')
    }, 1500)

  } catch (error) {
    console.error('Erreur:', error)
    state.statusMessage = {
      type: 'error',
      text: `❌ Erreur: ${error.message}`
    }
  } finally {
    state.isLoading = false
  }
}
</script>

<style scoped>
.create-view {
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

.create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--surface);
  border-bottom: 1.5px solid var(--border);
}

.back-btn {
  background: none;
  border: none;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--border);
  color: var(--purple);
}

.create-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  flex: 1;
  text-align: center;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background: var(--border);
}

.create-main {
  flex: 1;
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px 40px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.input {
  padding: 10px 12px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--purple);
  background: var(--surface);
  box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.1);
}

textarea.input {
  resize: vertical;
  min-height: 80px;
}

select.input {
  cursor: pointer;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.option-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.option-wrapper .input {
  flex: 1;
  margin: 0;
}

.btn-answer,
.btn-answer-active {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-answer:hover {
  border-color: var(--purple);
  color: var(--purple);
  background: rgba(147, 112, 219, 0.05);
}

.btn-answer-active {
  border-color: var(--green);
  background: var(--green);
  color: white;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--border);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--purple);
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 3px rgba(147, 112, 219, 0.2);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--purple);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 3px rgba(147, 112, 219, 0.2);
}

.slider-value {
  min-width: 45px;
  text-align: right;
  font-weight: 600;
  color: var(--purple);
  font-size: 0.95rem;
}

.stats-card {
  background: var(--surface);
  border: 1.5px solid rgba(147, 112, 219, 0.2);
}

.stats-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.stats-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.stat-num {
  font-size: 1rem;
  font-weight: 700;
  color: var(--purple);
}

.status-msg {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
}

.status-msg.success {
  background: rgba(34, 197, 94, 0.15);
  color: var(--green);
  border: 1.5px solid var(--green);
}

.status-msg.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1.5px solid #ef4444;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
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
  background: var(--purple);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(147, 112, 219, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: var(--border);
  color: var(--text);
}

.btn-ghost:hover {
  background: var(--border);
  transform: translateY(-1px);
}

@media (max-width: 600px) {
  .options-grid {
    grid-template-columns: 1fr;
  }

  .create-main {
    padding: 16px 12px 32px;
  }

  .create-title {
    font-size: 1.1rem;
  }

  .form {
    gap: 14px;
  }
}
</style>
