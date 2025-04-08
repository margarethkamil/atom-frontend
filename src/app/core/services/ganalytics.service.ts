import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class GAnalyticsService {
  private googleAnalyticsId = 'G-RKPN8YC1D3'; // Google Analytics ID

  constructor(private router: Router) {
    // Initialize Google Analytics only if needed
    if (environment.production) {
      this.initGoogleAnalytics();
    }
  }

  /**
   * Initializes Google Analytics by adding the necessary scripts to the DOM
   */
  private initGoogleAnalytics(): void {
    try {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.googleAnalyticsId}`;
      
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${this.googleAnalyticsId}');
      `;
      
      document.head.appendChild(script1);
      document.head.appendChild(script2);
      
      console.log('Google Analytics initialized successfully');
    } catch (error) {
      // console.error('Error initializing Google Analytics:', error);
    }
  }

  /**
   * Sends a page view event to Google Analytics
   * @param page Page path
   * @param title Page title (optional)
   */
  sendPageView(page: string, title?: string): void {
    if (typeof gtag !== 'undefined') {
      gtag('config', this.googleAnalyticsId, {
        page_path: page,
        page_title: title
      });
    }
  }

  /**
   * Sends a custom event to Google Analytics
   * @param eventName Event name
   * @param eventParams Event parameters
   */
  sendEvent(eventName: string, eventParams: any = {}): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventParams);
    }
  }
}
