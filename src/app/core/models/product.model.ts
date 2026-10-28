export interface Product {
  id: string;
  slug: string;            // e.g. consulting-hour
  sku?: string;
  barcode?: string;        // EAN / UPC / QR payload scanned at the POS
  name: string;
  description?: string;
  unitCost: number;
  taxRate: number;         // percentage
  category?: string;       // e.g. 'Services', 'Retail', 'Digital', 'Beverages'
  icon?: string;           // material-icon name
  imageUrl?: string;       // image URL or base64 data string
  isFavorite?: boolean;    // pinned to the POS "Favorites" tab
  trackStock?: boolean;    // services / digital goods leave this off
  stockQty?: number;       // may go negative when oversold
  lowStockThreshold?: number;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}
