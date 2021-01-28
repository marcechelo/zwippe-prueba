import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Product } from './product';
import { CartItem } from './cartItem';

@Injectable()
export class ProductService {

    status: string[] = ['OUTOFSTOCK', 'INSTOCK', 'LOWSTOCK'];

    itemList: Product[] = [];
    cartList: CartItem[] = [];
    userData = this.authFirebase.authState;
    totalProducts: number = 0;

    constructor(
        private http: HttpClient, 
        private store: AngularFirestore,
        private authFirebase: AngularFireAuth) { }

    getProducts() {
        let userDoc = this.store.firestore.collection(`products`).get();

        return userDoc.then((querySnapshot) => { 
            querySnapshot.forEach((doc) => {

                this.findCatgory( doc.data()['category'] as string)
                .then(category  => {
                   //console.log("categoria: " + category!['name']);
                   //itemProd['category'] = category!['name'];
                   let itemProd = {
                    id:doc.id,
                    category: category!['name'], //doc.data()['category'],
                    description: doc.data()['description'],
                    imageItem: doc.data()['imageItem'],
                    name: doc.data()['name'],
                    photoBanner: doc.data()['photoBanner'],
                    price: doc.data()['price'],
                    storeId: doc.data()['storeId'],
                    }

                    this.itemList.push(itemProd as Product);
                    
                     
                });

                
                
                //console.log(this.itemList);
                
            });
            /*this.itemList.forEach(value => {
                this.findCatgory( value['category'] as string)
                .then(category  => {
                   value['category'] = category!['name'];
                });
                
            });*/
            console.log(this.itemList); 
            return this.itemList
        })

        
    }

    getCartProducts(userUid: string) {
        
        let shoppingCart = this.store.firestore.collection(`shoppingCarts`).doc(userUid).collection('items');
        return shoppingCart.get().then((querySnapshot) => { 
            this.cartList = [];
            querySnapshot.forEach((doc) => {
                this.cartList.push(doc.data() as CartItem); 
            })
            return this.cartList
        })
    }

    getTotalProducts(){
        
        this.totalProducts = 0;
        this.cartList.forEach(item =>{
            this.totalProducts += (item.quantity! * item.price!);
        });
        return this.totalProducts;
    }

    findCatgory(category: string){
        let categoryFire = this.store.firestore.collection('categories');
        return categoryFire.doc(category).get().then(cat => {return cat.data();
        })
    }


    updateTable(itemId, sumRest){
        
        for (let index = 0; index < this.cartList.length; index++) {
            console.log(this.cartList[index])
            if (this.cartList[index]['productId'] == itemId) {
                let qty = this.cartList[index]['quantity'];
                let qty1 = qty + sumRest;
                if (qty1 == 0) {
                    this.cartList.splice(index, 1);
                } else {
                    this.cartList[index]['quantity'] = qty! + sumRest;
                }
                
            }
        }

        this.updateDb(itemId, sumRest)
    
    }

    updateDb(productId, sumRest){

        this.authFirebase.authState.subscribe((user) =>{
            if (user) {
                let arrayItesm;
                const cartItemCollection = this.store.collection('shoppingCarts')
                const itemsQuery = cartItemCollection
                .doc(user.uid)
                .collection('items')
                .ref
                .where('productId', '==', productId);
                
                itemsQuery.get().then(querySnapshot => {
                
                if(querySnapshot.size >= 1){
                    let queryItems = cartItemCollection
                    .doc(user.uid)
                    .collection('items')
                    .ref
                    .where('productId', '==', productId);
                    //console.log("Item id: " + productId);
                    
                    queryItems.get().then(cartItem => {
                    //console.log(cartItem.docs[0].id!);
                    
                    if (cartItem.size > 0) {
                        //console.log(cartItem.docs[0].data());
                        
                        let qty = cartItem.docs[0].data()['quantity'];
                        let qty1 = qty + sumRest;
                        if (qty1 == 0) {
                            cartItemCollection
                            .doc(user.uid)
                            .collection("items")
                            .doc(cartItem.docs[0].id!)
                            .delete()
                            .then(value =>{
                                console.log(value);
                            }).catch(e =>{
                                console.log(e);
                            })
                        }else{
                            //this.updateTable(productId, sumRest);
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
                    }
                    })
                    
                }else{
                    console.log("ERROR");
                }
                });
                return arrayItesm;
            }
        });

        
    }
}