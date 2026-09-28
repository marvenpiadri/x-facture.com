import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { db, seedInitialDataIfNeeded } from '../db/app-database';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly products = signal<Product[]>([]);

  constructor() {
    if (this.isBrowser) {
      this.loadProducts();
    }
  }

  async loadProducts(): Promise<Product[]> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') {
      return [];
    }
    try {
      await seedInitialDataIfNeeded();
      const list = await db.products.orderBy('name').toArray();
      this.products.set(list);
      return list;
    } catch {
      return [];
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') return undefined;
    try {
      return await db.products.get(id);
    } catch {
      return undefined;
    }
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') return undefined;
    try {
      const cleaned = slug.trim().toLowerCase();
      const all = await db.products.toArray();
      return all.find(p => p.slug.toLowerCase() === cleaned || p.id === slug);
    } catch {
      return undefined;
    }
  }

  async saveProduct(product: Partial<Product>): Promise<Product> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') {
      throw new Error('Product storage is unavailable outside the browser.');
    }
    const name = (product.name || 'New Item').trim();
    const slug = (product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    const now = new Date().toISOString();

    const fullProduct: Product = {
      id: product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      slug,
      sku: product.sku || '',
      name,
      description: product.description || '',
      unitCost: Number.isFinite(product.unitCost) ? Number(product.unitCost) : 0,
      taxRate: Number.isFinite(product.taxRate) ? Number(product.taxRate) : 0,
      category: product.category || 'General',
      icon: product.icon || 'inventory_2',
      imageUrl: product.imageUrl || undefined,
      isArchived: !!product.isArchived,
      createdAt: product.createdAt || now,
      updatedAt: now
    };

    await db.products.put(fullProduct);
    await this.loadProducts();
    return fullProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') {
      throw new Error('Product storage is unavailable outside the browser.');
    }
    await db.products.delete(id);
    await this.loadProducts();
  }
}
