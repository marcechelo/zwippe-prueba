import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor() { }

  public editTotalProduct: any = [];

  public totalProduct = new Subject<any>();

  private totalProductSource = new BehaviorSubject(this.editTotalProduct);

  currentTotalProduct = this.totalProductSource.asObservable();

  changeTotalProduct(totalProduct: string){
    this.totalProductSource.next(totalProduct);
  }

}
