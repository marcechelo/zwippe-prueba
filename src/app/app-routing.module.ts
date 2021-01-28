import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AngularFireAuthGuard, AngularFireAuthGuardModule, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { AuthService } from './service/auth/auth.service'
import { EstablishmentsComponent } from './establishments/establishments.component'
import { ShoppingCartComponent } from './shopping-cart/shopping-cart.component'

const redirectToLogin = () => redirectLoggedInTo(['login']);

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo:'home',
  
  },
  { 
    path:'login',
    component: LoginComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectToLogin }
  },
  {
    path:'home',
    component: HomeComponent,
    canActivate: [AuthService],
    data: { authGuardPipe: redirectToLogin }
  },
  {
    path:'establishment',
    component: EstablishmentsComponent,
    canActivate: [AuthService],
    data: { authGuardPipe: redirectToLogin }
  },
  {
    path:'shoppingCart',
    component: ShoppingCartComponent,
    canActivate: [AuthService],
    data: { authGuardPipe: redirectToLogin }
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
