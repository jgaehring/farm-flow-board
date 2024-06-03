<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, inject, ref, unref } from 'vue';
import { Dialog, Popover } from 'radix-vue/namespaced';
import { VisuallyHidden } from 'radix-vue';
import { computeBoardProperties } from '@/canvas/board';
import type { ActionRecords, ActionType, LocationRecord } from '@/data/boardSampleData';
import { actionRecordsKey, dateRangeKey, indexPositionKey, isDarkKey, locationRecordsKey } from '@/data/providerKeys';
import { sameDate } from '@/utils/date';
import IconCross2 from '@/assets/radix-icons/cross-2.svg?component'

interface FlowBoardCursorGridProps {
  x: Ref<number>,
  y: Ref<number>,
  width: Ref<number>,
  height: Ref<number>,
}
const props = defineProps<FlowBoardCursorGridProps>();

const actionRecords = inject<Ref<ActionRecords>>(actionRecordsKey, ref<ActionRecords>([]));
const locationRecords = inject<LocationRecord[]>(locationRecordsKey, []);
const dateRange = inject<Ref<Date[]>>(dateRangeKey, ref<Date[]>([]));
const boardIndex = inject<Ref<{ x: number, y: number }>>(indexPositionKey, ref({ x: 0, y: 0 }));
const isDark = inject(isDarkKey);

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
  { width: props.width.value, height: props.width.value },
  { x: unref(dateRange), y: locationRecords },
  boardIndex.value,
  style.value,
));

interface GridCell {
  location: { id: number, name: string },
  date: Date,
  actions: ActionType[],
  x: number, y: number,
  style: string,
  ref: Ref<HTMLDivElement|null>
}

const gridRefs = computed(() => board.value.labels.y.values.flatMap((loc, y) => {
  const location = { id: loc.id, name: loc.name };
  const { grid } = board.value;
  const records = actionRecords.value.find(l => l.id === loc.id)?.dates || [];
  return board.value.labels.x.values.reduce((cells, date, x) => {
    const actions = records.find(r => sameDate(r.date, date))?.actions || [];
    if (actions.length <= 0) return cells;
    const top = grid.origin.y + y * grid.unit;
    const left = grid.origin.x + x * grid.unit;
    const size = `width: ${grid.unit}px; height: ${grid.unit}px`;
    const style = `top: ${top}px; left: ${left}px; ${size}`;
    const gridCell = {
      location, date, actions,
      x, y, style,
      ref: ref(null),
    };
    return [...cells, gridCell];
  }, [] as GridCell[]);
}));

</script>

<template>
  <div class="cursor-grid">
    <div v-for="(cell, i) in gridRefs"
      class="cursor-grid-cell"
      :style="cell.style"
      :ref="cell.ref"
      :key="i">
      <Popover.Root>
        <Popover.Trigger class="popover-trigger">
          <VisuallyHidden>
            Click to view actions on this date.
          </VisuallyHidden>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content class="popover-content">
            <div class="popover-content-date-time">
              <span>{{ cell.location.name }}</span>
              <br>
              <span>{{ cell.date.toLocaleDateString(undefined, { dateStyle: 'medium' }) }}</span>
            </div>
            <div class="popover-content-action">
              <Dialog.Root  v-for="(action, j) in cell.actions" :key="j">
                <Dialog.Trigger as="button"
                  type="button">
                  <svg viewBox="0 0 12 12" width="12" height="12" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="6" r="6" :fill="action.color"/>
                  </svg>
                  {{ action.name }}
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay class="edit-dialog-overlay" />
                  <Dialog.Content class="edit-dialog-content" >
                    <Dialog.Title class="edit-dialog-title" >
                      Edit Task
                    </Dialog.Title>
                    <Dialog.Description class="edit-dialog-description" >
                      Make changes to the task.
                    </Dialog.Description>
                    <div>
                      <label for="type">// TODO </label>
                      <input type="text" placeholder="Edit something">
                    </div>
                    <Dialog.Close class="popover-close" aria-label="Close">
                      <IconCross2 />
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
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
button {
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
:deep(.popover-content-action) {
  display: flex;
  flex-flow: row wrap;
}
:deep(.popover-content-action) button {
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
:deep(.popover-content-action) button:hover {
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

.popover-close,
.edit-dialog-close {
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
.popover-close:hover,
.edit-dialog-close:hover {
  background-color: var(--ff-c-green-transparent);
}
.popover-close:focus,
.edit-dialog-close:focus {
  box-shadow: 0 0 0 2px var(--ff-c-green-transparent);
}

.edit-dialog-overlay {
  background-color: var(--ff-c-black-transparent-1);
  position: fixed;
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.edit-dialog-content {
  background-color: var(--color-background-soft);
  border-radius: 6px;
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 450px;
  max-height: 85vh;
  padding: 25px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>