import { Component, OnInit, Input, Output } from '@angular/core';
import { CartItem } from '../service/product/cartItem';
import { ProductService } from '../service/product/productservice';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component'

@Component({
  selector: 'app-item-card',
  templateUrl: './item-card.component.html',
  styleUrls: ['./item-card.component.scss']
})
export class ItemCardComponent implements OnInit {

  @Input() 
  item!: CartItem;
  
  @Input()
  index!: number;

  constructor(
    private productService: ProductService,
    private shoppingCart: ShoppingCartComponent) { }

  ngOnInit(): void {
  }

  updtabelCart(productId, num){
    
    this.productService.updateTable(productId, num);
    this.shoppingCart.updateTotals();
  }

  

}
