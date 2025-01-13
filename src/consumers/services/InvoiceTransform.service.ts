import { Injectable } from '@nestjs/common';
import { Order, Customer } from '@prisma/client';

export interface Product {
  name: string;
  price: number;
  barcode?: string;
  description?: string;
}

export interface OrderData {
  order: Omit<Order, 'products'> & {
    products: Product[];
  };
  customer: Customer;
}

export interface InvoiceData {
  'Order ID': number;
  'Customer Name': string;
  'Customer Email': string;
  'Order Date': string;
  Products: string;
  Total: string;
}

// src/services/invoice-transformer.service.ts

@Injectable()
export class InvoiceTransformerService {
  transform(orderData: OrderData): InvoiceData {
    const { order, customer } = orderData;

    return {
      'Order ID': order.id,
      'Customer Name':
        this.formatCustomerName(customer),
      'Customer Email': customer.email,
      'Order Date': this.formatOrderDate(
        order.createdAt,
      ),
      Products: this.formatProducts(
        order.products,
      ),
      Total: this.calculateTotal(order.products),
    };
  }

  // Separate method for customer name formatting
  formatCustomerName(customer: Customer): string {
    return `${customer.name} ${customer.surname}`.trim();
  }

  // Flexible date formatting
  formatOrderDate(
    date: Date | string,
    format:
      | 'short'
      | 'long'
      | 'default' = 'default',
  ): string {
    const parsedDate = new Date(date);

    switch (format) {
      case 'short':
        return parsedDate.toLocaleDateString(
          'en-US',
          {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
          },
        );
      case 'long':
        return parsedDate.toLocaleDateString(
          'en-US',
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          },
        );
      default:
        return parsedDate.toLocaleDateString();
    }
  }

  // Enhanced product formatting
  formatProducts(
    products: Product[],
    options: {
      maxProducts?: number;
      separator?: string;
    } = {},
  ): string {
    const { maxProducts = 3, separator = ', ' } =
      options;

    const formattedProducts = products
      .slice(0, maxProducts)
      .map(this.formatSingleProduct);

    if (products.length > maxProducts) {
      formattedProducts.push(
        `+ ${products.length - maxProducts} more`,
      );
    }

    return formattedProducts.join(separator);
  }

  // Format individual product
  private formatSingleProduct(
    product: Product,
  ): string {
    return `${
      product.name
    } - $${product.price.toFixed(2)}`;
  }

  // Flexible total calculation
  calculateTotal(
    products: Product[],
    options: {
      currencySymbol?: string;
      decimalPlaces?: number;
    } = {},
  ): string {
    const {
      currencySymbol = '$',
      decimalPlaces = 2,
    } = options;

    const total = products.reduce(
      (sum, p) => sum + p.price,
      0,
    );
    return `${currencySymbol}${total.toFixed(
      decimalPlaces,
    )}`;
  }

  // Optional: Validate order data
  validateOrderData(
    orderData: OrderData,
  ): boolean {
    const { order, customer } = orderData;

    return !!(
      order?.id &&
      customer?.name &&
      customer?.email &&
      order?.products?.length
    );
  }
}
