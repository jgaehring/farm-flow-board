<script lang="ts">
export const DEFAULT_CANVAS_WIDTH: 300 = 300; // <-- default width for any <canvas> element.
export const DEFAULT_CANVAS_HEIGHT: 150 = 150; // <-- default height for any <canvas> element.
</script>

<script setup lang="ts">
import { computed, inject, ref, unref, watch } from 'vue';
import { useMouseInElement } from '@vueuse/core';
import useResizableCanvas from '@/composables/useResizableCanvas';
import { addHighlighter, drawBoard, translateBoard } from '@/canvas/board';
import type { HighlightGenerator } from '@/canvas/board';
import {
  dateRangeKey, indexPositionKey, isDarkKey, locationsKey, matrixKey,
} from '@/components/providerKeys';  

// Refs for canvas DOM element.
const canvas = ref<HTMLCanvasElement | null>(null);
const maxWidth = ref<number>(DEFAULT_CANVAS_WIDTH);
const maxHeight = ref<number>(DEFAULT_CANVAS_HEIGHT);

const matrix = inject(matrixKey, ref([]));
const locations = inject(locationsKey, ref([]));
const dateRange = inject(dateRangeKey, ref([]));
const isDark = inject(isDarkKey);

// Constants for laying out the grid.
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

// The position of the board along x and y axes. The x coordinate corresponds to
// the index of the date in the dateRange array that will occupy the first
// column space. The y coordinate corresponds to the index of the location in
// locations array that will occupy the first row space.
// const currentIndex = ref<{ x: number, y: number}>({ x: 0, y: 0 });
const currentIndex = inject(indexPositionKey, ref({ x: 0, y: 0 }));

// For highlighting the row & column on hover.
const highlighter = ref<HighlightGenerator|null>(null);

const drawToCanvas = () => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) {
    console.warn(
      'Aborted drawing the board because the canvas\'s rendering '
      + 'context could not be found.',
    );
  } else {
    const range = { x: unref(dateRange), y: locations.value };
    drawBoard(ctx, range, unref(matrix.value), currentIndex.value, style.value);
    highlighter.value = addHighlighter(
      ctx, range, unref(matrix), currentIndex.value, style.value,
    );
  }
}

watch([matrix, dateRange, isDark], drawToCanvas);

// When scrolling, where `m` is the maximum width of the x- or y-axis that can
// be displayed, `n` is the hypothetical length of the axis if all possible
// values were displayed, and `u` is the unit length of each grid cell, then the
// highest value for the grid index, `i`, will be `(n - m) / u`, rounded down.
const maxi = computed<{ x: number, y: number }>(() => {
  const totalValuesX = unref(dateRange).length;
  const totalValuesY = locations.value.length;
  const maxGridW = maxWidth.value - style.value.labels.yAxisWidth;
  const maxGridH = maxHeight.value - style.value.labels.xAxisHeight;
  const maxValuesX = Math.floor(maxGridW / style.value.grid.unit);
  const maxValuesY = Math.floor(maxGridH / style.value.grid.unit);
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
    const range = { x: unref(dateRange), y: locations.value };
    const translation = {
      from: { x: currentIndex.value.x, y: currentIndex.value.y },
      to: { x: nextX, y: nextY },
      afterAll() {
        currentIndex.value.x = nextX;
        currentIndex.value.y = nextY;
        highlighter.value = addHighlighter(
          ctx, range, unref(matrix), currentIndex.value, style.value,
        );
      },
    };
    translateBoard(ctx, range, unref(matrix), translation, style.value);
  }
};

// Redraw the board whenever the canvas is resized.
useResizableCanvas(canvas, (width, height) => {
  // Reset reactive canvas properties, clear the canvas, and redraw the board.
  maxWidth.value = width;
  maxHeight.value = height;
  drawToCanvas();
});

const mouse = useMouseInElement(canvas);
watch([mouse.elementX, mouse.elementY], (position, prevPosition) => {
  if (!highlighter.value) return;
  highlighter.value.next([...position, ...prevPosition]);
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