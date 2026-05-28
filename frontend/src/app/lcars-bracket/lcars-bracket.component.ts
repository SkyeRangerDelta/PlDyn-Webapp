import { Component, Input } from '@angular/core';

export type LcarsBracketTone = 'orange' | 'peach' | 'periwinkle' | 'purple' | 'red';

@Component({
  selector: 'app-lcars-bracket',
  templateUrl: './lcars-bracket.component.html',
  styleUrl: './lcars-bracket.component.scss',
  standalone: false,
})
export class LcarsBracketComponent {
  /** Label shown in the top bar (e.g. "LOGIN", "RECENT UPLOADS"). */
  @Input() label = '';
  /** Label rendered at the start of the bottom bar. */
  @Input() footerLabel: string | null = '';
  /** Whether to render the bottom bracket (defaults to true). */
  @Input() showBottom = true;
  /** Whether to render the left sidebar (defaults to true). */
  @Input() showSidebar = true;
  /** Bracket frame tone — drives every segment color. */
  @Input() tone: LcarsBracketTone = 'orange';
}
