<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';

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

// Defaults.
const defaultValues = {
  // Bounding box (ie, the <section> containing the <canvas>).
  bb: {
    width: 960,
    height: 640,
    margin: 20,
  },
  grid: { unit: 20, lineWidth: 1.5 },
};

// Reactive refs to DOM elements.
const canvas: Ref<HTMLCanvasElement | null> = ref(null);
const ctx: Ref<CanvasRenderingContext2D | null> = ref(null);

// Initialize the board.
onMounted(() => {
  canvas.value = document.getElementById('the-board') as HTMLCanvasElement;
  ctx.value = canvas.value.getContext('2d');
  if (!canvas.value || !canvas.value.parentElement || !ctx.value) {
    console.error('Failed to get canvas context. Check element target.')
    return;
  }

  // Constants for the board dimensions.
  const { bb, grid } = defaultValues;
  const boardWidth = bb.width - (bb.margin * 2);
  const boardHeight = bb.height - (bb.margin * 2);

  // Set context styles etc.
  ctx.value.fillStyle = style.c.black.soft;
  ctx.value.strokeStyle = style.c.green.transparent;
  ctx.value.lineWidth = defaultValues.grid.lineWidth;

  // Create the board's background.
  ctx.value.fillRect(bb.margin, bb.margin, boardWidth, boardHeight);

  // Begin drawing the grid by setting the x and y coordinates for where each
  // line will start (origin) and where they will end (terminus). Horizontal
  // lines will always have their points on the x-origin and x-terminus, while
  // vertical lines will always have their 
  const gridLineOriginX = bb.margin;
  const gridLineTerminusX = boardWidth + bb.margin;
  const gridLineOriginY = bb.margin;
  const gridLineTerminusY = boardHeight + bb.margin;

  // Now loop through the horizontal grid...
  for (
    // ...starting from the top...
    let y = gridLineOriginY + grid.unit;
    // ...ending at the bottom...
    y < gridLineTerminusY;
    // ...iterating through each line, spaced accordingly by grid units.
    y += grid.unit
  ) {
    ctx.value.beginPath();
    ctx.value.moveTo(gridLineOriginX, y);
    ctx.value.lineTo(gridLineTerminusX, y);
    ctx.value.stroke();
  }

  // Then the vertical grid...
  for (
    // ...starting from the left...
    let x = gridLineOriginX + grid.unit;
    // ...ending at the right...
    x < gridLineTerminusX;
    // ...iterating through by grid units.
    x += grid.unit
  ) {
    ctx.value.beginPath();
    ctx.value.moveTo(x, gridLineOriginY);
    ctx.value.lineTo(x, gridLineTerminusY);
    ctx.value.stroke();
  }

  // Draw a square on top of a grid location w/ differently colored borderlines,
  // so that the orientation and direction of draw actions can be confirmed. 
  const sqLocX = 42;
  const sqLocY = 24;
  const sqOriginX = sqLocX * grid.unit;
  const sqOriginY = sqLocY * grid.unit;
  const sqTerminusX = sqOriginX + grid.unit;
  const sqTerminusY = sqOriginY + grid.unit;
  ctx.value.fillStyle = 'tomato';
  ctx.value.fillRect(sqOriginX, sqOriginY, grid.unit, grid.unit);

  // Top line.
  ctx.value.beginPath();
  ctx.value.strokeStyle = 'blue';
  ctx.value.moveTo(sqOriginX, sqOriginY);
  ctx.value.lineTo(sqTerminusX, sqOriginY);
  ctx.value.stroke();
  
  // Right line.
  ctx.value.beginPath();
  ctx.value.strokeStyle = 'green';
  ctx.value.moveTo(sqTerminusX, sqOriginY);
  ctx.value.lineTo(sqTerminusX, sqTerminusY);
  ctx.value.stroke();
  
  // Bottom line.
  ctx.value.beginPath();
  ctx.value.strokeStyle = 'yellow';
  ctx.value.moveTo(sqTerminusX, sqTerminusY);
  ctx.value.lineTo(sqOriginX, sqTerminusY);
  ctx.value.stroke();
  
  // Left line.
  ctx.value.beginPath();
  ctx.value.strokeStyle = 'red';
  ctx.value.moveTo(sqOriginX, sqTerminusY);
  ctx.value.lineTo(sqOriginX, sqOriginY);
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
