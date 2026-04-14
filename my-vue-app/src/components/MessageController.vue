<template>
  <div>
    <ActiveMessage ref="activeMessageRef" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useLongTimeNoSee } from '../composables/LongTimeNoSee.js'
import ActiveMessage from './ActiveMessage.vue'

const activeMessageRef = ref(null)

const { start, stop, inactiveDuration, lastActivityTime } = useLongTimeNoSee({
  inactiveThreshold: 30000, // 30秒
  checkInterval: 10000, // 10秒检查
  onInactive: () => {
    activeMessageRef.value?.show('好久不见！你还在吗？')
  }
})

onMounted(() => {
  start()
})

onUnmounted(() => {
  stop()
})
</script>