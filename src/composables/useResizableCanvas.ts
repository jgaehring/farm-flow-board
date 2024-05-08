import { isRef, onMounted, ref, type MaybeRefOrGetter, type Ref } from 'vue';
import { useParentElement, useResizeObserver } from '@vueuse/core';

declare type MaybeCanvas = HTMLCanvasElement|null;
declare type TargetCanvas = string|MaybeRefOrGetter<MaybeCanvas>;
declare type ResizeCanvasCB = (width: number, height: number) => void;

export default function useResizableCanvas(target: TargetCanvas, cb: ResizeCanvasCB) {
  const canvas: Ref<MaybeCanvas> = isRef(target) ? target : ref(null);

  if (typeof target === 'string') {
    onMounted(() => {
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