// src/services/file-management.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export const INVOICE_CONSTANTS = {
  DIRECTORY: path.join(process.cwd(), 'invoices'),
  PDF_OPTIONS: {
    title: 'Invoice',
    headerColor: '#000',
    fontSizes: {
      title: 22,
      subtitle: 16,
      body: 12,
    },
  },
  GENERATION_DELAY: 5000, // ms
};

@Injectable()
export class FileManagementService {
  constructor() {
    this.ensureDirectoryExists(
      INVOICE_CONSTANTS.DIRECTORY,
    );
  }

  ensureDirectoryExists(directory: string): void {
    try {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {
          recursive: true,
        });
      }
    } catch (error) {
      this.handleDirectoryCreationError(
        directory,
        error,
      );
    }
  }

  generateInvoiceFileName(
    orderId: number,
    extension = 'pdf',
  ): string {
    return `invoice_${orderId}_${this.generateTimestamp()}.${extension}`;
  }

  getInvoicePath(
    fileName: string,
    baseDirectory: string = INVOICE_CONSTANTS.DIRECTORY,
  ): string {
    return path.join(baseDirectory, fileName);
  }

  // Additional utility methods
  private generateTimestamp(): string {
    return Date.now().toString();
  }

  private handleDirectoryCreationError(
    directory: string,
    error: Error,
  ): void {
    console.error(
      `Failed to create directory ${directory}:`,
      error,
    );
    // You might want to throw a custom exception or log the error
    throw new Error(
      `Unable to create directory: ${directory}`,
    );
  }

  // Optional: Method to check file existence
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  // Optional: Method to create a unique file path
  createUniqueFilePath(
    baseFileName: string,
    directory: string = INVOICE_CONSTANTS.DIRECTORY,
  ): string {
    let fileName = baseFileName;
    let counter = 1;
    let filePath = path.join(directory, fileName);

    while (this.fileExists(filePath)) {
      const parsedPath = path.parse(baseFileName);
      fileName = `${parsedPath.name}_${counter}${parsedPath.ext}`;
      filePath = path.join(directory, fileName);
      counter++;
    }

    return filePath;
  }
}
