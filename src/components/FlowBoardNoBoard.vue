<script setup lang="ts">
import { ref } from 'vue';
import type { BoardData } from '@/data/deserialize';
import FlowBoardDialogImportBoard from './FlowBoardDialogImportBoard.vue';

const emit = defineEmits<{
  (e: 'import-board', value: BoardData): void,
}>();
const openImportBoardDialog = ref(true);

function importBoard(data: BoardData) {
  emit('import-board', data);
  openImportBoardDialog.value = false;
}

</script>

<template>
  <div class="no-board-container">
    <div class="no-board-card">
      <h1>Let's Get Started!</h1>
      <p>
        It looks like you don't have any boards saved yet. To get started,
        please import board data from file.
      </p>

      <FlowBoardDialogImportBoard
        @update:save="importBoard"
        @update:cancel="openImportBoardDialog = false"
        :open="openImportBoardDialog" >
        <template #trigger >
          <button
            type="button"
            @click.prevent="openImportBoardDialog = true"
            class="no-board-import-btn" >
            Import Data
          </button>
        </template>
      </FlowBoardDialogImportBoard>

    </div>
  </div>
</template>

<style scoped>
.no-board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.no-board-card {
  display: block;
  max-width: 480px;
  padding: 1.5rem .75rem;
  background-color: var(--color-background);
  text-align: center;
}

h1, p {
  margin-bottom: .75rem;
}

.no-board-import-btn {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  text-wrap: nowrap;
  color: var(--ff-c-green);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  padding: .375rem .75rem;
  margin-right: .375rem;
  margin-bottom: .375rem;
  border-radius: 4px;
  cursor: pointer;
}

</style>