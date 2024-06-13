<script setup lang="ts">
import { inject, ref } from 'vue';
import { operationsKey } from '@/components/providerKeys';

const operations = inject(operationsKey, ref([]));
</script>

<template>
  <div class="op-types">
    <span v-for="(op, i) in operations" :key="i">
      <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" :fill="op.color"/>
      </svg>
      &nbsp;{{op.name}}
    </span>
  </div>
</template>

<style scoped>
.op-types {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  padding: 0 60px 0 240px;
}

.op-types span {
  flex: 2 1 20%;
  font-size: 1.5rem;
  text-align: center;
}

.op-types svg {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}
</style>