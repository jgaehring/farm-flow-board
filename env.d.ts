/// <reference types="vite/client" />

// Allow vite-svg-loader and other Vite plugins to access static assets, such as
// SVG files, as Vue components.
declare module "*?component" {
  const content: string;
  export default content;
}