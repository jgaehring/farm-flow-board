<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import type { Ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core'
import { Switch } from 'radix-vue/namespaced';
import { mergeRight, omit, pick } from 'ramda';
import {
  boardIdKey, cropsKey, dateRangeKey, isDarkKey, locationsKey,
  operationsKey, plantsKey, tasksKey,
} from '@/components/providerKeys';
import type { DeleteValue, UpdateValue } from '@/components/providerKeys';
import { generateEntities } from '@/data/random';
import {
  crops2023, locations2023, operations2023, plants2023, tasks2023,
} from '@/data/deserialize';
import { Asset } from '@/data/resources';
import type {
  CropTerm, LocationResource, LogResource,
  OperationTerm, PlantResource,
} from '@/data/resources';
import FlowBoard from '@/components/FlowBoard.vue';
import FlowBoardOperations from '@/components/FlowBoardOperations.vue';
import FlowBoardMenubar from '@/components/FlowBoardMenubar.vue';
import { createDateRange } from '@/utils/date';
import LogoType from '@/assets/logotype_color.svg?component';
import IconSun from '@/assets/radix-icons/sun.svg?component'
import IconMoon from '@/assets/radix-icons/moon.svg?component'

const boardId = ref<'2023'|'random'>('2023');

// All of the core data entities.
const tasks = ref<LogResource[]>(tasks2023);
const locations = ref<LocationResource[]>(locations2023);
const plants = ref<PlantResource[]>(plants2023);
const operations = ref<OperationTerm[]>(operations2023);
const crops = ref<CropTerm[]>(crops2023);

function onBoardUpdate(value: UpdateValue): void {
  let collection: Ref<LogResource[]|PlantResource[]>|false = false;
  if (value.type?.startsWith('log')) collection = tasks;
  else if (value.type === Asset.Plant) collection = plants;

  if (collection) {
    const i = collection.value.findIndex(item => item.id === value.id);
    type T = typeof collection.value[number];
    type K = keyof T;
    if (i >= 0) {
      const keys = Object.keys(collection.value[i]) as K[];
      const valid = pick(keys, value);
      const mutable = omit(['id', 'type'], valid);
      collection.value[i] = mergeRight(collection.value[i], mutable) as T;
    } else {
      (collection.value as T[]).push(value as T);
    }
  }
}
function onDelete(idfier: DeleteValue) {
  const i = tasks.value.findIndex(t => t.id === idfier.id && t.type === idfier.type);
  if (i >= 0) tasks.value.splice(i, 1);
}

// Start and end dates used to populate the x-axis.
const startDate = ref<Date>(new Date(2024, 2, 28));
const endDate = ref<Date>(new Date(2024, 9));
// Array of Date objects for every date within the specified range.
const dateRange = computed(() => createDateRange(startDate.value, endDate.value));

function loadBoard(name: '2023'|'random') {
  tasks.value = [];
  plants.value = [];
  if (name === 'random') {
    startDate.value = new Date(2024, 2, 28);
    endDate.value = new Date(2024, 9);
    // Generate a random scatter of tasks for the grid.
    const frequency = 6; // coefficient to adjust total tasks below
    const count = frequency * Math.floor(
      // Correlate total # of tasks to the 2 main parameters, fields & dates.
      Math.sqrt(locations.value.length * dateRange.value.length)
    );
    const entities = generateEntities(
      count,
      locations.value,
      operations.value,
      crops.value,
      [startDate.value, endDate.value],
    );
    tasks.value = entities[0];
    plants.value = entities[1];
  } else if (name === '2023') {
    startDate.value = new Date(2023, 4, 6);
    endDate.value = new Date(2023, 10, 15);
    tasks.value = tasks2023;
    plants.value = plants2023;
  }
}
loadBoard(boardId.value);

const isDark = useDark({
  selector: 'body',
  attribute: 'color-scheme',
  valueDark: 'dark',
  valueLight: 'light',
});
const toggleDark = useToggle(isDark);

provide(tasksKey, tasks);
provide(locationsKey, locations);
provide(plantsKey, plants);
provide(dateRangeKey, dateRange);
provide(operationsKey, operations);
provide(cropsKey, crops);
provide(boardIdKey, boardId);
provide(isDarkKey, isDark);

</script>

<template>
  <div class="layout">
    <header>
      <div class="logotype">
        <LogoType/>
      </div>
      <h1>{{ boardId === '2023' ? 'Crop 2023' : 'Random' }}</h1>
      <div class="menubar">
        <FlowBoardMenubar
          @select-board="loadBoard"
          @create-task="onBoardUpdate" />
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
      <FlowBoard @update="onBoardUpdate" @delete="onDelete"/>
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
  display: flex;
  align-items: center;
  justify-content: flex-start;
  line-height: 1.5;
  height: 5.5rem;
}

.logotype {
  flex: 0 0 calc(240px + 3rem);
  padding-top: .375rem;
  text-align: center;
}

.logotype svg {
  height: 3.75rem;
}

h1 {
  margin-right: 1.5rem;
}

.dark-mode-toggle {
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