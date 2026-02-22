import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FlowbiteService } from './core/services/flowbite/flowbite.services';
import { NgxSpinnerModule } from "ngx-spinner";
import { NavbarComponent } from "./core/components/navbar/navbar.component";
@Component({
  selector: 'app-root',
  imports: [NgxSpinnerModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
 private readonly flowbiteService =inject(FlowbiteService); 

  ngOnInit(): void {
    this.flowbiteService.loadFlowbite((flowbite) => {
      flowbite.initFlowbite();
    });
  }
}
