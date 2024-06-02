import { ref } from 'vue';

export function useStyleDeclaration(selector: string) {
  const declaration = ref<CSSStyleDeclaration|null>(null);
  const element = document?.querySelector(selector);
  if (element) {
    declaration.value = window.getComputedStyle(element);
  }
  return declaration;
}

// Get custom CSS properties (aka, variables) from stylesheet.
export function getCssVar(cssVar: string) {
  const element = document?.querySelector(':root');
  if (!element) return '';
  const rootStyles = window.getComputedStyle(element);
  return rootStyles?.getPropertyValue(cssVar) || '';
}