import { Component, OnInit, Input } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { ProductService } from '../service/product/productservice';
import { CartItem } from '../service/product/cartItem';
import { EstablishmentService } from '../service/establishments/establishment.service';
import { PaymentService } from '../service/payment/payment.service'
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { MapsAPILoader, AgmMap, GoogleMapsAPIWrapper } from '@agm/core';

declare var google: any;

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss']
})
export class ShoppingCartComponent implements OnInit {

  lat = -0.203852;
  lng = -78.483668;

  itemList: CartItem[] = [];  
  totalValue: string = "0.00";
  deliveryFee: string = "0.00";
  iva: string = "0.00";
  itemsValue: string = "0.00";
  productsValue: number = 0;
  establisments: Object[] =  []
  userUid: string = '';
  cardId: string = '';
  response:any;
  userData = this.authFirebase.authState;
  private destLng: any;
  private destLat: any;
  private map:any;
  referencia: string = '';
  storesLocation: any[] = [];
  itemsValueNumber: number = 0;


  constructor(
    private db: AngularFirestore, 
    private authFirebase: AngularFireAuth,
    private productService: ProductService,
    private router: Router,
    private _estabService: EstablishmentService,
    private http: HttpClient,
    public mapsApiLoader: MapsAPILoader,
    private _paymentService: PaymentService) {
      this.mapsApiLoader = mapsApiLoader;
      this.mapsApiLoader.load().then(() => {
        this.initMap();
      });
   }

  ngOnInit(): void {

    this.getEstablishment();
    this.getCartData();

  }

  getCartData(){
    
    this.userData.subscribe(user =>{
      if (user) {
        this.productService.getCartProducts(user.uid).then(data =>{
          this.itemList = data;
          this.updateTotals(0);
        })
      }
    });
    
  }

  getEstablishment(){
    let userDoc = this.db.firestore.collection(`establishments`);
    
    userDoc.get().then((querySnapshot) => { 
      querySnapshot.forEach((doc) => {      
        this.establisments.push([doc.id, doc.data()['name']]); 
       })
     })
  }

  goToEstablishment(estabId: string){

    console.log("estab id: " + estabId);
    this._estabService.changeEstab(estabId);
    this.router.navigate(['/establishment'])
  
  }

  goHome(){
    this.router.navigate(['/home'])
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

  makePayment(){
    
    if (this.destLng == undefined 
        || this.destLat == undefined 
        || this.referencia.length == 0
        || this.deliveryFee == '0.00'
        || this.totalValue == '0.00') {
      alert("Datos incompletos")
    }else{

      let origin = {
        latitude: this.destLat,
        longitude: this.destLng 
      }

      let destination = {
        latitude: this.destLat + 0.50,
        longitude: this.destLng + 0.50
      }

      let origin1 = new google.maps.LatLng(this.destLat, this.destLng);
      let destination1 = new google.maps.LatLng(this.destLat + 0.5, this.destLng + 0.5);
      

      /*this._googleDistanceMatrix(origin1, destination1).subscribe(data =>{
        console.log(data);
      });*/

      /*this.authFirebase.authState.subscribe(user =>{
        this.getDataPayment(
          user!.uid,
          0,//parseFloat(this.itemsValue), 
          0,//parseFloat(this.totalValue), 
          0,//parseFloat(this.iva),
          this.cardId
        ).then(data=>{
  
          console.log(this.destLat);
          console.log(this.destLng);
          //let response = this.completePaymentPorcess(data).subscribe(data =>{
          //  console.log(data);
          //})
            
        })
      });*/
    }
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

    /*
    const headers = { 'Authorization': 'Bearer my-token', 'My-Custom-Header': 'foobar' };
    const body = { title: 'Angular POST Request Example' };
    this.http.post<any>('https://jsonplaceholder.typicode.com/posts', body, { headers }).subscribe(response => {

    })*/;

    return responseType.asObservable();
9
  }

  initMap(): void {

    const zwippe = new google.maps.LatLng(-0.203852 , -78.483668);
    this.map = new google.maps.Map(
      document.getElementById("map") as HTMLElement,
      {
        zoom: 16,
        center: zwippe,
      }
    );
    let marker = new google.maps.Marker({
      position: zwippe,
      map: this.map,
    });

    this.map.addListener("click", async (mapsMouseEvent) => {
      let destLatLng = JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2);
      let transform = JSON.parse(destLatLng)
      this.destLng = transform.lng;
      this.destLat = transform.lat;

      let destination = new google.maps.LatLng(this.destLat, this.destLng);
      
      marker.setMap(null);
      marker = null;
      marker = new google.maps.Marker({
        position: destination,
        map: this.map
      });

      this.getStoresLocation(destination);
      this.getCartData();
      
      
    });

  };

 getStoresLocation(actualLoc){

  let distance = 0.0;
  let totalTime = 0; 
  let actualLocation = actualLoc;
  let transforTime;

  let stores: any[] = [];
  let auxStores: any[] = [];
  this.userData.subscribe(user =>{
    if (user) {
      
      this.productService.getCartProducts(user.uid).then(async itemList =>{
      
        for (let index = 0; index < itemList.length; index++) {
          await this.db.firestore.collection('establishments')
          .doc(itemList[index]['storeId']).get().then(value =>{
            
            if(this._exist(auxStores, value.data()!['name'])){
              auxStores.push(value.data()!['name']);
              let auxLocation = new google.maps.LatLng(value.data()!['location'].latitude, value.data()!['location'].longitude)
              stores.push(auxLocation); 
            }

          });
          
        }
        if (stores.length == 1) {
          
          this._googleDistanceMatrix(stores[0], actualLocation).subscribe(data =>{
            distance += data[0];
            totalTime += data[1];

            this.updateTotals(distance);
            transforTime = this._transforTime(totalTime);
          });
          
        } else if(stores.length > 1) {
          
          let contador = 0;

          for (let index = 1; index < stores.length; index++) {
            contador ++;
            console.log(contador);
            
            this._googleDistanceMatrix(stores[index-1], stores[index]).subscribe(data =>{
              distance += data[0];
              totalTime += data[1];
              
              this.updateTotals(distance);
              transforTime = this._transforTime(totalTime);
            });

            if(contador + 1 == stores.length){
              this._googleDistanceMatrix(stores[index], actualLocation).subscribe(data =>{
                distance += data[0];
                totalTime += data[1];

                this.updateTotals(distance);
                transforTime = this._transforTime(totalTime);
              });
            }
              
            
          }
        }else {
          distance = 0.0;
        }
        
      });
    }
  });
 };


  _exist(arrayValues: any, value: any){

    if(arrayValues.indexOf(value) == -1){
      return true;
    }else{
      return false;
    }

  }

  _googleDistanceMatrix(origin, destination) {

    /*var uri = "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=" 
    + origin.latitude + "," + origin.longitude 
    + "&destinations=" + destination.latitude + "," + destination.longitude 
    + "&key=AIzaSyCskbp7nhxpef38T96tjCmV-qswkeb5Jqg";*/

    let distance: number;
    let time: number;
    var responseType = new Subject<any>();

    var response = new google.maps.DistanceMatrixService().getDistanceMatrix({'origins': [origin], 'destinations': [destination], travelMode: 'DRIVING'}, (results: any) => {
      
      if(results.rows[0].elements[0].distance == undefined && results.rows[0].elements[0].duration == undefined){
        alert("Error al seleccionar las coordenadas \n Seleccione nuevamente la ubicación")
      }else{
        distance = results.rows[0].elements[0].distance.value;
        time = results.rows[0].elements[0].duration.value;
        responseType.next([distance, time]);
      }
      
    });

    return responseType.asObservable();

  }

  _transforTime(seconds: any){

    let time;
    let response;

    if(seconds >= 3600){
      time = seconds / 3600;
      response = time.toFixed(0) + " horas";
    }else{
      time = seconds / 60;
      response = time.toFixed(0) + " min";
    }

    return response;

  }

  updateTotals(distance?: any){

    let totalProd = this.productService.getTotalProducts();
    if (distance) {
      this.deliveryFee = (distance/1000*0.67).toFixed(2);
      this.totalValue = (totalProd + (distance/1000*0.67)).toFixed(2);
    }

    if (this.deliveryFee == '0.00') {
      this.totalValue = totalProd.toFixed(2);  
    }else{
      this.totalValue = (totalProd + parseFloat(this.deliveryFee)).toFixed(2);
    }

    this.itemsValue = totalProd.toFixed(2);        
    this.iva = (totalProd * 0.12 / 1.12).toFixed(2);
    this.itemsValueNumber = totalProd;
  }

  confirmPayment(){

    if (this.destLng == undefined 
      || this.destLat == undefined 
      || this.referencia.length == 0
      || this.deliveryFee == '0.00'
      || this.itemList.length == 0) {
    alert("Datos incompletos")
  }else{
    this._paymentService.makePayment(
                                    this.itemsValueNumber, 
                                    parseFloat(this.totalValue), 
                                    parseFloat(this.iva));
  }
    
  }

}
