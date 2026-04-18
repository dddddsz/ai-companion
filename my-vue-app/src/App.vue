<script setup>
import { ref } from 'vue'
import Page from './components/Page.vue'
import MessageController from './components/MessageController.vue'
import PeriodicReminder from './components/PeriodicReminder.vue';
</script>

<template>
  <Page />
  <MessageController />
  <PeriodicReminder />
</template>
