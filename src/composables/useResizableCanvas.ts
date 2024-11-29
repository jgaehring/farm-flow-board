import { isRef, ref } from 'vue';
import type { Ref } from 'vue';
import { tryOnMounted, useParentElement, useResizeObserver } from '@vueuse/core';

declare type MaybeCanvas = HTMLCanvasElement|null;
declare type TargetCanvas = string|Ref<MaybeCanvas>;
declare type ResizeCanvasCB = (width: number, height: number) => void;

export default function useResizableCanvas(target: TargetCanvas, cb: ResizeCanvasCB) {
  const canvas = isRef(target) ? target : ref<MaybeCanvas>(null);

  if (typeof target === 'string') {
    tryOnMounted(() => {
      canvas.value = document.getElementById(target) as HTMLCanvasElement;
    });
  }

  const parent = useParentElement(canvas) as Readonly<Ref<HTMLElement | null>>;  
  if (canvas.value && parent.value) {
    canvas.value.width = parent.value.clientWidth;
    canvas.value.height = parent.value.clientHeight;
  }
  if (parent.value) cb(parent.value.clientWidth, parent.value.clientHeight);

  useResizeObserver(parent, (entries) => {
    if (!canvas.value && typeof target === 'string') {
      canvas.value = document.getElementById(target) as MaybeCanvas;
    }
    const { contentRect: { width, height } } = entries[0];
    if (canvas.value) {
      canvas.value.width = width;
      canvas.value.height = height;
    }
    cb(width, height);
  });

  return canvas;
}