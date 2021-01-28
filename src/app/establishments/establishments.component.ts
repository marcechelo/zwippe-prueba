import { Component, OnInit } from '@angular/core';
import { ProductService } from '../service/product/productservice';
import { Product } from '../service/product/product';
import { EstablishmentService } from '../service/establishments/establishment.service';
import {SelectItem} from 'primeng/api';
import { PrimeNGConfig } from 'primeng/api';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-establishments',
  templateUrl: './establishments.component.html',
  styleUrls: ['./establishments.component.scss']
})
export class EstablishmentsComponent implements OnInit {

  products: Product[];
  sortOptions: SelectItem[];
  sortOrder: number;
  sortField: string;
  sortKey: string;
  selectedEstab: any;
  imageUrl: string = "";
  establisments: Object[] =  [];
  panelOpenState: boolean = true;
  categorys: string[] = [];

  constructor(
    private db: AngularFirestore,
    private authFirebase: AngularFireAuth,
    private _estabService: EstablishmentService,
    private _productService: ProductService,  
    private primengConfig: PrimeNGConfig,
    private router: Router) {
      this.sortField = '0';
      this.sortOrder = 0;
      this.sortOptions = [];
      this.products = [];
      this.sortKey = 'medicina'
   }

  ngOnInit(): void {

    this.getEstablishment();
    this._estabService.currentEstab.subscribe(estab => this.selectedEstab = estab);
    this.getProducts(this.selectedEstab).then(data => this.products = data)
    console.log("Estab: " + this.selectedEstab);
    this.getEstabData(this.selectedEstab);
    this.getCategorys();
    
      this.sortOptions = [
          {label: 'Price High to Low', value: '!price'},
          {label: 'Price Low to High', value: 'price'}
      ];

      this.primengConfig.ripple = true;
  }

  onSortChange(event) {
    let value = event.value;

    if (value.indexOf('!') === 0) {
        this.sortOrder = -1;
        this.sortField = value.substring(1, value.length);
    }
    else {
        this.sortOrder = 1;
        this.sortField = value;
    }
}

getEstabData(estabId: string){

  let estabDoc = this.db.firestore.collection(`establishments`).where("id", "==", estabId);
  
  estabDoc.get().then((querySnapshot) => { 
    
    if (querySnapshot.size > 1) {
      console.log("Existen dos establecimeintos con el mismo Id");
    } else {
      this.imageUrl = querySnapshot.docs[0].data()['logoImage'];
    }
    
   })
}

getProducts(estabId: string){

  let userDoc = this.db.firestore.collection(`products`).where("storeId", "==", estabId);
  let itemList: Product[] = []

  return userDoc.get().then((querySnapshot) => { 
      querySnapshot.forEach((doc) => {

        let itemProd = {
          id:doc.id,
          category: doc.data()['category'],
          description: doc.data()['description'],
          imageItem: doc.data()['imageItem'],
          name: doc.data()['name'],
          photoBanner: doc.data()['photoBanner'],
          price: doc.data()['price'],
          storeId: doc.data()['storeId'],
          }

          itemList.push(itemProd as Product);
          
      });
      itemList.forEach((value, index) =>{
        this._productService.findCatgory( value['category'] as string)
          .then(category  => {
            itemList[index]['category'] = category!['name'];
          });
      });
      
      console.log(itemList); 
      return itemList
  })

}

getEstablishment(){
  let userDoc = this.db.firestore.collection(`establishments`);
  
  userDoc.get().then((querySnapshot) => { 
    querySnapshot.forEach((doc) => {      
      this.establisments.push([doc.id, doc.data()['name']]); 
     })
   })
}

addToCart(item: Product){
   
  return this.authFirebase.authState
  .subscribe((user) =>{
      if (user) {

        let arrayItesm;
        const cartItemCollection = this.db.collection('shoppingCarts')
        const itemsQuery = cartItemCollection
        .doc(user.uid)
        .collection('items')
        .ref
        .where('productId', '==', item.id);
        
        itemsQuery.get().then(querySnapshot => {
          console.log("Log user uid: " + querySnapshot.size);
          
          if(querySnapshot.size >= 1){
            let queryItems = cartItemCollection
            .doc(user.uid)
            .collection('items')
            .ref
            .where('productId', '==', item.id);
            console.log("Item id: " + item.id);
            
            queryItems.get().then(cartItem => {
              console.log(cartItem.docs[0].id!);
               
              if (cartItem.size > 0) {
                let qty = cartItem.docs[0].data()['quantity'];
                let qty1 = qty + 1;
                cartItemCollection
                .doc(user.uid)
                .collection("items")
                .doc(cartItem.docs[0].id!)
                .update({"quantity": qty1})
                .then(data => {
                  console.log(data);
                }).catch((e) => {
                  console.log(e);
                })
              }
            })
            
          }else{
            let newItem = {
              description: item.description,
              id: null,
              image: item.imageItem,
              price: item.price,
              productId: item.id,
              productName: item.name,
              quantity: 1,
              storeId: item.storeId
            };
            
            cartItemCollection
            .doc(user.uid)
            .collection("items")
            .add( newItem )
            .then(value => {
              console.log("Add result: " + value.id);
            })
          }
        });
        return arrayItesm;
      }else{
        return "null";
      }
    });
}

getCategorys(){
  let userDoc = this.db.firestore.collection(`categories`);
       userDoc.get().then((querySnapshot) => { 
       querySnapshot.forEach((doc) => {
          this.categorys.push(doc.data()['name']); 
        })
      })
}

goHome(){
  this.router.navigate(['/home'])
}

goShoppingCart(){
  this.router.navigate(['/shoppingCart'])
}

goToEstablishment(estabId: string){
  
  this.getProducts(estabId).then(data => this.products = data);
  this.getEstabData(estabId);

}



}
