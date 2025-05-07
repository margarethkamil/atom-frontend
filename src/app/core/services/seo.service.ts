import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  /**
   * Update the page title
   * @param title New page title
   * @param siteName Optional site name to append
   */
  updateTitle(title: string, siteName: string = 'MK Task Manager'): void {
    if (siteName) {
      this.title.setTitle(`${title} | ${siteName}`);
    } else {
      this.title.setTitle(title);
    }
  }

  /**
   * Update meta description
   * @param description Page description
   */
  updateDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
  }

  /**
   * Set canonical URL
   * @param url Canonical URL
   */
  setCanonicalUrl(url: string): void {
    const link: HTMLLinkElement = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    
    const head = document.getElementsByTagName('head')[0];
    const existingLink = document.querySelector('link[rel="canonical"]');
    
    if (existingLink) {
      head.removeChild(existingLink);
    }
    
    head.appendChild(link);
  }

  /**
   * Update Open Graph metadata
   * @param params Open Graph parameters
   */
  updateOpenGraph(params: {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    type?: string;
  }): void {
    if (params.title) {
      this.meta.updateTag({ property: 'og:title', content: params.title });
    }
    
    if (params.description) {
      this.meta.updateTag({ property: 'og:description', content: params.description });
    }
    
    if (params.url) {
      this.meta.updateTag({ property: 'og:url', content: params.url });
    }
    
    if (params.image) {
      this.meta.updateTag({ property: 'og:image', content: params.image });
    }
    
    if (params.type) {
      this.meta.updateTag({ property: 'og:type', content: params.type });
    }
  }

  /**
   * Update Twitter Card metadata
   * @param params Twitter Card parameters
   */
  updateTwitterCard(params: {
    title?: string;
    description?: string;
    image?: string;
    site?: string;
  }): void {
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    
    if (params.title) {
      this.meta.updateTag({ name: 'twitter:title', content: params.title });
    }
    
    if (params.description) {
      this.meta.updateTag({ name: 'twitter:description', content: params.description });
    }
    
    if (params.image) {
      this.meta.updateTag({ name: 'twitter:image', content: params.image });
    }
    
    if (params.site) {
      this.meta.updateTag({ name: 'twitter:site', content: params.site });
    }
  }

  /**
   * Update basic SEO metadata - convenience method for common SEO operations
   * @param params SEO parameters
   */
  updateSeoMetadata(params: {
    title: string;
    description: string;
    url?: string; 
    siteName?: string;
    image?: string;
  }): void {
    // Update basic meta
    this.updateTitle(params.title, params.siteName);
    this.updateDescription(params.description);
    
    // Set canonical URL if provided
    if (params.url) {
      this.setCanonicalUrl(params.url);
    }
    
    // Update Open Graph
    this.updateOpenGraph({
      title: params.title,
      description: params.description,
      url: params.url,
      image: params.image,
      type: 'website'
    });
    
    // Update Twitter Card
    this.updateTwitterCard({
      title: params.title,
      description: params.description,
      image: params.image
    });
  }
}
