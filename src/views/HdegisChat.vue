<script setup>
import ChatSidebar from '@/components/ChatSidebar.vue'
import ChatMain from '@/components/ChatMain.vue'
import PdfViewer from '@/components/PdfViewer.vue'
import ChatService from '@/services/chat_service.js'
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

// 메시지 전송 상태
const isMessageSending = ref(false)

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
 * 사용자가 메시지를 전송했을 때 처리하는 함수 (타이핑 인디케이터 유지 버전)
 */
async function handleSend(messageData) {
  if (isMessageSending.value) {
    console.warn('이미 메시지를 전송 중입니다.')
    return
  }

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
    filters: filters,
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

  // 로컬 스토리지에 저장
  saveSessions()

  // 메시지 전송 시작
  isMessageSending.value = true

  // ⭐ 타이핑 인디케이터용 임시 봇 메시지 생성 (텍스트는 비어있음)
  const typingMessage = {
    from: 'bot',
    text: '', // 빈 텍스트로 타이핑 인디케이터 표시
    timestamp: new Date(),
    searchResults: [],
    isStreaming: true, // 타이핑 인디케이터 표시를 위해 true
    answerCompleted: false,
    showReferences: false,
  }
  
  currentSession.messages.push(typingMessage)
  const botMessageIndex = currentSession.messages.length - 1

  try {
    console.log('백엔드로 스트리밍 요청 전송:', {
      query: text.trim(),
      filters: filters,
    })

    // 백엔드에 스트리밍 요청
    const stream = await ChatService.sendStreamingMessage(text.trim(), filters)

    // 스트림 처리
    await ChatService.processStreamingResponse(stream, {
      onResponseChunk: (chunk) => {
        // ⭐ 첫 번째 청크가 도착하면 타이핑 메시지를 실제 답변으로 변환
        const currentBotMessage = currentSession.messages[botMessageIndex]
        if (currentBotMessage) {
          currentBotMessage.text += chunk
          currentBotMessage.isStreaming = true
          
          // 마지막 메시지 업데이트 (미리보기용)
          const previewText = currentBotMessage.text.length > 50 
            ? currentBotMessage.text.slice(0, 50) + '...' 
            : currentBotMessage.text
          currentSession.lastMessage = previewText || '응답 중...'
          
          // 세션 업데이트 시간 갱신
          currentSession.updatedAt = new Date()
        }
      },

      onResponseCompleted: () => {
        console.log('답변 스트리밍 완료')
        const currentBotMessage = currentSession.messages[botMessageIndex]
        if (currentBotMessage) {
          currentBotMessage.isStreaming = false // 스트리밍 완료
          currentBotMessage.answerCompleted = true // 답변 완료 표시
          
          // 최종 답변으로 마지막 메시지 업데이트
          const finalPreview = currentBotMessage.text.length > 50 
            ? currentBotMessage.text.slice(0, 50) + '...' 
            : currentBotMessage.text
          currentSession.lastMessage = finalPreview
          
          // 세션 업데이트 시간 갱신
          currentSession.updatedAt = new Date()
        }
      },

      onSearchResults: (searchResults) => {
        console.log('검색 결과 수신:', searchResults)
        const currentBotMessage = currentSession.messages[botMessageIndex]
        if (currentBotMessage) {
          // 검색 결과를 봇 메시지에 저장
          currentBotMessage.searchResults = searchResults || []
          
          // 지연 후 참조문서 표시
          setTimeout(() => {
            currentBotMessage.showReferences = true
            currentSession.updatedAt = new Date()
            saveSessions()
          }, 300) // 300ms 지연으로 자연스러운 등장
        }
      },
      
      onCompleted: () => {
        console.log('전체 스트리밍 프로세스 완료')
        isMessageSending.value = false
        
        // 최종 상태 저장
        saveSessions()
      },

      onError: (error) => {
        console.error('스트리밍 오류:', error)
        const currentBotMessage = currentSession.messages[botMessageIndex]
        if (currentBotMessage) {
          currentBotMessage.text = '죄송합니다. 응답 생성 중 오류가 발생했습니다.'
          currentBotMessage.isStreaming = false
          currentBotMessage.answerCompleted = true
          currentSession.lastMessage = '오류 발생'
        }
        isMessageSending.value = false
        
        // 에러 상태 저장
        saveSessions()
      },
    })
  } catch (error) {
    console.error('메시지 전송 실패:', error)
    const currentBotMessage = currentSession.messages[botMessageIndex]
    if (currentBotMessage) {
      currentBotMessage.text = '네트워크 오류가 발생했습니다. 다시 시도해 주세요.'
      currentBotMessage.isStreaming = false
      currentBotMessage.answerCompleted = true
      currentSession.lastMessage = '네트워크 오류'
    }
    isMessageSending.value = false
    
    // 에러 상태 저장
    saveSessions()
  }
}

/**
 * PDF 표시 핸들러
 */
function handleShowPdf(searchResult) {
  console.log('PDF 표시 요청:', searchResult)

  // 실제 백엔드에서 받은 경로 사용
  currentPdfUrl.value = searchResult.filePath || 'public/sample.pdf'
  currentPdfPage.value = searchResult.pageNumber || 1
  currentPdfFileName.value = searchResult.fileName || 'Document.pdf'
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
          
          // 기존 메시지에 새로운 상태 필드가 없는 경우 추가
          if (message.from === 'bot') {
            if (message.isStreaming === undefined) {
              message.isStreaming = false
            }
            if (message.answerCompleted === undefined) {
              message.answerCompleted = true
            }
            if (message.showReferences === undefined) {
              message.showReferences = true
            }
          }
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

/**
 * 백엔드 헬스 체크
 */
async function checkBackendHealth() {
  try {
    const isHealthy = await ChatService.healthCheck()
    if (isHealthy) {
      console.log('백엔드 서버 연결 확인됨')
    } else {
      console.warn('백엔드 서버 응답 없음')
    }
  } catch (error) {
    console.error('백엔드 연결 확인 실패:', error)
  }
}

// 컴포넌트 마운트 시 이벤트 리스너 등록 및 세션 데이터 로드
onMounted(() => {
  handleResize() // 초기 화면 크기 체크
  loadSessions() // 저장된 세션 데이터 로드
  checkBackendHealth() // 백엔드 연결 확인
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
      :is-message-sending="isMessageSending"
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