import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstablishmentService {

  constructor() { }

  public editDataEstab: any = [];

  public estab = new Subject<any>();

  private estabSource = new BehaviorSubject(this.editDataEstab);

  currentEstab = this.estabSource.asObservable();

  changeEstab(estab: string){
    this.estabSource.next(estab)
  }

}
