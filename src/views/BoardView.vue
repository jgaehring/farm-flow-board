<script setup lang="ts">
import { validate } from 'uuid';
import { computed, onMounted, provide, ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core'
import { Editable, Switch } from 'radix-vue/namespaced';
import {
  boardInfoKey, boardsKey, cropsKey, dateRangeKey, dateSequenceKey, isDarkKey,
  locationsKey, operationsKey, plantsKey, tasksKey,
} from '@/components/providerKeys';
import { serialize } from '@/data/deserialize';
import type { BoardData } from '@/data/deserialize';
import type { BoardInfo } from '@/data/resources';
import useBoardData from '@/composables/useBoardData';
import FlowBoard from '@/components/FlowBoard.vue';
import FlowBoardOperations from '@/components/FlowBoardOperations.vue';
import FlowBoardMenubar from '@/components/FlowBoardMenubar.vue';
import FlowBoardNoBoard from '@/components/FlowBoardNoBoard.vue';
import LogoType from '@/assets/logotype_color.svg?component';
import IconMoon from '@/assets/radix-icons/moon.svg?component';
import IconPencil2 from '@/assets/radix-icons/pencil-2.svg?component';
import IconSun from '@/assets/radix-icons/sun.svg?component';

const board = useBoardData();

const editableName = ref<string>(board.info.value?.name || '');
function submitBoardName(name: string|undefined) {
  if (board.info.value && typeof name === 'string') {
    const { id, type } = board.info.value;
    board.update({ id, type, name });
  }
}

// Start & end dates used to populate the x-axis & limit selection in date picker.
const dateRange = computed<[Date, Date]>(() => board.date.value.range);
// Array of Date objects for every date within the specified range.
const dateSeq = computed<Date[]>(() => board.date.value.sequence);

const boards = ref<BoardInfo[]>([]);

function selectBoard(id: string) {
  if (!validate(id)) return;
  const info = boards.value.find(b => b.id === id);
  if (info) board.load(info);
  if (info?.name !== editableName.value) {
    editableName.value = info?.name || '';
  }
}

function importBoard(data: BoardData) {
  if (!validate(data.board.id)) return;
  const json = serialize(data);
  sessionStorage.setItem(data.board.id, json);
  boards.value.push(data.board);
  selectBoard(data.board.id);
}

function exportBoard() {
  if (!board.info.value) return;
  const data = {
    board: board.info.value,
    crops: board.crops.value,
    locations: board.locations.value,
    operations: board.operations.value,
    tasks: board.tasks.value,
    plants: board.plants.value,
  };
  const json = serialize(data, null, 2);
  const blob = new Blob([json], { type: 'text/json' });
  const link = document.createElement('a');

  link.download = data.board.name.toLowerCase().replaceAll(/\s+/g, '_') + '.json';
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':');

  const evt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove();
}

const isDark = useDark({
  selector: 'body',
  attribute: 'color-scheme',
  valueDark: 'dark',
  valueLight: 'light',
});
const toggleDark = useToggle(isDark);

onMounted(async () => {
  const all = await board.getAllBoardInfo();
  all.forEach((board: BoardInfo) => { boards.value.push(board); });
  if (all.length > 0) board.load(all[0]);
});

provide(tasksKey, board.tasks);
provide(locationsKey, board.locations);
provide(plantsKey, board.plants);
provide(dateSequenceKey, dateSeq);
provide(dateRangeKey, dateRange);
provide(operationsKey, board.operations);
provide(cropsKey, board.crops);
provide(boardInfoKey, board.info);
provide(boardsKey, boards);
provide(isDarkKey, isDark);

</script>

<template>
  <div class="layout">
    <header>

      <div class="logotype">
        <LogoType/>
      </div>

      <Editable.Root
        id="edit-board-name"
        v-model:model-value="editableName"
        @update:model-value="editableName = $event"
        @submit="submitBoardName"
        v-slot="{ isEditing }"
        placeholder="Untitled Board"
        auto-resize
        class="editable-root" >
        <Editable.Area class="editable-area">

          <Editable.Preview class="editable-preview" />
          <Editable.Input class="editable-input" />

        </Editable.Area>
        <div class="editable-trigger-wrapper" >

          <Editable.EditTrigger v-if="!isEditing" class="editable-trigger-edit" >
            <span>
              <IconPencil2 />
            </span>
          </Editable.EditTrigger>

          <span v-else >
            <Editable.SubmitTrigger class="editable-trigger-submit">
              Done
            </Editable.SubmitTrigger>
            <Editable.CancelTrigger class="editable-trigger-cancel" >
              Reset
            </Editable.CancelTrigger>
          </span>

        </div>
      </Editable.Root>

      <div class="menubar">
        <FlowBoardMenubar
          @select-board="selectBoard"
          @export-board="exportBoard"
          @import-board="importBoard"
          @create-task="board.update"
          @update-board-info="board.update" />
      </div>

      <div class="dark-mode-toggle">
        <Switch.Root
          :checked="isDark"
          @update:checked="toggleDark"
          class="switch-root">
          <Switch.Thumb class="switch-thumb">
            <IconMoon v-if="isDark"/>
            <IconSun v-else />
          </Switch.Thumb>
        </Switch.Root>
      </div>

    </header>

    <main>
      <FlowBoard v-if="board.info.value" @update="board.update" @delete="board.delete"/>
      <FlowBoardNoBoard v-else @import-board="importBoard" />
    </main>

    <footer>
      <FlowBoardOperations/>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  width: auto;
  height: 100%;
}

header {
  display: grid;
  grid-template-columns: calc(240px + 3rem) auto auto;
  grid-template-rows: 1fr 1fr;
  grid-template-areas:
    "logo name name"
    "logo menu dark";
  align-items: center;
  row-gap: .125rem;
  padding: .125rem 0;
  justify-content: flex-start;
  line-height: 1.5;
  height: 5.5rem;
}

.logotype {
  grid-area: logo;
  padding-top: .375rem;
  text-align: center;
}

.logotype svg {
  height: 3.75rem;
}

h1 {
  margin-right: 1.5rem;
}

.editable-root {
  grid-area: name;
  display: flex;
  flex-direction: row;
}

.editable-area {
  color: var(--color-text);
  font-size: 30px;
  width: 180px;
  flex: auto;
}
.editable-preview {
  cursor: pointer;
}
.editable-input {
  cursor: text;
}

.editable-trigger-wrapper {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.editable-trigger-submit,
.editable-trigger-cancel,
.editable-trigger-edit {
  align-items: flex-end;
  margin: .375rem 0 0 .375rem;
  padding: .125rem .75rem;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  text-wrap: nowrap;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: 4px;
  cursor: pointer;
}

.editable-trigger-submit,
.editable-trigger-cancel:hover {
  color: var(--ff-c-green);
  background-color: var(--color-background);
}

.editable-trigger-submit:hover {
  background-color: var(--ff-c-green-transparent-3);
}

.editable-trigger-edit {
  cursor: pointer;
  border: none;
}
.editable-trigger-edit svg {
  width: 24px;
  height: 24px;
  color: var(--color-text);
}

.menubar {
  grid-area: menu;
  margin-right: 1.5rem;
}

.dark-mode-toggle {
  grid-area: dark;
  margin-left: auto;
  margin-right: 4rem;
  vertical-align: middle;
}
:deep(.dark-mode-toggle svg) {
  stroke: var(--color-text);
  fill: var(--color-text);
  width: 10px;
  height: 10px;
}
:deep(button) {
  all: unset;
}
:deep(.switch-root) {
  width: 42px;
  height: 25px;
  text-align: center;
  background-color: var(--color-background-soft);
  border: 2px solid var(--color-background-mute);
  border-radius: 9999px;
  position: relative;
  transition: background-color 250ms;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
:deep(.switch-root):focus {
  box-shadow: 0 0 0 2px var(--color-box-shadow-3);
}
:deep(.switch-root)[data-state='checked'] {
  background-color: var(--color-background);
}

:deep(.switch-thumb) {
  display: block;
  width: 21px;
  height: 21px;
  background-color: var(--color-background-mute);
  border-radius: 9999px;
  box-shadow: 0 2px 2px var(--color-box-shadow-1);
  transition: transform 250ms;
  transform: translateX(2px);
}
:deep(.switch-thumb)[data-state='checked'] {
  transform: translateX(19px);
}

main {
  flex: 4 1 calc(100vh - 12rem);
  width: 100%;
  padding: 0 3rem;
}

footer {
  flex: 1 1 6rem;
}
</style>