// Get custom CSS properties (aka, variables) from stylesheet.
export default function getCssVar(cssVar: string) {
  const element = document?.querySelector(':root');
  if (!element) return '';
  const rootStyles = window.getComputedStyle(element);
  return rootStyles?.getPropertyValue(cssVar) || '';
}