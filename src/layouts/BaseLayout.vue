<script setup lang="ts">
import ToastContainer from '@/components/ToastContainer.vue'
// Nessuna logica per ora
</script>

<template>
  <div
    class="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-700 px-4 pt-6"
  >
    <router-view />
    <ToastContainer />
  </div>
</template> 