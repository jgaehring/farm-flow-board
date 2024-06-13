<script setup lang="ts">
import { computed, inject, provide, ref, unref, watch } from 'vue';
import type { Ref } from "vue";
import { useMouseInElement } from '@vueuse/core';
import useResizableCanvas from '@/composables/useResizableCanvas';
import { addHighlighter, drawBoard, translateBoard } from '@/canvas/board';
import type {
  DatesByLocation, HighlightGenerator, OperationsByDate, TaskMatrix,
} from '@/canvas/board';
import {
  cropsKey, dateRangeKey, indexPositionKey, isDarkKey,
  locationsKey, matrixKey, operationsKey, plantsKey, tasksKey,
} from '@/components/providerKeys';
import { sameDate } from '@/utils/date';
import FlowBoardInteractiveLayer from '@/components/FlowBoardInteractiveLayer.vue'
import IconChevronDown from '@/assets/radix-icons/chevron-down.svg?component';
import IconChevronLeft from '@/assets/radix-icons/chevron-left.svg?component';
import IconChevronRight from '@/assets/radix-icons/chevron-right.svg?component';
import IconChevronUp from '@/assets/radix-icons/chevron-up.svg?component';

// Refs for canvas DOM element.
const canvas = ref<HTMLCanvasElement | null>(null);
const maxWidth = ref<number>(300); // <-- default width for any <canvas> element.
const maxHeight = ref<number>(150); // <-- default height for any <canvas> element.

// All of the core data entities.
const tasks = inject(tasksKey, ref([]));
const plants = inject(plantsKey, ref([]));
const locations = inject(locationsKey, ref([]));
const operations = inject(operationsKey, ref([]));
const crops = inject(cropsKey, ref([]));

// The collection of all field operations, first sorted by location, then within
// each location sorted by date. The locations will be created first, with empty
// dates arrays, and generateTasks will populate the tasks by date after
// randomly generating them according to the possible locations and dates.
const matrix = computed((): TaskMatrix => {
  return locations.value.map(({ id, name }) => {
    const crop = crops.value.find(crop => plants.value.some(plant =>
      crop.id === plant.crop.id && plant.location.id === id));
    const dates = tasks.value.reduce((byDate: OperationsByDate[], task) => {
      if (task.location.id !== id) return byDate;
      const opId = task.operation?.id;
      // Default for unknown ops in sample data: 'Cultivation'
      const op = opId && operations.value.find(o => o.id === opId) || operations.value[2];
      const { date } = task;
      const i = byDate.findIndex(byD => sameDate(byD.date, date));
      if (i < 0) return [...byDate, { date, operations: [op] }];
      return [
        ...byDate.slice(0, i),
        { date, operations: byDate[i].operations.concat(op) },
        ...byDate.slice(i + 1),
      ];
    }, []);
    return { id, name, crop, dates } as DatesByLocation;
  });
});
provide(matrixKey, matrix);

// Array of Date objects for every calendar day within the specified range.
const dateRange = inject<Ref<Date[]>>(dateRangeKey, ref<Date[]>([]));
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
const currentIndex = ref<{ x: number, y: number}>({ x: 0, y: 0 });
provide(indexPositionKey, currentIndex);

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
    drawBoard(ctx, range, unref(matrix), currentIndex.value, style.value);
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
</script>

<template>
  <figure>
    <FlowBoardInteractiveLayer
      :x="mouse.elementPositionX"
      :y="mouse.elementPositionX"
      :width="mouse.elementWidth"
      :height="mouse.elementHeight"/>
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
      v-if="currentIndex.y < maxi.y"
      class="board-scroll-btn scroll-down"
      @click="scrollTo(currentIndex.x, currentIndex.y + 3)">
      <IconChevronDown/>
    </button>
    <button
      type="button"
      v-if="currentIndex.x < maxi.x"
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
  background-color: var(--color-neutral-inverse-transparent-2);
  border: 1px solid var(--color-border);
  text-align: center;
}

.board-scroll-btn:hover {
  background-color: var(--color-neutral-inverse-transparent-1);
  border-color: var(--color-border-hover);
  cursor: pointer;
}

.board-scroll-btn:disabled {
  border-color: var(--color-border);
  background-color: var(--color-neutral-inverse-transparent-3);
  cursor: auto;
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
  top: -6rem;
}

.board-scroll-btn.scroll-right {
  right: -6rem;
}

.board-scroll-btn.scroll-down {
  bottom: -6rem;
}

.board-scroll-btn.scroll-left {
  left: -6rem;
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