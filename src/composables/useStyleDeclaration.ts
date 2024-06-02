import { ref } from 'vue';

export default function useStyleDeclaration(selector: string) {
  const declaration = ref<CSSStyleDeclaration|null>(null);
  const element = document?.querySelector(selector);
  if (element) {
    declaration.value = window.getComputedStyle(element);
  }
  return declaration;
}

// Get custom CSS properties (aka, variables) from stylesheet.
export function getCssVar(cssVar: string) {
  const rootStyles = useStyleDeclaration(':root');
  return rootStyles.value?.getPropertyValue(cssVar) || '';
}