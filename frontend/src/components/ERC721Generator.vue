<script setup lang="ts">
import { ref } from 'vue';
import { BigNumber, ethers } from "ethers";
import { store } from "../store/index"
import { reactive } from 'vue';
import moment from 'moment';
import DatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { connect, factoryAddress } from "../lib/connect";

const createData = reactive({
    name: '' as string,
    symbol: '' as string,
    oc: '' as string,
    cap: 0 as number,
    wlParam: {
        active: false as boolean,
        cost: '0' as string | BigNumber,
        cap: 0 as number,
        startTime: 0 as any,
        endTime: 0 as any
    },
    pubParam: {
        active: false as boolean,
        cost: '0' as string | BigNumber,
        cap: 0 as number,
        startTime: 0 as any,
        endTime: 0 as any
    }
})
declare var window: any
const create = async () => {
    const signer = await connect();
    const factory = new ethers.Contract(factoryAddress(), store.factoryABI, signer);
    if (createData.wlParam.active) {
        createData.wlParam.cost = ethers.utils.parseEther((createData.wlParam.cost).toString());
        createData.wlParam.startTime = moment(createData.wlParam.startTime).unix();
        createData.wlParam.endTime = moment(createData.wlParam.endTime).unix();
    }

    if (createData.pubParam.active) {
        createData.pubParam.cost = ethers.utils.parseEther((createData.pubParam.cost).toString());
        createData.pubParam.startTime = moment(createData.pubParam.startTime).unix();
        createData.pubParam.endTime = moment(createData.pubParam.endTime).unix();
    }

    const aa = await factory.create(createData.name, createData.symbol, createData.oc, createData.cap, createData.wlParam, createData.pubParam);
    console.log(aa);
    await connect();
}

</script>

<template>
  <div class="greetings">
    <h1 class="green">ERC721 Generator</h1>
  </div>

  <div class="greetings">

    <div class="row">
        <div class="row-key">
            NFT name
        </div>
        <div class="row-val">
            <input v-model="createData.name"/>
        </div>
    </div>
    
    <div class="row">
        <div class="row-key">
            NFT symbol
        </div>
        <div class="row-val">
            <input v-model="createData.symbol"/>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            OG Collection
        </div>
        <div class="row-val">
            <input v-model="createData.oc"/>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            Cap(Max Supply)
        </div>
        <div class="row-val">
            <input v-model="createData.cap"/>
        </div>
    </div>

    <hr />
    <h3>White List Sale</h3>
    <div class="row">
        <div class="row-key">
            WL Active
        </div>
        <div class="row-val">
            <select 
                class="w100 active_select"
                v-model="createData.wlParam.active"
            >
                <option value="true">on</option>
                <option selected value="false">off</option>
            </select>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            Cost
        </div>
        <div class="row-val">
            <input v-model="createData.wlParam.cost"/>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            cap(WL Supply)
        </div>
        <div class="row-val">
            <input v-model="createData.wlParam.cap"/>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            startTime
        </div>
        <div class="row-val">
            <DatePicker v-model="createData.wlParam.startTime"/>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            endTime
        </div>
        <div class="row-val">
            <DatePicker v-model="createData.wlParam.endTime"/>
        </div>
    </div>

    <hr />
    <h3>Public Sale</h3>
    <div class="row">
        <div class="row-key">
            PUB Active
        </div>
        <div class="row-val">
            <select 
                class="w100 active_select"
                v-model="createData.pubParam.active"
            >
                <option value="true">on</option>
                <option selected value="false">off</option>
            </select>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            Cost
        </div>
        <div class="row-val">
            <input v-model="createData.pubParam.cost"/>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            cap(PUB Supply)
        </div>
        <div class="row-val">
            <input v-model="createData.pubParam.cap"/>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            startTime
        </div>
        <div class="row-val">
            <DatePicker v-model="createData.pubParam.startTime"/>
        </div>
    </div>

    <div class="row">
        <div class="row-key">
            endTime
        </div>
        <div class="row-val">
            <DatePicker v-model="createData.pubParam.endTime"/>
        </div>
    </div>

    <div class="row">
        <button 
            class="btn_create"
            @click="create"
        >
            Create
        </button>
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
    font-size: 19px;
    margin-top: 0.6%;
    margin-bottom: 0.6%;
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
</style>
