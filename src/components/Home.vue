<script setup lang="ts">
import { connectSocket } from '@/services/socket.service'
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'
import Room from './Room.vue'

const userStore = useUserStore()

onMounted(() => {
  connectSocket()
})
</script>

<template>
  <div class="text-center space-y-3 text-white">
    <div class="fixed top-0 left-0 w-full bg-indigo-800 py-2 z-50 shadow-md">
      <h2 class="text-2xl font-bold text-white">Benvenuto, {{ userStore.nickname }}!</h2>
    </div>
    <div class="h-6"></div>
    <Room />
  </div>
</template>
