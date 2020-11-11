import { HighlightLayer } from "./HighLightLayer"
export function DefaultHighlightLayer(): HighlightLayer {
  const tooltip = document.createElement("div")
  return {
    ref: tooltip,
    position: target => {},
    show: () => {}
  }
}
