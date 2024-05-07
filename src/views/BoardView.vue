<script setup lang="ts">
import { computed, onMounted, reactive, ref, type Ref } from 'vue';

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

// Refs to key DOM elements.
const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const ctx: Ref<CanvasRenderingContext2D | null> = ref(null);

// Bounding box (ie, the <section> containing the <canvas>).
const bb: {
  el: HTMLElement | null, width: number, height: number, margin: number,
} = reactive({
  el: null,
  width: 960,
  height: 640,
  margin: 20,
});

// Grid dimensions.
const grid = computed<{
  width: number,
  height: number,
  unit: number,
  lineWidth: number,
  origin: { x: number, y: number },
  terminus: { x: number, y: number },
}>(() => ({
  width: bb.width - (bb.margin * 2),
  height: bb.height - (bb.margin * 2),
  // These are constants for now, but grouped here for consistency.
  unit: 20,
  lineWidth: 1.5,
  // Set the x + y coordinates where each line will start (origin) & end (terminus).
  origin: { x: bb.margin, y: bb.margin },
  terminus: { x: bb.width - bb.margin, y: bb.height - bb.margin },
}));

// Grid coordinates for the filled square, plus its computed dimensions.
const square: { x: number, y: number } = reactive({ x: 42, y: 24 });
const sq = computed<{
  origin: { x: number, y: number },
  terminus: { x: number, y: number },
}>(() => ({
  origin: {
    x: square.x * grid.value.unit,
    y: square.y * grid.value.unit,
  },
  terminus: {
    x: square.x * grid.value.unit + grid.value.unit,
    y: square.y * grid.value.unit + grid.value.unit,
  },
}));

// Initialize the board.
onMounted(() => {
  canvas.value = document.getElementById('the-board') as HTMLCanvasElement;
  ctx.value = canvas.value.getContext('2d');
  if (!canvas.value || !canvas.value.parentElement || !ctx.value) {
    console.error('Failed to get canvas context. Check element target.')
    return;
  }

  // Reset the canvas to be the same size as the bounding box.
  bb.el = canvas.value.parentElement;
  bb.width = bb.el.offsetWidth;
  bb.height = bb.el.offsetHeight;
  canvas.value.width = bb.width;
  canvas.value.height = bb.height;

  // Set context styles etc.
  ctx.value.fillStyle = style.c.black.soft;
  ctx.value.strokeStyle = style.c.green.transparent;
  ctx.value.lineWidth = grid.value.lineWidth;

  // Create the board's background.
  ctx.value.fillRect(bb.margin, bb.margin, grid.value.width, grid.value.height);

  // Now loop through the horizontal grid...
  for (
    // ...starting from the top...
    let y = grid.value.origin.y + grid.value.unit;
    // ...ending at the bottom...
    y < grid.value.terminus.y;
    // ...iterating through each line, spaced accordingly by grid units.
    y += grid.value.unit
  ) {
    ctx.value.beginPath();
    // Horizontal gridlines will have endpoints on the x-origin & x-terminus.
    ctx.value.moveTo(grid.value.origin.x, y);
    ctx.value.lineTo(grid.value.terminus.x, y);
    ctx.value.stroke();
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
    ctx.value.beginPath();
    // Vertical gridlines will have endpoints on the y-origin & y-terminus.
    ctx.value.moveTo(x, grid.value.origin.y);
    ctx.value.lineTo(x, grid.value.terminus.y);
    ctx.value.stroke();
  }

  // Fill a square on top of a grid location w/ differently colored borderlines,
  // so that the orientation and direction of draw actions can be confirmed. 
  ctx.value.fillStyle = 'tomato';
  ctx.value.fillRect(
    sq.value.origin.x,
    sq.value.origin.y,
    grid.value.unit,
    grid.value.unit,
  );

  // Top line.
  ctx.value.beginPath();
  ctx.value.strokeStyle = 'blue';
  ctx.value.moveTo(sq.value.origin.x, sq.value.origin.y);
  ctx.value.lineTo(sq.value.terminus.x, sq.value.origin.y);
  ctx.value.stroke();
  
  // Right line.
  ctx.value.beginPath();
  ctx.value.strokeStyle = 'green';
  ctx.value.moveTo(sq.value.terminus.x, sq.value.origin.y);
  ctx.value.lineTo(sq.value.terminus.x, sq.value.terminus.y);
  ctx.value.stroke();
  
  // Bottom line.
  ctx.value.beginPath();
  ctx.value.strokeStyle = 'yellow';
  ctx.value.moveTo(sq.value.terminus.x, sq.value.terminus.y);
  ctx.value.lineTo(sq.value.origin.x, sq.value.terminus.y);
  ctx.value.stroke();
  
  // Left line.
  ctx.value.beginPath();
  ctx.value.strokeStyle = 'red';
  ctx.value.moveTo(sq.value.origin.x, sq.value.terminus.y);
  ctx.value.lineTo(sq.value.origin.x, sq.value.origin.y);
  ctx.value.stroke();
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
