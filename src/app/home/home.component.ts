import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Product } from '../service/product/product';
import {SelectItem} from 'primeng/api';
import { ProductService } from '../service/product/productservice';
import { PrimeNGConfig } from 'primeng/api';
import { Router } from '@angular/router';
import { EstablishmentService } from '../service/establishments/establishment.service';
import { CategoryService } from '../service/category/category.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  value: any;
  products: Product[];
  sortOptions: SelectItem[];
  sortOrder: number;
  sortField: string;
  sortKey: string;
  panelOpenState: boolean = true;
  categorys: Object[] = [];
  establisments: Object[] =  [];
  selectedCategory:any;

  constructor(
    private db: AngularFirestore, 
    private authFirebase: AngularFireAuth,
    private _productService: ProductService, 
    private primengConfig: PrimeNGConfig,
    private router: Router,
    private _estabService: EstablishmentService,
    private _categoryService: CategoryService) {
    this.sortField = '0';
    this.sortOrder = 0;
    this.sortOptions = [];
    this.products = [];
    this.sortKey = 'medicina';
   }

  ngOnInit(){

    this._categoryService.currentCategory.subscribe(category =>{
      this.selectedCategory = category;
    });
  
    this.getEstablishment();
    this.changePorducts('all');
    this.getCategorys();

    this.sortOptions = [
        {label: 'Precio Mayor a Menor', value: '!price'},
        {label: 'Precio Menor a Mayor', value: 'price'}
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

funcTest(name){
  console.log(name);
  
}

getEstablishment(){
  let userDoc = this.db.firestore.collection(`establishments`);
  
  userDoc.get().then((querySnapshot) => { 
    querySnapshot.forEach((doc) => {      
      this.establisments.push([doc.id, doc.data()['name']]); 
     })
   })
}

goShoppingCart(){
  this.router.navigate(['/shoppingCart'])
}

goToEstablishment(estabId: string){

  console.log("estab id: " + estabId);
  this._estabService.changeEstab(estabId);
  this.router.navigate(['/establishment'])

}

getProducts(productsCategory){
  
  let itemList: Product[] = []

  return productsCategory.then((querySnapshot) => { 
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

      return itemList
  })

}

getCategorys(){
  let userDoc = this.db.firestore.collection(`categories`);
       userDoc.get().then((querySnapshot) => { 
       querySnapshot.forEach((doc) => {
          this.categorys.push([doc.id, doc.data()['name']]); 
        })
      })
}

changePorducts(category: string){

  let productsCategory;

  if (category === 'all') {
    productsCategory = this.db.firestore.collection('products').get();
  } else {
    productsCategory = this.db.collection('products').ref.where('category', '==', category).get();
  }

  this.getProducts(productsCategory).then(value => this.products = value);

}

}
