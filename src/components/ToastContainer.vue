<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
const toastStore = useToastStore()
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <transition-group name="toast" tag="div">
      <div
        v-for="t in toastStore.toasts"
        :key="t.id"
        :class="[
          'px-4 py-2 rounded shadow text-white',
          t.type === 'success' && 'bg-green-600',
          t.type === 'error' && 'bg-red-600',
          t.type === 'info' && 'bg-blue-600'
        ]"
      >
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 