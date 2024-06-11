<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core'
import { Switch } from 'radix-vue/namespaced';
import {
  tasksKey, operationsKey, boardIdKey, dateRangeKey, isDarkKey, locationsKey,
} from '@/data/providerKeys';
import { cropTerms, operations, locations, randomTasks, taskMatrix2023 } from '@/data/boardSampleData';
import type { TaskMatrix } from '@/data/resources';
import FlowBoard from '@/components/FlowBoard.vue';
import FlowBoardOperations from '@/components/FlowBoardOperations.vue';
import FlowBoardMenubar from '@/components/FlowBoardMenubar.vue';
import { createDateRange, sameDate } from '@/utils/date';
import LogoType from '@/assets/logotype_color.svg?component';
import IconSun from '@/assets/radix-icons/sun.svg?component'
import IconMoon from '@/assets/radix-icons/moon.svg?component'

const boardId = ref<'2023'|'random'>('2023');

// The collection of all field operations, first sorted by location, then within
// each location sorted by date. The locations will be created first, with empty
// dates arrays, and generateTasks will populate the tasks by date after
// randomly generating them according to the possible locations and dates.
const tasks = ref<TaskMatrix>(taskMatrix2023);

// Start and end dates used to populate the x-axis.
const startDate = ref<Date>(new Date(2024, 2, 28));
const endDate = ref<Date>(new Date(2024, 9));
// Array of Date objects for every date within the specified range.
const dateRange = computed(() => createDateRange(startDate.value, endDate.value));

function generateTasks(count: number): TaskMatrix {
  const range: [Date, Date] = [startDate.value, endDate.value];
  const taskGenerator = randomTasks(range, locations, operations, cropTerms);
  const random: TaskMatrix = [];
  for (let i  = 0; i < count; i += 1) {
    const task = taskGenerator.next().value;
    if (task) {
      const { date, type } = task;
      const op = operations[type];
      if (!random[task.location]) {
        const { id, name } = locations[task.location];
        random[task.location] = { id, name, crop: null, dates: [] };
      }
      const location = random[task.location];
      const matchingDate = location?.dates.find(a => sameDate(date, a.date));
      if (matchingDate && op) {
        matchingDate.operations.push(op);
      } else if (location && op){
        location.dates.push({ date, operations: [op]});
      }
    }
  }
  return random;
}

function loadBoard(name: '2023'|'random') {
  if (name === 'random') {
    tasks.value = [];
    startDate.value = new Date(2024, 2, 28);
    endDate.value = new Date(2024, 9);
    // Generate a random scatter of tasks for the grid.
    const frequency = 6; // coefficient to adjust total tasks below
    const count = frequency * Math.floor(
      // Correlate total # of tasks to the 2 main parameters, fields & dates.
      Math.sqrt(locations.length * dateRange.value.length)
    );
    tasks.value = generateTasks(count);
  } else {
    startDate.value = new Date(2023, 4, 6);
    endDate.value = new Date(2023, 10, 15);
    tasks.value = name === '2023' ? taskMatrix2023 : [];
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
provide(dateRangeKey, dateRange);
provide(operationsKey, operations);
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
        <FlowBoardMenubar @select-board="loadBoard"/>
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
      <FlowBoard/>
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