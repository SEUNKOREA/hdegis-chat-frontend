<template>
  <button class="home-button" @click="goHome">홈으로 돌아가기</button>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.home-button {
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background-color: var(--color-border-hover);
  color: var(--color-text);
  transition: background-color 0.2s ease;
}

.home-button:hover {
  background-color: var(--color-heading);
  color: white;
}
</style>
