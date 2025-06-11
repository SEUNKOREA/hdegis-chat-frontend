<template>
  <div class="document-filter">
    <!-- 필터 칩 (닫힌 상태) -->
    <div
      v-if="!isExpanded"
      class="filter-chip"
      @click="toggleFilter"
      :class="{ 'has-selection': hasSelectedFilters }"
    >
      <span class="chip-icon">📁</span>
      <span class="chip-text">
        {{ hasSelectedFilters ? getSelectedText() : '문서 필터' }}
      </span>
      <span class="chip-count" v-if="selectedCount > 0">{{ selectedCount }}</span>
      <span class="chip-arrow">▼</span>
    </div>

    <!-- 확장된 필터 패널 -->
    <div v-if="isExpanded" class="filter-panel">
      <!-- 헤더 -->
      <div class="filter-header">
        <div class="header-left">
          <span class="filter-icon">📁</span>
          <h3 class="filter-title">문서 필터 선택</h3>
        </div>
        <div class="header-right">
          <button class="clear-button" @click="clearAllFilters" v-if="hasSelectedFilters">
            전체 해제
          </button>
          <button class="close-button" @click="toggleFilter">
            <span class="close-icon">✕</span>
          </button>
        </div>
      </div>

      <!-- 필터 트리 -->
      <div class="filter-content">
        <!-- 트리 구조 -->
        <div class="tree-container">
          <div class="tree-item" v-for="category in documentCategories" :key="category.name">
            <!-- 1단계: 메인 카테고리 -->
            <div class="tree-node level-1" @click="toggleCategory(category)">
              <div class="node-content">
                <span class="expand-icon" :class="{ expanded: category.expanded }">
                  {{ category.children?.length > 0 ? '▶' : '' }}
                </span>
                <label class="node-label">
                  <input
                    type="checkbox"
                    :checked="isCategoryFullySelected(category)"
                    :indeterminate.prop="isCategoryPartiallySelected(category)"
                    @change="toggleCategorySelection(category, $event)"
                    @click.stop
                  />
                  <span class="label-text">{{ category.name }}</span>
                </label>
              </div>
            </div>

            <!-- 2단계: 하위 카테고리 -->
            <div v-if="category.expanded && category.children" class="tree-children">
              <div
                class="tree-item"
                v-for="subCategory in category.children"
                :key="subCategory.name"
              >
                <div class="tree-node level-2" @click="toggleSubCategory(subCategory)">
                  <div class="node-content">
                    <span class="expand-icon" :class="{ expanded: subCategory.expanded }">
                      {{ subCategory.children?.length > 0 ? '▶' : '' }}
                    </span>
                    <label class="node-label">
                      <input
                        type="checkbox"
                        :checked="isSubCategoryFullySelected(category, subCategory)"
                        :indeterminate.prop="isSubCategoryPartiallySelected(category, subCategory)"
                        @change="toggleSubCategorySelection(category, subCategory, $event)"
                        @click.stop
                      />
                      <span class="label-text">{{ subCategory.name }}</span>
                    </label>
                  </div>
                </div>

                <!-- 3단계: 세부 카테고리 -->
                <div v-if="subCategory.expanded && subCategory.children" class="tree-children">
                  <div v-for="detail in subCategory.children" :key="detail.name" class="tree-item">
                    <div class="tree-node level-3">
                      <div class="node-content">
                        <span class="expand-icon"></span>
                        <label class="node-label">
                          <input
                            type="checkbox"
                            :checked="isDetailSelected(category, subCategory, detail)"
                            @change="toggleDetailSelection(category, subCategory, detail, $event)"
                          />
                          <span class="label-text">{{ detail.name }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <div class="filter-footer">
        <div class="filter-actions">
          <button class="apply-button" @click="applyFilters">
            <span class="button-icon">✓</span>
            적용하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'filter-change'])

// 반응형 데이터
const isExpanded = ref(false)
const selectedFilters = ref([...props.modelValue])

// 문서 카테고리 데이터
const documentCategories = ref([
  {
    name: '1. International Standards',
    expanded: true, // 기본으로 펼쳐진 상태
    children: [
      { name: 'IEC', expanded: false },
      { name: 'IEEE', expanded: false },
    ],
  },
  {
    name: '2. Type Test Reports',
    expanded: true, // 기본으로 펼쳐진 상태
    children: [
      {
        name: '145SP-3',
        expanded: false,
        children: [{ name: '145 kV 40 kA MS (2017)' }],
      },
      {
        name: '300SR',
        expanded: false,
        children: [{ name: '245 kV 50 kA MS (2020)' }, { name: '245 kV 63 kA MS (2024)' }],
      },
    ],
  },
  {
    name: '3. Customer Standard Specifications',
    expanded: true, // 기본으로 펼쳐진 상태
    children: [
      {
        name: 'Australia',
        expanded: false,
        children: [{ name: 'Endeavour Energy' }],
      },
      {
        name: 'Oman',
        expanded: false,
        children: [{ name: 'OETC' }],
      },
      {
        name: 'Saudi Arabia',
        expanded: false,
        children: [{ name: 'SEC' }],
      },
      {
        name: 'Spain',
        expanded: false,
        children: [{ name: 'Iberdrola' }, { name: 'REE' }],
      },
    ],
  },
])

// 계산된 속성
const hasSelectedFilters = computed(() => {
  return selectedFilters.value.length > 0
})

const selectedCount = computed(() => {
  return selectedFilters.value.length
})

// 유틸리티 함수들
function getFilterPath(category, subCategory = null, detail = null) {
  let path = category.name
  if (subCategory) path += `/${subCategory.name}`
  if (detail) path += `/${detail.name}`
  return path
}

function getAllLeafPaths(category, subCategory = null) {
  const paths = []

  if (subCategory) {
    // 특정 서브카테고리의 모든 리프 경로
    if (subCategory.children) {
      subCategory.children.forEach((detail) => {
        paths.push(getFilterPath(category, subCategory, detail))
      })
    } else {
      paths.push(getFilterPath(category, subCategory))
    }
  } else {
    // 전체 카테고리의 모든 리프 경로
    if (category.children) {
      category.children.forEach((child) => {
        if (child.children) {
          child.children.forEach((detail) => {
            paths.push(getFilterPath(category, child, detail))
          })
        } else {
          paths.push(getFilterPath(category, child))
        }
      })
    }
  }

  return paths
}

// 선택 상태 확인 함수들
function isCategoryFullySelected(category) {
  const allPaths = getAllLeafPaths(category)
  return allPaths.length > 0 && allPaths.every((path) => selectedFilters.value.includes(path))
}

function isCategoryPartiallySelected(category) {
  const allPaths = getAllLeafPaths(category)
  const selectedPaths = allPaths.filter((path) => selectedFilters.value.includes(path))
  return selectedPaths.length > 0 && selectedPaths.length < allPaths.length
}

function isSubCategoryFullySelected(category, subCategory) {
  const allPaths = getAllLeafPaths(category, subCategory)
  return allPaths.length > 0 && allPaths.every((path) => selectedFilters.value.includes(path))
}

function isSubCategoryPartiallySelected(category, subCategory) {
  const allPaths = getAllLeafPaths(category, subCategory)
  const selectedPaths = allPaths.filter((path) => selectedFilters.value.includes(path))
  return selectedPaths.length > 0 && selectedPaths.length < allPaths.length
}

function isDetailSelected(category, subCategory, detail) {
  const path = getFilterPath(category, subCategory, detail)
  return selectedFilters.value.includes(path)
}

// 개수 계산 함수들 제거됨

// 선택/해제 함수들
function toggleCategorySelection(category, event) {
  const isChecked = event.target.checked
  const allPaths = getAllLeafPaths(category)

  if (isChecked) {
    // 카테고리 전체 선택
    allPaths.forEach((path) => {
      if (!selectedFilters.value.includes(path)) {
        selectedFilters.value.push(path)
      }
    })
  } else {
    // 카테고리 전체 해제
    allPaths.forEach((path) => {
      const index = selectedFilters.value.indexOf(path)
      if (index > -1) {
        selectedFilters.value.splice(index, 1)
      }
    })
  }
}

function toggleSubCategorySelection(category, subCategory, event) {
  const isChecked = event.target.checked
  const allPaths = getAllLeafPaths(category, subCategory)

  if (isChecked) {
    // 서브카테고리 전체 선택
    allPaths.forEach((path) => {
      if (!selectedFilters.value.includes(path)) {
        selectedFilters.value.push(path)
      }
    })
  } else {
    // 서브카테고리 전체 해제
    allPaths.forEach((path) => {
      const index = selectedFilters.value.indexOf(path)
      if (index > -1) {
        selectedFilters.value.splice(index, 1)
      }
    })
  }

  // 상위 카테고리 상태 자동 업데이트는 반응형으로 처리됨
}

function toggleDetailSelection(category, subCategory, detail, event) {
  const isChecked = event.target.checked
  const path = getFilterPath(category, subCategory, detail)

  if (isChecked) {
    // 세부 항목 선택
    if (!selectedFilters.value.includes(path)) {
      selectedFilters.value.push(path)
    }
  } else {
    // 세부 항목 해제
    const index = selectedFilters.value.indexOf(path)
    if (index > -1) {
      selectedFilters.value.splice(index, 1)
    }
  }

  // 상위 카테고리들의 상태는 반응형으로 자동 업데이트됨
}

// 기타 함수들
function toggleFilter() {
  isExpanded.value = !isExpanded.value
}

function toggleCategory(category) {
  category.expanded = !category.expanded
}

function toggleSubCategory(subCategory) {
  subCategory.expanded = !subCategory.expanded
}

function getSelectedText() {
  if (selectedFilters.value.length === 1) {
    const filter = selectedFilters.value[0]
    const parts = filter.split('/')
    return parts[parts.length - 1]
  }
  return `${selectedFilters.value.length}개 카테고리`
}

function clearAllFilters() {
  selectedFilters.value = []
}

function applyFilters() {
  emit('update:modelValue', [...selectedFilters.value])
  emit('filter-change', [...selectedFilters.value])
  isExpanded.value = false
}

// 초기값 설정
watch(
  () => props.modelValue,
  (newValue) => {
    selectedFilters.value = [...newValue]
  },
  { immediate: true },
)
</script>

<style scoped>
.document-filter {
  margin-bottom: 1rem;
}

/* 필터 칩 (닫힌 상태) */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  user-select: none;
}

.filter-chip:hover {
  background: var(--color-background-mute);
  border-color: #3498db;
}

.filter-chip.has-selection {
  background: #e3f2fd;
  border-color: #3498db;
  color: #1976d2;
}

.chip-icon {
  font-size: 1rem;
}

.chip-text {
  font-weight: 500;
}

.chip-count {
  background: #3498db;
  color: white;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.chip-arrow {
  font-size: 0.8rem;
  opacity: 0.7;
  transition: transform 0.2s ease;
}

/* 확장된 필터 패널 */
.filter-panel {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 헤더 */
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-icon {
  font-size: 1.2rem;
}

.filter-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.clear-button {
  background: none;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background: #e74c3c;
  color: white;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;
  color: var(--color-text);
  opacity: 0.7;
}

.close-button:hover {
  background: var(--color-background-mute);
  opacity: 1;
}

.close-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

/* 필터 내용 */
.filter-content {
  max-height: 400px;
  overflow-y: auto;
}

/* 검색 섹션 */
.search-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 1rem;
  opacity: 0.5;
}

.search-input input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--color-background);
  color: var(--color-text);
}

.search-input input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

/* 트리 구조 */
.tree-container {
  padding: 0.5rem 0;
}

.tree-item {
  margin-bottom: 0.25rem;
}

.tree-node {
  cursor: pointer;
  transition: background 0.2s ease;
}

.tree-node:hover {
  background: var(--color-background-soft);
}

.node-content {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  gap: 0.5rem;
}

.level-1 .node-content {
  padding-left: 1.5rem;
}

.level-2 .node-content {
  padding-left: 2.5rem;
}

.level-3 .node-content {
  padding-left: 3.5rem;
}

.expand-icon {
  font-size: 0.8rem;
  width: 16px;
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.node-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  cursor: pointer;
  font-size: 0.9rem;
}

.node-label input[type='checkbox'] {
  margin: 0;
  cursor: pointer;
}

.label-text {
  font-weight: 500;
  color: var(--color-text);
}

.tree-children {
  border-left: 1px solid var(--color-border);
  margin-left: 2rem;
}

/* 푸터 */
.filter-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
}

/* 검색 섹션과 개수 표시 제거됨 */

.apply-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3498db;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-button:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

.button-icon {
  font-size: 0.9rem;
}

/* 스크롤바 스타일링 */
.filter-content::-webkit-scrollbar {
  width: 6px;
}

.filter-content::-webkit-scrollbar-track {
  background: var(--color-background-soft);
}

.filter-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.filter-content::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

/* 반응형 */
@media (max-width: 768px) {
  .filter-panel {
    margin: 0 -1rem;
    border-radius: 8px;
  }

  .filter-content {
    max-height: 300px;
  }

  .filter-footer {
    padding: 1.25rem 1.5rem;
  }

  .apply-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
