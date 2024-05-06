<script setup lang="ts">
</script>

<template>
  <Teleport to="body">
    <header>
      <h1>Farm Flow</h1>
    </header>
    <main>
      <section>
        <h1>The Board</h1>
      </section>
    </main>
  </Teleport>
</template>

<style scoped>
header {
  line-height: 1.5;
  height: 3rem;
  padding: 1.5rem 1.5rem 0  1.5rem;
}
main {
  display: flex;
  place-items: center;
  max-width: 1280px;
  min-height: calc(100vh - 3rem);
  margin: auto;
}

</style>
