<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import socket, { notify } from '@/services/socket.service'
import {
  getActiveSession,
  launchPlayer as apiLaunchPlayer,
  placeBid as apiPlaceBid,
  declareWinner as apiDeclareWinner,
  skipSession as apiSkipSession,
  getUsers as apiGetUsers,
  assignSession as apiAssignSession
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
  C = 'C',
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
const users = ref<User[]>([]);
const userWinner = ref<User>();
const assignPrice = ref<number | null>(null)

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
    console.log('Nessuna sessione attiva', e)
  }
}

async function fetchUsers() {
  try {
    const data = await apiGetUsers();
    users.value = data.map((user: User) => ({ id: user.id, name: user.name }));
  } catch (e) {
    console.error('Errore fetch users', e)
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
  } catch (e: {response: {data: {error: string}}}) {
    console.error('Errore invio bid', e)
    notify(e?.response?.data?.error ? `Errore invio offerta: ${e.response.data.error}` : 'Errore invio offerta', 'error')
  }
}

async function skipSession() {
  try {
    await apiSkipSession()
  } catch (e) {
    console.error('Errore skip session', e)
    notify(`Errore skip session: ${e}`, 'error')
  }
}

async function submitAssign() {
  if (!userWinner.value || !assignPrice.value) {
    notify('Seleziona un vincitore e un prezzo', 'error')
    return;
  }
  try {
    await apiAssignSession(userWinner.value.id, assignPrice.value)
    assignPrice.value = null
    userWinner.value = undefined
  } catch (e) {
    console.error('Errore assegno vincitore', e)
    notify(`Errore assegno vincitore: ${e}`, 'error')
  }
}

onMounted(() => {
  fetchActivePlayer()
  fetchUsers();

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

  socket.on('session-skipped', () => {
    notify('Sessione Skippata', 'info')
    setTimeout(() => {
      launchedPlayer.value = undefined
      isActiveSession.value = false
    }, 1000)
  })
})

onBeforeUnmount(() => {
  socket.off('new-session')
  socket.off('new-bid')
  socket.off('winner-declared')
  socket.off('session-skipped')
})
</script>

<template>
  <div class="space-y-1">
    <h3 v-if="!isActiveSession" class="text-xl font-semibold text-white">Nessuna asta in corso</h3>
    <h3 v-else class="text-xl font-semibold text-white">Asta in corso</h3>

    <!-- Card con le informazioni del giocatore -->
    <div
      v-if="launchedPlayer"
      class="
        bg-gray-800 text-white rounded-lg shadow-lg
        /* spaziatura più generosa da md in poi */
        p-6 md:p-10
        /* layout */
        flex flex-col md:flex-row items-center
        space-y-4 md:space-y-0 md:space-x-10
        /* larghezza */
        w-full              /* 100 % su mobile */
        md:max-w-4xl        /* card larga (≈ 64 rem) su desktop */
        mx-auto             /* centrata orizzontalmente */
      "
    >
      <!-- Immagine giocatore -->
      <img
        :src="launchedPlayer.imageUrl"
        :alt="`Foto ${launchedPlayer.name}`"
        class="
          w-[60%]
          w-[60%]
          md:w-56
        "
      />

      <div class="flex-1">
        <h2 class="text-2xl md:text-4xl font-bold mb-2">{{ launchedPlayer.name }}</h2>

        <p class="text-lg md:text-2xl mb-1">
          <span class="font-medium">Ruolo:</span> {{ launchedPlayer.role }}
        </p>
        <p class="text-lg md:text-2xl mb-1">
          <span class="font-medium">Squadra:</span> {{ launchedPlayer.team }}
        </p>
        <p class="text-lg md:text-2xl">
          <span class="font-medium">Valore iniziale:</span> €{{ launchedPlayer.value }}
        </p>
      </div>

      <!-- Prezzo corrente -->
      <div class="text-center md:text-right">
        <p class="text-xl md:text-3xl font-semibold text-yellow-400">Prezzo attuale</p>
        <p class="text-3xl md:text-6xl font-bold text-yellow-400">
          €{{ launchedPlayer.activePrice }}
        </p>
      </div>
    </div>

    <p v-if="lastBid" class="text-yellow-400 font-medium mt-8 space-y-1">
      Ultima offerta di: {{ lastBid.user.name }} – €{{ lastBid.price }}
    </p>
    
    <div v-if="isActiveSession" class="flex items-center justify-center space-x-2 mt-4 space-y-1">
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
        class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50 space-y-1"
      >
        Offri
      </button>
    </div>

    <div v-if="isActiveSession && userStore.isAdmin && users.length > 0" class="flex items-center justify-center space-x-2 mt-4 space-y-1">
      <div>
        <select v-model="userWinner" class="bg-white text-gray-800 px-2 py-1 rounded">
          <option v-for="user in users" :key="user.id" :value="user">{{ user.name }}</option>
        </select>
      </div>
      <input
        v-model.number="assignPrice"
        type="number"
        min="1"
        class="w-24 px-2 py-1 rounded bg-white text-gray-800 placeholder-gray-500
               focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Prezzo"
      />
      <button
        @click="submitAssign"
        :disabled="!assignPrice || !userWinner"
        class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50 space-y-1"
      >
        Assegna
      </button>
    </div>
    

    <div v-if="userStore.isAdmin && !isActiveSession" class="flex items-center justify-center space-x-2 mt-4">
      <div>
        <select v-model="playerRole" class="bg-white text-gray-800 px-2 py-1 rounded">
          <option value="P">P</option>
          <option value="D">D</option>
          <option value="C">C</option>
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
      v-if="userStore.isAdmin && isActiveSession && launchedPlayer?.activePrice"
      @click="declareWinner"
      :disabled="loadingWinner"
      class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded"
    >
      Dichiara Vincitore
    </button>

    <button
      v-if="userStore.isAdmin && isActiveSession && !launchedPlayer?.activePrice"
      @click="skipSession"
      class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded"
    >
      Skip
    </button>
  </div>
</template> 