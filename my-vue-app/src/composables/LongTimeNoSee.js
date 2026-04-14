import { ref } from 'vue'

console.log('useLongTimeNoSee composable loaded')

export function useLongTimeNoSee(options = {}) {
  const inactiveThreshold = options.inactiveThreshold ?? 30000
  const checkInterval = options.checkInterval ?? 10000

  const inactiveDuration = ref(0)
  const lastActivityTime = ref(Date.now())

  const events = ['click', 'keydown', 'scroll', 'touchstart']
  let timer = null
  let active = true

  const resetActivity = () => {
    lastActivityTime.value = Date.now()
    inactiveDuration.value = 0
    active = true
  }

  const handleActivity = () => {
    resetActivity()
  }

  const checkInactivity = () => {
    const now = Date.now()
    const elapsed = now - lastActivityTime.value
    inactiveDuration.value = Math.floor(elapsed / 1000)

    // console.log(`监测：无操作时间 ${inactiveDuration.value} 秒`)

    if (elapsed >= inactiveThreshold && active) {
      active = false
      console.log('触发长时间未活动')
      if (typeof options.onInactive === 'function') {
        options.onInactive()
      }
      lastActivityTime.value = Date.now()
      inactiveDuration.value = 0
    }
  }

  const start = () => {
    console.log('Starting inactivity tracking')
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })
    timer = window.setInterval(checkInactivity, checkInterval)
  }

  const stop = () => {
    events.forEach((eventName) => {
      window.removeEventListener(eventName, handleActivity)
    })
    if (timer) {
      window.clearInterval(timer)
      timer = null
    }
  }

  return {
    inactiveDuration,
    inactiveThreshold,
    checkInterval,
    resetActivity,
    start,
    stop
  }
}
