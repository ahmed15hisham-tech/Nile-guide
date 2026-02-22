import { Routes } from "@angular/router";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { RegisterPageComponent } from "./pages/register-page/register-page.component";
import { ForgetPassPageComponent } from "./pages/forget-pass-page/forget-pass-page.component";

export const Auth_ROUTES : Routes = [

    {
        path: 'login',
        component:LoginPageComponent
    },
    {
        path: 'register',
        component:RegisterPageComponent
    },
    {
        path: 'forgot-password',
        component:ForgetPassPageComponent
    },

]