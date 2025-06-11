<template>
  <div class="pdf-panel">
    <!-- PDF 헤더 -->
    <div class="pdf-header">
      <div class="pdf-title">
        <h3>{{ fileName }}</h3>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      </div>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>

    <!-- PDF 툴바 -->
    <div class="pdf-toolbar">
      <button @click="previousPage" :disabled="currentPage <= 1" class="nav-btn">◀</button>
      <div class="page-input-group">
        <input
          v-model="pageInput"
          @keyup.enter="goToPage"
          @blur="goToPage"
          type="number"
          :min="1"
          :max="totalPages"
          class="page-input"
        />
        <span class="page-total">/ {{ totalPages }}</span>
      </div>
      <button @click="nextPage" :disabled="currentPage >= totalPages" class="nav-btn">▶</button>

      <div class="zoom-controls">
        <button @click="zoomOut" class="zoom-btn">-</button>
        <span class="zoom-display">{{ Math.round(zoom * 100) }}%</span>
        <button @click="zoomIn" class="zoom-btn">+</button>
        <button @click="fitToWidth" class="fit-btn">맞춤</button>
      </div>
    </div>

    <!-- 검색 결과 표시 -->
    <div v-if="searchResults && searchResults.length > 0" class="search-results-panel">
      <h4>검색 결과 ({{ searchResults.length }}개)</h4>
      <div class="results-list">
        <div
          v-for="(result, index) in searchResults"
          :key="index"
          class="result-item"
          :class="{ active: result.pageNumber === currentPage }"
          @click="goToPage(result.pageNumber)"
        >
          <div class="result-score">{{ (result.score * 100).toFixed(1) }}%</div>
          <div class="result-info">
            <div class="result-page">페이지 {{ result.pageNumber }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF 컨테이너 -->
    <div class="pdf-container" ref="pdfContainer">
      <canvas
        ref="pdfCanvas"
        :style="{ transform: `scale(${zoom})`, transformOrigin: 'top left' }"
      ></canvas>

      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="pdf-loading">
        <div class="loading-spinner"></div>
        <p>PDF를 불러오는 중...</p>
      </div>

      <!-- 에러 상태 -->
      <div v-if="hasError" class="pdf-error">
        <p>PDF를 불러올 수 없습니다.</p>
        <button @click="retryLoad" class="retry-btn">다시 시도</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

// Props 정의
const props = defineProps({
  pdfUrl: {
    type: String,
    required: true,
  },
  targetPage: {
    type: Number,
    default: 1,
  },
  searchResults: {
    type: Array,
    default: () => [],
  },
  fileName: {
    type: String,
    default: 'Document.pdf',
  },
})

// Emits 정의
const emit = defineEmits(['close', 'page-change'])

// 반응형 데이터
const currentPage = ref(1)
const totalPages = ref(0)
const zoom = ref(1)
const pageInput = ref(1)
const pdfDocument = ref(null)
const pdfCanvas = ref(null)
const pdfContainer = ref(null)
const isLoading = ref(false)
const hasError = ref(false)

// PDF.js 워커 설정 (CDN 사용)
let pdfjsLib = null

// 컴포넌트 마운트 시 PDF.js 로드
onMounted(async () => {
  await loadPdfJs()
  if (props.pdfUrl) {
    await loadPdf()
  }
})

// PDF URL 변경 감지
watch(
  () => props.pdfUrl,
  async () => {
    if (props.pdfUrl) {
      await loadPdf()
    }
  },
)

// 타겟 페이지 변경 감지
watch(
  () => props.targetPage,
  (newPage) => {
    if (newPage && newPage !== currentPage.value) {
      goToPage(newPage)
    }
  },
)

// 현재 페이지 변경 감지
watch(currentPage, (newPage) => {
  pageInput.value = newPage
  emit('page-change', newPage)
})

/**
 * PDF.js 라이브러리 동적 로드
 */
async function loadPdfJs() {
  try {
    // PDF.js CDN에서 동적 로드
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'

    return new Promise((resolve, reject) => {
      script.onload = () => {
        pdfjsLib = window.pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  } catch (error) {
    console.error('PDF.js 로드 실패:', error)
    hasError.value = true
  }
}

/**
 * PDF 문서 로드
 */
async function loadPdf() {
  if (!pdfjsLib) {
    console.error('PDF.js가 로드되지 않았습니다')
    return
  }

  isLoading.value = true
  hasError.value = false

  try {
    // PDF 문서 로드
    const loadingTask = pdfjsLib.getDocument(props.pdfUrl)
    pdfDocument.value = await loadingTask.promise

    totalPages.value = pdfDocument.value.numPages

    // 타겟 페이지로 이동 또는 첫 페이지 렌더링
    const initialPage = props.targetPage || 1
    await goToPage(initialPage)

    isLoading.value = false
  } catch (error) {
    console.error('PDF 로드 실패:', error)
    hasError.value = true
    isLoading.value = false
  }
}

/**
 * 특정 페이지 렌더링
 */
async function renderPage(pageNumber) {
  if (!pdfDocument.value || !pdfCanvas.value) return

  try {
    const page = await pdfDocument.value.getPage(pageNumber)
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')

    // 컨테이너 크기에 맞춰 스케일 계산
    const containerWidth = pdfContainer.value?.clientWidth || 800
    const viewport = page.getViewport({ scale: 1 })
    const scale = (containerWidth - 40) / viewport.width // 여백 고려

    const scaledViewport = page.getViewport({ scale })

    // 캔버스 크기 설정
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height

    // 렌더링
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    }

    await page.render(renderContext).promise
  } catch (error) {
    console.error('페이지 렌더링 실패:', error)
  }
}

/**
 * 페이지 이동
 */
async function goToPage(pageNumber) {
  if (typeof pageNumber === 'string') {
    pageNumber = parseInt(pageNumber) || 1
  }

  if (pageNumber < 1) pageNumber = 1
  if (pageNumber > totalPages.value) pageNumber = totalPages.value

  currentPage.value = pageNumber
  await renderPage(pageNumber)
}

/**
 * 이전 페이지
 */
async function previousPage() {
  if (currentPage.value > 1) {
    await goToPage(currentPage.value - 1)
  }
}

/**
 * 다음 페이지
 */
async function nextPage() {
  if (currentPage.value < totalPages.value) {
    await goToPage(currentPage.value + 1)
  }
}

/**
 * 줌 인
 */
function zoomIn() {
  zoom.value = Math.min(zoom.value + 0.2, 3)
}

/**
 * 줌 아웃
 */
function zoomOut() {
  zoom.value = Math.max(zoom.value - 0.2, 0.5)
}

/**
 * 폭에 맞춤
 */
async function fitToWidth() {
  zoom.value = 1
  await nextTick()
  await renderPage(currentPage.value)
}

/**
 * 다시 로드
 */
async function retryLoad() {
  await loadPdf()
}
</script>

<style scoped>
.pdf-panel {
  width: 400px;
  height: 100vh;
  background: var(--color-background);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 100;
}

/* PDF 헤더 */
.pdf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
  flex-shrink: 0;
}

.pdf-title h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}

.page-info {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.7;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 1.2rem;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: var(--color-background-mute);
}

/* PDF 툴바 */
.pdf-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.nav-btn,
.zoom-btn,
.fit-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-btn:hover,
.zoom-btn:hover,
.fit-btn:hover {
  background: var(--color-background-soft);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-input-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-input {
  width: 50px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  text-align: center;
  font-size: 0.85rem;
  background: var(--color-background);
  color: var(--color-text);
}

.page-total {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.7;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}

.zoom-display {
  font-size: 0.85rem;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
  color: var(--color-text);
}

.fit-btn {
  width: auto;
  padding: 0 0.5rem;
  font-size: 0.8rem;
}

/* 검색 결과 패널 */
.search-results-panel {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
  flex-shrink: 0;
  max-height: 200px;
  overflow-y: auto;
}

.search-results-panel h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--color-text);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  border: 1px solid transparent;
}

.result-item:hover {
  background: var(--color-background-mute);
}

.result-item.active {
  background: var(--color-background-mute);
  border-color: #3498db;
}

.result-score {
  font-size: 0.8rem;
  font-weight: 600;
  color: #3498db;
  min-width: 40px;
}

.result-info {
  flex: 1;
}

.result-page {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
}

/* PDF 컨테이너 */
.pdf-container {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  background: var(--color-background-mute);
  position: relative;
}

canvas {
  display: block;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background: white;
  border-radius: 4px;
}

/* 로딩 상태 */
.pdf-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--color-text);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 에러 상태 */
.pdf-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--color-text);
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: #2980b9;
}

/* 스크롤바 스타일링 */
.pdf-container::-webkit-scrollbar,
.search-results-panel::-webkit-scrollbar {
  width: 8px;
}

.pdf-container::-webkit-scrollbar-track,
.search-results-panel::-webkit-scrollbar-track {
  background: var(--color-background-soft);
}

.pdf-container::-webkit-scrollbar-thumb,
.search-results-panel::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

/* 반응형 */
@media (max-width: 768px) {
  .pdf-panel {
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }

  .pdf-toolbar {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .zoom-controls {
    margin-left: 0;
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }
}
</style>
