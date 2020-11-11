import { OverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { GuideStepItemData } from './user-guide.service';

export interface OverlayCloseEvent {
  type: 'backdropClick' | 'complate' | 'manualy';
  data: any;
}

/**
 * 使用向导模板框架(遮罩包装)
 */
export class UserGuideMaskRef {
  afterClosed$ = new Subject<OverlayCloseEvent>();

  constructor(public overlay: OverlayRef, public data: GuideStepItemData[], public enableBackDropClose?: boolean) {}

  backDropClose(closeData?: any) {
    this.close({ type: 'backdropClick', data: closeData });
  }

  complateClose(closeData: { noMore: boolean }) {
    this.close({ type: 'complate', data: closeData });
  }

  close(item: OverlayCloseEvent) {
    this.overlay.dispose();
    this.afterClosed$.next({ type: item.type, data: item.data });
    this.afterClosed$.complete();
  }
}
