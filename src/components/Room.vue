<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import socket, { notify } from '@/services/socket.service'
import {
  getActiveSession,
  launchPlayer as apiLaunchPlayer,
  placeBid as apiPlaceBid,
} from '@/services/apis/apis'

type Player = {
  id: string
  name: string
  role: string
  team: string
  value: number
  imageUrl: string
  activePrice: number
}

type User = {
  id: string
  name: string
}

type LastBid = {
    user: User
    price: number
}

const userStore = useUserStore()
const launchedPlayer = ref<Player>()
const loadingLaunch = ref(false)
const isActiveSession = ref(false)
const lastBid = ref<LastBid>()
const bidPrice = ref<number | null>(null)

async function fetchActivePlayer() {
  try {
    const { session } = await getActiveSession()
    if (session?.player) {
      launchedPlayer.value = { ...session.player, activePrice: session.price };
      isActiveSession.value = true;
      const { user, price } = session.bids[0];
      const { id, name } = user;
      lastBid.value = { user: { id, name }, price };
    }
  } catch (e) {
    console.log('Nessuna sessione attiva')
  }
}

async function launchPlayer() {
  loadingLaunch.value = true
  try {
    await apiLaunchPlayer('P')
  } catch (e) {
    console.error('Errore lancio giocatore', e)
  } finally {
    loadingLaunch.value = false
  }
}

async function submitBid() {
  if (!bidPrice.value) return
  try {
    await apiPlaceBid(userStore.userId, bidPrice.value)
    bidPrice.value = null
  } catch (e: any) {
    console.error('Errore invio bid', e)
    notify(e?.response?.data?.error ? `Errore invio offerta: ${e.response.data.error}` : 'Errore invio offerta', 'error')
  }
}

onMounted(() => {
  fetchActivePlayer()

  socket.on('new-session', async () => {
    notify('Nuova asta iniziata!', 'success');
    fetchActivePlayer();
  })

  socket.on('new-bid', ({ userName, price }) => {
    if (launchedPlayer.value) launchedPlayer.value.activePrice = price
    lastBid.value = { user: { id: userStore.userId, name: userName }, price }
    notify(`Nuova offerta di ${userName} – €${price}`, 'info')
  })
})

onBeforeUnmount(() => {
  socket.off('new-session')
  socket.off('new-bid')
})
</script>

<template>
  <div class="space-y-4">
    <h3 v-if="!isActiveSession" class="text-xl font-semibold text-white">Nessuna asta in corso</h3>
    <h3 v-else class="text-xl font-semibold text-white">Asta in corso</h3>

    <ul class="space-y-2" v-if="launchedPlayer">
      <li class="bg-gray-800 text-white p-2 rounded">
        {{ launchedPlayer?.name }} ({{ launchedPlayer?.role }}) – {{ launchedPlayer?.team }} €{{ launchedPlayer?.activePrice }}
      </li>
    </ul>

    <p v-if="lastBid" class="text-yellow-400 font-medium">
      Ultima offerta di: {{ lastBid.user.name }} – €{{ lastBid.price }}
    </p>
    
    <div v-if="isActiveSession" class="flex items-center justify-center space-x-2">
      <input
        v-model.number="bidPrice"
        type="number"
        min="1"
        class="w-24 px-2 py-1 rounded bg-white text-gray-800 placeholder-gray-500
               focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="€"
      />
      <button
        @click="submitBid"
        :disabled="!bidPrice"
        class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50"
      >
        Offri
      </button>
    </div>

    <!-- Pulsante visibile solo all’admin -->
    <button
      v-if="userStore.isAdmin && !isActiveSession"
      @click="launchPlayer"
      :disabled="loadingLaunch"
      class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded"
    >
      Lancia giocatore
    </button>
  </div>
</template> 