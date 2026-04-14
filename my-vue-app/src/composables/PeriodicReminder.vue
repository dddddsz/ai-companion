<!-- components/PeriodicReminder.vue -->
<template>
    <!-- 无 UI 的功能性组件 -->
    <div style="display: none;"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

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
let timer = null                       // 定时器 ID

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
    if (timer) {
        clearInterval(timer)
        timer = null
    }

    const intervalMs = props.interval
    log(`启动定时器，间隔 ${intervalMs / 1000} 秒（${intervalMs / 60000} 分钟）`)
    log(`预计下次触发时间: ${new Date(Date.now() + intervalMs).toLocaleTimeString()}`)

    timer = setInterval(() => {
        log('定时器触发')
        sendNotification()
    }, intervalMs)
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
})

onUnmounted(() => {
    log('组件卸载，清理定时器')
    stopTimer()
})
</script>