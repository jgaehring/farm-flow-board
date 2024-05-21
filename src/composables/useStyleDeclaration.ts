import { ref } from 'vue';
import { tryOnMounted } from '@vueuse/core';

export default function useStyleDeclaration(selector: string) {
  const declaration = ref<CSSStyleDeclaration|null>(null);
  tryOnMounted(() => {
    const element = document.querySelector(selector);
    if (element) {
      declaration.value = window.getComputedStyle(element);
    }
  });
  return declaration;
}
