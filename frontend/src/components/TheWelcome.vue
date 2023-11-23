<script setup lang="ts">
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
import SupportIcon from './icons/IconSupport.vue'
import { store } from '../store/index'
</script>

<template>
  <WelcomeItem @click="store.view = 1">
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>ERC721 Generator</template>
  </WelcomeItem>

  <WelcomeItem @click="store.view = 2">
    <template #icon>
      <ToolingIcon />
    </template>
    <template #heading>minting</template>
  </WelcomeItem>

  <WelcomeItem @click="store.view = 3">
    <template #icon>
      <EcosystemIcon />
    </template>
    <template #heading>refund</template>
  </WelcomeItem>

  <WelcomeItem @click="store.view = 4">
    <template #icon>
      <CommunityIcon />
    </template>
    <template #heading>withdraw</template>
  </WelcomeItem>

  <WelcomeItem @click="store.view = 5">
    <template #icon>
      <SupportIcon />
    </template>
    <template #heading>Setting</template>
  </WelcomeItem>
</template>
