<template>
  <div class="auth-view">
    <div class="auth-container card">
      <h1 class="auth-title">LogicDle</h1>
      
      <div class="auth-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: isLogin }" 
          @click="isLogin = true">
          Connexion
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: !isLogin }" 
          @click="isLogin = false">
          Inscription
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <input 
            v-model="email" 
            type="email" 
            placeholder="Email" 
            class="form-input"
            required
          />
        </div>
        
        <div class="form-group">
          <input 
            v-model="password" 
            type="password" 
            placeholder="Mot de passe" 
            class="form-input"
            required
          />
        </div>

        <button 
          type="submit" 
          class="btn btn-primary auth-btn"
          :disabled="loading">
          {{ loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire') }}
        </button>
      </form>

      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'
import { useGameStore } from '@/stores/gameStore.js'
import { setAuthState } from '@/router/index.js'

const router = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''

  try {
    let result
    if (isLogin.value) {
      console.log('Tentative de connexion...')
      result = await authStore.login(email.value, password.value)
    } else {
      console.log('Tentative d\'inscription...')
      result = await authStore.register(email.value, password.value)
    }

    console.log('Résultat auth:', result)

    if (result.success) {
      console.log('Auth réussie, utilisateur:', result.user.email)
      // Mettre à jour le state d'auth immédiatement
      setAuthState(result.user, false)
      
      // Charger les données depuis Firebase
      try {
        console.log('Chargement des données depuis Firebase...')
        await gameStore.loadFromFirebase(result.user.uid)
        console.log('Données chargées')
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err)
        // Continue anyway
      }
      
      loading.value = false
      
      // Redirection après un court délai
      setTimeout(() => {
        console.log('Redirection vers /')
        router.push('/')
      }, 500)
    } else {
      console.error('Erreur d\'authentification:', result.error)
      error.value = result.error
      loading.value = false
    }
  } catch (err) {
    console.error('Erreur exception:', err)
    error.value = 'Une erreur est survenue: ' + err.message
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 32px;
}

.auth-title {
  text-align: center;
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 800;
  color: var(--purple);
  margin-bottom: 28px;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 10px;
  background: var(--surface-2);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--purple);
  color: #fff;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-input {
  padding: 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--purple);
}

.auth-btn {
  margin-top: 8px;
  padding: 12px;
  font-size: 0.95rem;
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: var(--wrong);
  font-size: 0.85rem;
  text-align: center;
  margin-top: 8px;
}
</style>
