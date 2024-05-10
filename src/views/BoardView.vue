<script setup lang="ts">
import { reactive, ref, type Ref } from 'vue';
import useResizableCanvas from '@/composables/useResizableCanvas';
import sampleData from './boardSampleData';
import useStyleDeclaration from '../composables/useStyleDeclaration';

const rootStyles = useStyleDeclaration(':root');
const getCssVar = (v: string, def?: string) =>
  rootStyles.value?.getPropertyValue(v) || def || '';

// Defaults for initializing the board.
const marginTop = 45;
const marginRight = 20;
const marginBottom = 20;
const marginLeft = 300;
const gridUnit = 45;
const lineWidth = 1.5;

// Refs for canvas DOM element.
const canvas: Ref<HTMLCanvasElement | null> = ref(null);

// Grid coordinates for the filled square.
const square = reactive({ x: 3, y: 9 });

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
  // without any rows partially cut off.
  const maxDisplayWidth = canvasWidth - marginLeft - marginRight;
  const maxDisplayColumns = maxDisplayWidth - (maxDisplayWidth % gridUnit);
  const boardWidth = maxDisplayColumns;
  // ...and same for height and columns.
  const rowCount = sampleData.farmFields.length;
  const maxRowHeight = rowCount * gridUnit;
  const maxDisplayHeight = canvasHeight - marginTop - marginBottom;
  const maxDisplayRows = maxDisplayHeight - (maxDisplayHeight % gridUnit);
  const boardHeight = maxRowHeight > maxDisplayRows ? maxDisplayRows : maxRowHeight;

  // Draw the board's background and grid.
  ctx.fillStyle = getCssVar('--vt-c-black-soft', '#222222');
  ctx.strokeStyle = getCssVar('--ff-c-green-transparent', 'rgba(0, 189, 126, 0.3)');
  ctx.lineWidth = lineWidth;
  ctx.fillRect(marginLeft, marginTop, boardWidth, boardHeight);
  drawGrid(ctx, boardWidth, boardHeight);
  labelAxisY(ctx, sampleData.farmFields);
  const stubAxisXLabels = [...Array(boardWidth / gridUnit)];
  labelAxisX(ctx, stubAxisXLabels);

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
  const fontSize = marginTop * .40;
  const textMarginLeft = gridUnit * .5;
  const baseline = marginTop - .5 * fontSize;
  ctx.fillStyle = getCssVar('--color-text');
  ctx.font = `${fontSize}px ${getCssVar('--ff-font-family')}`;
  ctx.textAlign = 'center';
  const y = baseline;
  dates.forEach((d, i) => {
    const label = d.getDate().toString();
    const x = marginLeft + i * gridUnit + textMarginLeft;
    ctx.fillText(label, x, y);
  });
};

const labelAxisY = (ctx: CanvasRenderingContext2D, farmLocations: string[]) => {
  ctx.fillStyle = getCssVar('--color-text');
  ctx.font = `${gridUnit * .80}px ${getCssVar('--ff-font-family')}`;
  ctx.textAlign = 'end';
  const x = marginLeft - 6;
  farmLocations.forEach((loc, i) => {
    const y = marginTop + (i + 1) * gridUnit - gridUnit * .2;
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
