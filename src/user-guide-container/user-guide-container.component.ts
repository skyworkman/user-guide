import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { OverlayCloseEvent, UserGuideMaskRef } from '../user-guide-mask-ref';
import { GuideStepItemData, UserGuideService } from '../user-guide.service';

@Component({
  selector: 'app-user-guide-container',
  templateUrl: './user-guide-container.component.html',
  styleUrls: ['./user-guide-container.component.less']
})
export class UserGuideContainerComponent implements OnInit, OnDestroy {
  steps: GuideStepItemData[];
  context;

  currentStepIndexSource = new BehaviorSubject<number>(0);
  currentStep$: Observable<GuideStepItemData>;
  loading = false;
  intervalIndex;

  get currentStepIndex() {
    return this.currentStepIndexSource.value;
  }

  get currentStep() {
    return this.steps[this.currentStepIndexSource.value];
  }

  constructor(private ref: UserGuideMaskRef, private userGuide: UserGuideService) {}

  ngOnInit() {
    this.steps = this.ref.data;

    this.currentStep$ = this.currentStepIndexSource.pipe(
      map(index => this.steps[index]),
      publishReplay(1),
      refCount()
    );
  }

  ngOnDestroy() {
    if (this.intervalIndex) {
      clearInterval(this.intervalIndex);
    }
  }

  onNextStep(data: { noMore: boolean }) {
    // 最后一步(没有更多的向导步骤了)
    if (this.currentStepIndex + 1 >= this.steps.length) {
      this.ref.complateClose(data);
      return;
    }

    const nextitem = this.steps[this.currentStepIndex + 1];

    const nextElement = document.querySelector(nextitem.elementSelector);
    if (!nextElement) {
      this.forceGet(nextitem.elementSelector);
    } else {
      this.currentStepIndexSource.next(this.currentStepIndex + 1);
    }
  }

  // 点击了关闭向导
  onClose(event: OverlayCloseEvent) {
    this.ref.close(event);
  }

  /**
   * 强制获取元素
   * 因为页面渲染延迟, 无法第一时间获取到元素, 将重复获取,直到获取到为止
   * @param elementSelector
   */
  forceGet(elementSelector: string) {
    this.loading = true;
    this.intervalIndex = setInterval(() => {
      const targetElement = document.querySelector(elementSelector);
      if (!!targetElement) {
        clearInterval(this.intervalIndex);
        this.loading = false;
        this.currentStepIndexSource.next(this.currentStepIndex + 1);
      }
    }, 500);
  }

  // 点击背景遮罩关闭(如果启用了的话)
  close() {
    if (this.ref.enableBackDropClose) {
      this.ref.backDropClose(null);
    }
  }
}
