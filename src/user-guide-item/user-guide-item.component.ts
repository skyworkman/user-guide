import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { delay, filter, map, publishReplay, refCount, take, tap } from 'rxjs/operators';
import { OverlayCloseEvent } from '../user-guide-mask-ref';
import { GuideStepItemData } from '../user-guide.service';

@Component({
  selector: 'app-user-guide-item',
  templateUrl: './user-guide-item.component.html',
  styleUrls: ['./user-guide-item.component.less']
})
export class UserGuideItemComponent implements OnChanges {
  // 当前步骤项
  @Input()
  item: GuideStepItemData;
  // 点击了下一步
  @Output()
  OnNextStep = new EventEmitter<{ noMore: boolean }>();
  // 点击了关闭向导
  @Output()
  OnClose = new EventEmitter<OverlayCloseEvent>();
  @Input()
  loading = false;
  // 是否为最后一步
  @Input()
  lastStep: boolean;
  // 下一步按钮的显示文本
  @Input()
  buttonText: string;

  // 消息框元素
  @ViewChild('messageBox', { read: ElementRef, static: true })
  messageBox: ElementRef<HTMLDivElement>;

  targetElementSource = new BehaviorSubject<HTMLElement>(null);
  // 目标元素留白的样式(位置,大小)
  itemStyle$: Observable<{ x: number; y: number; width: number; height: number }>;
  // 是否不再提示
  noMore = false;

  get targetElement() {
    return this.targetElementSource.value;
  }

  constructor() {
    this.itemStyle$ = this.targetElementSource.pipe(
      filter(t => t !== null),
      delay(100),
      tap(element => {
        // 滚动到视图
        this.targetElement.scrollIntoView({ block: 'nearest' });
        if (this.item.onEnter) {
          this.item.onEnter(element);
        }
      }),
      map(element => {
        // 获取目标元素在浏览器的坐标
        let rect = element.getBoundingClientRect();
        // 元素紧挨着页面最底部, 为了美观, 页面滚动向上偏移一下,
        if (rect.bottom >= document.body.clientHeight) {
          const parent = this.getScrollableParent(this.targetElement);
          parent.scrollTop += 24;
          rect = element.getBoundingClientRect();
        }
        // 镂空此区域的大小,位置如图hi
        const style = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
        // 消息框的位置, 因为需要等待渲染,消息框不能及时更新 setimeout一下,放到渲染后执行
        setTimeout(() => {
          // 当前消息框的原生元素
          const msgBox = this.messageBox.nativeElement;
          // 消息框向左偏移
          let left = style.width;
          // 消息框向上偏移
          let top = msgBox.offsetHeight;
          // 如果消息框向左偏移,超出了屏幕
          const outset = left + msgBox.clientWidth + style.x - document.body.clientWidth;
          if (outset > 0) {
            // 处理一下
            left = left - outset;
          }
          // 如果消息框向上偏移,超出了屏幕
          const lessTop = top - style.y;
          if (lessTop > 0) {
            // 处理一下
            top = top - lessTop;
          }
          // 消息框应用偏移
          this.messageBox.nativeElement.style.transform = `translate(${left}px,-${top}px)`;
        }, 0);
        return style;
      }),
      publishReplay(1),
      refCount()
    );
  }

  getScrollableParent(node: HTMLElement): HTMLElement {
    if (node == null) {
      return null;
    }

    if (node.scrollHeight > node.clientHeight) {
      return node;
    } else {
      return this.getScrollableParent(node.parentElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('item' in changes) {
      // 切换目标元素
      this.targetElementSource.next(document.querySelector(this.item.elementSelector));
    }
    if ('lastStep' in changes) {
      if (this.lastStep) {
        this.noMore = true;
      }
    }
  }

  bindEvent() {
    if (this.item.canNext) {
      this.loading = true;
      this.item.canNext(this.targetElement).subscribe(_ => {
        this.loading = false;
        // 触发目标元素的click事件
        this.targetElement.click();
        this.OnNextStep.emit({ noMore: this.noMore });
      });
    } else {
      // 触发目标元素的click事件
      this.targetElement.click();
      this.OnNextStep.emit({ noMore: this.noMore });
    }
  }

  close() {
    this.OnClose.emit({
      type: 'manualy',
      data: {
        noMore: this.noMore
      }
    });
  }

  // 点击了下一步按钮
  nextClick() {
    // 如果处在loading, 则不继续
    if (this.loading) {
      return;
    }
    // 启用了映射事件(需要触发目标元素的事件)
    if (this.item.bindEvent) {
      this.bindEvent();
    } else {
      // 如果step设置了是否可以进行下一步项
      if (this.item.canNext) {
        this.loading = true;
        // 等待canNext的值
        this.item
          .canNext(this.targetElement)
          .pipe(take(1))
          .subscribe(_ => {
            this.OnNextStep.emit({ noMore: this.noMore });
            this.loading = false;
          });
      } else {
        this.OnNextStep.emit({ noMore: this.noMore });
      }
    }
  }
}
