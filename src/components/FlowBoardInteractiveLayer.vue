<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, inject, ref, unref } from 'vue';
import { Popover } from 'radix-vue/namespaced';
import { VisuallyHidden } from 'radix-vue';
import { computeBoardProperties } from '@/canvas/board';
import type { LogResource, OperationTerm } from '@/data/resources';
import {
  dateRangeKey, emitBoardUpdateKey, indexPositionKey, isDarkKey,
  locationsKey, matrixKey, operationsKey,
} from '@/components/providerKeys';
import { sameDate } from '@/utils/date';
import FlowBoardDialogEditTask from './FlowBoardDialogEditTask.vue';
import IconCross2 from '@/assets/radix-icons/cross-2.svg?component';

interface FlowBoardCursorGridProps {
  width: number,
  height: number,
}
const props = defineProps<FlowBoardCursorGridProps>();

const matrix = inject(matrixKey, ref([]));
const locations = inject(locationsKey, ref([]));
const operations = inject(operationsKey, ref([]));
const dateRange = inject(dateRangeKey, ref([]));
const boardIndex = inject(indexPositionKey, ref({ x: 0, y: 0 }));
const isDark = inject(isDarkKey);
const update = inject(emitBoardUpdateKey, () => console.warn('No update emitter provided.'));

// Parameters for laying out the grid.
const style = computed(() => ({
  isDark: isDark?.value,
  grid: {
    unit: 40,
    lineWidth: 1.5,
  },
  labels: {
    yAxisWidth: 240,
    xAxisHeight: 60,
  },
}));

const board = computed(() => computeBoardProperties(
  { width: props.width, height: props.height },
  { x: unref(dateRange), y: locations.value },
  boardIndex.value,
  style.value,
));

interface GridCell {
  location: { id: string, name: string },
  date: Date,
  tasks: LogResource[],
  operations: OperationTerm[],
  x: number, y: number,
  style: string,
  ref: Ref<HTMLDivElement|null>
}

const gridRefs = computed(() => board.value.labels.y.values.flatMap((loc, y) => {
  const location = { id: loc.id, name: loc.name };
  const { grid } = board.value;
  const records = matrix.value.find(l => l.id === loc.id)?.dates || [];
  return board.value.labels.x.values.reduce((cells, date, x) => {
    const {
      operations: ops = [], tasks: tasksByDate = [],
    } = records.find(r => sameDate(r.date, date)) || {};
    if (ops.length <= 0) return cells;
    const top = grid.origin.y + y * grid.unit;
    const left = grid.origin.x + x * grid.unit;
    const size = `width: ${grid.unit}px; height: ${grid.unit}px`;
    const style = `top: ${top}px; left: ${left}px; ${size}`;
    const gridCell = {
      location, date,
      operations: ops, tasks: tasksByDate,
      x, y, style,
      ref: ref(null),
    };
    return [...cells, gridCell];
  }, [] as GridCell[]);
}));

enum IndexOf { Cell, Task, Operation, Location }
const selected = ref<{ [I in IndexOf]: number }>([-1, -1, -1, -1]);

function selectCell(i: number, open?: boolean) {
  if (open === false) selected.value[IndexOf.Cell] = -1;
  else selected.value[IndexOf.Cell] = i;
}
function selectTask(j: number, open?: boolean) {
  if (open === false) selected.value[IndexOf.Task] = -1;
  else selected.value[IndexOf.Task] = j;
  const i = selected.value[IndexOf.Cell];
  if (i < 0 || j < 0) return;
  const task = gridRefs.value[i].tasks[j];
  selected.value[IndexOf.Operation] = operations.value
    .findIndex(op => op.id === task.operation?.id);
  selected.value[IndexOf.Location] = locations.value
    .findIndex(loc => loc.id === task.location?.id);
}

function confirmChanges(changes: Partial<LogResource>) {
  update(changes);
  selectTask(-1);
  selectCell(-1);
}
function cancelChanges() {
  selectTask(-1);
  selectCell(-1);
}

</script>

<template>
  <div class="cursor-grid">
    <div v-for="(cell, i) in gridRefs"
      class="cursor-grid-cell"
      :style="cell.style"
      :ref="cell.ref"
      :key="`cursor-grid-cell-${i}`">
      <Popover.Root
        :open="i === selected[IndexOf.Cell]"
        @update:open="selectCell(i, $event)">
        <Popover.Trigger class="popover-trigger">
          <VisuallyHidden>
            Click to view tasks on this date.
          </VisuallyHidden>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content class="popover-content">
            <div class="popover-content-date-time">
              <span>{{ cell.location.name }}</span>
              <br>
              <span>{{ cell.date.toLocaleDateString(undefined, { dateStyle: 'medium' }) }}</span>
            </div>
            <div class="popover-content-operation">
              <FlowBoardDialogEditTask
                v-for="(op, j) in cell.operations"
                @update:save="confirmChanges"
                @update:cancel="cancelChanges"
                :open="j === selected[IndexOf.Task]"
                :task="cell.tasks[j]"
                :operations="operations"
                :locations="locations"
                :key="`popover-content-operation-${j}`" >
                <template #trigger>
                  <button @click="selectTask(j)" type="button">
                    <svg viewBox="0 0 12 12" width="12" height="12" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="6" cy="6" r="6" :fill="op.color"/>
                    </svg>
                    {{ op.name }}
                  </button>
                </template>
              </FlowBoardDialogEditTask>
            </div>
            <Popover.Close class="popover-close" aria-label="Close">
              <IconCross2 />
            </Popover.Close>
            <Popover.Arrow class="popover-arrow" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  </div>
</template>

<style scoped>
/* reset */
button, input {
  all: unset;
}

.cursor-grid {
  position: absolute;
  background-color: transparent;
}
.cursor-grid-cell {
  position: absolute;
  background-color: transparent;
}
.popover-trigger {
  background-color: transparent;
  border: 1px inset transparent;
  border-radius: 50%;
  box-shadow: none;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

:deep(.popover-content) {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 320px;
  padding: .75rem .75rem;
  background-color: var(--color-background-mute);
  border-radius: 4px;
  box-shadow: 0 0 6px 3px var(--color-box-shadow-2);
}
:deep(.popover-content-operation) {
  display: flex;
  flex-flow: row wrap;
}
:deep(.popover-content-operation) button {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  text-wrap: nowrap;
  background-color: var(--color-background-soft);
  color: var(--ff-c-green);
  padding: .375rem .75rem;
  margin-right: .375rem;
  margin-bottom: .375rem;
  border-radius: 4px;
  cursor: pointer;
}
:deep(.popover-content-operation) button:hover {
  background-color: var(--ff-c-green-transparent-2);
}
:deep(.popover-content-date-time) {
  text-align: center;
  margin-bottom: .375rem;
}

:deep(.popover-arrow) {
  fill: var(--color-background-mute);
  stroke: var(--color-box-shadow-2);
  stroke-width: 1px;
}

.popover-close {
  font-family: inherit;
  border-radius: 100%;
  height: 15px;
  width: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ff-c-green);
  position: absolute;
  top: .5rem;
  right: .5rem;
}
.popover-close:hover {
  background-color: var(--ff-c-green-transparent);
}
.popover-close:focus {
  box-shadow: 0 0 0 2px var(--ff-c-green-transparent);
}
</style>