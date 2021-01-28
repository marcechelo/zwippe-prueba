import { Component, OnInit } from '@angular/core';
import { Form, FormBuilder  } from '@angular/forms';
import { AuthService } from '../service/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  checkoutForm = this.formBuilder.group({
    email: '',
    password: ''
  });
  constructor(private authService: AuthService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
  }

  onSubmit(){
    if (this.checkoutForm.valid) {
      this.authService.login(this.checkoutForm.value.email, this.checkoutForm.value.password);
    } else {
      console.log("Error in login form");
      
    }
    
  }

}
