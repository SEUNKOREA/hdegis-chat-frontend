<template>
  <aside
    class="sidebar"
    :class="{
      'sidebar-closed': !props.isOpen,
      'sidebar-mobile': props.isMobile,
    }"
  >
    <!-- 사이드바 토글 버튼 -->
    <button
      class="sidebar-toggle"
      @click="handleToggle"
      :title="props.isOpen ? '사이드바 닫기' : '사이드바 열기'"
    >
      <span class="toggle-icon" :class="{ rotated: !props.isOpen }">‹</span>
    </button>

    <!-- 헤더 영역: 로고 및 타이틀 -->
    <header class="sidebar-header">
      <div class="branding" @click="goHome" :class="{ clickable: props.isOpen }">
        <img src="@/assets/icons/hdegis-chat.png" alt="HD-Agent 로고" class="logo" />
        <h2 v-show="props.isOpen" class="brand-title">HD-Agent</h2>
      </div>
      <p v-show="props.isOpen" class="brand-caption">고압차단기 사내문서 QA 챗봇</p>
    </header>

    <!-- 새 채팅 버튼 (채팅이 시작된 경우에만 표시) -->
    <div v-show="props.isOpen && props.hasChatStarted" class="new-chat-section">
      <button class="new-chat-btn" @click="handleNewChat">
        <span class="new-chat-icon">➕</span>
        <span class="new-chat-text">새 채팅</span>
      </button>
    </div>

    <!-- 채팅 세션 목록 (채팅이 시작된 경우에만 표시) -->
    <div v-show="props.isOpen && props.hasChatStarted" class="chat-sessions">
      <h3 class="sessions-title">최근 대화</h3>
      <div class="sessions-list" ref="sessionsListRef">
        <div
          v-for="session in sortedChatSessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === props.currentSessionId }"
          @click="handleSelectSession(session.id)"
        >
          <div class="session-content">
            <div class="session-title">{{ session.title }}</div>
            <div class="session-preview">{{ session.lastMessage }}</div>
            <div class="session-time">{{ formatSessionTime(session.updatedAt) }}</div>
          </div>
          <button
            class="session-delete"
            @click.stop="handleDeleteSession(session.id)"
            :title="'대화 삭제'"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 네비게이션 메뉴 제거됨 -->

    <!-- 하단 사용자 정보 -->
    <div v-show="props.isOpen" class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">👤</div>
        <div class="user-details">
          <div class="user-name">사용자</div>
          <div class="user-status">온라인</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
// HelpModal 컴포넌트 import 제거됨

// Props 정의
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  chatSessions: {
    type: Array,
    default: () => [],
  },
  currentSessionId: {
    type: String,
    default: null,
  },
  hasChatStarted: {
    type: Boolean,
    default: false,
  },
})

// Emits 정의
const emit = defineEmits(['toggle', 'newChat', 'selectSession', 'deleteSession'])

const router = useRouter()
const sessionsListRef = ref(null)
// showHelpModal ref 제거됨

// 세션을 업데이트 시간 순으로 정렬 (최신 순)
const sortedChatSessions = computed(() => {
  return [...props.chatSessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
})

/**
 * 홈페이지로 이동하는 함수
 */
function goHome() {
  router.push('/')
}

/**
 * 사이드바 토글 이벤트 처리
 */
function handleToggle() {
  emit('toggle')
}

/**
 * 새 채팅 생성
 */
function handleNewChat() {
  emit('newChat')
}

/**
 * 세션 선택
 */
function handleSelectSession(sessionId) {
  emit('selectSession', sessionId)
}

/**
 * 세션 삭제
 */
function handleDeleteSession(sessionId) {
  if (confirm('이 대화를 삭제하시겠습니까?')) {
    emit('deleteSession', sessionId)
  }
}

/**
 * Help 모달 관련 함수들 제거됨
 */
/**
 * 세션 시간 포맷팅
 */
function formatSessionTime(timestamp) {
  if (!timestamp) return ''

  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } else if (diffDays === 1) {
    return '어제'
  } else if (diffDays < 7) {
    return `${diffDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
  }
}
</script>

<style scoped>
.sidebar {
  width: 300px;
  flex-shrink: 0;
  background-color: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1rem;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1001;
}

/* 닫힌 상태 */
.sidebar-closed {
  width: 80px;
}

/* 모바일 상태 */
.sidebar-mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  transform: translateX(-100%);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-mobile:not(.sidebar-closed) {
  transform: translateX(0);
}

/* 토글 버튼 */
.sidebar-toggle {
  position: absolute;
  top: 1rem;
  right: -15px;
  width: 30px;
  height: 30px;
  border: none;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle:hover {
  background-color: var(--color-background-mute);
  transform: scale(1.1);
}

.toggle-icon {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text);
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

/* 헤더 영역 스타일 */
.sidebar-header {
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}

.branding {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  padding-left: 0rem;
  justify-content: center;
  transition: all 0.2s ease;
}

.branding.clickable {
  cursor: pointer;
  border-radius: 8px;
  padding: 0.5rem;
  margin: -0.5rem -0.5rem 0.3rem -0.5rem;
}

.branding.clickable:hover {
  background: var(--color-background-mute);
}

.sidebar-closed .branding {
  justify-content: center;
}

.logo {
  height: 40px;
  width: auto;
  flex-shrink: 0;
}

.brand-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
}

.brand-caption {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
  opacity: 0.7;
  margin: 0;
  padding-left: 1rem;
  text-align: center;
  line-height: 1.3;
}

/* 새 채팅 버튼 */
.new-chat-section {
  margin-bottom: 1.5rem;
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.new-chat-btn:active {
  transform: translateY(0);
}

.new-chat-icon {
  font-size: 1.1rem;
}

.new-chat-text {
  flex: 1;
  text-align: left;
}

/* 채팅 세션 목록 */
.chat-sessions {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  min-height: 0;
  overflow: hidden;
}

.sessions-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.7;
  margin: 0 0 0.75rem 0;
  padding: 0 0.5rem;
  flex-shrink: 0;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
  min-height: 0;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
  flex-shrink: 0;
}

.session-item:hover {
  background-color: var(--color-background-mute);
}

.session-item.active {
  background-color: var(--color-background-mute);
  border-color: #3498db;
  box-shadow: 0 0 0 1px rgba(52, 152, 219, 0.2);
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-preview {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.6;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.5;
}

.session-delete {
  opacity: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.session-item:hover .session-delete {
  opacity: 1;
}

.session-delete:hover {
  background-color: rgba(255, 0, 0, 0.1);
}

/* 네비게이션 관련 스타일 제거됨 */

/* 사이드바 하단 */
.sidebar-footer {
  padding-top: 1rem;
  flex-shrink: 0;
  margin-top: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  background-color: var(--color-background-mute);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
}

.user-status {
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.6;
}

/* 스크롤바 스타일링 */
.sessions-list::-webkit-scrollbar {
  width: 6px;
}

.sessions-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.sessions-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Firefox 스크롤바 */
.sessions-list {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

/* 모바일에서 토글 버튼 위치 조정 */
@media (max-width: 767px) {
  .sidebar-toggle {
    display: none;
  }
}

/* 툴팁 관련 스타일 제거됨 */
</style>
