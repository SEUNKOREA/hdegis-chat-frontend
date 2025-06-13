<template>
  <div class="page-wrapper">
    <!-- 히어로 섹션 -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="company-badge">
          <span class="badge-text">HD현대일렉트릭</span>
          <span class="badge-ai">AI Platform</span>
        </div>
        <h1 class="hero-title">차세대 <span class="highlight">AI Agent</span> 플랫폼</h1>
        <p class="hero-description">
          혁신적인 생성형 AI 기술로<br />
          더 스마트한 업무 환경을 경험해보세요
        </p>
      </div>
      <div class="hero-decoration">
        <div class="floating-element element-1">🤖</div>
        <div class="floating-element element-2">⚡</div>
        <div class="floating-element element-3">🔧</div>
        <div class="floating-element element-4">📊</div>
      </div>
    </div>

    <!-- 서비스 섹션 -->
    <div class="services-section">
      <div class="section-header">
        <h2 class="section-title">AI 서비스 라인업</h2>
        <p class="section-subtitle">각 분야별 전문 AI 에이전트가 여러분의 업무를 도와드립니다</p>
      </div>

      <div class="card-container">
        <div
          class="service-card"
          v-for="(card, index) in cards"
          :key="card.title"
          :class="{ 'coming-soon': isComingSoon(card.route) }"
          @click="goTo(card.route)"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <div class="card-header">
            <div class="icon-wrapper">
              <img class="card-icon" :src="card.icon" :alt="card.title" />
              <div v-if="isComingSoon(card.route)" class="coming-soon-badge">Coming Soon</div>
            </div>
            <div v-if="isHighlighted(card.route)" class="popular-badge">🔥 인기</div>
          </div>

          <div class="card-content">
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-description">{{ card.description }}</p>
          </div>

          <div class="card-footer">
            <div class="card-tags">
              <span v-for="tag in getCardTags(card.route)" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
            <div class="card-arrow">
              <span v-if="!isComingSoon(card.route)">→</span>
              <span v-else class="coming-soon-text">준비중</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 푸터 섹션 -->
    <div class="footer-section">
      <div class="footer-content">
        <div class="footer-info">
          <h3 class="footer-title">HD현대일렉트릭 AI Platform</h3>
          <p class="footer-description">지속적인 혁신을 통해 더 나은 AI 서비스를 제공하겠습니다.</p>
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link" @click.prevent="openHelpModal">문의하기</a>
        </div>
      </div>
    </div>

    <!-- Help 모달 -->
    <HelpModal :is-visible="showHelpModal" @close="closeHelpModal" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import HelpModal from '@/components/HelpModal.vue'

const router = useRouter()
const showHelpModal = ref(false)

const cards = [
  {
    title: '고압차단기 사내문서 QA 챗봇',
    description:
      '기술 문서와 관련된 전문 지식을 쉽고 빠르게 검색할 수 있습니다.',
    icon: '/icons/hdegis-chat.svg',
    route: '/hdegis-chat',
  },
  {
    title: '변압기 사양검토 자동화',
    description: '변압기 사양을 자동으로 분석하고 최적화된 검토 결과를 제공합니다.',
    icon: '/icons/hdetrf-spec.svg',
    route: '/hdetrf-spec',
  },
  {
    title: '회전기 사양검토 자동화',
    description: '회전기 설계 사양을 스마트하게 검토하고 개선 방안을 제안합니다.',
    icon: '/icons/hdermd-spec.svg',
    route: '/hdermd-spec',
  },
  {
    title: 'INTEGRICT 전력기기 진단 서비스',
    description: 'AI 기반 전력기기 상태 진단으로 예방 정비와 안전 관리를 지원합니다.',
    icon: '/icons/hdeintg-anly.svg',
    route: '/hdeintg-analysis',
  },
  {
    title: '설비 최적화 AI 어시스턴트',
    description: '설비 운영 데이터를 분석하여 최적화 방안을 제안하는 차세대 AI 서비스입니다.',
    icon: '/icons/hde-tmp-1.svg',
    route: '/pending',
  },
  {
    title: '스마트 품질관리 시스템',
    description: 'AI 기반 품질 검사 및 관리 시스템으로 제품 품질을 한 단계 높여보세요.',
    icon: '/icons/hde-tmp-2.svg',
    route: '/pending',
  },
]

function goTo(route) {
  if (route === '/pending') {
    return
  }
  router.push(route)
}

function isComingSoon(route) {
  return route === '/pending'
}

function isHighlighted(route) {
  return route === '/hdegis-chat'
}

function getCardTags(route) {
  const tagMap = {
    '/hdegis-chat': ['QA', '실시간'],
    '/hdetrf-spec': ['자동화', '검토'],
    '/hdermd-spec': ['설계', '최적화'],
    '/hdeintg-analysis': ['PRPD', 'DGA'],
    '/pending': ['NEW', '준비중'],
  }
  return tagMap[route] || ['서비스']
}

/**
 * Help 모달 열기
 */
function openHelpModal() {
  showHelpModal.value = true
}

/**
 * Help 모달 닫기
 */
function closeHelpModal() {
  showHelpModal.value = false
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  color: white;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* 히어로 섹션 - HD현대 컬러 적용 */
.hero-section {
  position: relative;
  padding: clamp(2rem, 8vh, 6rem) 0;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  background: linear-gradient(135deg, #00b140 0%, #0066cc 100%);
  min-height: clamp(400px, 60vh, 700px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

.hero-content {
  max-width: min(800px, 90vw);
  position: relative;
  z-index: 2;
  padding: 0 clamp(1rem, 4vw, 2rem);
}

.company-badge {
  display: inline-flex;
  align-items: center;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50px;
  padding: clamp(0.4rem, 1.5vw, 0.5rem) clamp(1rem, 3vw, 1.5rem);
  margin-bottom: clamp(1.5rem, 4vh, 2rem);
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  font-weight: 600;
}

.badge-text {
  color: rgba(255, 255, 255, 0.95);
}

.badge-ai {
  background: linear-gradient(135deg, #4cc366, #7fd492);
  color: white;
  padding: clamp(0.2rem, 0.5vw, 0.25rem) clamp(0.5rem, 1.5vw, 0.75rem);
  border-radius: 20px;
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  font-weight: 600;
}

.hero-title {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 800;
  margin-bottom: clamp(1rem, 3vh, 1.5rem);
  line-height: 1.2;
}

.highlight {
  background: linear-gradient(135deg, #ffffff, #e8f7ed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.3);
}

.hero-description {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  opacity: 0.95;
  line-height: 1.6;
  margin-bottom: clamp(2rem, 5vh, 3rem);
}

/* 플로팅 요소들 - HD현대 컬러 적용 */
.hero-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  font-size: clamp(1.5rem, 3vw, 2rem);
  opacity: 0.12;
  animation: float 6s ease-in-out infinite;
  color: rgba(255, 255, 255, 0.8);
}

.element-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}
.element-2 {
  top: 30%;
  right: 15%;
  animation-delay: 1s;
}
.element-3 {
  bottom: 30%;
  left: 15%;
  animation-delay: 2s;
}
.element-4 {
  bottom: 20%;
  right: 10%;
  animation-delay: 3s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* 서비스 섹션 - 완전 반응형 */
.services-section {
  background: white;
  color: #333;
  padding: clamp(2rem, 8vh, 4rem) clamp(1rem, 4vw, 2rem);
  flex: 1;
}

.section-header {
  text-align: center;
  margin-bottom: clamp(2rem, 6vh, 3rem);
}

.section-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 700;
  margin-bottom: clamp(0.5rem, 2vh, 1rem);
  color: #2d3436;
}

.section-subtitle {
  font-size: clamp(1rem, 2.2vw, 1.1rem);
  color: #636e72;
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto;
}

/* 카드 컨테이너 - 완전 반응형 그리드 */
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
  max-width: 1200px;
  margin: 0 auto;
}

/* 서비스 카드 - 반응형 */
.service-card {
  background: white;
  border-radius: clamp(12px, 3vw, 20px);
  padding: clamp(1.5rem, 4vw, 2rem);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e9ecef;
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.6s ease-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  height: fit-content;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: #74b9ff;
}

.service-card.coming-soon {
  opacity: 0.7;
  cursor: not-allowed;
}

.service-card.coming-soon:hover {
  transform: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 카드 헤더 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
}

.icon-wrapper {
  position: relative;
}

.card-icon {
  width: clamp(48px, 8vw, 60px);
  height: clamp(48px, 8vw, 60px);
}

.coming-soon-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #fd79a8;
  color: white;
  font-size: clamp(0.6rem, 1.5vw, 0.7rem);
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.popular-badge {
  background: linear-gradient(135deg, #fd79a8, #fdcb6e);
  color: white;
  font-size: clamp(0.7rem, 1.8vw, 0.8rem);
  padding: clamp(0.4rem, 1vw, 0.5rem) clamp(0.8rem, 2vw, 1rem);
  border-radius: 20px;
  font-weight: 600;
  white-space: nowrap;
}

/* 카드 콘텐츠 */
.card-content {
  margin-bottom: clamp(1.5rem, 4vw, 2rem);
}

.card-title {
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
  font-weight: 700;
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
  color: #2d3436;
  line-height: 1.3;
}

.card-description {
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  color: #636e72;
  line-height: 1.6;
}

/* 카드 푸터 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.card-tags {
  display: flex;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  flex-wrap: wrap;
}

.tag {
  background: #f8f9fa;
  color: #495057;
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  padding: 0.25rem clamp(0.5rem, 1.5vw, 0.75rem);
  border-radius: 15px;
  font-weight: 500;
  white-space: nowrap;
}

.card-arrow {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  font-weight: bold;
  color: #74b9ff;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.service-card:hover .card-arrow {
  transform: translateX(4px);
}

.coming-soon-text {
  font-size: clamp(0.8rem, 1.8vw, 0.9rem);
  color: #adb5bd;
}

/* 푸터 섹션 - 완전 반응형 */
.footer-section {
  background: #2d3436;
  color: white;
  padding: clamp(2rem, 6vh, 3rem) 0;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 clamp(1rem, 4vw, 2rem);
  gap: clamp(1rem, 4vw, 2rem);
}

.footer-info {
  flex: 1;
}

.footer-title {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  font-weight: 700;
  margin-bottom: clamp(0.3rem, 1vh, 0.5rem);
}

.footer-description {
  color: #b2bec3;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  line-height: 1.5;
}

.footer-links {
  display: flex;
  gap: clamp(1rem, 3vw, 2rem);
  flex-wrap: wrap;
}

.footer-link {
  color: #b2bec3;
  text-decoration: none;
  font-weight: 500;
  font-size: clamp(0.9rem, 2vw, 1rem);
  transition: color 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
}

.footer-link:hover {
  color: #74b9ff;
}

/* 세밀한 반응형 조정 */
@media (max-width: 768px) {
  .hero-description br {
    display: none;
  }

  .card-container {
    grid-template-columns: 1fr;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .company-badge {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* 극소 화면 대응 */
@media (max-width: 320px) {
  .hero-section {
    min-height: 350px;
  }

  .card-container {
    gap: 1rem;
  }

  .service-card {
    padding: 1.25rem;
  }
}

/* 대형 화면 최적화 */
@media (min-width: 1400px) {
  .hero-content {
    max-width: 900px;
  }

  .card-container {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
