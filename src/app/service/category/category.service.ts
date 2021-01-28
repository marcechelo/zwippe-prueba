import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor() {
    this.categorySource.next("all");
   }

  public editDataCategory: any = [];

  public category = new Subject<any>();

  private categorySource = new BehaviorSubject(this.editDataCategory);

  currentCategory = this.categorySource.asObservable();

  changeCategory(category: string){
    this.categorySource.next(category);
  }
}
