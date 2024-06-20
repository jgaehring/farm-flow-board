<script setup lang="ts">
import { computed, inject, provide, ref } from 'vue';
import type { DatesByLocation, OperationsByDate, TaskMatrix } from '@/canvas/board';
import {
  cropsKey, emitBoardDeleteKey, emitBoardUpdateKey, indexPositionKey,
  locationsKey, matrixKey, operationsKey, plantsKey, tasksKey,
} from '@/components/providerKeys';
import type { DeleteValue, UpdateValue } from '@/components/providerKeys';
import { sameDate } from '@/utils/date';
import FlowBoardCanvas from '@/components/FlowBoardCanvas.vue';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '@/components/FlowBoardCanvas.vue';
import FlowBoardInteractiveLayer from '@/components/FlowBoardInteractiveLayer.vue';
import IconChevronDown from '@/assets/radix-icons/chevron-down.svg?component';
import IconChevronLeft from '@/assets/radix-icons/chevron-left.svg?component';
import IconChevronRight from '@/assets/radix-icons/chevron-right.svg?component';
import IconChevronUp from '@/assets/radix-icons/chevron-up.svg?component';

const canvas = ref<InstanceType<typeof FlowBoardCanvas> | null>(null);

// All of the core data entities.
const tasks = inject(tasksKey, ref([]));
const plants = inject(plantsKey, ref([]));
const locations = inject(locationsKey, ref([]));
const operations = inject(operationsKey, ref([]));
const crops = inject(cropsKey, ref([]));

const emit = defineEmits<{
  (e: 'update', value: UpdateValue): void,
  (e: 'delete', value: DeleteValue): void,
}>();
provide(emitBoardUpdateKey, (value: UpdateValue) => emit('update', value));
provide(emitBoardDeleteKey, (value: DeleteValue) => emit('delete', value));

// The collection of all field operations, first sorted by location, then within
// each location sorted by date. The locations will be created first, with empty
// dates arrays, and generateTasks will populate the tasks by date after
// randomly generating them according to the possible locations and dates.
const matrix = computed((): TaskMatrix => {
  return locations.value.map(({ id, type, name }) => {
    const crop = crops.value.find(crop => plants.value.some(plant =>
      crop.id === plant.crop.id && plant.location.id === id));
    const dates = tasks.value.reduce((byDate: OperationsByDate[], task) => {
      if (task.location?.id !== id) return byDate;
      const opId = task.operation?.id;
      // Default for unknown ops in sample data: 'Cultivation'
      const op = opId && operations.value.find(o => o.id === opId) || operations.value[2];
      const { date } = task;
      const i = byDate.findIndex(byD => sameDate(byD.date, date));
      if (i < 0) return [...byDate, { date, operations: [op], tasks: [task] }];
      const ops = byDate[i].operations.concat(op);
      const tasksByDate = byDate[i].tasks.concat(task);
      return [
        ...byDate.slice(0, i),
        { date, operations: ops, tasks: tasksByDate },
        ...byDate.slice(i + 1),
      ];
    }, []);
    return { id, type, name, crop, dates } as DatesByLocation;
  });
});
provide(matrixKey, matrix);

// The position of the board along x and y axes. The x coordinate corresponds to
// the index of the date in the date sequence that will occupy the first
// column space. The y coordinate corresponds to the index of the location in
// locations array that will occupy the first row space.
const currentIndex = ref<{ x: number, y: number}>({ x: 0, y: 0 });
provide(indexPositionKey, currentIndex);
</script>

<template>
  <figure>
    <FlowBoardInteractiveLayer
      :width="canvas?.canvas?.width || DEFAULT_CANVAS_WIDTH"
      :height="canvas?.canvas?.height || DEFAULT_CANVAS_HEIGHT"/>
    <FlowBoardCanvas ref="canvas" />
    <button
      type="button"
      v-if="canvas && currentIndex.x > 0"
      class="board-scroll-btn scroll-left"
      @click="canvas.scrollTo(currentIndex.x - 7, currentIndex.y)">
      <IconChevronLeft/>
    </button>
    <button
      type="button"
      v-if="canvas && currentIndex.y > 0"
      class="board-scroll-btn scroll-up"
      @click="canvas.scrollTo(currentIndex.x, currentIndex.y - 3)">
      <IconChevronUp/>
    </button>
    <button
      type="button"
      v-if="canvas && currentIndex.y < canvas.maxi.y"
      class="board-scroll-btn scroll-down"
      @click="canvas.scrollTo(currentIndex.x, currentIndex.y + 3)">
      <IconChevronDown/>
    </button>
    <button
      type="button"
      v-if="canvas && currentIndex.x < canvas.maxi.x"
      class="board-scroll-btn scroll-right"
      @click="canvas.scrollTo(currentIndex.x + 7, currentIndex.y)">
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