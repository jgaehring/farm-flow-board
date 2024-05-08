<script setup lang="ts">
import { computed, onMounted, reactive, ref, type Ref } from 'vue';
import { useResizeObserver } from '@vueuse/core';

// Style constants.
const style = {
  c: {
    green: {
      base: 'rgba(0, 189, 126, 1)',
      transparent: 'rgba(0, 189, 126, 0.3)',
    },
    black: {
      base: '#181818',
      soft: '#222222',
      mute: '#282828'
    },
  },
};

// Refs to canvas DOM element and its 2D rendering context.
const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const ctx: Ref<CanvasRenderingContext2D | null> = ref(null);

// Bounding box (ie, the <section> containing the <canvas>).
const boundingBox: Ref<HTMLElement | null> = ref(null);
interface BBDimensions { width: number, height: number, margin: number, }
const bb: BBDimensions = reactive({
  width: boundingBox.value?.clientWidth || 960,
  height: boundingBox.value?.clientHeight || 640,
  margin: 20,
});

// Grid dimensions.
interface GridDimensions {
  width: number,
  height: number,
  unit: number,
  lineWidth: number,
  origin: { x: number, y: number },
  terminus: { x: number, y: number },
}
const grid = computed<GridDimensions>(() => {
  console.log('computing grid dimensions');
  return {
    width: bb.width - (bb.margin * 2),
    height: bb.height - (bb.margin * 2),
    // These are constants for now, but grouped here for consistency.
    unit: 20,
    lineWidth: 1.5,
    // Set the x + y coordinates where each line will start (origin) & end (terminus).
    origin: { x: bb.margin, y: bb.margin },
    terminus: { x: bb.width - bb.margin, y: bb.height - bb.margin },
  };
});

// Grid coordinates for the filled square, plus its computed dimensions.
interface GridCoordinates { x: number, y: number }
const square: GridCoordinates = reactive({ x: 42, y: 24 });

const resizeCanvas = (dimensions: { width: number, height: number }) => {
  bb.width = dimensions.width;
  bb.height = dimensions.height;
  if (canvas.value) {
    canvas.value.width = dimensions.width;
    canvas.value.height = dimensions.height;
  }
}

const drawBoard = (ctx: CanvasRenderingContext2D, bb: BBDimensions) => {
  // Create the board's background.
  ctx.fillStyle = style.c.black.soft;
  ctx.strokeStyle = style.c.green.transparent;
  ctx.lineWidth = grid.value.lineWidth;
  ctx.fillRect(bb.margin, bb.margin, grid.value.width, grid.value.height);

  // Now loop through the horizontal grid...
  for (
    // ...starting from the top...
    let y = grid.value.origin.y + grid.value.unit;
    // ...ending at the bottom...
    y < grid.value.terminus.y;
    // ...iterating through each line, spaced accordingly by grid units.
    y += grid.value.unit
  ) {
    ctx.beginPath();
    // Horizontal gridlines will have endpoints on the x-origin & x-terminus.
    ctx.moveTo(grid.value.origin.x, y);
    ctx.lineTo(grid.value.terminus.x, y);
    ctx.stroke();
  }

  // Then the vertical grid...
  for (
    // ...starting from the left...
    let x = grid.value.origin.x + grid.value.unit;
    // ...ending at the right...
    x < grid.value.terminus.x;
    // ...iterating through by grid units.
    x += grid.value.unit
  ) {
    ctx.beginPath();
    // Vertical gridlines will have endpoints on the y-origin & y-terminus.
    ctx.moveTo(x, grid.value.origin.y);
    ctx.lineTo(x, grid.value.terminus.y);
    ctx.stroke();
  }
};

// Fill a square on top of a grid location w/ differently colored borderlines,
// so that the orientation and direction of draw actions can be confirmed.
const drawSquare = (ctx: CanvasRenderingContext2D, coords: GridCoordinates) => {
  const { x, y } = coords;
  const originX = x * grid.value.unit;
  const originY = y * grid.value.unit;
  const terminusX = originX + grid.value.unit;
  const terminusY = originY + grid.value.unit;


  ctx.fillStyle = 'tomato';
  ctx.fillRect(
    originX,
    originY,
    grid.value.unit,
    grid.value.unit,
  );

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

onMounted(() => {
  canvas.value = document.getElementById('the-board') as HTMLCanvasElement;
  if (canvas.value) {
    boundingBox.value = canvas.value.parentElement;
    ctx.value = canvas.value.getContext('2d');
  }
  if (boundingBox.value && ctx.value) {
    resizeCanvas({
      width: boundingBox.value.clientWidth,
      height: boundingBox.value.clientHeight,
    });
    drawBoard(ctx!.value, bb);
    drawSquare(ctx!.value, { x: square.x, y: square.y });
  } else {
    console.error('Failed to get canvas context. Check target element.')
  }
});

useResizeObserver(boundingBox, ([bbResizeObserverEntry]) => {
  if (!canvas.value) {
    canvas.value = document.getElementById('the-board') as HTMLCanvasElement;
  } else {
    boundingBox.value = canvas.value.parentElement;
    ctx.value = canvas.value.getContext('2d');
  }
  if (ctx.value) {
    const { contentRect: { width, height } } = bbResizeObserverEntry;
    resizeCanvas({ width, height });
    drawBoard(ctx!.value, bb);
    drawSquare(ctx!.value, { x: square.x, y: square.y });
  } else {
    console.error('Failed to get canvas context. Check target element.')
  }
});



</script>

<template>
  <Teleport to="body">
    <header>
      <h1>Farm Flow</h1>
    </header>
    <main>
      <section>
        <canvas id="the-board" role="presentation" height="640" width="960">
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
}

</style>
