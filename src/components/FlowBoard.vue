<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import { useMouseInElement } from '@vueuse/core';
import useResizableCanvas from '@/composables/useResizableCanvas';
import { addHighlighter, drawBoard, translateBoard } from '@/canvas/board';
import type { HighlightGenerator } from '@/canvas/board';
import type { ActionRecords, LocationRecord } from '@/data/boardSampleData';
import { actionRecordsKey, dateRangeKey, locationRecordsKey } from '@/data/providerKeys';
import IconChevronDown from '@/assets/radix-icons/chevron-down.svg?component';
import IconChevronLeft from '@/assets/radix-icons/chevron-left.svg?component';
import IconChevronRight from '@/assets/radix-icons/chevron-right.svg?component';
import IconChevronUp from '@/assets/radix-icons/chevron-up.svg?component';

// Refs for canvas DOM element.
const canvas = ref<HTMLCanvasElement | null>(null);
const maxWidth = ref<number>(300); // <-- default width for any <canvas> element.
const maxHeight = ref<number>(150); // <-- default height for any <canvas> element.

// The collection of all field actions, first sorted by location, then within
// each location sorted by date.
const actionRecords = inject<ActionRecords>(actionRecordsKey) || [];
const locationRecords = inject<LocationRecord[]>(locationRecordsKey) || [];

// Array of Date objects for every date within the specified range.
const dateRange = inject<Date[]>(dateRangeKey) || [];

// Date + location ranges combined so they can be easily passed to drawing functions.
const range = {
  x: dateRange,
  y: locationRecords,
};

// Constants for laying out the grid.
const style = {
  grid: {
    unit: 40,
    lineWidth: 1.5,
  },
  labels: {
    yAxisWidth: 240,
    xAxisHeight: 60,
  },
};

// The position of the board along x and y axes. The x coordinate corresponds to
// the index of the date in the dateRange array that will occupy the first
// column space. The y coordinate corresponds to the index of the location in
// locationRecords array that will occupy the first row space.
const currentIndex = ref<{ x: number, y: number}>({ x: 0, y: 0 });

// For highlighting the row & column on hover.
const highlighter = ref<HighlightGenerator|null>(null);

const maxIndex = (maxLength: number, axis: 'x'|'y') => {
  const axisLength = axis === 'x' ? style.labels.yAxisWidth : style.labels.xAxisHeight;
  const rangeLength = axis === 'x' ? dateRange.length : locationRecords.length;
  const maxGridLength = maxLength - axisLength;
  const maxDisplayDates = Math.floor(maxGridLength / style.grid.unit);
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
        highlighter.value = addHighlighter(
          ctx, range, actionRecords, currentIndex.value, style,
        );
      },
    };
    translateBoard(ctx, range, actionRecords, translation, style);
  }
};

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
    drawBoard(ctx, range, actionRecords, currentIndex.value, style);
    highlighter.value = addHighlighter(
      ctx, range, actionRecords, currentIndex.value, style,
    );
  }
});

const mouse = useMouseInElement(canvas);
watch([mouse.elementX, mouse.elementY], (position, prevPosition) => {
  if (!highlighter.value) return;
  highlighter.value.next([...position, ...prevPosition]);
});

</script>

<template>
  <figure>
    <canvas id="the-board" ref="canvas" role="presentation" height="640" width="960">
      <p>Oops, forgot to add a fallback! &#x1F643;</p>
    </canvas>
    <button
      type="button"
      v-if="currentIndex.x > 0"
      class="board-scroll-btn scroll-left"
      @click="scrollTo(currentIndex.x - 7, currentIndex.y)">
      <IconChevronLeft/>
    </button>
    <button
      type="button"
      v-if="currentIndex.y > 0"
      class="board-scroll-btn scroll-up"
      @click="scrollTo(currentIndex.x, currentIndex.y - 3)">
      <IconChevronUp/>
    </button>
    <button
      type="button"
      v-if="currentIndex.x < maxIndex(maxHeight, 'y')"
      class="board-scroll-btn scroll-down"
      @click="scrollTo(currentIndex.x, currentIndex.y + 3)">
      <IconChevronDown/>
    </button>
    <button
      type="button"
      v-if="currentIndex.x < maxIndex(maxWidth, 'x')"
      class="board-scroll-btn scroll-right"
      @click="scrollTo(currentIndex.x + 7, currentIndex.y)">
      <IconChevronRight/>
    </button>
  </figure>
</template>

<style scoped>
figure {
  position: relative;
  width: 100%;
  height: 100%;
  /** The canvas will resize, but not instantly. Setting overflow to hidden
    * prevents a flash resize of the figure.
    */
  overflow: hidden;
}

canvas {
  /**
  * MUST ALWAYS BE DISPLAY BLOCK!
  * Otherwise useResizeObserver may create an infinite loop if its parent node
  * resizes or if any of ancestors resizes.
  */
  display: block;
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
</style>