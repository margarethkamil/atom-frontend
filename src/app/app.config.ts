import { ApplicationConfig } from "@angular/core";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { AuthInterceptor } from "./core/interceptors/auth.interceptor";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes), 
        provideAnimationsAsync(),
        provideHttpClient(withInterceptorsFromDi()),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
    ]
};
