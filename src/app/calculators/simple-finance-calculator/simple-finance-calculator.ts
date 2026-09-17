import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CalculatorLayoutComponent } from '../../shared/components/calculator-layout/calculator-layout';
import { CalculatorDefinition, getCalculatorBySlug } from '../calculator-registry';
import { ADDITIONAL_CALCULATORS } from '../additional-calculators';

@Component({
  selector:'app-simple-finance-calculator', standalone:true,
  imports:[CommonModule,FormsModule,CalculatorLayoutComponent],
  templateUrl:'./simple-finance-calculator.html', styleUrl:'./simple-finance-calculator.css',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class SimpleFinanceCalculatorComponent {
  private readonly route=inject(ActivatedRoute);
  readonly slug=this.route.snapshot.routeConfig?.path ?? '';
  readonly definition=computed<CalculatorDefinition>(()=>getCalculatorBySlug(this.slug) ?? ADDITIONAL_CALCULATORS[0]);
  readonly values=signal<Record<string,number>>({a:1000,b:1200,c:10,d:0.2});

  set(key:string,value:string|number){const n=Number(value);this.values.update(v=>({...v,[key]:Number.isFinite(n)?n:0}));}
  value(key:string){return this.values()[key] ?? 0;}

  readonly result=computed(()=>{const v=this.values(),s=this.slug;const a=Number(v.a)||0,b=Number(v.b)||0,c=Number(v.c)||0,d=Number(v.d)||0;
    if(s==='roi-calculator') return {primary: a ? ((b-a)/a)*100 : 0, label:'Return on investment', unit:'%', secondary:(b-a), secondaryLabel:'Net gain', prefix:'$'};
    if(s==='roas-calculator') return {primary:a?b/a:0,label:'ROAS',unit:'x',secondary:a?b/a*100:0,secondaryLabel:'ROAS percentage',prefix:''};
    if(s==='customer-acquisition-cost-calculator') return {primary:b? a/b:0,label:'Customer acquisition cost',unit:'',secondary:b,secondaryLabel:'New customers',prefix:'$'};
    if(s==='customer-lifetime-value-calculator'){const revenue=a*b*c;return {primary:revenue,label:'Customer lifetime value',unit:'',secondary:revenue*d,secondaryLabel:'Gross-profit LTV',prefix:'$'};}
    if(s==='cagr-calculator') return {primary:a>0&&c>0?((b/a)**(1/c)-1)*100:0,label:'Compound annual growth rate',unit:'%',secondary:b-a,secondaryLabel:'Total change',prefix:'$'};
    const discount=a*d;return {primary:a-discount,label:'Sale price',unit:'',secondary:discount,secondaryLabel:'You save',prefix:'$'};
  });

  readonly inputConfig=computed(()=>{
    if(this.slug==='roi-calculator') return [['a','Investment cost',1000],['b','Final value / return',1200]];
    if(this.slug==='roas-calculator') return [['a','Advertising spend',1000],['b','Attributed revenue',4000]];
    if(this.slug==='customer-acquisition-cost-calculator') return [['a','Sales & marketing cost',5000],['b','New customers',50]];
    if(this.slug==='customer-lifetime-value-calculator') return [['a','Average order value',100],['b','Purchases per year',6],['c','Customer lifespan (years)',3],['d','Gross margin',0.2]];
    if(this.slug==='cagr-calculator') return [['a','Starting value',10000],['b','Ending value',15000],['c','Years',5]];
    return [['a','Original price',100],['d','Discount rate',0.2]];
  });

  display(value:number){return new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);}
}
