import { ref, type Ref } from 'vue';
import { tryOnMounted } from '@vueuse/core';

export default function useStyleDeclaration(selector: string) {
  const declaration: Ref<CSSStyleDeclaration|null> = ref(null);
  tryOnMounted(() => {
    const element = document.querySelector(selector);
    if (element) {
      declaration.value = window.getComputedStyle(element);
    }
  });
  return declaration;
}
