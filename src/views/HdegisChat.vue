<script setup>
import ChatSidebar from '@/components/ChatSidebar.vue'
import ChatMain from '@/components/ChatMain.vue'
import PdfViewer from '@/components/PdfViewer.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'

// 채팅 세션 데이터 구조
const chatSessions = ref([])
const currentSessionId = ref(null)
const currentDocumentFilters = ref([])

// 사이드바 상태 관리
const isSidebarOpen = ref(true)
const isMobile = ref(false)

// PDF 뷰어 상태 관리
const showPdfPanel = ref(false)
const currentPdfUrl = ref('')
const currentPdfPage = ref(1)
const currentPdfFileName = ref('')
const currentSearchResults = ref([])

// 현재 활성 세션의 메시지들을 계산된 속성으로 가져오기
const messages = computed(() => {
  const currentSession = chatSessions.value.find((session) => session.id === currentSessionId.value)
  return currentSession ? currentSession.messages : []
})

// 채팅이 시작되었는지 여부 (메시지가 있는지 확인)
const hasChatStarted = computed(() => {
  return (
    chatSessions.value.length > 0 &&
    chatSessions.value.some((session) => session.messages.length > 0)
  )
})

/**
 * 고유 ID 생성 함수
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 세션 번호 생성 (순차적)
 */
function generateSessionNumber() {
  return chatSessions.value.length + 1
}

/**
 * 새로운 채팅 세션 생성
 */
function createNewSession() {
  const newSessionId = generateId()
  const sessionNumber = generateSessionNumber()
  const newSession = {
    id: newSessionId,
    title: `Chat History ${sessionNumber}`,
    number: sessionNumber,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessage: '',
    documentFilters: [], // 세션별 문서 필터 저장
  }

  chatSessions.value.unshift(newSession)
  currentSessionId.value = newSessionId

  // 로컬 스토리지에 저장
  saveSessions()
}

/**
 * 세션 제목 자동 생성 (첫 번째 사용자 메시지 기반)
 */
function generateSessionTitle(firstMessage, sessionNumber) {
  if (!firstMessage) return `Chat History ${sessionNumber}`

  // 첫 30자까지만 사용하고 말줄임표 추가
  const shortMessage =
    firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage
  return `${sessionNumber}. ${shortMessage}`
}

/**
 * 샘플 검색 결과 생성 (실제 API 연동 전까지 사용)
 */
function generateSampleSearchResults() {
  return [
    {
      fileName: 'sample.pdf',
      filePath: 'sample.pdf',
      pageNumber: 5,
      score: 0.92,
      preview:
        '고압차단기의 동작 원리에 대한 설명이 포함된 내용입니다. 차단기는 전력 시스템에서 중요한 역할을 담당하며...',
    },
    {
      fileName: 'sample.pdf',
      filePath: 'sample.pdf',
      pageNumber: 12,
      score: 0.87,
      preview:
        '안전 규정 및 유지보수 가이드라인이 명시되어 있습니다. 정기적인 점검과 관리가 필요하며...',
    },
    {
      fileName: 'sample.pdf',
      filePath: 'sample.pdf',
      pageNumber: 18,
      score: 0.81,
      preview:
        '기술적 사양 및 성능 지표에 대한 상세한 정보가 포함되어 있습니다. 전압, 전류 등의 파라미터...',
    },
  ]
}

/**
 * 사용자가 메시지를 전송했을 때 처리하는 함수
 */
function handleSend(messageData) {
  const { text, filters } = messageData

  // 현재 세션이 없으면 새로 생성
  if (!currentSessionId.value) {
    createNewSession()
  }

  const currentSession = chatSessions.value.find((session) => session.id === currentSessionId.value)
  if (!currentSession) return

  // 세션에 필터 정보 저장 (첫 메시지인 경우)
  if (currentSession.messages.length === 0 && filters.length > 0) {
    currentSession.documentFilters = [...filters]
  }

  const userMessage = {
    from: 'user',
    text: text.trim(),
    timestamp: new Date(),
    filters: filters, // 메시지별 필터 정보 저장
  }

  // 사용자 메시지 추가
  currentSession.messages.push(userMessage)

  // 첫 번째 메시지인 경우 세션 제목 업데이트
  if (currentSession.messages.length === 1) {
    currentSession.title = generateSessionTitle(text.trim(), currentSession.number)
  }

  // 세션 업데이트 시간 및 마지막 메시지 업데이트
  currentSession.updatedAt = new Date()
  currentSession.lastMessage = text.trim()

  // 선택된 필터 정보 로깅
  console.log('메시지 전송:', {
    text: text.trim(),
    selectedFilters: filters,
    sessionId: currentSessionId.value,
  })

  // 봇 응답 시뮬레이션 (실제로는 API 호출)
  setTimeout(() => {
    const botMessage = {
      from: 'bot',
      text: generateBotResponse(filters),
      timestamp: new Date(),
      searchResults: generateSampleSearchResults(), // 샘플 검색 결과 추가
    }

    currentSession.messages.push(botMessage)
    currentSession.updatedAt = new Date()
    currentSession.lastMessage = botMessage.text

    // 로컬 스토리지에 저장
    saveSessions()
  }, 600)

  // 로컬 스토리지에 저장
  saveSessions()
}

/**
 * 필터 기반 봇 응답 생성 (시뮬레이션)
 */
function generateBotResponse(filters) {
  if (filters.length === 0) {
    return '알겠습니다. 전체 문서를 기반으로 답변드리겠습니다. 고압차단기의 동작 원리는 다음과 같습니다...'
  }

  const filterNames = filters.map((filter) => {
    const parts = filter.split('/')
    return parts[parts.length - 1]
  })

  return `선택하신 문서 카테고리(${filterNames.join(', ')})를 기반으로 답변드리겠습니다. 관련 문서에서 다음과 같은 정보를 찾았습니다...`
}

/**
 * PDF 표시 핸들러
 */
function handleShowPdf(searchResult) {
  console.log('PDF 표시 요청:', searchResult)

  currentPdfUrl.value = searchResult.filePath
  currentPdfPage.value = searchResult.pageNumber
  currentPdfFileName.value = searchResult.fileName
  currentSearchResults.value = [searchResult]
  showPdfPanel.value = true

  // 모바일에서는 사이드바를 닫음
  if (isMobile.value) {
    isSidebarOpen.value = false
  }
}

/**
 * PDF 패널 닫기
 */
function closePdfPanel() {
  showPdfPanel.value = false
  currentPdfUrl.value = ''
  currentPdfPage.value = 1
  currentPdfFileName.value = ''
  currentSearchResults.value = []
}

/**
 * PDF 페이지 변경 핸들러
 */
function handlePdfPageChange(pageNumber) {
  currentPdfPage.value = pageNumber
  console.log('PDF 페이지 변경:', pageNumber)
}

/**
 * 문서 필터 변경 처리 함수
 */
function handleFilterChange(filters) {
  currentDocumentFilters.value = [...filters]
  console.log('문서 필터 변경:', filters)

  // 현재 세션이 있다면 세션에 필터 정보 업데이트
  const currentSession = chatSessions.value.find((session) => session.id === currentSessionId.value)
  if (currentSession) {
    currentSession.documentFilters = [...filters]
    saveSessions()
  }
}

/**
 * 새 채팅 생성 핸들러
 */
function handleNewChat() {
  createNewSession()
  // PDF 패널이 열려있다면 닫기
  if (showPdfPanel.value) {
    closePdfPanel()
  }
}

/**
 * 세션 선택 핸들러
 */
function handleSelectSession(sessionId) {
  currentSessionId.value = sessionId

  // 선택된 세션의 필터 정보 복원
  const selectedSession = chatSessions.value.find((session) => session.id === sessionId)
  if (selectedSession && selectedSession.documentFilters) {
    currentDocumentFilters.value = [...selectedSession.documentFilters]
  }

  // PDF 패널이 열려있다면 닫기
  if (showPdfPanel.value) {
    closePdfPanel()
  }
}

/**
 * 세션 삭제 핸들러
 */
function handleDeleteSession(sessionId) {
  const sessionIndex = chatSessions.value.findIndex((session) => session.id === sessionId)
  if (sessionIndex === -1) return

  // 세션 삭제
  chatSessions.value.splice(sessionIndex, 1)

  // 삭제 후 남은 세션들의 번호 재정렬
  reorderSessionNumbers()

  // 삭제된 세션이 현재 활성 세션이었다면
  if (currentSessionId.value === sessionId) {
    if (chatSessions.value.length > 0) {
      // 다른 세션으로 전환
      const newSession = chatSessions.value[0]
      currentSessionId.value = newSession.id
      // 새 세션의 필터 복원
      if (newSession.documentFilters) {
        currentDocumentFilters.value = [...newSession.documentFilters]
      }
    } else {
      // 모든 세션이 삭제되었다면 null로 설정
      currentSessionId.value = null
      currentDocumentFilters.value = []
    }

    // PDF 패널이 열려있다면 닫기
    if (showPdfPanel.value) {
      closePdfPanel()
    }
  }

  // 로컬 스토리지에 저장
  saveSessions()
}

/**
 * 세션 번호 재정렬
 */
function reorderSessionNumbers() {
  // 생성 시간 순으로 정렬하여 번호 재할당
  const sortedSessions = [...chatSessions.value].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  )

  sortedSessions.forEach((session, index) => {
    const newNumber = index + 1
    session.number = newNumber

    // 첫 번째 메시지가 있으면 제목도 업데이트
    if (session.messages.length > 0) {
      const firstUserMessage = session.messages.find((msg) => msg.from === 'user')
      if (firstUserMessage) {
        session.title = generateSessionTitle(firstUserMessage.text, newNumber)
      } else {
        session.title = `Chat History ${newNumber}`
      }
    } else {
      session.title = `Chat History ${newNumber}`
    }
  })
}

/**
 * 사이드바 토글 함수
 */
function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

/**
 * 화면 크기 변화 감지하여 사이드바 상태 조정
 */
function handleResize() {
  const width = window.innerWidth
  isMobile.value = width < 768

  // 모바일에서는 기본으로 사이드바 닫기, 데스크톱에서는 열기
  if (isMobile.value) {
    isSidebarOpen.value = false
  } else {
    isSidebarOpen.value = true
  }
}

/**
 * 사이드바 외부 클릭 시 닫기 (모바일에서만)
 */
function handleOverlayClick() {
  if (isMobile.value && isSidebarOpen.value) {
    isSidebarOpen.value = false
  }
}

/**
 * 세션 데이터를 로컬 스토리지에 저장
 */
function saveSessions() {
  try {
    const sessionData = {
      sessions: chatSessions.value,
      currentSessionId: currentSessionId.value,
      currentDocumentFilters: currentDocumentFilters.value,
    }
    localStorage.setItem('hd-agent-sessions', JSON.stringify(sessionData))
  } catch (error) {
    console.error('세션 저장 실패:', error)
  }
}

/**
 * 로컬 스토리지에서 세션 데이터 불러오기
 */
function loadSessions() {
  try {
    const savedData = localStorage.getItem('hd-agent-sessions')
    if (savedData) {
      const sessionData = JSON.parse(savedData)

      // 날짜 객체 복원
      sessionData.sessions.forEach((session) => {
        session.createdAt = new Date(session.createdAt)
        session.updatedAt = new Date(session.updatedAt)
        session.messages.forEach((message) => {
          message.timestamp = new Date(message.timestamp)
        })

        // 기존 데이터에 number 필드가 없는 경우 추가
        if (!session.number) {
          session.number = sessionData.sessions.indexOf(session) + 1
        }

        // 기존 데이터에 documentFilters 필드가 없는 경우 추가
        if (!session.documentFilters) {
          session.documentFilters = []
        }
      })

      chatSessions.value = sessionData.sessions || []
      currentSessionId.value = sessionData.currentSessionId || null
      currentDocumentFilters.value = sessionData.currentDocumentFilters || []

      // 현재 세션 ID가 유효하지 않은 경우 처리
      if (
        currentSessionId.value &&
        !chatSessions.value.find((s) => s.id === currentSessionId.value)
      ) {
        currentSessionId.value = chatSessions.value.length > 0 ? chatSessions.value[0].id : null

        // 새로운 현재 세션의 필터 복원
        if (currentSessionId.value) {
          const newCurrentSession = chatSessions.value.find((s) => s.id === currentSessionId.value)
          if (newCurrentSession && newCurrentSession.documentFilters) {
            currentDocumentFilters.value = [...newCurrentSession.documentFilters]
          }
        }
      }

      // 번호 재정렬 (기존 데이터 호환성을 위해)
      reorderSessionNumbers()
    }
  } catch (error) {
    console.error('세션 로드 실패:', error)
    chatSessions.value = []
    currentSessionId.value = null
    currentDocumentFilters.value = []
  }
}

// 컴포넌트 마운트 시 이벤트 리스너 등록 및 세션 데이터 로드
onMounted(() => {
  handleResize() // 초기 화면 크기 체크
  loadSessions() // 저장된 세션 데이터 로드
  window.addEventListener('resize', handleResize)
})

// 컴포넌트 언마운트 시 이벤트 리스너 제거
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="chat-layout">
    <!-- 모바일 오버레이 -->
    <div v-if="isMobile && isSidebarOpen" class="sidebar-overlay" @click="handleOverlayClick"></div>

    <!-- 좌측 사이드바 -->
    <ChatSidebar
      :is-open="isSidebarOpen"
      :is-mobile="isMobile"
      :chat-sessions="chatSessions"
      :current-session-id="currentSessionId"
      :has-chat-started="hasChatStarted"
      @toggle="toggleSidebar"
      @new-chat="handleNewChat"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
    />

    <!-- 메인 채팅 영역 -->
    <ChatMain
      :messages="messages"
      :is-sidebar-open="isSidebarOpen"
      :is-mobile="isMobile"
      @send="handleSend"
      @toggle-sidebar="toggleSidebar"
      @filter-change="handleFilterChange"
      @show-pdf="handleShowPdf"
    />

    <!-- PDF 뷰어 패널 -->
    <PdfViewer
      v-if="showPdfPanel"
      :pdf-url="currentPdfUrl"
      :target-page="currentPdfPage"
      :search-results="currentSearchResults"
      :file-name="currentPdfFileName"
      @close="closePdfPanel"
      @page-change="handlePdfPageChange"
    />
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

/* 모바일 오버레이 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  backdrop-filter: blur(2px);
}

/* PDF 패널이 열렸을 때 레이아웃 조정 */
.chat-layout:has(.pdf-panel) .chat-main {
  width: calc(100% - 400px);
}

/* 모바일에서 PDF 패널이 열렸을 때 */
@media (max-width: 767px) {
  .chat-layout:has(.pdf-panel) .chat-main {
    display: none;
  }

  .chat-layout:has(.pdf-panel) .sidebar {
    display: none;
  }
}
</style>
*
