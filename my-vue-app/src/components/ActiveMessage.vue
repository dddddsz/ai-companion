<script setup>
import { ref } from 'vue'

const visible = ref(false)
const messageText = ref('')
const progress = ref(100)

const close = () => {
  visible.value = false
  messageText.value = ''
  progress.value = 100
}

const show = (message) => {
  close()
  messageText.value = message
  visible.value = true
  progress.value = 100
}

defineExpose({ show, close })
</script>

<template>
  <div v-if="visible" class="active-message-overlay" @click="close">
    <div class="active-message-card">
      <div class="message-body">
        <p>{{ messageText }}</p>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-message-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  z-index: 10000;
}

.active-message-card {
  width: min(92vw, 360px);
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(15, 23, 42, 0.08);
  overflow: hidden;
  animation: popIn 0.18s ease;
}

.message-body {
  padding: 24px 22px 18px;
  color: #111827;
  font-size: 15px;
  line-height: 1.6;
}

.progress-track {
  position: relative;
  height: 6px;
  background: rgba(15, 23, 42, 0.08);
}

.progress-fill {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  transition: width 0.1s linear;
  transform-origin: right center;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
