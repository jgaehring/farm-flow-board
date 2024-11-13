<script lang="ts">
export const DEFAULT_CANVAS_WIDTH: 300 = 300; // <-- default width for any <canvas> element.
export const DEFAULT_CANVAS_HEIGHT: 150 = 150; // <-- default height for any <canvas> element.

// Constants for laying out the grid and label margins along each axis.
export const DEFAULT_GRID = {
  unit: 40,
  lineWidth: 1.5,
};
export const DEFAULT_AXES = {
  yAxisWidth: 240,
  xAxisHeight: 60,
};
</script>

<script setup lang="ts">
import { computed, inject, ref, unref, watch } from 'vue';
import { useMouseInElement } from '@vueuse/core';
import useResizableCanvas from '@/composables/useResizableCanvas';
import { drawBoard, translateBoard } from '@/canvas/board';
import {
  dateSequenceKey, indexPositionKey, isDarkKey, locationsKey, matrixKey,
} from '@/components/providerKeys';  

// Refs for canvas DOM element.
const canvas = ref<HTMLCanvasElement | null>(null);
const maxWidth = ref<number>(DEFAULT_CANVAS_WIDTH);
const maxHeight = ref<number>(DEFAULT_CANVAS_HEIGHT);

const matrix = inject(matrixKey, ref([]));
const locations = inject(locationsKey, ref([]));
const dateSeq = inject(dateSequenceKey, ref([]));
const isDark = inject(isDarkKey);

// The position of the board along x and y axes. The x coordinate corresponds to
// the index of the date in the date sequence that will occupy the first
// column space. The y coordinate corresponds to the index of the location in
// locations array that will occupy the first row space.
// const currentIndex = ref<{ x: number, y: number}>({ x: 0, y: 0 });
const currentIndex = inject(indexPositionKey, ref({ x: 0, y: 0 }));

// For highlighting the row & column on hover.
const mouse = useMouseInElement(canvas);

const highlight = computed(() => {
  const { xAxisHeight, yAxisWidth } = DEFAULT_AXES;
  const { unit } = DEFAULT_GRID;
  const { elementX, elementY, isOutside } = mouse;
  const column = Math.floor((elementX.value - yAxisWidth) / unit);
  const row = Math.floor((elementY.value - xAxisHeight) / unit);
  return { column, row };
});

// Prevent redrawing the canvas while a board transition is underway.
const preventRedraw = ref(false);

// Draw or redraw the board to the canvas; also used as a watcher, so no args.
const drawToCanvas = () => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) {
    console.warn(
      'Aborted drawing the board because the canvas\'s rendering '
      + 'context could not be found.',
    );
  } else if (!preventRedraw.value) {
    const range = { x: unref(dateSeq), y: locations.value };
    const style = {
      isDark: isDark?.value,
      grid: DEFAULT_GRID,
      axes: DEFAULT_AXES,
      highlight: highlight.value,
    };
    drawBoard(ctx, range, unref(matrix.value), currentIndex.value, style);
  }
}

watch([matrix, dateSeq, isDark], drawToCanvas);

// When scrolling, where `m` is the maximum width of the x- or y-axis that can
// be displayed, `n` is the hypothetical length of the axis if all possible
// values were displayed, and `u` is the unit length of each grid cell, then the
// highest value for the grid index, `i`, will be `(n - m) / u`, rounded down.
const maxi = computed<{ x: number, y: number }>(() => {
  const totalValuesX = unref(dateSeq).length;
  const totalValuesY = locations.value.length;
  const maxGridW = maxWidth.value - DEFAULT_AXES.yAxisWidth;
  const maxGridH = maxHeight.value - DEFAULT_AXES.xAxisHeight;
  const maxValuesX = Math.floor(maxGridW / DEFAULT_GRID.unit);
  const maxValuesY = Math.floor(maxGridH / DEFAULT_GRID.unit);
  return {
    x: totalValuesX - maxValuesX,
    y: totalValuesY - maxValuesY,
  };
});
// Find the nearest possible numeric value, given a set of minimum and maximum
// bounds; i.e.: y = min <= x <= max.
const minMax = (mn: number, mx: number, num: number): number =>
  Math.max(mn, Math.min(mx, num));
const scrollTo = (x: number, y: number) => {
  const nextX = minMax(0, maxi.value.x, x);
  const nextY = minMax(0, maxi.value.y, y);
  const xChanged = nextX !== currentIndex.value.x;
  const yChanged = nextY !== currentIndex.value.y;
  const positionChanged = xChanged || yChanged;
  const ctx = canvas.value?.getContext('2d');
  if (positionChanged && ctx) {
    // Prevent the transition from being interrupted before it completes.
    preventRedraw.value = true;
    const range = { x: unref(dateSeq), y: locations.value };
    const translation = {
      from: { x: currentIndex.value.x, y: currentIndex.value.y },
      to: { x: nextX, y: nextY },
      afterAll() {
        currentIndex.value.x = nextX;
        currentIndex.value.y = nextY;
        preventRedraw.value = false;
      },
    };
    const style = {
      isDark: isDark?.value,
      grid: DEFAULT_GRID,
      axes: DEFAULT_AXES,
      highlight: highlight.value,
    };
    translateBoard(ctx, range, unref(matrix), translation, style);
  }
};

// Redraw the board whenever the canvas is resized.
useResizableCanvas(canvas, (width, height) => {
  // Reset reactive canvas properties, clear the canvas, and redraw the board.
  maxWidth.value = width;
  maxHeight.value = height;
  drawToCanvas();
});

watch([mouse.elementX, mouse.elementY, mouse.isOutside], (position, prevPosition) => {
  const { xAxisHeight, yAxisWidth } = DEFAULT_AXES;
  const { unit } = DEFAULT_GRID;
  const [curX, curY, isOutside] = position;
  const [prevX, prevY, wasOutside] = prevPosition;

  // Derive integer values that can be compared to show change. Each integer
  // represents a column or row the mouse is in currently or was in previously.
  const curCol = Math.floor((curX - yAxisWidth) / unit);
  const prevCol = Math.floor((prevX - yAxisWidth) / unit);
  const curRow = Math.floor((curY - xAxisHeight) / unit);
  const prevRow = Math.floor((prevY - xAxisHeight) / unit);

  // If the mouse moved from one column or row to another, or if it moved into
  // or out of the canvas' bounding box, redraw the canvas.
  if (isOutside !== wasOutside || curCol !== prevCol || curRow !== prevRow) {
    drawToCanvas();
  }
});

defineExpose({
  canvas, mouse, scrollTo, maxWidth, maxHeight, maxi,
});
</script>

<template>
  <canvas id="the-board" ref="canvas" role="presentation" height="640" width="960">
    <p>Oops, forgot to add a fallback! &#x1F643;</p>
  </canvas>
</template>

<style scoped>
canvas {
  /**
  * MUST ALWAYS BE DISPLAY BLOCK!
  * Otherwise useResizeObserver may create an infinite loop if its parent node
  * resizes or if any of its ancestors resize.
  */
  display: block;
}
</style>