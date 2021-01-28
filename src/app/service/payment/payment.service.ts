import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, Subject, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  userUid: any;
  cardId: any;

  constructor(
    private db: AngularFirestore, 
    private authFirebase: AngularFireAuth,
    private http: HttpClient,) {
      this.authFirebase.authState.subscribe(user =>{
        this.userUid = user!.uid;
        this.getCard();
      });
      
     }

  makePayment(totalBase: number, total: number, iva: number){
    this.authFirebase.authState.subscribe(user =>{
      this.getDataPayment(
        user!.uid,
        totalBase,
        total,
        iva,
        'sdfghjkl' //this.cardId
      ).then(data=>{
        console.log(data);
        this.completePaymentPorcess(data);
    
        //console.log(this.destLat);
        //console.log(this.destLng);
        //let response = this.completePaymentPorcess(data).subscribe(data =>{
        //  console.log(data);
        //})
          
      })
    });
  }

  getDataPayment(user:any, totalBase: number, total: number, iva: number, cardId: string){
    
    let userDoc = this.db.firestore.collection('users');
    return userDoc.doc(user).get().then(data=>{
          
          
          var billingDataId = data.data()!['defaultBillingDataId'];
          var email = data.data()!['email'];
          var lastname;
          var name;
          var address;
          var dni;
          var phone;
          var base = totalBase / 1.12 ;
          //var billingData = this.db.firestore.collection('users')
          return this.db.firestore.collection('users').doc(user)
          .collection('billingData')
          .doc(billingDataId)
          .get()
          .then(data=>{

            lastname =  data.data()!['lastname'];
            name =  data.data()!['name'];
            address =  data.data()!['address'];
            dni =  data.data()!['dni'];
            phone =  data.data()!['phone'];

            var requestBody = {
              "payer": {
                "document": dni,
                "documentType": "CI",
                "name": name,
                "surname": lastname,
                "email": email,
                "mobile": phone
              },
              "payment": {
                "reference": (new Date).getTime(),
                "description": "Compra " + dni + ": " + total.toString(),
                "amount": {
                  "currency": "USD",
                  "total": total,
                  "taxes": [{
                    "kind": "valueAddedTax",
                    "amount": iva,
                    "base": base.toFixed(2),
                  }]
                }
              },
              "cardId": cardId
            };
            return requestBody

          });
      })
    
  }

  getCard(){

    let user = this.db.firestore.collection('users').doc(this.userUid);
    user.get().then(data =>{
      this.cardId = data.data()!['defaultCardId']; 
    });
  }

  completePaymentPorcess(requestBody){

    let uri =  'http://34.105.57.165:8080/api/collect-process';
    var responseType = new Subject<any>();

    const headers = {'Content-type': 'application/json'};
    this.http.post<any>(uri, requestBody, { headers }).subscribe(response => {
      
      console.log("RESPONSE");
      console.log(response);
      
      

      var map = response.body.userMessage;
      var status = map.status;
      var paymentId = map.paymentId;
      var reference = map.reference;
      var statusResponse = ['REJECTED', 'error', 'error'];

      if (response.statusCode == 200 && status == 'APPROVED') {
        statusResponse = ['APPROVED', paymentId, reference];
      }else if(response.statusCode == 200 && status == 'PENDING'){
        statusResponse = ['PENDING', paymentId, reference];
      }else if(response.statusCode == 200 && status == 'REJECTED'){
        statusResponse = ['REJECTED', paymentId, reference];
      }

      responseType.next(statusResponse)        
    });


    /*const headers = { 'Authorization': 'Bearer my-token', 'My-Custom-Header': 'foobar' };
    const body = { title: 'Angular POST Request Example' };
    this.http.post<any>('https://jsonplaceholder.typicode.com/posts', body, { headers }).subscribe(response => {
      console.log(response);
      
    });*/

    //return responseType.asObservable();

  }

}
