<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ethers, BigNumber } from "ethers";
import { store } from "../store/index"
import { reactive } from 'vue';
import moment from 'moment';
import DatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { connect, factoryAddress } from "../lib/connect";

onMounted(async () => {
  console.log("mount")
  await getProducts();
})

const totalSupply = ref(0);
const nftList:any = ref([]);

const getProducts = async () => {
    const signer = await connect();
    const factory = new ethers.Contract(factoryAddress(), store.factoryABI, signer);
    totalSupply.value = (await factory.totalSupply()).toNumber();
    const localAry:any = [];
    for (let i = 1; i <= totalSupply.value; i++) {
      const nftAddress = await factory.getNftByProductId(i);
      const nft = new ethers.Contract(nftAddress, store.erc721ABI, signer);
      const pushData = {
        address: nftAddress,
        name: await nft.name(),
        symbol: await nft.symbol(),
        cap: await nft.getCap(),
        wl: await nft.saleConfig("WL"),
        pub: await nft.saleConfig("PUB"),
        timeLock: await nft.getTimeLock(),
        totalSupply: await nft.totalSupply(),
        tokenId: 0,
        refundAddress: '',
      }
      localAry.push(pushData);
    }
    nftList.value = localAry;
}

const refund = async (nftAddress: string) => {
  const signer = await connect();
  const nft = new ethers.Contract(nftAddress, store.erc721ABI, signer);
  const now = moment().unix();
  const nftInfo = nftList.value.filter((item:any) => nftAddress == item.address)[0];
  const refundAddress = nftInfo.refundAddress ? nftInfo.refundAddress : await signer.getAddress();
  try {
    await nft.refund(refundAddress, nftInfo.tokenId);
  } catch (error: any) {
    alert(error.error.data.message);
  }
}

</script>

<template>
  <div class="greetings">
    <h1 class="green">Refund</h1>
  </div>

  <div class="greetings">
    <div class="row">
        totalSupply : {{totalSupply}}
    </div>

    <div 
      v-for="nft in nftList"
      class="row"
    >
        <div class="nft-name">
          {{nft.name}}({{nft.symbol}})
        </div>
        <div class="nft-address">
          {{nft.address}}
        </div>
        <div class="nft-timelock">
          {{moment.unix(nft.timeLock).format("YYYY. MM. DD HH:mm")}}
        </div>
        <div 
          v-if="nft.wl.active"
          class="nft-wl"
        >
          <b>White List Sale</b>
          <div>
            start {{moment.unix(nft.wl.startTime).format("YYYY. MM. DD HH:mm")}}
          </div>
          <div>
            end {{moment.unix(nft.wl.endTime).format("YYYY. MM. DD HH:mm")}}
          </div>
          <div>
            price {{ethers.utils.formatEther(nft.wl.cost)}} ETH
          </div>
          <div>
            supply {{nft.wl.cap}}
          </div>
        </div>
        <div 
          v-if="nft.pub.active"
          class="nft-pub"
        >
          <strong>Public Sale</strong>
          <div>
            start {{moment.unix(nft.pub.startTime).format("YYYY. MM. DD HH:mm")}}
          </div>
          <div>
            end {{moment.unix(nft.pub.endTime).format("YYYY. MM. DD HH:mm")}}
          </div>
          <div>
            price {{ethers.utils.formatEther(nft.pub.cost)}} ETH
          </div>
          <div>
            supply {{nft.pub.cap}}
          </div>
        </div>
        <div class="nft-mint">
          <div class="nft-total-supply">
            totalSupply {{nft.totalSupply}}
          </div>
          <input type="number" v-model="nft.tokenId" placeholder="Token Id"/>
          <input v-model="nft.refundAddress" placeholder="Refund Address"/>
          <button 
            class="btn-mint"
            @click="refund(nft.address)"
          >refund</button>
        </div>
    </div>

  </div>
</template>

<style scoped>
.greetings {
    width: 100%;
}
.row {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    font-size: 19px;
    margin-top: 0.6%;
    margin-bottom: 0.6%;
    text-align: center;
}
.row-key {
    width: 15%;
    align-self: stretch;
}
.row-val {
    width: 85%;
}
.row-val input {
    width: 100%;
    line-height: 1.5;
    padding: 1%;
}
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.w100 {
    width: 100%;
}

.active_select {
    font-size: 20px;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

.btn_create {
    width: 50%;
    background: #00bd7e;
    color: #fff;
    font-size: 30px;
}

.nft-name {
  width: 30%;
  text-align: center;
}

.nft-address {
  width: 40%;
  text-align: center;
}

.nft-timelock {
  width: 30%;
  text-align: center;
}

.nft-wl {
  width: 50%;
}

.nft-pub {
  width: 50%;
}

.nft-mint {
  width: 100%;
  border-bottom: 1px solid #fff;
}

.nft-total-supply{
  width: 33%;
}

.btn-mint{
  background-color: #00bd7e;
  color: #fff;
  padding: 8px 35px;
  border: none;
  border-radius: 2rem;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
}
</style>
