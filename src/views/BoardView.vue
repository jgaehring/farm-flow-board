<script setup lang="ts">
import { ref, type Ref } from 'vue';
import useResizableCanvas from '@/composables/useResizableCanvas';
import { drawBoard, translateBoard } from '@/canvas/board';
import { actionTypes, locationRecords, randomActions } from './boardSampleData';
import { type ActionRecords, type LocationRecord } from './boardSampleData';
import IconChevronDown from '@/assets/radix-icons/chevron-down.svg?component';
import IconChevronLeft from '@/assets/radix-icons/chevron-left.svg?component';
import IconChevronRight from '@/assets/radix-icons/chevron-right.svg?component';
import IconChevronUp from '@/assets/radix-icons/chevron-up.svg?component';

// Refs for canvas DOM element.
const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const maxWidth: Ref<number> = ref(300); // <-- default width for any <canvas> element.
const maxHeight: Ref<number> = ref(150); // <-- default height for any <canvas> element.

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

// The collection of all field actions, first sorted by location, then within
// each location sorted by date. The locations will be created first, with empty
// dates arrays, and generateActions will populate the actions by date after
// randomly generating them according to the possible locations and dates.
const actionRecords: Ref<ActionRecords> = ref([]);
locationRecords.forEach(({ id, name }) => {
  actionRecords.value[id] = { id, name, dates: [] };
});

// Start and end dates used to populate the x-axis.
const startDate = new Date(2024, 2, 28);
const endDate = new Date(2024, 9);
// Array of Date objects for every date within the specified range.
const dateRange = createDateRange(startDate, endDate);

// Date + location ranges combined so they can be easily passed to drawing functions.
const range = {
  x: dateRange,
  y: locationRecords,
};

// Constants for laying out the grid.
const gridConfig = {
  unit: 40,
  lineWidth: 1.5,
  yAxisWidth: 240,
  xAxisHeight: 60,
};

// The position of the board along x and y axes. The x coordinate corresponds to
// the index of the date in the dateRange array that will occupy the first
// column space. The y coordinate corresponds to the index of the location in
// locationRecords array that will occupy the first row space.
const currentIndex: Ref<{ x: number, y: number}> = ref({ x: 0, y: 0 });

const maxIndex = (maxLength: number, axis: 'x'|'y') => {
  const axisLength = axis === 'x' ? gridConfig.yAxisWidth : gridConfig.xAxisHeight;
  const rangeLength = axis === 'x' ? dateRange.length : locationRecords.length;
  const maxGridLength = maxLength - axisLength;
  const maxDisplayDates = Math.floor(maxGridLength / gridConfig.unit);
  return rangeLength - maxDisplayDates;
};
const minMax = (mn: number, mx: number, num: number): number =>
  Math.max(mn, Math.min(mx, num));
const scrollTo = (x: number, y: number) => {
  const xMaxIndex = maxIndex(maxWidth.value, 'x');
  const yMaxIndex = maxIndex(maxHeight.value, 'y');
  const nextX = minMax(0, xMaxIndex, x);
  const nextY = minMax(0, yMaxIndex, y);
  const xChanged = nextX !== currentIndex.value.x;
  const yChanged = nextY !== currentIndex.value.y;
  const positionChanged = xChanged || yChanged;
  const ctx = canvas.value?.getContext('2d');
  if (positionChanged && ctx) {
    const translation = {
      from: { x: currentIndex.value.x, y: currentIndex.value.y },
      to: { x: nextX, y: nextY },
      afterAll() {
        currentIndex.value.x = nextX;
        currentIndex.value.y = nextY;
      },
    };
    translateBoard(ctx, range, gridConfig, actionRecords.value, translation);
  }
};

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

// Redraw the board whenever the canvas is resized.
useResizableCanvas(canvas, (width, height) => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) {
    console.warn(
      'Aborted drawing the board because the canvas\'s rendering '
      + 'context could not be found.',
    );
  } else {
    // Reset reactive canvas properties, clear the canvas, and redraw the board.
    maxWidth.value = width;
    maxHeight.value = height;
    drawBoard(ctx, range, gridConfig, actionRecords.value, currentIndex.value);
  }
});

</script>

<template>
  <Teleport to="body">
    <header>
      <h1>Farm Flow</h1>
    </header>
    <main>
      <figure>
        <canvas id="the-board" ref="canvas" role="presentation" height="640" width="960">
          <p>Oops, forgot to add a fallback! &#x1F643;</p>
        </canvas>
        <button
          type="button"
          :disabled="currentIndex.x <= 0"
          class="board-scroll-btn scroll-left"
          @click="scrollTo(currentIndex.x - 7, currentIndex.y)">
          <IconChevronLeft/>
        </button>
        <button
          type="button"
          :disabled="currentIndex.y <= 0"
          class="board-scroll-btn scroll-up"
          @click="scrollTo(currentIndex.x, currentIndex.y - 3)">
          <IconChevronUp/>
        </button>
        <button
          type="button"
          :disabled="currentIndex.x >= maxIndex(maxHeight, 'y')"
          class="board-scroll-btn scroll-down"
          @click="scrollTo(currentIndex.x, currentIndex.y + 3)">
          <IconChevronDown/>
        </button>
        <button
          type="button"
          :disabled="currentIndex.x >= maxIndex(maxWidth, 'x')"
          class="board-scroll-btn scroll-right"
          @click="scrollTo(currentIndex.x + 7, currentIndex.y)">
          <IconChevronRight/>
        </button>
      </figure>
      <figcaption>
        <span v-for="(action, i) in actionTypes" :key="i">
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" :fill="action.color"/>
          </svg>
          &nbsp;{{action.name}}
        </span>
      </figcaption>
    </main>
  </Teleport>
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

main {
  display: grid;
  place-items: center;
  min-height: calc(100vh - 3rem);
  margin: auto;
}

figure {
  position: relative;
  width: calc(100% - 2rem);
  height: calc(100% - 3rem);
  /** The canvas will resize, but not instantly. Setting overflow to hidden
    * prevents a flash resize of the figure.
    */
  overflow: hidden;
}

.board-scroll-btn {
  position: absolute;
  background-color: var(--ff-c-white-transparent-1);
  border: 1px solid var(--color-border);
}

.board-scroll-btn:hover {
  background-color: var(--ff-c-white);
  border-color: var(--color-border-hover);
  cursor: pointer;
}

.board-scroll-btn:disabled {
  border-color: var(--color-border);
  background-color: var(--ff-c-white-transparent-2);
  cursor: auto;
}

@media (prefers-color-scheme: dark) {
  .board-scroll-btn {
    background-color: var(--ff-c-black-transparent-1);
  }
  
  .board-scroll-btn:hover {
    background-color: var(--ff-c-black);
  }
  
  .board-scroll-btn:disabled {
    background-color: var(--ff-c-black-transparent-2);
  }
}

.board-scroll-btn.board-scroll-btn.scroll-up,
.board-scroll-btn.scroll-down {
  width: 6rem;
  height: 3rem;
  left: calc(50% + 120px - 3rem);
}

.board-scroll-btn.scroll-right,
.board-scroll-btn.scroll-left {
  width: 3rem;
  height: 6rem;
  top: calc(50% - 3rem);
}

.board-scroll-btn.scroll-up {
  top: -3rem;
}

.board-scroll-btn.scroll-right {
  right: -3rem;
}

.board-scroll-btn.scroll-down {
  bottom: -3rem;
}

.board-scroll-btn.scroll-left {
  left: -3rem;
}

figure:hover .board-scroll-btn.scroll-up {
  top: 75px;
}

figure:hover .board-scroll-btn.scroll-right {
  right: 40px;
}

figure:hover .board-scroll-btn.scroll-down {
  bottom: 40px;
}

figure:hover .board-scroll-btn.scroll-left {
  left: 255px;
}

.board-scroll-btn svg {
  stroke: var(--ff-c-green);
}

.board-scroll-btn:disabled svg {
  stroke: var(--color-border);
}

figcaption {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  padding: 0 60px 0 240px;
}

figcaption span {
  flex: 2 1 20%;
  font-size: 1.5rem;
  text-align: center;
}

figcaption svg {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}
</style>
