<script setup>
import { nextTick, onMounted, ref, computed } from 'vue'

const input = ref('')
const messages = ref([
  {
    role: 'assistant',
    text: '你好！这是一个 AI 聊天演示页面。输入消息开始对话。'
  }
])
const chatListRef = ref(null)
const messageRefs = ref({})
const activeHistory = ref(null)
const autoScroll = ref(true)

const userMessages = computed(() =>
  messages.value
    .map((message, index) => ({ ...message, index }))
    .filter((message) => message.role === 'user')
)

const previewText = (text) =>
  text.length > 24 ? `${text.slice(0, 24)}…` : text

const registerMessageRef = (el, index) => {
  if (el) {
    messageRefs.value[index] = el
  } else {
    delete messageRefs.value[index]
  }
}

const scrollToMessage = async (index) => {
  activeHistory.value = index
  await nextTick()
  const target = messageRefs.value[index]
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const generateReply = (text) => `收到：“${text}”。你可以把这里替换成实际 AI 接口调用。`

const scrollToBottom = () => {
  const list = chatListRef.value
  if (!list) return
  list.scrollTop = list.scrollHeight
}

const isScrolledToBottom = () => {
  const list = chatListRef.value
  if (!list) return true
  return Math.abs(list.scrollHeight - list.scrollTop - list.clientHeight) < 12
}

const handleScroll = () => {
  autoScroll.value = isScrolledToBottom()
}

const sendMessage = async () => {
  const value = input.value.trim()
  if (!value) return

  messages.value.push({ role: 'user', text: value })
  messages.value.push({ role: 'assistant', text: 'AI 正在生成回复…', pending: true })
  input.value = ''

  await nextTick()
  if (autoScroll.value) scrollToBottom()

  setTimeout(async () => {
    const pendingIndex = messages.value.findIndex((msg) => msg.pending)
    if (pendingIndex !== -1) {
      messages.value[pendingIndex] = {
        role: 'assistant',
        text: generateReply(value)
      }
      await nextTick()
      if (autoScroll.value) scrollToBottom()
    }
  }, 600)
}

onMounted(() => {
  if (autoScroll.value) scrollToBottom()
})

const handleKeydown = async (event) => {
  if (event.key !== 'Enter') return

  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    const textarea = event.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    input.value = `${input.value.slice(0, start)}\n${input.value.slice(end)}`
    await nextTick()
    textarea.selectionStart = textarea.selectionEnd = start + 1
    return
  }

  event.preventDefault()
  sendMessage()
}
</script>

<template>
  <div class="chat-shell">
    <aside class="chat-sidebar">
      <div class="sidebar-header">
        <p class="chat-label"></p>
        <h2>历史记录</h2>
      </div>

      <div class="history-list">
        <div v-if="!userMessages.length" class="history-empty">暂无用户消息</div>
        <button
          v-for="item in userMessages"
          :key="item.index"
          class="history-item"
          :class="{ active: item.index === activeHistory }"
          @click="scrollToMessage(item.index)"
        >
          <p>{{ previewText(item.text) }}</p>
        </button>
      </div>
    </aside>

    <main class="chat-main">
      <section class="chat-header">
        <div>
          <p class="chat-label"></p>
          <h1>her</h1>
        </div>
      </section>

      <section class="chat-body">
        <div class="chat-body-top">
          <div class="chat-list" ref="chatListRef" @scroll="handleScroll">
            <div
              v-for="(message, index) in messages"
              :key="index"
              :ref="(el) => registerMessageRef(el, index)"
              :class="['chat-message', message.role === 'user' ? 'user' : 'assistant']"
            >
              <span class="message-role">{{ message.role === 'user' ? '我' : 'AI' }}</span>
              <p>{{ message.text }}</p>
            </div>
          </div>
        </div>

        <div class="chat-body-bottom">
          <form class="chat-form" @submit.prevent="sendMessage">
            <textarea
              v-model="input"
              rows="3"
              placeholder="输入你的消息..."
              @keydown="handleKeydown"
              autocomplete="off"
            />
            <button type="submit">发送</button>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>
