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

// Get custom CSS properties (aka, variables) from stylesheet.
export function getCssVar(cssVar: string, def?: string) {
  const rootStyles = useStyleDeclaration(':root');
  return rootStyles.value?.getPropertyValue(cssVar) || def || 'inherit';
}