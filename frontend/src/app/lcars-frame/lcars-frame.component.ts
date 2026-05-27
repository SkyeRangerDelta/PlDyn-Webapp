import { Component, Input } from '@angular/core';

export type LcarsElbowCorner = 'left' | 'right' | 'none';

@Component({
  selector: 'app-lcars-frame',
  templateUrl: './lcars-frame.component.html',
  styleUrl: './lcars-frame.component.scss',
  standalone: false,
})
export class LcarsFrameComponent {
  @Input() headerBand = false;
  @Input() sidebar = false;
  @Input() elbowCorner: LcarsElbowCorner = 'left';
  @Input() headerLabel: string | null = null;
  @Input() sidebarLabels: string[] = [];
}
