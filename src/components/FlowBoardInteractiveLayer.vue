<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, inject, ref, unref } from 'vue';
import { Combobox, DatePicker, Dialog, Label, Popover } from 'radix-vue/namespaced';
import { VisuallyHidden } from 'radix-vue';
import type { DateValue } from '@internationalized/date';
import { computeBoardProperties } from '@/canvas/board';
import { actionTypes, type ActionRecords, type ActionType, type LocationRecord } from '@/data/boardSampleData';
import { actionRecordsKey, dateRangeKey, indexPositionKey, isDarkKey, locationRecordsKey } from '@/data/providerKeys';
import { sameDate } from '@/utils/date';
import IconCalendar from '@/assets/radix-icons/calendar.svg?component';
import IconChevronDown from '@/assets/radix-icons/chevron-down.svg?component';
import IconChevronLeft from '@/assets/radix-icons/chevron-left.svg?component';
import IconChevronRight from '@/assets/radix-icons/chevron-right.svg?component';
import IconCross2 from '@/assets/radix-icons/cross-2.svg?component';
import IconDotFilled from '@/assets/radix-icons/dot-filled.svg?component';

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
                    <VisuallyHidden>
                      <Dialog.Description class="edit-dialog-description" >
                        Make changes to the task.
                      </Dialog.Description>
                    </VisuallyHidden>
                    <Label class="label-task-type" for="edit-task-type">Task</Label>
                    <Combobox.Root :model-value="action.id">
                      <Combobox.Anchor class="combobox-anchor">
                        <Combobox.Input
                          id="edit-task-type"
                          class="combobox-input"
                          :value="action.name" />
                        <Combobox.Trigger >
                          <IconChevronDown/>
                        </Combobox.Trigger>
                      </Combobox.Anchor>
                      <Combobox.Content class="combobox-content">
                        <Combobox.Viewport class="combobox-viewport" >
                          <Combobox.Empty class="combobox-empty"/>
                          <Combobox.Item v-for="(type, i) in actionTypes"
                            class="combobox-item"
                            :value="type.id"
                            :key="i">
                            <Combobox.ItemIndicator class="combobox-item-indicator" >
                              <IconDotFilled/>
                            </Combobox.ItemIndicator>
                            {{ type.name }}
                          </Combobox.Item>
                        </Combobox.Viewport>
                      </Combobox.Content>
                    </Combobox.Root>
                    <Label class="label-task-type" for="edit-task-location">Location</Label>
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
                          <Combobox.Item v-for="(location, i) in locationRecords"
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
                    <div class="date-field-wrapper">
                      <Label class="date-field-label" for="edit-task-date">Date</Label>

                      <DatePicker.Root
                        id="edit-task-date"
                        :is-date-unavailable="(date: DateValue) => date.day === 19"
                        granularity="second">

                        <DatePicker.Field
                          v-slot="{ segments }"
                          class="date-field">
                          <template v-for="item in segments" :key="item.part">
                            <DatePicker.Input v-if="item.part === 'literal'"
                              :part="item.part"
                              class="date-field-literal">
                              {{ item.value }}
                            </DatePicker.Input>
                            <DatePicker.Input v-else
                              :part="item.part"
                              class="date-field-segment">
                              {{ item.value }}
                            </DatePicker.Input>
                          </template>

                          <DatePicker.Trigger class="PopoverTrigger">
                            <IconCalendar />
                          </DatePicker.Trigger>
                        </DatePicker.Field>
  
                        <DatePicker.Content
                          :align="'end'"
                          :side-offset="16"
                          class="PopoverContent date-picker-container">
                          <DatePicker.Arrow class="PopoverArrow" />
                          <DatePicker.Calendar
                            v-slot="{ weekDays, grid }"
                            class="Calendar">
                            <DatePicker.Header class="CalendarHeader">
                              <DatePicker.Prev class="CalendarNavButton">
                                <IconChevronLeft />
                              </DatePicker.Prev>

                              <DatePicker.Heading class="CalendarHeading" />
                              <DatePicker.Next
                                class="CalendarNavButton">
                                <IconChevronRight />
                              </DatePicker.Next>
                            </DatePicker.Header>
                            <div class="CalendarWrapper" >
                              <DatePicker.Grid
                                v-for="month in grid"
                                class="CalendarGrid"
                                :key="month.value.toString()">
                                <DatePicker.GridHead>
                                  <DatePicker.GridRow class="CalendarGridRow">
                                    <DatePicker.HeadCell
                                      v-for="day in weekDays" :key="day"
                                      class="CalendarHead-cell">
                                      {{ day }}
                                    </DatePicker.HeadCell>
                                  </DatePicker.GridRow>
                                </DatePicker.GridHead>
                                <DatePicker.GridBody>
                                  <DatePicker.GridRow
                                    v-for="(weekDates, index) in month.rows"
                                    :key="`weekDate-${index}`"
                                    class="CalendarGridRow">
                                    <DatePicker.Cell
                                      v-for="weekDate in weekDates"
                                      :key="weekDate.toString()"
                                      :date="weekDate"
                                      class="CalendarCell">
                                      <DatePicker.CellTrigger
                                        :day="weekDate"
                                        :month="month.value"
                                        class="CalendarCellTrigger"/>
                                    </DatePicker.Cell>
                                  </DatePicker.GridRow>
                                </DatePicker.GridBody>
                              </DatePicker.Grid>
                            </div>
                          </DatePicker.Calendar>
                        </DatePicker.Content>
                      </DatePicker.Root>
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

.date-field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-field-label {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-text);
}

:deep(.date-field) {
  display: flex;
  flex-direction: row;
  padding: 0.5rem;
  align-items: center;
  border-radius: 0.25rem;
  border-width: 1px;
  text-align: center;
  background-color: var(--color-background);
  user-select: none;
  color: var(--ff-c-green);
  border: 1px solid var(--color-border);
}

.date-field::placeholder {
  color: var(--color-heading);
}

.date-field[data-invalid] {
  border: 1px solid red;
}

.date-field-literal {
  padding: 0.25rem;
}

.date-field-segment {
  padding: 0.25rem;
}

.date-field-segment:hover{
  background-color: var(--ff-c-green-transparent-2);
}

.date-field-segment:focus {
  background-color: var(--ff-c-green-transparent-2);
}

.date-field-segment[aria-valuetext='Empty'] {
  color: var(--ff-c-green-transparent-1);
}

.date-field svg {
  width: 1.5rem;
  height: 1.5rem;
}



.Calendar {
  padding: 22px;
  background-color: var(--color-background);
  box-shadow: 0 0 2px var(--color-box-shadow-inverse-1)
}

.CalendarHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.CalendarNavButton {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-text);
  background-color: transparent;
  cursor: pointer;
}

.CalendarNavButton:hover {
  color: var(--color-heading);
  background-color: var(--color-background-soft);
}

.CalendarHeading {
  font-weight: 500;
  color: var(--color-heading);
  font-size: 15px;
}

.CalendarWrapper {
  display: flex;
  padding-top: 1rem;
  margin-top: 1rem;
  flex-direction: column;
  background-color: var(--color-background);
}

@media (min-width: 640px) {
  .CalendarWrapper {
    margin-left: 1rem;
    margin-top: 0;
    flex-direction: row;
  }
}

.CalendarGrid {
  margin-top: 0.25rem;
  width: 100%;
  user-select: none;
  border-collapse: collapse;
}

.CalendarGridRow {
  display: grid;
  margin-bottom: 0.25rem;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  width: 100%;
}

.CalendarGridRow[data-radix-vue-calendar-month-view] {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.CalendarHeadCell {
  border-radius: 0.375rem;
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--color-text);
  font-weight: 400;
}

.CalendarCell {
  position: relative;
  font-size: 0.875rem;
  line-height: 1.25rem;
  text-align: center;
}

.CalendarCellTrigger {
  display: flex;
  position: relative;
  padding: 0.5rem;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: transparent;
  border-radius: 9px;
  outline-style: none;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 400;
  color: var(--color-text);
  white-space: nowrap;
  cursor: pointer;
  background-color: transparent;
}

.CalendarCellTrigger:hover {
  box-shadow: 0 0 0 2px var(--color-border);
}

.CalendarCellTrigger:focus {
  box-shadow: 0 0 0 2px var(--color-text);
}

.CalendarCellTrigger[data-disabled] {
  cursor: default;
  box-shadow: none;
  color: var(--color-background-mute);
}

.CalendarCellTrigger[data-selected] {
  background-color: var(--ff-c-green);
  color: var(--color-neutral-inverse);
  font-weight: 500;
}

.CalendarCellTrigger[data-selected]::before {
  background-color: transparent;
}

.CalendarCellTrigger[data-unavailable] {
  cursor: default;
  box-shadow: none;
  color: var(--color-background-mute);
  text-decoration: line-through;
}

.CalendarCellTrigger::before {
  content: '';
  position: absolute;
  top: 5px;
  left: calc(50% - 2px);
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 9999px;
  background-color: var(--color-background);
}

.CalendarCellTrigger[data-today]::before {
  display: block;
  background-color: var(--ff-c-green-transparent-1);
}

.PopoverTrigger:focus {
  box-shadow: 0 0 0 2px var(--color-text);
}

.PopoverContent {
  border-radius: 4px;
  padding: 20px;
  width: 260px;
  background-color: var(--color-background);
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}
.PopoverContent:focus {
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px,
    0 0 0 2px var(--ff-c-green-transparent);
}
.PopoverContent[data-state='open'][data-side='top'] {
  animation-name: slideDownAndFade;
}
.PopoverContent[data-state='open'][data-side='right'] {
  animation-name: slideLeftAndFade;
}
.PopoverContent[data-state='open'][data-side='bottom'] {
  animation-name: slideUpAndFade;
}
.PopoverContent[data-state='open'][data-side='left'] {
  animation-name: slideRightAndFade;
}

:deep(.PopoverArrow) {
  fill: var(--color-background);
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

@keyframes slideUpAndFade {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideRightAndFade {
  from {
    opacity: 0;
    transform: translateX(-2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeftAndFade {
  from {
    opacity: 0;
    transform: translateX(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>