<script setup lang="ts">
import { provide, ref } from 'vue';
import { actionRecordsKey, locationRecordsKey, dateRangeKey, actionTypesKey } from '@/data/providerKeys';
import { actionTypes, locationRecords, randomActions } from '@/data/boardSampleData';
import type { ActionRecords, LocationRecord } from '@/data/boardSampleData';
import FlowBoard from '@/components/FlowBoard.vue';
import FlowBoardActions from '@/components/FlowBoardActions.vue';
import FlowMenubar from '@/components/FlowBoardMenubar.vue';
import { createDateRange, sameDate } from '@/utils/date';

// The collection of all field actions, first sorted by location, then within
// each location sorted by date. The locations will be created first, with empty
// dates arrays, and generateActions will populate the actions by date after
// randomly generating them according to the possible locations and dates.
const actionRecords = ref<ActionRecords>([]);
locationRecords.forEach(({ id, name }) => {
  actionRecords.value[id] = { id, name, dates: [] };
});

// Start and end dates used to populate the x-axis.
const startDate = new Date(2024, 2, 28);
const endDate = new Date(2024, 9);
// Array of Date objects for every date within the specified range.
const dateRange = createDateRange(startDate, endDate);

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
  <div class="layout">
    <header>
      <h1>Farm Flow</h1>
      <div class="menubar">
        <FlowMenubar/>
      </div>
    </header>
    <main>
      <FlowBoard/>
    </main>
    <footer>
      <FlowBoardActions/>
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
  padding: 1.5rem 3rem 1.5rem calc(3rem + 240px);
}

h1 {
  display: inline-block;
  color: hsla(160, 100%, 37%, .8);
  margin-right: 1.5rem;
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