<script setup lang="ts">
import { inject } from 'vue';
import { type ActionType } from '@/data/boardSampleData';
import { actionTypesKey } from '@/data/providerKeys';

const actionTypes = inject<ActionType[]>(actionTypesKey) || [];
</script>

<template>
  <div class="action-types">
    <span v-for="(action, i) in actionTypes" :key="i">
      <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" :fill="action.color"/>
      </svg>
      &nbsp;{{action.name}}
    </span>
  </div>
</template>

<style scoped>
.action-types {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  padding: 0 60px 0 240px;
}

.action-types span {
  flex: 2 1 20%;
  font-size: 1.5rem;
  text-align: center;
}

.action-types svg {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}
</style>