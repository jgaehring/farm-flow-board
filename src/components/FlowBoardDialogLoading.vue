<script setup lang="ts">
import { Dialog } from 'radix-vue/namespaced';
import { VisuallyHidden } from 'radix-vue';

defineProps<{
  open: boolean,
}>();

</script>

<template>
  <Dialog.Root :open="open" >
    <Dialog.Portal>

      <Dialog.Overlay class="loading-dialog-overlay" />
      <Dialog.Content class="loading-dialog-content" >

        <Dialog.Title class="loading-dialog-title" >
          Loading
        </Dialog.Title>

        <VisuallyHidden>
          <Dialog.Description class="loading-dialog-description" >
            Loading data for the Farm Flow Board.
          </Dialog.Description>
        </VisuallyHidden>

      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</template>

<style scoped>
/* reset */
button, input {
  all: unset;
}

.loading-dialog-title {
  text-align: center;
  color: var(--color-text);
  /* margin-bottom: 1.5rem; */
}
.loading-dialog-overlay {
  background-color: var(--ff-c-black-transparent-1);
  position: fixed;
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.loading-dialog-content {
  background-color: var(--color-background-soft);
  border-radius: 6px;
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 3rem 6rem;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
