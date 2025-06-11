<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h2 class="modal-title">도움말 및 지원</h2>
        <button class="close-button" @click="closeModal">
          <span class="close-icon">✕</span>
        </button>
      </div>

      <!-- 모달 내용 -->
      <div class="modal-content">
        <div class="help-section">
          <div class="help-icon">📧</div>
          <h3 class="help-title">문의 및 지원</h3>
          <p class="help-description">
            HD-Agent 사용 중 문의사항이나 기술적 문제가 있으시면<br />
            언제든지 아래 이메일로 연락해 주세요.
          </p>

          <div class="email-info">
            <div class="email-label">지원 이메일</div>
            <div class="email-address" @click="copyEmail">
              <span class="email-text">{{ supportEmail }}</span>
              <button class="copy-button" :class="{ copied: emailCopied }">
                <span v-if="!emailCopied" class="copy-icon">📋</span>
                <span v-else class="copied-icon">✓</span>
              </button>
            </div>
            <div class="copy-message" :class="{ show: emailCopied }">
              이메일 주소가 복사되었습니다!
            </div>
          </div>

          <div class="help-features">
            <h4 class="features-title">문의 가능한 내용</h4>
            <ul class="features-list">
              <li>• 기술적 문제 및 버그 신고</li>
              <li>• 새로운 기능 제안</li>
              <li>• 사용법 관련 질문</li>
              <li>• 성능 개선 요청</li>
              <li>• 기타 서비스 관련 문의</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button class="secondary-button" @click="closeModal">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['close'])

// 반응형 데이터
const supportEmail = 'seeun.lee@hd.com'
const emailCopied = ref(false)

/**
 * 모달 닫기
 */
function closeModal() {
  emit('close')
}

/**
 * 이메일 주소 복사
 */
async function copyEmail() {
  try {
    await navigator.clipboard.writeText(supportEmail)
    emailCopied.value = true

    // 2초 후 복사 상태 초기화
    setTimeout(() => {
      emailCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('이메일 복사 실패:', error)
    // 폴백: 텍스트 선택
    selectEmailText()
  }
}

/**
 * 이메일 텍스트 선택 (복사 폴백)
 */
function selectEmailText() {
  const emailElement = document.querySelector('.email-text')
  if (emailElement) {
    const range = document.createRange()
    range.selectNode(emailElement)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  }
}
</script>

<style scoped>
/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 모달 컨테이너 */
.modal-container {
  background-color: var(--color-background);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 모달 헤더 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--color-text);
  opacity: 0.7;
}

.close-button:hover {
  background-color: var(--color-background-mute);
  opacity: 1;
}

.close-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* 모달 내용 */
.modal-content {
  padding: 2rem;
  overflow-y: auto;
  max-height: 60vh;
}

.help-section {
  text-align: center;
}

.help-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.help-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 1rem 0;
}

.help-description {
  font-size: 1rem;
  color: var(--color-text);
  opacity: 0.8;
  line-height: 1.5;
  margin: 0 0 2rem 0;
}

/* 이메일 정보 */
.email-info {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.email-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.email-address {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.email-address:hover {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.email-text {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
  color: #3498db;
  font-family: 'Monaco', 'Menlo', monospace;
}

.copy-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.copy-button:hover {
  background-color: var(--color-background-mute);
}

.copy-button.copied {
  color: #27ae60;
}

.copy-message {
  font-size: 0.85rem;
  color: #27ae60;
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.copy-message.show {
  opacity: 1;
}

/* 기능 목록 */
.help-features {
  text-align: left;
  margin-bottom: 1.5rem;
}

.features-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.75rem 0;
}

.features-list {
  font-size: 0.95rem;
  color: var(--color-text);
  opacity: 0.8;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  list-style: none;
}

.features-list li {
  margin-bottom: 0.5rem;
}

/* 응답 정보 제거됨 */

/* 모달 푸터 */
.modal-footer {
  display: flex;
  justify-content: center;
  padding: 1.5rem 2rem;
  background-color: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
}

.primary-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.secondary-button {
  padding: 0.875rem 2rem;
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-button:hover {
  background-color: var(--color-background-mute);
}

.button-icon {
  font-size: 1rem;
}

/* 모바일 반응형 */
@media (max-width: 767px) {
  .modal-container {
    width: 95%;
    margin: 1rem;
  }

  .modal-header {
    padding: 1.25rem 1.5rem;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .modal-footer {
    padding: 1.25rem 1.5rem;
  }

  .help-title {
    font-size: 1.3rem;
  }

  .help-description {
    font-size: 0.95rem;
  }
}

/* 다크모드 대응 제거됨 */
</style>
