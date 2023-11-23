<script setup lang="ts">
import { ref } from 'vue';
import { ethers } from "ethers";
import { store } from "../store/index"
import moment from 'moment';



</script>

<template>
  <div class="greetings">
    <h1 class="green">Setting</h1>
    <h3>This Block Time : </h3>
  </div>
</template>

<style scoped>
.greetings {
    width: 100%;
}
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
</style>
