<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
import ERC721GeneratorVue from './components/ERC721Generator.vue';
import Minting from './components/Minting.vue'
import Refund from './components/Refund.vue'
import Withdraw from './components/Withdraw.vue'
import Setting from './components/Setting.vue'
import { store } from './store/index'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="OG Generator Test" />
    </div>
  </header>

  <main>
    <TheWelcome />
  </main>

  <div
   class="w-100"
  >
    <ERC721GeneratorVue v-if="store.view == 1" />
    <Minting v-if="store.view == 2" />
    <Refund v-if="store.view == 3" />
    <Withdraw v-if="store.view == 4" />
    <Setting v-if="store.view == 5" />
  </div>

</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
.w-100 {
  width: 100%;
  grid-column: 1 / 3;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
