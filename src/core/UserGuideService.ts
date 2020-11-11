import { DefaultMaskLayer } from "../layer/mask/MaskLayerImpl"

export interface UserGuideOptionStep {
  // 目标元素选择式
  elementSelector: string
  // 消息框内容(描述)
  description: string
  // 展示消息框时触发
  onEnter?: (targetElement: HTMLElement) => void
  // 是否映射click事件(绑定遮罩层click事件到目标元素click事件)
  bindEvent?: boolean
  /*
   * @description: 是否可以进行下一步 (点击下一步按钮后, 将等待此observable, 直到接收到第一个值, 才显示(进行)下一步骤)
   */
  canNext?: (targetElement: HTMLElement) => Promise<boolean>
}

export class UserGuideService {
  constructor() {}

  create(steps: UserGuideOptionStep[], config: { enableBackDropClose?: boolean }) {
    const maskLayer = DefaultMaskLayer()
    config.positionStrategy = this.overlay.position().global()
    config.panelClass = "max-zindex"
    const overlayRef = this.overlay.create(config)
    // overlay置顶
    overlayRef.hostElement.style.zIndex = "99999"
    const maskOverlayRef = new UserGuideMaskRef(overlayRef, steps, enableBackDropClose)
    maskOverlayRef.afterClosed$.subscribe(closeData => {
      if (closeData.type === "complate" || closeData.type === "manualy") {
        // 不再提示(记住)
        if (closeData.data.noMore) {
          this.setNoMoreFlag("true")
        } else if (closeData.data.noMore === false) {
          this.setNoMoreFlag("false")
        }
      }
    })
    // 为guide container 注入mask ref
    const injector = this.createInjector(maskOverlayRef, this.injector)
    const container = new ComponentPortal(UserGuideContainerComponent, null, injector)
    overlayRef.attach(container)
    return maskOverlayRef
  }

  setNoMoreFlag(value: "true" | "false") {
    window.localStorage.setItem("user-guide-nomore", value)
  }

  getNoMoreFlag() {
    return window.localStorage.getItem("user-guide-nomore") === "true"
  }
}
