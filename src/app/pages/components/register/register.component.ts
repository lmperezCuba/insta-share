import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, RouterModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  hide = signal(true);
  confirmHide = signal(true);
  registerForm: FormGroup;
  incorrectCredentials = signal(false);
  passwordsDontMatch = signal(false);

  constructor() {
    this.registerForm = new FormGroup({
      username: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.required, Validators.email]
      }),
      password: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.required]
      }),
      confirmPassword: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.required]
      }),
    },
      { validators: this.checkMatchingPassword }
    )
  }

  get f(): { [key: string]: AbstractControl } {
    return this.registerForm.controls;
  }

  /**
   * Create a new account with the register form data
   */
  register() {
    if (this.registerForm.valid) {
      alert('register')
    }
  }

  checkMatchingPassword: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    let password = control.get('password');
    let confirmPassword = control.get('confirmPassword');
    const passNotMatch = password && confirmPassword && password.value !== confirmPassword.value;
    let passwordErrors = password?.errors || null;
    let confirmPasswordErrors = password?.errors || null;
    if (!!passNotMatch) {
      password?.setErrors({ ...passwordErrors, passwordNoMatch: true });
      confirmPassword?.setErrors({ ...confirmPasswordErrors, passwordNoMatch: true });
    } else {
      delete passwordErrors?.['passwordNoMatch'];
      if(passwordErrors && Object.keys(passwordErrors as Object).length === 0)  passwordErrors = null
      delete confirmPasswordErrors?.['passwordNoMatch'];
      if(confirmPasswordErrors && Object.keys(confirmPasswordErrors as Object).length === 0)  confirmPasswordErrors = null
      password?.setErrors(passwordErrors);
      confirmPassword?.setErrors(confirmPasswordErrors);
    }
    return !!passNotMatch ? { passwordNoMatch: true } : null;
  };

}
