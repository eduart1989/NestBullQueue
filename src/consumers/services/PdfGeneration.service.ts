import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface PdfGenerationOptions {
  title?: string;
  headerColor?: string;
  fontSizes?: {
    title?: number;
    subtitle?: number;
    body?: number;
  };
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

@Injectable()
export class PdfGenerationService {
  private readonly DEFAULT_OPTIONS: PdfGenerationOptions =
    {
      title: 'Document',
      headerColor: '#000000',
      fontSizes: {
        title: 20,
        subtitle: 14,
        body: 10,
      },
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    };

  async generatePdf(
    data: Record<string, any>,
    outputPath: string,
    options: PdfGenerationOptions = {},
  ): Promise<string> {
    const mergedOptions: PdfGenerationOptions = {
      ...this.DEFAULT_OPTIONS,
      ...options,
      fontSizes: {
        ...this.DEFAULT_OPTIONS.fontSizes,
        ...options.fontSizes,
      },
      margins: {
        ...this.DEFAULT_OPTIONS.margins,
        ...options.margins,
      },
    };

    return new Promise((resolve, reject) => {
      try {
        // Ensure output directory exists
        this.ensureDirectoryExists(outputPath);

        const doc = this.createPdfDocument(
          mergedOptions,
        );
        const stream =
          fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add document metadata
        doc.info.Title = mergedOptions.title;

        // Populate PDF content
        this.populatePdfContent(
          doc,
          data,
          mergedOptions,
        );

        doc.end();

        stream.on('finish', () =>
          resolve(outputPath),
        );
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private ensureDirectoryExists(
    outputPath: string,
  ): void {
    const directory = path.dirname(outputPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, {
        recursive: true,
      });
    }
  }

  private createPdfDocument(
    options: PdfGenerationOptions,
  ): PDFKit.PDFDocument {
    return new PDFDocument({
      margins: {
        top: options.margins.top,
        bottom: options.margins.bottom,
        left: options.margins.left,
        right: options.margins.right,
      },
    });
  }

  private populatePdfContent(
    doc: PDFKit.PDFDocument,
    data: Record<string, any>,
    options: PdfGenerationOptions,
  ): void {
    this.addHeader(doc, options);
    this.addContent(doc, data, options);
    this.addFooter(doc);
  }

  private addHeader(
    doc: PDFKit.PDFDocument,
    options: PdfGenerationOptions,
  ): void {
    doc
      .fillColor(options.headerColor)
      .fontSize(options.fontSizes.title)
      .text(options.title, {
        align: 'center',
        underline: true,
      })
      .moveDown();
  }

  private addContent(
    doc: PDFKit.PDFDocument,
    data: Record<string, any>,
    options: PdfGenerationOptions,
  ): void {
    Object.entries(data).forEach(
      ([key, value]) => {
        doc
          .fontSize(options.fontSizes.subtitle)
          .text(key, { underline: true })
          .fontSize(options.fontSizes.body)
          .text(this.formatValue(value))
          .moveDown();
      },
    );
  }

  private addFooter(
    doc: PDFKit.PDFDocument,
  ): void {
    doc
      .fontSize(8)
      .text(
        `Generated on: ${new Date().toLocaleString()}`,
        { align: 'center' },
      );
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined)
      return 'N/A';
    if (Array.isArray(value))
      return value.join(', ');
    if (typeof value === 'object')
      return JSON.stringify(value);
    if (value instanceof Date)
      return value.toLocaleString();
    return String(value);
  }
}
