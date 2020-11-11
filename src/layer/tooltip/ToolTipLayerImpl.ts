import { TootipLayer } from "./ToolTipLayer"

export function DefaultTooltipLayer(): TootipLayer {
  const tooltip = document.createElement("div")

  return {
    ref: tooltip,
    position: target => {},

    show: () => {}
  }
}
