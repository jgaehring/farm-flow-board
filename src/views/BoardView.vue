<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { actionRecordsKey, locationRecordsKey, dateRangeKey, actionTypesKey, boardIdKey } from '@/data/providerKeys';
import { actionTypes, crop2023, locationRecords, randomActions } from '@/data/boardSampleData';
import type { ActionRecords, LocationRecord } from '@/data/boardSampleData';
import FlowBoard from '@/components/FlowBoard.vue';
import FlowBoardActions from '@/components/FlowBoardActions.vue';
import FlowBoardMenubar from '@/components/FlowBoardMenubar.vue';
import { createDateRange, sameDate } from '@/utils/date';
import LogoType from '@/assets/logotype_color.svg?component';

const boardId = ref<'2023'|'random'>('2023');

// The collection of all field actions, first sorted by location, then within
// each location sorted by date. The locations will be created first, with empty
// dates arrays, and generateActions will populate the actions by date after
// randomly generating them according to the possible locations and dates.
const actionRecords = ref<ActionRecords>([]);
locationRecords.forEach(({ id, name }) => {
  actionRecords.value[id] = { id, name, dates: [] };
});

// Start and end dates used to populate the x-axis.
const startDate = ref<Date>(new Date(2024, 2, 28));
const endDate = ref<Date>(new Date(2024, 9));
// Array of Date objects for every date within the specified range.
const dateRange = computed(() => createDateRange(startDate.value, endDate.value));

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

function loadBoard(name: '2023'|'random') {
  if (name === 'random') {
    actionRecords.value = [];
    startDate.value = new Date(2024, 2, 28);
    endDate.value = new Date(2024, 9);
    locationRecords.forEach(({ id, name }) => {
      actionRecords.value[id] = { id, name, dates: [] };
    });
    // Generate a random scatter of actions for the grid.
    const actionFrequency = 6; // coefficient to adjust total actions below
    const actionCount = actionFrequency * Math.floor(
      // Correlate total # of actions to the 2 main parameters, fields & dates.
      Math.sqrt(locationRecords.length * dateRange.value.length)
    );
    generateActions(actionCount, [startDate.value, endDate.value], locationRecords);
  } else {
    startDate.value = new Date(2023, 4, 6);
    endDate.value = new Date(2023, 10, 15);
    actionRecords.value = name === '2023' ? crop2023 : [];
  }
}
loadBoard(boardId.value);

provide(actionRecordsKey, actionRecords);
provide(locationRecordsKey, locationRecords);
provide(dateRangeKey, dateRange);
provide(actionTypesKey, actionTypes);
provide(boardIdKey, boardId);

</script>

<template>
  <div class="layout">
    <header>
      <div class="logotype">
        <LogoType/>
      </div>
      <div class="menubar">
        <FlowBoardMenubar @select-board="loadBoard"/>
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

main {
  flex: 4 1 calc(100vh - 12rem);
  width: 100%;
  padding: 0 3rem;
}

footer {
  flex: 1 1 6rem;
}
</style>