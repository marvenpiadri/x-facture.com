import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DOCUMENT_TYPE_CONFIGS } from '../../../core/config/document-type-config';
import { sampleDocument } from '../../../core/utils/sample-document';
import { TemplateRendererComponent } from '../template-renderer/template-renderer';

const A4_PX = 794; // 210mm at 96dpi, the width the renderer lays out at

/** A scaled-down, non-interactive render of the real template with sample data. */
@Component({
  selector: 'app-template-thumb',
  standalone: true,
  imports: [TemplateRendererComponent],
  template: `
    <div class="frame" [style.width.px]="width()" [style.height.px]="width() * 1.2" aria-hidden="true">
      <div class="sheet" [style.transform]="'scale(' + width() / A4 + ')'">
        <app-template-renderer [document]="doc()" [templateId]="templateId()" />
      </div>
    </div>`,
  styles: [`
    .frame { position: relative; overflow: hidden; background: #fff; border: 1px solid var(--color-border); border-radius: 6px; box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,.12)); pointer-events: none; }
    .sheet { width: 794px; transform-origin: top left; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateThumbComponent {
  readonly docType = input('invoices');
  readonly templateId = input('modern');
  readonly width = input(220);
  readonly A4 = A4_PX;
  readonly doc = computed(() => sampleDocument(DOCUMENT_TYPE_CONFIGS[this.docType()] ?? DOCUMENT_TYPE_CONFIGS['invoices'], this.templateId()));
}
