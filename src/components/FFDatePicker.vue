<script setup lang="ts">
import { computed, ref } from 'vue';
import { DatePicker, Label } from 'radix-vue/namespaced';
import { fromDate, getLocalTimeZone } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import IconCalendar from '@/assets/radix-icons/calendar.svg?component';
import IconChevronLeft from '@/assets/radix-icons/chevron-left.svg?component';
import IconChevronRight from '@/assets/radix-icons/chevron-right.svg?component';

export interface Props {
  value?: Date,
  minValue?: Date,
  maxValue?: Date,
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'change', value: Date): void,
  (e: 'input', value: Date): void,
}>();

const tz = ref(getLocalTimeZone());
const defaultDateTime = computed(() => fromDate(
  props.value || props.minValue || new Date(),
  tz.value,
));
const dateTime = ref(defaultDateTime);
</script>

<template>
  <div class="ff-date-picker-wrapper">
    <Label class="ff-date-picker-field-label" for="ff-date-picker-root">
      Date
    </Label>

    <DatePicker.Root
      id="ff-date-picker-root"
      v-model:placeholder="(dateTime as DateValue)"
      @update:placeholder="emit('input', $event.toDate(tz))"
      v-model:model-value="(dateTime as DateValue)"
      @update:model-value="emit('change', $event?.toDate(tz) || dateTime.toDate())"
      :min-value="minValue && fromDate(minValue, tz)"
      :max-value="maxValue && fromDate(maxValue, tz)"
      granularity="minute">

      <DatePicker.Field
        v-slot="{ segments }"
        class="ff-date-picker-field">
        <template v-for="item in segments" :key="item.part">
          <DatePicker.Input v-if="item.part === 'literal'"
            :part="item.part"
            class="ff-date-picker-field-literal">
            {{ item.value }}
          </DatePicker.Input>
          <DatePicker.Input v-else
            :part="item.part"
            class="ff-date-picker-field-segment">
            {{ item.value }}
          </DatePicker.Input>
        </template>

        <DatePicker.Trigger class="ff-date-picker-popover-trigger">
          <IconCalendar />
        </DatePicker.Trigger>
      </DatePicker.Field>

      <DatePicker.Content
        :align="'end'"
        :side-offset="16"
        class="ff-date-picker-popover-content">
        <DatePicker.Arrow class="ff-date-picker-popover-arrow" />
        <DatePicker.Calendar
          v-slot="{ weekDays, grid }"
          class="ff-date-picker-calendar">
          <DatePicker.Header class="ff-date-picker-calendar-header">
            <DatePicker.Prev class="ff-date-picker-calendar-nav-button">
              <IconChevronLeft />
            </DatePicker.Prev>

            <DatePicker.Heading class="ff-date-picker-calendar-heading" />
            <DatePicker.Next
              class="ff-date-picker-calendar-nav-button">
              <IconChevronRight />
            </DatePicker.Next>
          </DatePicker.Header>
          <div class="ff-date-picker-calendar-wrapper" >
            <DatePicker.Grid
              v-for="month in grid"
              class="ff-date-picker-calendar-grid"
              :key="month.value.toString()">
              <DatePicker.GridHead>
                <DatePicker.GridRow class="ff-date-picker-calendar-grid-row">
                  <DatePicker.HeadCell
                    v-for="day in weekDays" :key="day"
                    class="calendar-head-cell">
                    {{ day }}
                  </DatePicker.HeadCell>
                </DatePicker.GridRow>
              </DatePicker.GridHead>
              <DatePicker.GridBody>
                <DatePicker.GridRow
                  v-for="(weekDates, index) in month.rows"
                  :key="`weekDate-${index}`"
                  class="ff-date-picker-calendar-grid-row">
                  <DatePicker.Cell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                    class="ff-date-picker-calendar-cell">
                    <DatePicker.CellTrigger
                      :day="weekDate"
                      :month="month.value"
                      class="ff-date-picker-calendar-cell-trigger"/>
                  </DatePicker.Cell>
                </DatePicker.GridRow>
              </DatePicker.GridBody>
            </DatePicker.Grid>
          </div>
        </DatePicker.Calendar>
      </DatePicker.Content>
    </DatePicker.Root>
  </div>
</template>

<style>
/* reset */
button.ff-date-picker-popover-trigger {
  all: unset;
}

.ff-date-picker-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ff-date-picker-field-label {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-text);
}

.ff-date-picker-field {
  display: flex;
  flex-direction: row;
  max-width: fit-content;
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

.ff-date-picker-field::placeholder {
  color: var(--color-heading);
}

.ff-date-picker-field[data-invalid] {
  border: 1px solid red;
}

.ff-date-picker-field-literal {
  padding: 0.25rem;
}

.ff-date-picker-field-segment {
  padding: 0.25rem;
}

.ff-date-picker-field-segment:hover{
  background-color: var(--ff-c-green-transparent-3);
}

.ff-date-picker-field-segment:focus {
  background-color: var(--ff-c-green-transparent-3);
}

.ff-date-picker-field-segment[aria-valuetext='Empty'] {
  color: var(--ff-c-green-transparent-2);
}

.ff-date-picker-field svg {
  width: 1.5rem;
  height: 1.5rem;
}

.ff-date-picker-calendar {
  padding: 22px;
}

.ff-date-picker-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ff-date-picker-calendar-nav-button {
  all: unset;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-text);
  background-color: transparent;
  cursor: pointer;
}

.ff-date-picker-calendar-nav-button:hover {
  color: var(--color-heading);
  background-color: var(--color-background-soft);
}

.ff-date-picker-calendar-heading {
  font-weight: 500;
  color: var(--color-heading);
  font-size: 15px;
}

.ff-date-picker-calendar-wrapper {
  display: flex;
  padding-top: .75rem;
  margin-top: .75rem;
  flex-direction: column;
  background-color: var(--color-background);
}

@media (min-width: 640px) {
  .ff-date-picker-calendar-wrapper {
    padding-top: 0;
    margin-top: 0;
    margin-left: 0;
    flex-direction: row;
  }
}

.ff-date-picker-calendar-grid {
  margin-top: 0.2rem;
  width: 100%;
  user-select: none;
  border-collapse: collapse;
}

.ff-date-picker-calendar-grid-row {
  display: grid;
  margin-bottom: 0.2rem;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  width: 100%;
}

.ff-date-picker-calendar-grid-row[data-radix-vue-calendar-month-view] {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-head-cell {
  border-radius: 0.375rem;
  font-size: 0.75rem;
  line-height: .8rem;
  color: var(--color-text);
  font-weight: 400;
}

.ff-date-picker-calendar-cell {
  position: relative;
  font-size: 0.875rem;
  line-height: 1rem;
  text-align: center;
}

.ff-date-picker-calendar-cell-trigger {
  display: flex;
  position: relative;
  padding: 0.4rem;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: transparent;
  border-radius: 9px;
  outline-style: none;
  font-size: 0.875rem;
  line-height: .875rem;
  font-weight: 400;
  color: var(--color-text);
  white-space: nowrap;
  cursor: pointer;
  background-color: transparent;
}

.ff-date-picker-calendar-cell-trigger:hover {
  box-shadow: 0 0 0 2px var(--color-border);
}

.ff-date-picker-calendar-cell-trigger:focus {
  box-shadow: 0 0 0 2px var(--color-text);
}

.ff-date-picker-calendar-cell-trigger[data-disabled] {
  cursor: default;
  box-shadow: none;
  color: var(--color-background-mute);
}

.ff-date-picker-calendar-cell-trigger[data-selected] {
  background-color: var(--ff-c-green);
  color: var(--color-neutral-inverse);
  font-weight: 500;
}

.ff-date-picker-calendar-cell-trigger[data-selected]::before {
  background-color: transparent;
}

.ff-date-picker-calendar-cell-trigger[data-unavailable] {
  cursor: default;
  box-shadow: none;
  color: var(--color-background-mute);
  text-decoration: line-through;
}

.ff-date-picker-calendar-cell-trigger::before {
  content: '';
  position: absolute;
  top: 5px;
  left: calc(50% - 2px);
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 9999px;
  background-color: var(--color-background);
}

.ff-date-picker-calendar-cell-trigger[data-today]::before {
  display: block;
  background-color: var(--ff-c-green-transparent-2);
}

.ff-date-picker-popover-trigger:focus {
  box-shadow: 0 0 0 2px var(--color-text);
}

.ff-date-picker-popover-content {
  border-radius: 12px;
  width: 260px;
  background-color: var(--color-background);
  box-shadow: 0 0 2px var(--color-box-shadow-inverse-1);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}
.ff-date-picker-popover-content:focus {
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px,
    0 0 0 2px var(--ff-c-green-transparent-2);
}
.ff-date-picker-popover-content[data-state='open'][data-side='top'] {
  animation-name: slideDownAndFade;
}
.ff-date-picker-popover-content[data-state='open'][data-side='right'] {
  animation-name: slideLeftAndFade;
}
.ff-date-picker-popover-content[data-state='open'][data-side='bottom'] {
  animation-name: slideUpAndFade;
}
.ff-date-picker-popover-content[data-state='open'][data-side='left'] {
  animation-name: slideRightAndFade;
}

.ff-date-picker-popover-arrow {
  fill: var(--color-background);
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