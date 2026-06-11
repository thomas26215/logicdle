<template>
  <div class="versus-lobby">
    <header class="lobby-header">
      <button class="back-btn" @click="$router.push('/')">← Retour</button>
      <h2 class="lobby-title">⚔️ Mode Versus</h2>
      <button class="theme-toggle" @click="theme.toggle()">{{ theme.isDark ? '☀️' : '🌙' }}</button>
    </header>

    <main class="lobby-main">
      <div v-if="!selectedMode" class="mode-selection">
        <p class="section-label">Choisissez une option</p>
        
        <button class="mode-btn create-btn" @click="selectedMode = 'create'">
          <span class="mode-icon">🆕</span>
          <span class="mode-text">Créer une partie</span>
          <span class="mode-desc">Vous créez le code de room</span>
        </button>

        <button class="mode-btn join-btn" @click="selectedMode = 'join'">
          <span class="mode-icon">🔗</span>
          <span class="mode-text">Rejoindre une partie</span>
          <span class="mode-desc">Entrez le code d'une room</span>
        </button>
      </div>

      <!-- Mode création -->
      <div v-else-if="selectedMode === 'create'" class="section">
        <button class="back-mode-btn" @click="selectedMode = null">← Retour</button>
        
        <div v-if="!roomCreated" class="form-section">
          <h3>Créer une nouvelle partie</h3>
          <p class="info-text">Un code de room sera généré. Partagez-le avec votre adversaire.</p>
          <button class="btn btn-primary btn-lg" @click="handleCreateRoom" :disabled="isLoading">
            {{ isLoading ? '⏳ Création...' : '✅ Créer la party' }}
          </button>
        </div>

        <div v-else class="room-created">
          <h3>🎉 Partie créée!</h3>
          <div class="room-code-box">
            <p class="room-code-label">Code de room:</p>
            <p class="room-code">{{ versusStore.roomId }}</p>
            <button class="btn-copy" @click="copyToClipboard(versusStore.roomId)">📋 Copier</button>
          </div>
          <p class="waiting-text">⏳ En attente de l'adversaire...</p>
          <div v-if="versusStore.currentRoom?.opponentName" class="opponent-joined">
            <p>✅ {{ versusStore.currentRoom.opponentName }} a rejoint!</p>
            <button class="btn btn-primary" @click="startGame" :disabled="isLoading">
              🚀 Lancer la partie
            </button>
          </div>
          <button class="btn btn-ghost" @click="cancelRoom">Annuler</button>
        </div>
      </div>

      <!-- Mode rejoindre -->
      <div v-else-if="selectedMode === 'join'" class="section">
        <button class="back-mode-btn" @click="selectedMode = null">← Retour</button>
        
        <div class="form-section">
          <h3>Rejoindre une partie</h3>
          <div class="form-group">
            <label for="room-code">Code de room:</label>
            <input 
              id="room-code" 
              v-model="joinRoomCode" 
              placeholder="Ex: ABC123"
              class="input"
              maxlength="6"
              @keyup.enter="handleJoinRoom"
            />
          </div>
          
          <div v-if="statusMessage" :class="['status-msg', statusMessage.type]">
            {{ statusMessage.text }}
          </div>

          <button class="btn btn-primary btn-lg" @click="handleJoinRoom" :disabled="!joinRoomCode.trim() || isLoading">
            {{ isLoading ? '⏳ Connexion...' : '✅ Rejoindre' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVersusStore } from '@/stores/versusStore.js'
import { useThemeStore } from '@/stores/themeStore.js'
import { useAuthStore } from '@/stores/authStore.js'

const router = useRouter()
const versusStore = useVersusStore()
const theme = useThemeStore()
const authStore = useAuthStore()

const selectedMode = ref(null)
const roomCreated = ref(false)
const joinRoomCode = ref('')
const isLoading = ref(false)
const statusMessage = ref(null)

// Écouter les changements de la room
watch(
  () => versusStore.currentRoom?.opponentName,
  async (opponentName) => {
    console.log('👀 Watch opponentName:', opponentName, 'selectedMode:', selectedMode.value)
    if (opponentName && selectedMode.value === 'create') {
      console.log('✅ Démarrage automatique du jeu depuis le creator')
      await startGame()
    }
  }
)

async function handleCreateRoom() {
  try {
    isLoading.value = true
    const result = await versusStore.createNewRoom(authStore.user.uid, authStore.user.email.split('@')[0])
    if (result.success) {
      roomCreated.value = true
    } else {
      statusMessage.value = { type: 'error', text: result.error }
    }
  } finally {
    isLoading.value = false
  }
}

async function handleJoinRoom() {
  try {
    isLoading.value = true
    statusMessage.value = null
    const result = await versusStore.joinExistingRoom(
      joinRoomCode.value.toUpperCase(),
      authStore.user.uid,
      authStore.user.email.split('@')[0]
    )
    if (result.success) {
      router.push('/versus-game')
    } else {
      statusMessage.value = { type: 'error', text: result.error }
    }
  } finally {
    isLoading.value = false
  }
}

async function startGame() {
  try {
    isLoading.value = true
    const result = await versusStore.initializeGame()
    if (result.success) {
      router.push('/versus-game')
    } else {
      statusMessage.value = { type: 'error', text: result.error }
    }
  } finally {
    isLoading.value = false
  }
}

async function cancelRoom() {
  await versusStore.destroyRoom()
  selectedMode.value = null
  roomCreated.value = false
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  // Feedback optionnel
}
</script>

<style scoped>
.versus-lobby {
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

.lobby-header {
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

.lobby-title {
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

.lobby-main {
  flex: 1;
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px 40px;
}

.mode-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-label {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-light);
  text-align: center;
  margin-bottom: 8px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  cursor: pointer;
  transition: all 0.3s;
}

.mode-btn:hover {
  border-color: var(--purple);
  background: rgba(147, 112, 219, 0.05);
  transform: translateY(-2px);
}

.create-btn:hover {
  border-color: #4ade80;
}

.join-btn:hover {
  border-color: #60a5fa;
}

.mode-icon {
  font-size: 2rem;
}

.mode-text {
  font-weight: 600;
  color: var(--text);
}

.mode-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-mode-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  align-self: flex-start;
  transition: all 0.2s;
}

.back-mode-btn:hover {
  color: var(--purple);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.info-text {
  font-size: 0.9rem;
  color: var(--text-muted);
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
  font-size: 0.95rem;
  font-family: inherit;
  text-transform: uppercase;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--purple);
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
  transform: translateY(-1px);
}

.room-created {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-created h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.room-code-box {
  background: var(--surface);
  border: 2px solid var(--purple);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.room-code-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.room-code {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--purple);
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.btn-copy {
  padding: 8px 16px;
  border: 1.5px solid var(--purple);
  background: rgba(147, 112, 219, 0.1);
  color: var(--purple);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-copy:hover {
  background: rgba(147, 112, 219, 0.2);
}

.waiting-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: center;
}

.opponent-joined {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: rgba(74, 222, 128, 0.1);
  border: 1.5px solid rgba(74, 222, 128, 0.5);
  border-radius: 8px;
}

.opponent-joined p {
  font-size: 0.95rem;
  color: #4ade80;
  font-weight: 600;
  margin: 0;
}

.status-msg {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-msg.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1.5px solid #ef4444;
}

.status-msg.success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1.5px solid #4ade80;
}

@media (max-width: 600px) {
  .lobby-main {
    padding: 16px 12px 32px;
  }

  .mode-btn {
    padding: 12px;
  }

  .room-code {
    font-size: 1.5rem;
  }
}
</style>
