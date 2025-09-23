import 'zone.js/node';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app'; // Importe o AppComponent
import { appConfig } from './app/app.config'; // use the real export name

const bootstrap = (context: BootstrapContext | undefined) => bootstrapApplication(AppComponent, appConfig, context);

export default bootstrap;