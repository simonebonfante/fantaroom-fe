<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { loginOrCreateUser } from '@/services/apis/apis'
import router from '@/router'

const nickname = ref('')
const userStore = useUserStore()

const handleLogin = async () => {
  if (!nickname.value.trim()) return

  try {
    const user = await loginOrCreateUser(nickname.value.trim())
    userStore.setUser(user.id, user.name, user.isAdmin)
    router.push('/')
  } catch (err) {
    console.error('Errore nel login:', err)
    alert('Errore durante il login. Riprova.')
  }
}
</script>

<template>
  <div
    class="w-full max-w-sm md:max-w-xl lg:max-w-2xl xl:max-w-3xl bg-white/20 backdrop-blur-md rounded-xl shadow-xl p-8 space-y-8 mx-auto"
  >
    <h2 class="text-2xl font-bold text-center text-white">Inserisci il tuo nickname</h2>

    <input
      v-model="nickname"
      class="w-full py-3 px-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      placeholder="Es. bomber_99"
    />

    <button
      class="w-full py-3 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 text-white font-semibold shadow-md transform active:scale-95 transition-transform duration-150 hover:brightness-110"
      @click="handleLogin"
    >
      Entra
    </button>
  </div>
</template>
