<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ethers } from "ethers";
import { store } from "../store/index"
import { connect, factoryAddress } from "../lib/connect";
import moment from 'moment';

defineProps<{
  msg: string
}>()

declare var window: any
const address = ref('');
const balance = ref('');
const blockTime = ref('');

onMounted(async () => {
  console.log("mount")
  await walletConnect();
})

const walletConnect = async () => {
  const signer = await connect();
  const factory = new ethers.Contract(factoryAddress(), store.factoryABI, signer);
  const nftAddress = await factory.getNftByProductId(1);
  const nft = new ethers.Contract(nftAddress, store.erc721ABI, signer);
  store.blockTime = await nft.getBlockTime();
  console.log(moment.unix(store.blockTime).add(2, "day").unix());
}
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>
      You’ve successfully created a project with
      <a target="_blank" href="https://vitejs.dev/">Vite</a> +
      <a target="_blank" href="https://vuejs.org/">Vue 3</a>.
    </h3>
    <button v-if="store.address == ''" @click=walletConnect>wallet connect</button>
    <h3 v-else>
      address : {{store.address}} <br />
      balance : {{store.balance}}
    </h3>
    <h3>This Block Time : {{moment.unix(store.blockTime).format("YYYY. MM. DD HH:mm")}}</h3>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
