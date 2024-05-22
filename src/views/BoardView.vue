<script setup lang="ts">
import { provide, ref } from 'vue';
import { actionRecordsKey, locationRecordsKey, dateRangeKey, actionTypesKey } from '@/data/providerKeys';
import { actionTypes, locationRecords, randomActions } from '@/data/boardSampleData';
import { type ActionRecords, type LocationRecord } from '@/data/boardSampleData';
import FlowBoard from '@/components/FlowBoard.vue';

// The collection of all field actions, first sorted by location, then within
// each location sorted by date. The locations will be created first, with empty
// dates arrays, and generateActions will populate the actions by date after
// randomly generating them according to the possible locations and dates.
const actionRecords = ref<ActionRecords>([]);
locationRecords.forEach(({ id, name }) => {
  actionRecords.value[id] = { id, name, dates: [] };
});

// Given a Date object, return a new Date object set 24 hours later.
const plusDay = (d: Date) => new Date(d.valueOf() + 24 * 60 * 60 * 1000);
// Given a starting Date object and an ending Date object, return an array of
// Date objects spanning that date range, including the start and end dates.
function createDateRange(start: Date, end: Date, prevRange = [] as Date[]) {
  if (start.valueOf() >= end.valueOf()) return [...prevRange, end];
  const nextRange = [...prevRange, start];
  const nextStart = plusDay(start);
  if (nextStart.valueOf() >= end.valueOf()) return [...nextRange, end];
  return createDateRange(nextStart, end, nextRange);
}

// Start and end dates used to populate the x-axis.
const startDate = new Date(2024, 2, 28);
const endDate = new Date(2024, 9);
// Array of Date objects for every date within the specified range.
const dateRange = createDateRange(startDate, endDate);

// Find out if two dates are the same, w/o regard to hours, minutes or smaller units.
const sameDate = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear()
  && d1.getMonth() === d2.getMonth()
  && d1.getDay() === d2.getDay();

function generateActions(
  count: number,
  dateRange: [Date, Date],
  locations: LocationRecord[],
): void {
  const actionGenerator = randomActions(dateRange, locations.map(l => l.name));
  for (let i  = 0; i < count; i += 1) {
    const action = actionGenerator.next().value;
    if (action) {
      const { date, type } = action;
      const actionType = actionTypes[type];
      const location = actionRecords.value[action.location];
      const matchingDate = location?.dates.find(a => sameDate(date, a.date));
      if (matchingDate && actionType) {
        const { id, name, color } = actionType;
        matchingDate.actions.push({ id, name, color });
      } else if (location && actionType){
        const { id, name, color } = actionType;
        location.dates.push({ date, actions: [{ id, name, color }]});
      }
    }
  }
}

// Generate a random scatter of actions for the grid.
const actionFrequency = 6; // coefficient to adjust total actions below
const actionCount = actionFrequency * Math.floor(
  // Correlate total # of actions to the 2 main parameters, fields & dates.
  Math.sqrt(locationRecords.length * dateRange.length)
);
generateActions(actionCount, [startDate, endDate], locationRecords);

provide(actionRecordsKey, actionRecords.value);
provide(locationRecordsKey, locationRecords);
provide(dateRangeKey, dateRange);
provide(actionTypesKey, actionTypes);

</script>

<template>
  <header>
    <h1>Farm Flow</h1>
  </header>
  <main>
    <section class="board">
      <FlowBoard/>
    </section>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  height: 3rem;
  padding: .875rem 60px .875rem 240px;
  text-align: center;
}

h1 {
  color: hsla(160, 100%, 37%, .8);
}

section.board {
  display: grid;
  place-items: center;
  min-height: calc(100vh - 3rem);
  margin: auto;
}
</style>