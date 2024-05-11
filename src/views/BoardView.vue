<script setup lang="ts">
import { reactive, ref, type Ref } from 'vue';
import useResizableCanvas from '@/composables/useResizableCanvas';
import sampleData from './boardSampleData';
import useStyleDeclaration from '../composables/useStyleDeclaration';

const rootStyles = useStyleDeclaration(':root');
const getCssVar = (v: string, def?: string) =>
  rootStyles.value?.getPropertyValue(v) || def || '';

// Defaults for initializing the board.
const marginTop = 60;
const marginRight = 20;
const marginBottom = 20;
const marginLeft = 240;
const gridUnit = 40;
const lineWidth = 1.5;

// Refs for canvas DOM element.
const canvas: Ref<HTMLCanvasElement | null> = ref(null);

// Grid coordinates for the filled square.
const square = reactive({ x: 3, y: 9 });

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
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long' });
type MonthAttrs = { name: string, startCol: number, endCol: number };
// Reducer function derives the x-axis grid coordinates covered by each month.
const reduceDatesToMonths = (months: MonthAttrs[], d: Date) => {
  const name = monthFmt.format(d);
  const prev = months[months.length - 1];
  if (!prev || prev.name !== name) {
    const startCol = prev?.endCol || 0;
    return [...months, { name, startCol, endCol: startCol + 1 }];
  }
  const endCol = prev.endCol + 1;
  return [
    ...months.slice(0, months.length - 1),
    { ...prev, endCol }
  ];
};

// Based on the length of one of the canvas axes, the margins along that axis,
// and an array of elements to display, return a truncated shallow copy of those
// elements that will fit within the canvas along that axis.
function fitToGrid<T>(
  axisLength: number,
  marginStart: number,
  marginEnd: number,
  elements: T[],
): T[] {
  const maxDisplayWidth = axisLength - marginStart - marginEnd;
  const maxColumns = Math.floor(maxDisplayWidth / gridUnit);
  const gridCount = elements.length <= maxColumns ? elements.length : maxColumns;
  const truncatedElements = elements.slice(0, gridCount);
  return truncatedElements;
}

const drawBoard = (canvasWidth: number, canvasHeight: number) => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) {
    console.warn(
      'Aborted drawing the board because the canvas\'s rendering '
      + 'context could not be found.',
    );
    return;
  }

  // Adjust board width to fit the most rows within bounding box (canvas + margins)
  // without any rows partially cut off; similarly for height / columns.
  const dateRange = createDateRange(new Date(2024, 2, 28), new Date(2024, 9));
  const displayDates = fitToGrid(canvasWidth, marginLeft, marginRight, dateRange);
  const boardWidth = displayDates.length * gridUnit;
  const { farmFields: fieldRange } = sampleData;
  const displayFields = fitToGrid(canvasHeight, marginTop, marginBottom, fieldRange);
  const boardHeight = displayFields.length * gridUnit;

  // Draw the board's background and grid.
  ctx.fillStyle = getCssVar('--vt-c-black-soft', '#222222');
  ctx.strokeStyle = getCssVar('--ff-c-green-transparent', 'rgba(0, 189, 126, 0.3)');
  ctx.lineWidth = lineWidth;
  ctx.fillRect(marginLeft, marginTop, boardWidth, boardHeight);
  drawGrid(ctx, boardWidth, boardHeight);
  labelAxisY(ctx, displayFields);
  labelAxisX(ctx, displayDates);

  // And finally the square.
  drawSquare(ctx, square.x, square.y);
};

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Set the x + y coordinates where each line will start (origin) & end (terminus).
  const originX = marginLeft;
  const originY = marginTop;
  const terminusX = marginLeft + width;
  const terminusY = marginTop + height;

  // Now loop through the horizontal gridlines...
  for (
    // ...starting from the top...
    let y = originY + gridUnit;
    // ...ending at the bottom...
    y < terminusY;
    // ...iterating through each line, spaced accordingly by grid units.
    y += gridUnit
  ) {
    ctx.beginPath();
    // Horizontal gridlines will have endpoints on the x-origin & x-terminus.
    ctx.moveTo(originX, y);
    ctx.lineTo(terminusX, y);
    ctx.stroke();
  }

  // Then the vertical gridlines...
  for (
    // ...starting from the left...
    let x = originX + gridUnit;
    // ...ending at the right...
    x < terminusX;
    // ...iterating through by grid units.
    x += gridUnit
  ) {
    ctx.beginPath();
    // Vertical gridlines will have endpoints on the y-origin & y-terminus.
    ctx.moveTo(x, originY);
    ctx.lineTo(x, terminusY);
    ctx.stroke();
  }
};

const labelAxisX = (ctx: CanvasRenderingContext2D, dates: Date[]) => {
  // Label the x-axis with the date numeral directly above each column.
  const dateLineheight = Math.floor(marginTop * (5 / 9));
  const dateFontSize = Math.floor(dateLineheight * (5 / 9));
  const dateBaseline = marginTop - Math.floor(dateLineheight * (1 / 3));
  const dateTextMarginLeft = gridUnit * .5;
  dates.forEach((d, i) => {
    const label = d.getDate().toString();
    const x = marginLeft + i * gridUnit + dateTextMarginLeft;
    ctx.fillStyle = getCssVar('--color-text');
    ctx.font = `${dateFontSize}px ${getCssVar('--ff-font-family')}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, dateBaseline);
  });

  // Add the months across the top, spread out over the date numerals.
  const months = dates.reduce(reduceDatesToMonths, []);
  const monthLineheight = Math.floor(marginTop * (3 / 9));
  const monthFontSize = Math.floor(monthLineheight * (2 / 3));
  const monthBaseline = monthLineheight - Math.floor(monthLineheight * (1 / 5));
  months.forEach((month) => {
    const width = (month.endCol - month.startCol) * gridUnit;
    ctx.strokeStyle = getCssVar('--ff-c-green-transparent');
    const bgX = marginLeft + month.startCol * gridUnit;
    ctx.strokeRect(bgX, 0, width, monthLineheight);
    const textX = bgX + .5 * width;
    ctx.fillStyle = getCssVar('--color-text');
    ctx.font = `${monthFontSize}px ${getCssVar('--ff-font-family')}`;
    ctx.textAlign = 'center';
    ctx.fillText(month.name, textX, monthBaseline);
  });
};

const labelAxisY = (ctx: CanvasRenderingContext2D, farmLocations: string[]) => {
  ctx.fillStyle = getCssVar('--color-text');
  ctx.font = `${gridUnit * .65}px ${getCssVar('--ff-font-family')}`;
  ctx.textAlign = 'end';
  const x = marginLeft - 6;
  farmLocations.forEach((loc, i) => {
    const y = marginTop + (i + 1) * gridUnit - gridUnit * .25;
    ctx.fillText(loc, x, y);
  });
};

// Fill a square on top of a grid location w/ differently colored borderlines,
// so that the orientation and direction of draw actions can be confirmed.
const drawSquare = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  // Four points of the square.
  const originX = (x - 1) * gridUnit + marginLeft;
  const originY = (y - 1) * gridUnit + marginTop;
  const terminusX = originX + gridUnit;
  const terminusY = originY + gridUnit;

  // Fill.
  ctx.fillStyle = 'tomato';
  ctx.fillRect(originX, originY, gridUnit, gridUnit);

  // Top line.
  ctx.beginPath();
  ctx.strokeStyle = 'blue';
  ctx.moveTo(originX, originY);
  ctx.lineTo(terminusX, originY);
  ctx.stroke();
  
  // Right line.
  ctx.beginPath();
  ctx.strokeStyle = 'green';
  ctx.moveTo(terminusX, originY);
  ctx.lineTo(terminusX, terminusY);
  ctx.stroke();
  
  // Bottom line.
  ctx.beginPath();
  ctx.strokeStyle = 'yellow';
  ctx.moveTo(terminusX, terminusY);
  ctx.lineTo(originX, terminusY);
  ctx.stroke();
  
  // Left line.
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.moveTo(originX, terminusY);
  ctx.lineTo(originX, originY);
  ctx.stroke();
}

// Redraw the board whenever the canvas is resized.
useResizableCanvas(canvas, drawBoard);

</script>

<template>
  <Teleport to="body">
    <header>
      <h1>Farm Flow</h1>
    </header>
    <main>
      <section>
        <canvas id="the-board" ref="canvas" role="presentation" height="640" width="960">
          <p>Oops, forgot to add a fallback! &#x1F643;</p>
        </canvas>
      </section>
    </main>
  </Teleport>
</template>

<style scoped>
header {
  line-height: 1.5;
  height: 3rem;
  padding: 1.5rem 2rem 0  2rem;
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

section {
  width: calc(100% - 2rem);
  height: calc(100% - 3rem);
  /** The canvas will resize, but not instantly. Setting overflow to hidden
    * prevents a flash resize of the section.
    */
  overflow: hidden;
}

</style>
