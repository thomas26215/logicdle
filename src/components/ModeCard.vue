<template>
  <button class="mode-card" :class="{ disabled }" :style="{ '--mode-color': mode.color }" @click="$emit('click')" :disabled="disabled">
    <div class="mode-icon"><span>{{ mode.icon }}</span></div>
    <div class="mode-body">
      <div class="mode-header">
        <span class="mode-name">{{ mode.name }}</span>
        <span class="mode-badge">{{ mode.badgeIcon }} {{ disabled ? 'Déjà joué ✓' : mode.badge }}</span>
      </div>
      <p class="mode-desc">{{ disabled ? 'Revenez demain pour une nouvelle question !' : mode.desc }}</p>
    </div>
    <span class="mode-arrow">›</span>
  </button>
</template>

<script setup>
defineProps({ mode: Object, disabled: Boolean })
defineEmits(['click'])
</script>

<style scoped>
.mode-card {
  display: flex; align-items: center; gap: 14px; width: 100%;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-md); padding: 16px 18px; cursor: pointer;
  text-align: left; box-shadow: var(--shadow-sm); transition: all 0.18s ease;
  position: relative; overflow: hidden;
}
.mode-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background: var(--mode-color); border-radius: 4px 0 0 4px; opacity: 0; transition: opacity 0.18s;
}
.mode-card:hover:not(.disabled) { transform: translateX(4px); box-shadow: var(--shadow-md); border-color: var(--mode-color); }
.mode-card:hover:not(.disabled)::before { opacity: 1; }
.mode-card.disabled { opacity: 0.5; cursor: not-allowed; }

.mode-icon {
  width: 46px; height: 46px; border-radius: var(--radius-sm); flex-shrink: 0;
  background: color-mix(in srgb, var(--mode-color) 12%, transparent);
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
}
.mode-body { flex: 1; }
.mode-header { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.mode-name { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: var(--text); }
.mode-badge {
  font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 99px;
  background: color-mix(in srgb, var(--mode-color) 10%, transparent);
  color: var(--mode-color); border: 1px solid color-mix(in srgb, var(--mode-color) 25%, transparent);
}
.mode-desc { font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; }
.mode-arrow { font-size: 1.4rem; color: var(--text-light); flex-shrink: 0; }
</style>
