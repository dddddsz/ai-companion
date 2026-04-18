<!-- components/PeriodicReminder.vue -->
<template>
  <div class="periodic-reminder-root" aria-live="polite">
    <div class="periodic-reminder-badge">
      <div class="countdown-ring">
        <div class="countdown-value">{{ formattedCountdown }}</div>
        <button class="pause-button" @click="togglePause">
          {{ isPaused ? '继续' : '暂停' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

// ==================== 配置参数 ====================
const props = defineProps({
    interval: {
        type: Number,
        default: 40 * 60 * 1000   // 40 分钟（毫秒）
    },
    title: {
        type: String,
        default: '休息提醒'
    },
    body: {
        type: String,
        default: '已经连续工作40分钟了，起来活动一下吧'
    },
    requireInteraction: {
        type: Boolean,
        default: false    // 通知是否常驻直到用户点击
    },
    silent: {
        type: Boolean,
        default: false    // 是否静音
    },
    debug: {
        type: Boolean,
        default: true     // 开发时开启，方便观察运行状态
    }
})

// ==================== 内部状态 ====================
const permissionGranted = ref(false)   // 用户是否已授权通知
const remainingMs = ref(props.interval)
const isPaused = ref(false)
let timer = null                       // 定时器 ID

const formattedCountdown = computed(() => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs.value / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// // window.periodicReminder.getCountdown() 可以在控制台调用，获取当前倒计时字符串（格式 MM:SS）
// function exposeCountdownToConsole() {
//   if (typeof window !== 'undefined') {
//     window.periodicReminder = window.periodicReminder || {}
//     window.periodicReminder.getCountdown = () => formattedCountdown.value
//   }
// }

// function removeCountdownFromConsole() {
//   if (typeof window !== 'undefined' && window.periodicReminder) {
//     delete window.periodicReminder.getCountdown
//     if (Object.keys(window.periodicReminder).length === 0) {
//       delete window.periodicReminder
//     }
//   }
// }

// ==================== 辅助函数：打印日志 ====================
function log(...args) {
    if (props.debug) {
        console.log('[PeriodicReminder]', ...args)
    }
}

function warn(...args) {
    if (props.debug) {
        console.warn('[PeriodicReminder]', ...args)
    }
}

// ==================== 通知权限管理 ====================
// 请求通知权限（仅在组件挂载时调用一次）
async function requestPermission() {
    if (!('Notification' in window)) {
        warn('浏览器不支持通知 API')
        return false
    }

    // 已经授权过
    if (Notification.permission === 'granted') {
        permissionGranted.value = true
        log('通知权限已存在')
        return true
    }

    // 之前被拒绝过，不再请求（避免反复弹窗打扰）
      if (Notification.permission === 'denied') {
        warn('通知权限已被用户拒绝，将无法发送通知')
        permissionGranted.value = false
        return false
      }

    // 尚未决定（'default'），发起请求
    log('请求通知权限...')
    const permission = await Notification.requestPermission()
    const isGranted = permission === 'granted'
    permissionGranted.value = isGranted

    if (isGranted) {
        log('用户同意通知权限')
        // 可选：发送一条欢迎通知，让用户知道功能生效
        new Notification('✅ 已开启提醒', {
            body: `我会每隔 ${props.interval / 60000} 分钟提醒您休息`,
            silent: props.silent,
            requireInteraction: false
        })
    } else {
        warn('用户拒绝通知权限')
    }
    return isGranted
}

// ==================== 发送通知 ====================
// 直接发送一条系统通知（调用前需确保 permissionGranted === true）
function sendNotification() {
    if (!permissionGranted.value) {
        warn('没有通知权限，跳过发送')
        return
    }

    log(`发送通知: ${props.title}`)
    new Notification(props.title, {
        body: props.body,
        requireInteraction: props.requireInteraction,
        silent: props.silent
    })
}

// ==================== 定时器控制 ====================
function startTimer() {
    if (timer || isPaused.value) {
        return
    }

    const intervalMs = props.interval
    if (remainingMs.value <= 0) {
      remainingMs.value = intervalMs
    }

    log(`启动定时器，间隔 ${intervalMs / 1000} 秒（${intervalMs / 60000} 分钟）`)
    log(`预计下次触发时间: ${new Date(Date.now() + remainingMs.value).toLocaleTimeString()} (剩余 ${formattedCountdown.value})`)

    timer = setInterval(() => {
        remainingMs.value -= 1000
        if (remainingMs.value <= 0) {
            log('定时器触发')
            sendNotification()
            remainingMs.value = intervalMs
            log(`预计下次触发时间: ${new Date(Date.now() + remainingMs.value).toLocaleTimeString()} (剩余 ${formattedCountdown.value})`)
        }
    }, 1000)
}

function pauseTimer() {
    if (!isPaused.value) {
      isPaused.value = true
      stopTimer()
      log('计时已暂停')
    }
}

function resumeTimer() {
    if (isPaused.value) {
      isPaused.value = false
      log('计时继续')
      startTimer()
    }
}

function togglePause() {
    if (isPaused.value) {
      resumeTimer()
    } else {
      pauseTimer()
    }
}

function stopTimer() {
    if (timer) {
        log('停止定时器')
        clearInterval(timer)
        timer = null
    } else {
        log('没有运行中的定时器')
    }
}

// ==================== 生命周期 ====================
onMounted(async () => {
    log('组件挂载')
    await requestPermission()   // 请求权限（仅一次）
    startTimer()               // 启动定时器（无论权限结果如何都启动，因为权限可能在之后变为 granted）
    exposeCountdownToConsole()
})

onUnmounted(() => {
    log('组件卸载，清理定时器')
    stopTimer()
    removeCountdownFromConsole()
})
</script>

<style scoped>
.periodic-reminder-root {
  position: fixed;
  left: 18px;
  top: 18px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.periodic-reminder-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

.countdown-ring {
  width: 96px;
  height: 96px;
  position: relative;
  border-radius: 50%;
  background: rgba(24, 144, 255, 0.95);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
}

.countdown-value {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.pause-button {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 56px;
  padding: 4px 8px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: white;
  font-size: 0.68rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.pause-button:hover {
  background: rgba(255, 255, 255, 0.28);
}

.pause-button:focus {
  outline: 2px solid rgba(255, 255, 255, 0.7);
  outline-offset: 2px;
}
</style>