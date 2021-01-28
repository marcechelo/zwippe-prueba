import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth/';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private firebaseAuth: AngularFireAuth,
    private router: Router
    ) {}

    login(email: string, password: string) {
      this.firebaseAuth
        .signInWithEmailAndPassword(email, password)
        .then(value => { 
          this.router.navigate(['/home'])
        })
        .catch(err => {
          this.router.navigate(['/login'])
          console.log('Something went wrong:',err.message);
        });
    }
  
    logout() {
      this.firebaseAuth.signOut().then(() => {
        this.router.navigate(['/']);
      });
    }
  
    canActivate(
      next: ActivatedRouteSnapshot,
      state: RouterStateSnapshot): Observable<boolean>{
        
        return this.firebaseAuth.authState.pipe(take(1), map(user =>{
          if (user == null) {
            return false
          }else return true
          }), tap(loggedIn => {
          console.log(loggedIn);
          if (!loggedIn) {
            this.router.navigate(['/login'])
          }
         }))
      }
}
