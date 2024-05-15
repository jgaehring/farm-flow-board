<script setup lang="ts">
import { computed, ref, type Ref } from 'vue';
import useResizableCanvas from '@/composables/useResizableCanvas';
import drawBoard from '@/canvas/board';
import { actionTypes, locationRecords, randomActions } from './boardSampleData';
import { type ActionRecords, type LocationRecord } from './boardSampleData';

// Constants for laying out the board.
const marginTop = 60;
const marginRight = 20;
const marginBottom = 20;
const marginLeft = 240;
const gridUnit = 40;
const lineWidth = 1.5;
const startDate = new Date(2024, 2, 28);
const endDate = new Date(2024, 9);

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
// Array of Date objects for every date within the specified range.
const dateRange = createDateRange(startDate, endDate);
// The position of the board along x and y axes. The x coordinate corresponds to
// the index of the date in the dateRange array that will occupy the first
// column space. The y coordinate corresponds to the index of the location in
// locationRecords array that will occupy the first row space.
const currentIndex: Ref<{ x: number, y: number}> = ref({ x: 0, y: 0 });

// Based on the length of one of the canvas axes, the margins along that axis,
// and an array of elements to display, return a truncated shallow copy of those
// elements that will fit within the canvas along that axis.
function fitToGrid<T>(
  axisLength: number,
  marginStart: number,
  marginEnd: number,
  elements: T[],
  index?: number,
): T[] {
  const gridLength = axisLength - marginStart - marginEnd;
  const gridElements = Math.floor(gridLength / gridUnit);
  let startIndex = index || 0;
  let stopIndex = startIndex + gridElements;
  if (stopIndex >= elements.length) {
    startIndex = elements.length - gridElements;
    stopIndex = elements.length;
  }
  const truncatedElements = elements.slice(startIndex, stopIndex);
  return truncatedElements;
}

// Compute the board's dimensions and the range of values that can be displayed.
// Adjust the width and height to fit as many columns and rows as possible
// within the board's bounding box (ie, canvas + margins) w/o partially cutting
// off any columns or rows; the last column/row should be fully displayed.
const board = computed(() => {
  const dates = fitToGrid(
    maxWidth.value,
    marginLeft,
    marginRight,
    dateRange,
    currentIndex.value.x,
  );
  const locations = fitToGrid(
    maxHeight.value,
    marginTop,
    marginBottom,
    locationRecords,
    currentIndex.value.y,
  );
  const columns = dates.length;
  const rows = locations.length;
  return {
    width: columns * gridUnit + marginLeft + marginRight,
    height: rows * gridUnit + marginTop + marginBottom,
    margin: {
      top: marginTop,
      right: marginRight,
      bottom: marginBottom,
      left: marginLeft,
    },
    grid: {
      width: columns * gridUnit,
      height: rows * gridUnit,
      unit: gridUnit,
      lineWidth,
    },
    dates,
    locations,
  };
});

const minMax = (mn: number, mx: number, num: number): number =>
  Math.max(mn, Math.min(mx, num));
const scrollTo = (x: number, y: number) => {
  const ctx = canvas.value?.getContext('2d');
  const columns = dateRange.length - board.value.dates.length;
  const rows = locationRecords.length - board.value.locations.length
  const nextX = minMax(0, columns, x);
  const nextY = minMax(0, rows, y);
  const positionChanged = nextX !== currentIndex.value.x
    || nextY !== currentIndex.value.y
  if (ctx && positionChanged) {
    currentIndex.value.x = nextX;
    currentIndex.value.y = nextY;
    drawBoard(ctx, board.value, actionRecords.value);
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
    drawBoard(ctx, board.value, actionRecords.value);
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
      </figure>
      <figcaption>
        <div id="scroll-ctrls">
          <button type="button" @click="scrollTo(currentIndex.x - 1, currentIndex.y)">
            LEFT
          </button>&nbsp;
          <button type="button" @click="scrollTo(currentIndex.x, currentIndex.y - 1)">
            UP
          </button>&nbsp;
          <button type="button" @click="scrollTo(currentIndex.x, currentIndex.y + 1)">
            DOWN
          </button>&nbsp;
          <button type="button" @click="scrollTo(currentIndex.x + 1, currentIndex.y)">
            RIGHT
          </button>&nbsp;
        </div>
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
  width: calc(100% - 2rem);
  height: calc(100% - 3rem);
  /** The canvas will resize, but not instantly. Setting overflow to hidden
    * prevents a flash resize of the figure.
    */
  overflow: hidden;
}

figcaption {
  position: relative;
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

#scroll-ctrls {
  position: absolute;
  top: -4rem;
}

#scroll-ctrls span:hover {
  color: var(--ff-c-green);
  cursor: pointer;
}
</style>
