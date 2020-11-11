import { MaskLayer } from "./MaskLayer"

export function DefaultMaskLayer(): MaskLayer {
  const mask = document.createElement("div")
  mask.classList.add("aki-ug-mask-layer")
  return {
    ref: mask,
    show: () => {}
  }
}
