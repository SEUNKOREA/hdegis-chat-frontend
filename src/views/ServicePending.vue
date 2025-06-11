<template>
  <div class="page">
    <h1>서비스 준비 중입니다.</h1>
    <p>해당 서비스는 곧 제공될 예정입니다.</p>

    <GoHomeButton />
  </div>
</template>

<script setup>
import GoHomeButton from '@/components/GoHomeButton.vue'
</script>

<style scoped>
.page {
  padding: 3rem 2rem;
  text-align: center;
  color: var(--color-text);
}
</style>
