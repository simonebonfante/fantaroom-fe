<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import socket, { notify } from '@/services/socket.service'
import {
  getActiveSession,
  launchPlayer as apiLaunchPlayer,
  placeBid as apiPlaceBid,
  declareWinner as apiDeclareWinner,
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

enum PlayerRole {
  P = 'P',
  D = 'D',
  M = 'M',
  A = 'A',
}

const userStore = useUserStore()
const launchedPlayer = ref<Player>()
const loadingLaunch = ref(false)
const isActiveSession = ref(false)
const lastBid = ref<LastBid>()
const bidPrice = ref<number | null>(null)
const loadingWinner = ref(false)
const playerRole = ref<PlayerRole | null>(null)

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
    if (!playerRole.value) {
      notify('Seleziona un ruolo', 'error')
      return
    }
    await apiLaunchPlayer(playerRole.value)
  } catch (e) {
    console.error('Errore lancio giocatore', e)
    notify(`Errore lancio giocatore: ${e}`, 'error')
  } finally {
    loadingLaunch.value = false
  }
}

async function declareWinner() {
  loadingWinner.value = true
  try {
    await apiDeclareWinner()
  } catch (e) {
    console.error('Errore dichiarazione vincitore', e);
    notify(`Errore dichiarazione vincitore: ${e}`, 'error')
  } finally {
    loadingWinner.value = false
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

  socket.on('winner-declared', ({ winnerName, price }) => {
    notify(`🏆 Vincitore: ${winnerName} – €${price}`, 'success')
    setTimeout(() => {
      launchedPlayer.value = undefined
      isActiveSession.value = false
      lastBid.value = undefined
      bidPrice.value = null
    }, 3000)
  })
})

onBeforeUnmount(() => {
  socket.off('new-session')
  socket.off('new-bid')
  socket.off('winner-declared')
})
</script>

<template>
  <div class="space-y-2">
    <h3 v-if="!isActiveSession" class="text-xl font-semibold text-white">Nessuna asta in corso</h3>
    <h3 v-else class="text-xl font-semibold text-white">Asta in corso</h3>

    <!-- Card con le informazioni del giocatore -->
    <div
      v-if="launchedPlayer"
      class="bg-gray-800 text-white rounded-lg shadow-lg p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 w-full"
    >
      <!-- Immagine giocatore -->
      <img
        :src="launchedPlayer.imageUrl"
        :alt="`Foto ${launchedPlayer.name}`"
        class="w-32 h-32 rounded-full object-cover shadow-md"
      />

      <div class="flex-1">
        <h2 class="text-2xl font-bold mb-2">{{ launchedPlayer.name }}</h2>
        <p class="text-lg mb-1">
          <span class="font-medium">Ruolo:</span> {{ launchedPlayer.role }}
        </p>
        <p class="text-lg mb-1">
          <span class="font-medium">Squadra:</span> {{ launchedPlayer.team }}
        </p>
        <p class="text-lg">
          <span class="font-medium">Valore iniziale:</span> €{{ launchedPlayer.value }}
        </p>
      </div>

      <!-- Prezzo corrente -->
      <div class="text-center md:text-right">
        <p class="text-xl font-semibold text-yellow-400">Prezzo attuale</p>
        <p class="text-3xl font-bold text-yellow-400">€{{ launchedPlayer.activePrice }}</p>
      </div>
    </div>

    <p v-if="lastBid" class="text-yellow-400 font-medium mt-8">
      Ultima offerta di: {{ lastBid.user.name }} – €{{ lastBid.price }}
    </p>
    
    <div v-if="isActiveSession" class="flex items-center justify-center space-x-2 mt-4">
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
    

    <div v-if="userStore.isAdmin && !isActiveSession" class="flex items-center justify-center space-x-2 mt-4">
      <div>
        <select v-model="playerRole" class="bg-white text-gray-800 px-2 py-1 rounded">
          <option value="P">P</option>
          <option value="D">D</option>
          <option value="M">M</option>
          <option value="A">A</option>
        </select>
      </div>
      <button
        @click="launchPlayer"
        :disabled="loadingLaunch"
        class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded"
      >
        Lancia giocatore
      </button>
    </div>

    <button
      v-if="userStore.isAdmin && isActiveSession"
      @click="declareWinner"
      :disabled="loadingWinner"
      class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded"
    >
      Dichiara Vincitore
    </button>
  </div>
</template> 