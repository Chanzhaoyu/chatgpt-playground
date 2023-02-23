<template>
  <div>
    <input v-model="value" />
    <p>{{ message }}</p>
    <button @click="handleStart">Start</button>
    <button @click="handleClick">Close</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const loading = ref(false);

const message = ref('');
const value = ref('你是谁');

let source: EventSource;

function handleStart() {
  if (loading.value || !value.value || value.value.trim() === '') return;

  source?.close();

  loading.value = true;

  const BASE_URL = new URL('http://127.0.0.1:3002/events');
  BASE_URL.searchParams.append('prompt', value.value);
  const url = BASE_URL.toString();

  source = new EventSource(url);

  source.addEventListener('message', (event) => {
    message.value = event.data;
  });

  source.addEventListener('error', () => {
    window.console.log('error');
    loading.value = false;
  });

  source.addEventListener('open', () => {
    message.value = 'open';
  });

  source.addEventListener('close', () => {
    window.console.log('close');
    loading.value = false;
  });

  source.addEventListener('ping', () => {
    window.console.log('ping');
  });

  source.addEventListener('pong', () => {
    window.console.log('pong');
  });

  source.addEventListener('start', () => {
    window.console.log('start');
  });

  source.addEventListener('end', () => {
    loading.value = false;
    window.console.log('end');
  });

  source.addEventListener('cancel', () => {
    loading.value = false;
    window.console.log('cancel');
  });

  source.addEventListener('pause', () => {
    window.console.log('pause');
    loading.value = false;
  });

  source.addEventListener('resume', () => {
    window.console.log('resume');
  });
}

function handleClick() {
  source?.close();
}
</script>
