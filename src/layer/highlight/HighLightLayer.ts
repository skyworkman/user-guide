export interface HighlightLayer {
  ref: HTMLElement
  // 矫正定位
  position(target: HTMLElement): void
  show(): void
}
