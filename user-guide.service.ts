import { Overlay, OverlayConfig } from "@angular/cdk/overlay";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { Injectable, Injector } from "@angular/core";
import { interval, Observable, timer } from "rxjs";
import { filter, first, map } from "rxjs/operators";
import { UserGuideContainerComponent } from "./user-guide-container/user-guide-container.component";
import { UserGuideMaskRef } from "./user-guide-mask-ref";

export interface GuideStepItemData {
  // 目标元素选择式
  elementSelector: string;
  // 消息框内容(描述)
  description: string;
  // 展示消息框时触发
  onEnter?: (targetElement: HTMLElement) => void;
  // 是否映射click事件(绑定遮罩层click事件到目标元素click事件)
  bindEvent?: boolean;
  // 是否可以进行下一步 (点击下一步按钮后, 将等待此observable, 直到接收到第一个值, 才显示(进行)下一步骤)
  canNext?: (targetElement: HTMLElement) => Observable<boolean>;
}

/**
 * 使用向导service
 */
@Injectable()
export class UserGuideService {
  constructor(private overlay: Overlay, private injector: Injector) {}

  createUserGuide(steps: GuideStepItemData[], enableBackDropClose?: boolean) {
    const config = new OverlayConfig();
    config.positionStrategy = this.overlay.position().global();
    config.panelClass = "max-zindex";
    const overlayRef = this.overlay.create(config);
    // overlay置顶
    overlayRef.hostElement.style.zIndex = "99999";

    const maskOverlayRef = new UserGuideMaskRef(
      overlayRef,
      steps,
      enableBackDropClose
    );
    maskOverlayRef.afterClosed$.subscribe((closeData) => {
      if (closeData.type === "complate" || closeData.type === "manualy") {
        // 不再提示(记住)
        if (closeData.data.noMore) {
          this.setNoMoreFlag("true");
        } else if (closeData.data.noMore === false) {
          this.setNoMoreFlag("false");
        }
      }
    });

    // 为guide container 注入mask ref
    const injector = this.createInjector(maskOverlayRef, this.injector);
    const container = new ComponentPortal(
      UserGuideContainerComponent,
      null,
      injector
    );

    overlayRef.attach(container);
    return maskOverlayRef;
  }

  setNoMoreFlag(value: "true" | "false") {
    window.localStorage.setItem("user-guide-nomore", value);
  }

  getNoMoreFlag() {
    return window.localStorage.getItem("user-guide-nomore") === "true";
  }

  private createInjector(ref: UserGuideMaskRef, inj: Injector) {
    const injectorTokens = new WeakMap([[UserGuideMaskRef, ref]]);
    return new PortalInjector(inj, injectorTokens);
  }

  showTaskCreateGuide(taskName: string, enableBackDropClose: boolean = false) {
    return this.createUserGuide(
      [
        {
          elementSelector: "[data-guide=tasklist-link]",
          description: "新建检查任务<br />在导航菜单点击任务列表",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=tasklistpage-newbutton]",
          description: "新建检查任务<br />点击新建任务, 创建检查任务",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=tasknew-modal-db-label]",
          description: "新建检查任务<br />选择检查类型<br />数据库检查",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=tasknew-model] button.ant-btn-primary",
          description: "新建检查任务<br />确定选择",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskbasic-taskname]",
          description: "任务基础信息配置<br />输入任务名称",
          onEnter: (t: HTMLElement) => {
            const taskNameInput = t.querySelector("input") as HTMLInputElement;
            taskNameInput.value = taskName;
            taskNameInput.dispatchEvent(new Event("input"));
          },
        },
        {
          elementSelector: "[data-guide=taskbasic-taskSecurityLevel]",
          description: "任务基础信息配置<br />选择任务密级",
          bindEvent: false,
        },
        {
          elementSelector: "[data-guide=taskbasic-organizationName]",
          description: "任务基础信息配置<br />选择单位名称",
          bindEvent: true,
          onEnter: (t) => {
            timer(0, 200)
              .pipe(
                filter(() => {
                  let item: HTMLElement | undefined;
                  document.querySelectorAll("li").forEach((it) => {
                    if (it.innerText === "演示使用组织机构") {
                      item = it;
                    }
                  });
                  if (item != null) {
                    item.setAttribute(
                      "data-guide",
                      "taskbasic-organizationName-test"
                    );
                    return true;
                  }
                  return false;
                }),
                first()
              )
              .subscribe();
          },
        },
        {
          elementSelector: "[data-guide=taskbasic-organizationName-test]",
          description: "任务基础信息配置<br />选择单位名称",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskbasic-checkPerson]",
          description: "任务基础信息配置<br />输入检查人姓名",
          onEnter: (t: HTMLElement) => {
            const taskNameInput = t.querySelector("input") as HTMLInputElement;
            taskNameInput.value = "测试向导";
            taskNameInput.dispatchEvent(new Event("input"));
          },
        },
        {
          elementSelector: "[data-guide=taskbasic-targetDepartment]",
          description: "任务基础信息配置<br />输入被检部门",
          onEnter: (t: HTMLElement) => {
            const taskNameInput = t.querySelector("input") as HTMLInputElement;
            taskNameInput.value = "测试向导";
            taskNameInput.dispatchEvent(new Event("input"));
          },
        },
        {
          elementSelector: "[data-guide=taskbasic-high-config-trigger]",
          description:
            "任务基础信息配置<br />还可以根据需要配置任务高级选项<br/>点击展开任务高级选项",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskbasic-high-config-panel]",
          description: "任务基础信息配置<br />任务高级选项面板",
        },
        {
          elementSelector: "[data-guide=taskwizard-nextstep-1]:not([disabled])",
          description:
            "任务基础信息配置<br />任务基础信息配置完毕<br/>点击下一步",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=datasource-db-type]",
          description: "数据源配置<br/>选择数据库类型",
          bindEvent: true,
        },

        {
          elementSelector: "[data-guide=datasource-db-type-postgress]",
          description: "数据源配置<br/>选择数据库类型",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=datasource-db-ip]",
          description: "数据源配置<br/>数据库类型：填写-数据库ip",
          onEnter: (t) => {
            const taskNameInput = t.querySelector("input") as HTMLInputElement;
            taskNameInput.value = "127.0.0.1";
            taskNameInput.dispatchEvent(new Event("input"));
          },
        },
        {
          elementSelector: "[data-guide=datasource-db-port]",
          description: "数据源配置<br/>填写-数据库端口",
          onEnter: (t) => {
            const taskNameInput = t.querySelector("input") as HTMLInputElement;
            taskNameInput.value = "5455";
            taskNameInput.dispatchEvent(new Event("input"));
          },
        },
        {
          elementSelector: "[data-guide=datasource-db-user]",
          description: "数据源配置<br/>填写-数据库用户名",
          onEnter: (t) => {
            const taskNameInput = t.querySelector("input") as HTMLInputElement;
            taskNameInput.value = "postgres";
            taskNameInput.dispatchEvent(new Event("input"));
          },
        },
        {
          elementSelector: "[data-guide=datasource-db-password]",
          description: "数据源配置<br/>填写-数据库密码",
          onEnter: (t) => {
            const taskNameInput = t.querySelector("input") as HTMLInputElement;
            taskNameInput.value = "123ABCdef*";
            taskNameInput.dispatchEvent(new Event("input"));
          },
        },
        {
          elementSelector: "[data-guide=datasource-db-name]",
          description: "数据源配置<br/>填写-要检查的数据库",
          onEnter: (t) => {
            const taskNameInput = t.querySelector("input") as HTMLInputElement;
            taskNameInput.value = "db_guide";
            taskNameInput.dispatchEvent(new Event("input"));
          },
        },
        {
          elementSelector: "[data-guide=datasource-db-testconnect]",
          description: "数据源配置<br/>测试数据库连接, 等待校验结果",
          bindEvent: true,
        },
        {
          elementSelector:
            "[data-guide=datasource-db-tables] .ant-tree-checkbox",
          description: "数据源配置<br/>校验通过，选择要扫描的数据表",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskwizard-nextstep-2]:not([disabled])",
          description: "数据源配置<br/>数据源配置完成<br/>点击下一步",
          bindEvent: true,
        },
        {
          elementSelector:
            "[data-guide=taskwizard-nextstep-ok] .ant-btn-primary",
          description: "数据源配置<br/>查看数据库表权限<br/>点击确定",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=matchpolicies-edit-button]",
          description: "检查策略配置<br/>修改检查策略",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=matchpolicies-dialog-swtich-content]",
          description: "检查策略配置<br/>默认选中关键词与标签匹配策略",
        },
        {
          elementSelector:
            "[data-guide=matchpolicies-dialog-next-step]:not([disabled])",
          description: "检查策略配置<br/>点击下一步",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=matchpolicies-dialog-keywords-input]",
          description: "检查策略配置<br/>输入匹配关键词",
        },
        {
          elementSelector: "[data-guide=matchpolicies-dialog-keywords-add]",
          description: "检查策略配置<br/>点击添加",
        },
        {
          elementSelector:
            "[data-guide=matchpolicies-dialog-next-step]:not([disabled])",
          description: "检查策略配置<br/>点击下一步",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=matchpolicies-dialog-tags-content]",
          description: "检查策略配置<br/>选择匹配的标签",
        },
        {
          elementSelector:
            "[data-guide=matchpolicies-dialog-enter]:not([disabled])",
          description: "检查策略配置<br/>点击确定",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskwizard-nextstep-3]:not([disabled])",
          description: "检查策略配置<br/>检查策略配置完成<br/>点击下一步",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskwizard-nextstep-updata]",
          description: "调度策略配置<br/>修改调度策略",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskwizard-nextstep-show]",
          description: "调度策略配置<br/>选择调度策略",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskwizard-nextstep-show-ok]",
          description: "调度策略配置<br/>点击完成",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskwizard-nextstep-4]:not([disabled])",
          description: "调度策略配置<br/>点击完成",
          bindEvent: true,
        },
        {
          elementSelector:
            "[data-guide=tasklistpage-taskitem] .tasklistpage-taskitem",
          description: "任务检查<br/这就是我们刚刚创建的任务",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=tasklistpage-taskitem-startbtn]",
          description: "任务检查<br/>点击开始任务",
          bindEvent: true,
        },
        {
          elementSelector: ".ant-popover-buttons button.ant-btn-primary",
          description: "任务检查<br/>确定",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=tasklistpage-taskitem] .progress",
          description: "任务检查<br/>等待任务检查完成",
          canNext: (t: HTMLElement) => {
            return interval(500).pipe(
              filter((_) => {
                const ele = t.querySelector(".subtitle");
                return (
                  !!ele &&
                  !!ele.textContent &&
                  ele.textContent.trim() === "成功完成"
                );
              }),
              first(),
              map((_) => true)
            );
          },
        },
        {
          elementSelector: "[data-guide=tasklistpage-taskitem-result]",
          description: "任务检查<br/>任务检查完成<br/>点击查看结果<br/>",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=tasklistpage-taskitem-result-info-btn]",
          description: "任务检查<br/>点击查看任务详情",
          bindEvent: true,
        },
        {
          elementSelector: "[data-guide=taskresult-filtercard]",
          description:
            "查看任务结果<br/>这里可以对检查结果进行筛选<br/><em>使用向导结束<br/>结束后请手动删除此示例任务, 以免影响正常数据</em>",
        },
      ],
      enableBackDropClose
    );
  }
}
