import { NgModule, SkipSelf, Optional } from '@angular/core';
import { UserGuideService } from './user-guide.service';
import { UserGuideContainerComponent } from './user-guide-container/user-guide-container.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { UserGuideItemComponent } from './user-guide-item/user-guide-item.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [UserGuideContainerComponent, UserGuideItemComponent],
  imports: [SharedModule, OverlayModule],
  entryComponents: [UserGuideContainerComponent, UserGuideItemComponent],
  providers: [UserGuideService]
})
export class UserGuideModule {
  constructor(@Optional() @SkipSelf() parentModule: UserGuideModule) {
    if (parentModule) {
      throw new Error('UserGuideModule is already loaded.');
    }
  }
}
