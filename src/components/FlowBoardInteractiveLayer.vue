<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, inject, ref, unref } from 'vue';
import { Combobox, Dialog, Label, Popover } from 'radix-vue/namespaced';
import { VisuallyHidden } from 'radix-vue';
import { computeBoardProperties } from '@/canvas/board';
import { operations2023 } from '@/data/boardSampleData';
import type { OperationTerm } from '@/data/resources';
import { dateRangeKey, indexPositionKey, isDarkKey, locationsKey, matrixKey } from '@/data/providerKeys';
import { sameDate } from '@/utils/date';
import FFDatePicker from '@/components/FFDatePicker.vue';
import IconChevronDown from '@/assets/radix-icons/chevron-down.svg?component';
import IconCross2 from '@/assets/radix-icons/cross-2.svg?component';
import IconDotFilled from '@/assets/radix-icons/dot-filled.svg?component';

interface FlowBoardCursorGridProps {
  x: Ref<number>,
  y: Ref<number>,
  width: Ref<number>,
  height: Ref<number>,
}
const props = defineProps<FlowBoardCursorGridProps>();

const matrix = inject(matrixKey, ref([]));
const locations = inject(locationsKey, ref([]));
const dateRange = inject(dateRangeKey, ref([]));
const boardIndex = inject(indexPositionKey, ref({ x: 0, y: 0 }));
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
  { x: unref(dateRange), y: locations.value },
  boardIndex.value,
  style.value,
));

interface GridCell {
  location: { id: string, name: string },
  date: Date,
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
    const ops = records.find(r => sameDate(r.date, date))?.operations || [];
    if (ops.length <= 0) return cells;
    const top = grid.origin.y + y * grid.unit;
    const left = grid.origin.x + x * grid.unit;
    const size = `width: ${grid.unit}px; height: ${grid.unit}px`;
    const style = `top: ${top}px; left: ${left}px; ${size}`;
    const gridCell = {
      location, date, operations: ops,
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
              <Dialog.Root  v-for="(op, j) in cell.operations" :key="j">
                <Dialog.Trigger as="button"
                  type="button">
                  <svg viewBox="0 0 12 12" width="12" height="12" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="6" r="6" :fill="op.color"/>
                  </svg>
                  {{ op.name }}
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay class="edit-dialog-overlay" />
                  <Dialog.Content class="edit-dialog-content" >
                    <Dialog.Title class="edit-dialog-title" >
                      Edit Task
                    </Dialog.Title>
                    <VisuallyHidden>
                      <Dialog.Description class="edit-dialog-description" >
                        Make changes to the task.
                      </Dialog.Description>
                    </VisuallyHidden>
                    <Label class="label-combobox" for="edit-task-op">Task</Label>
                    <Combobox.Root :model-value="op.id">
                      <Combobox.Anchor class="combobox-anchor">
                        <Combobox.Input
                          id="edit-task-op"
                          class="combobox-input"
                          :value="op.name" />
                        <Combobox.Trigger >
                          <IconChevronDown/>
                        </Combobox.Trigger>
                      </Combobox.Anchor>
                      <Combobox.Content class="combobox-content">
                        <Combobox.Viewport class="combobox-viewport" >
                          <Combobox.Empty class="combobox-empty"/>
                          <Combobox.Item v-for="(op, i) in operations2023"
                            class="combobox-item"
                            :value="op.id"
                            :key="i">
                            <Combobox.ItemIndicator class="combobox-item-indicator" >
                              <IconDotFilled/>
                            </Combobox.ItemIndicator>
                            {{ op.name }}
                          </Combobox.Item>
                        </Combobox.Viewport>
                      </Combobox.Content>
                    </Combobox.Root>
                    <Label class="label-combobox" for="edit-task-location">Location</Label>
                    <Combobox.Root :model-value="cell.location.id">
                      <Combobox.Anchor class="combobox-anchor">
                        <Combobox.Input
                          id="edit-task-location"
                          class="combobox-input"
                          :value="cell.location.name" />
                        <Combobox.Trigger >
                          <IconChevronDown/>
                        </Combobox.Trigger>
                      </Combobox.Anchor>
                      <Combobox.Content class="combobox-content">
                        <Combobox.Viewport class="combobox-viewport" >
                          <Combobox.Empty class="combobox-empty"/>
                          <Combobox.Item v-for="(location, i) in locations"
                            class="combobox-item"
                            :value="location.id"
                            :key="i">
                            <Combobox.ItemIndicator class="combobox-item-indicator" >
                              <IconDotFilled/>
                            </Combobox.ItemIndicator>
                            {{ location.name }}
                          </Combobox.Item>
                        </Combobox.Viewport>
                      </Combobox.Content>
                    </Combobox.Root>

                    <FFDatePicker/>

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

.edit-dialog-title {
  color: var(--color-heading);
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

.combobox-root {
  position: relative;
}

.combobox-anchor {
  display: inline-flex;
  align-items: center;
  justify-content: between; 
  font-size: 13px;
  line-height: 1;
  height: 35px;
  padding: 0 15px;
  gap: 5px;
  background-color: var(--color-background);
  color: var(--ff-c-green);
  border-radius: 4px;
  box-shadow: 0 2px 10px var(--color-box-shadow-2);
}
.combobox-anchor:hover {
  background-color: var(--ff-c-green-transparent-2);
}

.combobox-input {
  height: 100%;
  background-color: transparent;
  color: var(--ff-c-green);
}
.combobox-input[data-placeholder] {
  color: var(--ff-c-green-transparent);
}

.combobox-icon {
  width: 16px;
  height: 16px;
  color: var(--ff-c-green);
}

.combobox-content {
  z-index: 10;
  width: 100%;
  position: absolute;
  overflow: hidden;
  background-color: var(--color-background);
  border-radius: 6px;
  margin-top: 8px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
}

.combobox-viewport {
  padding: 5px;
}

.combobox-empty {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500; 
  color: var(--color-text)
}

.combobox-item {
  font-size: 13px;
  line-height: 1;
  color: var(--ff-c-green);
  border-radius: 3px;
  display: flex;
  align-items: center;
  height: 25px;
  padding: 0 35px 0 25px;
  position: relative;
  user-select: none;
}
.combobox-item[data-disabled] {
  color: var(--color-border);
  pointer-events: none;
}
.combobox-item[data-highlighted] {
  outline: none;
  background-color: var(--ff-c-green-transparent);
  color: var(--color-heading);
}

.combobox-label {
  padding: 0 25px;
  font-size: 12px;
  line-height: 25px;
  color: var(--color-text);
}

.combobox-separator {
  height: 1px;
  background-color: var(--ff-c-green-transparent-2);
  margin: 5px;
}

.combobox-item-indicator {
  position: absolute;
  left: 0;
  width: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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