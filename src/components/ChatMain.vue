<template>
  <main class="chat-main" :class="{ 'sidebar-closed': !isSidebarOpen }">
    <!-- 모바일 햄버거 메뉴 버튼 -->
    <div v-if="isMobile" class="mobile-header">
      <button class="mobile-menu-btn" @click="$emit('toggleSidebar')">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      <h2 class="mobile-title">HD-Agent</h2>
    </div>

    <div class="chat-container" :class="{ 'welcome-mode': isWelcomeMode }">
      <!-- 초기 환영 화면 -->
      <div v-if="isWelcomeMode" class="welcome-section">
        <div class="welcome-content">
          <h1 class="welcome-title">HD-Agent에 오신 걸 환영합니다</h1>
          <p class="welcome-subtitle">궁금한 것이 있으시면 언제든지 물어보세요!</p>

          <!-- 중앙 정렬된 입력창 -->
          <div class="welcome-input-container">
            <!-- 환영 화면 문서 필터 -->
            <DocumentFilter
              v-model="selectedDocumentFilters"
              @filter-change="handleFilterChange"
              class="welcome-filter"
            />

            <form class="input-form welcome-input" @submit.prevent="sendMessage">
              <input
                v-model="inputText"
                type="text"
                placeholder="메시지를 입력하세요"
                class="message-input"
                autocomplete="off"
                ref="welcomeInputRef"
              />
              <button type="submit" class="send-button" :disabled="!inputText.trim()">
                <span class="send-icon">▶</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- 채팅 메시지 영역 -->
      <div v-else class="chat-content">
        <!-- 메시지 목록 -->
        <div class="messages-container" ref="messagesContainer">
          <div
            v-for="(message, index) in messages"
            :key="`msg-${index}`"
            :class="['message-bubble', `message-${message.from}`, { 
              'streaming': message.isStreaming,
              'answer-completed': message.answerCompleted,
              'showing-references': message.showReferences
            }]"
          >
            <!-- 사용자 메시지에 필터 정보 표시 -->
            <div
              v-if="message.from === 'user' && message.filters && message.filters.length > 0"
              class="message-filters"
            >
              <button
                class="filter-toggle"
                @click="toggleMessageFilters(index)"
                :class="{ expanded: expandedFilters[index] }"
              >
                <span class="filter-icon">📁</span>
                <span class="filter-text">적용된 필터 ({{ message.filters.length }}개)</span>
                <span class="toggle-arrow">▼</span>
              </button>

              <div v-if="expandedFilters[index]" class="filter-tags-container">
                <div class="filter-tags">
                  <span
                    v-for="filter in getTopLevelFilters(message.filters)"
                    :key="filter"
                    class="filter-tag"
                  >
                    {{ getFilterDisplayName(filter) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="message-content" v-if="message.text.trim()">
              <!-- 봇 메시지 텍스트 렌더링 -->
              <div 
                v-if="message.from === 'bot'"
                class="bot-message-text"
                v-html="formatBotMessage(message.text, message.isStreaming)"
              ></div>
              <div v-else>{{ message.text }}</div>
            </div>

            <!-- 타이핑 인디케이터 (답변이 시작되지 않았을 때만) -->
            <div v-if="message.from === 'bot' && message.isStreaming && !message.text" class="typing-indicator">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span class="typing-text">답변을 생성하고 있습니다...</span>
            </div>
            
            <!-- 참조문서 로딩 인디케이터 -->
            <div v-if="message.from === 'bot' && message.answerCompleted && !message.showReferences && !message.searchResults?.length" 
                 class="references-loading">
              <div class="loading-spinner"></div>
              <span class="loading-text">참조 문서를 불러오는 중...</span>
            </div>

            <!-- 봇 메시지에 검색 결과 표시 (애니메이션과 함께) -->
            <div v-if="message.from === 'bot' && message.searchResults && message.showReferences" 
                 class="search-results"
                 :class="{ 'fade-in': message.showReferences }">
              <div class="search-results-header">
                <h4>참조 문서 ({{ message.searchResults.length }}개)</h4>
              </div>

              <div class="results-list">
                <div
                  v-for="(result, resultIndex) in message.searchResults"
                  :key="resultIndex"
                  class="result-item"
                  :style="{ animationDelay: `${resultIndex * 100}ms` }"
                  @click="showPdfResult(result)"
                >
                  <div class="result-header">
                    <div class="result-main-info">
                      <span class="file-name">{{ result.fileName }}</span>
                      <span class="page-number">페이지 {{ result.pageNumber }}</span>
                    </div>
                    <span class="relevance-score">{{ (result.score * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="result-actions">
                    <button class="view-pdf-btn" @click.stop="showPdfResult(result)">
                      <span class="pdf-icon">📄</span>
                      보기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="message-time">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>

          <!-- 메시지가 없을 때 안내 메시지 -->
          <div v-if="messages.length === 0" class="empty-messages">
            <p class="empty-text">대화를 시작해보세요!</p>
          </div>
        </div>

        <!-- 하단 고정 입력창 -->
        <div class="input-section">
          <!-- 문서 필터 -->
          <DocumentFilter v-model="selectedDocumentFilters" @filter-change="handleFilterChange" />

          <form class="input-form" @submit.prevent="sendMessage">
            <input
              v-model="inputText"
              type="text"
              placeholder="메시지를 입력하세요"
              class="message-input"
              autocomplete="off"
              ref="chatInputRef"
              :disabled="isMessageSending"
            />
            <button type="submit" class="send-button" :disabled="!inputText.trim() || isMessageSending">
              <span v-if="!isMessageSending" class="send-icon">▶</span>
              <div v-else class="sending-spinner"></div>
            </button>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import DocumentFilter from './DocumentFilter.vue'

// Props: 부모 컴포넌트로부터 받는 데이터
const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  isSidebarOpen: {
    type: Boolean,
    default: true,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  isMessageSending: {
    type: Boolean,
    default: false,
  }
})

// Emits: 부모 컴포넌트로 전달할 이벤트 정의
const emit = defineEmits(['send', 'toggleSidebar', 'filterChange', 'showPdf'])

// 반응형 데이터
const inputText = ref('')
const messagesContainer = ref(null)
const welcomeInputRef = ref(null)
const chatInputRef = ref(null)
const selectedDocumentFilters = ref([])
const expandedFilters = ref({}) // 메시지별 필터 펼침 상태

// 계산된 속성: 환영 화면 표시 여부
const isWelcomeMode = computed(() => props.messages.length === 0)

/**
 * 봇 메시지 포맷팅 (타이핑 효과 포함)
 */
function formatBotMessage(text, isStreaming = false) {
  if (!text) return ''
  
  // 마크다운 스타일 텍스트를 HTML로 변환 (간단한 변환)
  let formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 스트리밍 중일 때 커서 효과 추가
  if (isStreaming && text) {
    formattedText += '<span class="typing-cursor">|</span>'
  }
  
  return formattedText
}

/**
 * 메시지 전송 처리 함수
 */
function sendMessage() {
  const text = inputText.value.trim()
  if (!text || props.isMessageSending) return

  // 부모 컴포넌트로 메시지 전송 이벤트 발생 (필터 정보도 함께 전달)
  emit('send', {
    text: text,
    filters: selectedDocumentFilters.value,
  })

  // 입력창 초기화
  inputText.value = ''

  // 메시지 목록 하단으로 스크롤
  scrollToBottom()

  // 전송 후 입력창에 포커스 유지
  nextTick(() => {
    if (chatInputRef.value) {
      chatInputRef.value.focus()
    }
  })
}

/**
 * 메시지의 필터 펼침/접기 토글 함수
 */
function toggleMessageFilters(messageIndex) {
  expandedFilters.value[messageIndex] = !expandedFilters.value[messageIndex]
}

/**
 * 최상위 카테고리만 추출하는 함수
 * 중복된 상위 카테고리는 제거하고 대표적인 것만 표시
 */
function getTopLevelFilters(filters) {
  const topLevelSet = new Set()

  filters.forEach((filter) => {
    const parts = filter.split('/')
    // 최상위 카테고리만 추가
    topLevelSet.add(parts[0])
  })

  return Array.from(topLevelSet)
}

/**
 * PDF 결과 표시 함수
 */
function showPdfResult(result) {
  emit('showPdf', result)
}

/**
 * 문서 필터 변경 처리 함수
 */
function handleFilterChange(filters) {
  console.log('선택된 문서 필터:', filters)
  emit('filterChange', filters)
}

/**
 * 메시지 목록을 하단으로 스크롤하는 함수 (throttle 적용)
 */
let scrollTimeout = null
function scrollToBottom() {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  
  scrollTimeout = setTimeout(() => {
    nextTick(() => {
      if (messagesContainer.value) {
        const container = messagesContainer.value
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      }
    })
  }, 50) // 50ms throttle
}

/**
 * 시간을 포맷팅하는 함수
 * @param {Date} timestamp - 포맷팅할 시간
 * @returns {string} 포맷팅된 시간 문자열
 */
function formatTime(timestamp) {
  if (!timestamp) return ''

  return timestamp.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 필터 경로를 사용자에게 보여줄 형태로 변환하는 함수
 * @param {string} filterPath - 필터 경로 (예: "1. International Standards/IEC")
 * @returns {string} 표시용 필터 이름
 */
function getFilterDisplayName(filterPath) {
  const parts = filterPath.split('/')

  // 최상위 카테고리만 표시하도록 수정
  if (parts.length >= 1) {
    return parts[0].replace(/^\d+\.\s*/, '') // 숫자와 점 제거
  }

  return filterPath
}

// 메시지 배열 변화 감지하여 자동 스크롤 (성능 최적화)
watch(
  () => props.messages,
  (newMessages, oldMessages) => {
    // 새 메시지가 추가되거나 마지막 메시지가 업데이트된 경우
    if (newMessages.length !== (oldMessages?.length || 0) || 
        (newMessages.length > 0 && oldMessages?.length > 0 && 
         newMessages[newMessages.length - 1].text !== oldMessages[oldMessages.length - 1]?.text)) {
      scrollToBottom()
    }
  },
  { deep: true }
)

// 환영 모드 변화 감지하여 적절한 입력창에 포커스
watch(isWelcomeMode, (isWelcome) => {
  nextTick(() => {
    if (isWelcome && welcomeInputRef.value) {
      welcomeInputRef.value.focus()
    } else if (!isWelcome && chatInputRef.value) {
      chatInputRef.value.focus()
    }
  })
})

// 컴포넌트 마운트 시 초기 포커스 설정
onMounted(() => {
  nextTick(() => {
    if (isWelcomeMode.value && welcomeInputRef.value) {
      welcomeInputRef.value.focus()
    }
  })
})
</script>

<style scoped>
/* 메인 채팅 영역 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  color: var(--color-text);
  height: 100vh;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 모바일 헤더 */
.mobile-header {
  display: none;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hamburger-line {
  width: 100%;
  height: 3px;
  background-color: var(--color-text);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.mobile-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  width: 100%;
  min-height: 0;
}

/* 환영 모드일 때 더 넓은 레이아웃 */
.chat-container.welcome-mode {
  max-width: 960px;
}

/* 환영 화면 스타일 */
.welcome-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 0;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.welcome-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem 0;
  opacity: 0.95;
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: var(--color-text);
  opacity: 0.7;
  margin: 0 0 2rem 0;
}

.welcome-input-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
}

.welcome-filter {
  max-width: 500px;
  width: 100%;
}

/* 채팅 내용 영역 */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 메시지 컨테이너 */
.messages-container {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scroll-behavior: smooth;
  min-height: 0;
}

/* 빈 메시지 상태 */
.empty-messages {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--color-text);
  margin: 0;
}

/* 메시지 필터 표시 */
.message-filters {
  margin-bottom: 0.5rem;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(52, 152, 219, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.3);
  border-radius: 0.75rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  color: var(--color-text);
}

.filter-toggle:hover {
  background: rgba(52, 152, 219, 0.15);
  border-color: rgba(52, 152, 219, 0.4);
}

.filter-icon {
  font-size: 0.9rem;
}

.filter-text {
  font-weight: 500;
  flex: 1;
  text-align: left;
}

.toggle-arrow {
  font-size: 0.7rem;
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.filter-toggle.expanded .toggle-arrow {
  transform: rotate(180deg);
}

.filter-tags-container {
  margin-top: 0.5rem;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.filter-tag {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  font-weight: 500;
  white-space: nowrap;
}

/* 메시지 버블 공통 스타일 */
.message-bubble {
  display: flex;
  flex-direction: column;
  max-width: 75%;
  animation: fadeInUp 0.3s ease-out;
  flex-shrink: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-user {
  align-self: flex-end;
  align-items: flex-end;
}

.message-bot {
  align-self: flex-start;
  align-items: flex-start;
}

.message-content {
  padding: 1rem 1.25rem;
  border-radius: 1.25rem;
  font-size: 0.95rem;
  line-height: 1.4;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: pre-wrap;
}

.message-user .message-content {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-bottom-right-radius: 0.5rem;
}

.message-bot .message-content {
  background-color: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 0.5rem;
}

/* 봇 메시지 텍스트 스타일 */
.bot-message-text {
  line-height: 1.5;
}

/* 타이핑 커서 애니메이션 */
.typing-cursor {
  animation: blink 1s infinite;
  color: #3498db;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 타이핑 인디케이터 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background-color: #3498db;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
}

.typing-text {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.7;
}

/* 참조문서 로딩 인디케이터 */
.references-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  animation: fadeIn 0.3s ease-out;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.7;
}

/* 봇 메시지에 스트리밍 클래스 추가 시 스타일 */
.message-bot.streaming .message-content {
  border-bottom-left-radius: 0.5rem;
  position: relative;
}

/* .message-bot.streaming .message-content::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #3498db, transparent);
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
} */

/* 검색 결과 스타일 */
.search-results {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.4s ease-out;
}

.search-results.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.search-results-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.results-list {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.result-item {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-background-soft);
  min-width: 200px;
  flex-shrink: 0;
  opacity: 0;
  transform: translateY(10px);
  animation: slideInItem 0.3s ease-out forwards;
}

@keyframes slideInItem {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
  background: var(--color-background);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.result-main-info {
  flex: 1;
}

.file-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  display: block;
  margin-bottom: 0.25rem;
}

.page-number {
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.7;
}

.relevance-score {
  font-size: 0.8rem;
  font-weight: 600;
  color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.view-pdf-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: 1px solid #3498db;
  color: #3498db;
  padding: 0.3rem 0.6rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-pdf-btn:hover {
  background: #3498db;
  color: white;
}

.pdf-icon {
  font-size: 0.8rem;
}

.message-time {
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.6;
  margin-top: 0.25rem;
  padding: 0 0.5rem;
}

/* 입력 영역 스타일 */
.input-section {
  padding: 1.5rem;
  background-color: var(--color-background);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.welcome-input {
  margin-top: 0;
  max-width: 500px;
  width: 100%;
}

.message-input {
  flex: 1;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 1.5rem;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  outline: none;
  transition: all 0.2s ease;
  resize: none;
}

.message-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-button {
  width: 48px;
  height: 48px;
  border: none;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.send-icon {
  font-size: 1rem;
  margin-left: 2px;
}

/* 전송 중 스피너 */
.sending-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 애니메이션 키프레임 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 스크롤바 스타일링 */
.messages-container::-webkit-scrollbar,
.results-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.messages-container::-webkit-scrollbar-track,
.results-list::-webkit-scrollbar-track {
  background: var(--color-background-soft);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb,
.results-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.results-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Firefox 스크롤바 */
.messages-container,
.results-list {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) var(--color-background-soft);
}

/* 모바일 반응형 스타일 */
@media (max-width: 767px) {
  .mobile-header {
    display: flex;
  }

  .welcome-title {
    font-size: 1.8rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .message-bubble {
    max-width: 85%;
  }

  .messages-container {
    padding: 1rem;
  }

  .input-section {
    padding: 1rem;
  }

  .message-input {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
  }

  .send-button {
    width: 44px;
    height: 44px;
  }

  .welcome-input-container {
    gap: 0.75rem;
  }

  .filter-toggle {
    padding: 0.35rem 0.6rem;
    font-size: 0.75rem;
  }

  .filter-tags {
    gap: 0.25rem;
  }

  .filter-tag {
    font-size: 0.7rem;
    padding: 0.2rem 0.45rem;
  }

  .search-results {
    padding: 0.75rem;
  }

  .result-item {
    padding: 0.5rem;
    min-width: 160px;
  }

  .results-list {
    gap: 0.5rem;
  }
}

/* 태블릿 크기 */
@media (min-width: 768px) and (max-width: 1024px) {
  .chat-container {
    max-width: 700px;
  }

  .messages-container {
    padding: 1.25rem;
  }
}

/* 큰 화면에서 사이드바가 닫혔을 때 */
@media (min-width: 768px) {
  .chat-main.sidebar-closed {
    margin-left: 0;
  }
}

/* 접근성 향상 */
@media (prefers-reduced-motion: reduce) {
  .message-bubble {
    animation: none;
  }

  .messages-container {
    scroll-behavior: auto;
  }

  * {
    transition: none !important;
  }

  .typing-cursor {
    animation: none;
  }

  .search-results.fade-in {
    animation: none;
  }

  .result-item {
    animation: none;
  }
}
</style>