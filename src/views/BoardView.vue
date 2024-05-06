<script setup lang="ts">
</script>

<template>
  <div id="the-board-wrapper">
    <div id="the-board">
      <header>
        <div class="wrapper">
          <h1>Farm Flow</h1>
          <nav>
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/demo">Demo</RouterLink>
            <RouterLink to="/demo/about">About</RouterLink>
          </nav>
        </div>
      </header>
      <main>
        <h2>The Board</h2>
      </main>
    </div>
  </div>
</template>

<style scoped>
#the-board-wrapper {
  min-height: 100vh;
}

#the-board {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  font-weight: normal;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  #the-board-wrapper {
    display: flex;
    place-items: center;
  }

  #the-board {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0 2rem;
  }

  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
