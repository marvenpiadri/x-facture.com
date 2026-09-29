import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-xfacture-page',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './xfacture-page.html',
  styleUrl: './xfacture-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XFacturePage {
}
