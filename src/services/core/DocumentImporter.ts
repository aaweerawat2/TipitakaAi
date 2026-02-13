/**
 * Document Importer
 * Handles importing documents (PDF, TXT, DOCX, EPUB) from various sources
 */

import { Platform } from 'react-native';
import * as FileSystem from 'react-native-fs';
import { DocumentPickerResponse } from 'react-native-document-picker';
import { UserDocument, ImportProgress } from '@/types';

// ============================================
// Types
// ============================================

export interface ImportedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'epub';
  content: string;
  size: number;
  metadata?: Record<string, any>;
}

export interface ImportOptions {
  maxSizeMB?: number;
  encoding?: string;
  extractMetadata?: boolean;
}

// ============================================
// Document Importer Class
// ============================================

class DocumentImporter {
  private supportedTypes = ['pdf', 'txt', 'docx', 'epub'];
  private maxFileSize = 50 * 1024 * 1024; // 50MB

  /**
   * Import document from file picker result
   */
  async importFromPicker(
    pickerResult: DocumentPickerResponse,
    options?: ImportOptions
  ): Promise<ImportedDocument> {
    const { uri, name, size, type } = pickerResult[0] || pickerResult;

    // Validate file
    this.validateFile(name, size, type);

    // Get file extension
    const extension = this.getFileExtension(name);
    
    // Check if supported
    if (!this.supportedTypes.includes(extension)) {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    // Read file content
    const content = await this.readFile(uri, extension, options);

    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      type: extension as any,
      content,
      size: size || content.length,
      metadata: {
        originalUri: uri,
        importedAt: Date.now(),
      },
    };
  }

  /**
   * Import document from URL (requires initial internet)
   */
  async importFromUrl(
    url: string,
    options?: ImportOptions
  ): Promise<ImportedDocument> {
    const fileName = url.split('/').pop() || 'document';
    const extension = this.getFileExtension(fileName);

    if (!this.supportedTypes.includes(extension)) {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    // Download file
    const downloadPath = `${FileSystem.CachesDirectoryPath}/${fileName}`;
    
    const downloadResult = await FileSystem.downloadFile({
      fromUrl: url,
      toFile: downloadPath,
    }).promise;

    if (downloadResult.statusCode !== 200) {
      throw new Error(`Download failed with status ${downloadResult.statusCode}`);
    }

    // Read content
    const content = await this.readFile(downloadPath, extension, options);

    // Clean up downloaded file
    await FileSystem.unlink(downloadPath);

    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: fileName,
      type: extension as any,
      content,
      size: content.length,
      metadata: {
        sourceUrl: url,
        importedAt: Date.now(),
      },
    };
  }

  /**
   * Import text directly
   */
  importText(
    text: string,
    name: string = 'Pasted Text'
  ): ImportedDocument {
    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      type: 'txt',
      content: text,
      size: text.length,
      metadata: {
        importedAt: Date.now(),
        source: 'paste',
      },
    };
  }

  /**
   * Validate file before import
   */
  private validateFile(name: string, size?: number, type?: string): void {
    if (!name) {
      throw new Error('Invalid file: missing name');
    }

    const extension = this.getFileExtension(name);
    
    if (!extension) {
      throw new Error('Invalid file: no extension');
    }

    if (!this.supportedTypes.includes(extension)) {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    if (size && size > this.maxFileSize) {
      throw new Error(`File too large: ${Math.round(size / 1024 / 1024)}MB (max: ${this.maxFileSize / 1024 / 1024}MB)`);
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
  }

  /**
   * Read file content based on type
   */
  private async readFile(
    uri: string,
    type: string,
    options?: ImportOptions
  ): Promise<string> {
    const encoding = options?.encoding || 'utf8';

    switch (type) {
      case 'txt':
        return this.readTextFile(uri, encoding);
      case 'pdf':
        return this.readPdfFile(uri);
      case 'docx':
        return this.readDocxFile(uri);
      case 'epub':
        return this.readEpubFile(uri);
      default:
        throw new Error(`Unknown file type: ${type}`);
    }
  }

  /**
   * Read plain text file
   */
  private async readTextFile(uri: string, encoding: string): Promise<string> {
    // Handle content:// URIs on Android
    const filePath = this.resolveUri(uri);
    return FileSystem.readFile(filePath, encoding);
  }

  /**
   * Read PDF file
   * Note: Requires native module or external library
   */
  private async readPdfFile(uri: string): Promise<string> {
    // In production, would use a native PDF extraction library
    // For now, return placeholder
    console.warn('[DocumentImporter] PDF extraction not implemented, returning placeholder');
    
    const filePath = this.resolveUri(uri);
    // Would use: react-native-pdf or similar
    return `[PDF Content from ${uri}]`;
  }

  /**
   * Read DOCX file
   * Note: Requires native module or library
   */
  private async readDocxFile(uri: string): Promise<string> {
    // In production, would use mammoth.js or similar
    console.warn('[DocumentImporter] DOCX extraction not implemented, returning placeholder');
    
    return `[DOCX Content from ${uri}]`;
  }

  /**
   * Read EPUB file
   * Note: Requires EPUB parser library
   */
  private async readEpubFile(uri: string): Promise<string> {
    // In production, would use epub.js or similar
    console.warn('[DocumentImporter] EPUB extraction not implemented, returning placeholder');
    
    return `[EPUB Content from ${uri}]`;
  }

  /**
   * Resolve URI to file path
   */
  private resolveUri(uri: string): string {
    // On Android, content:// URIs need to be copied to a readable location
    if (Platform.OS === 'android' && uri.startsWith('content://')) {
      // Would need to copy to cache directory
      // For now, return as-is (FileSystem can handle some content:// URIs)
      return uri;
    }
    
    // iOS file:// URIs can be read directly
    return uri.replace('file://', '');
  }

  /**
   * Get supported file types
   */
  getSupportedTypes(): string[] {
    return [...this.supportedTypes];
  }

  /**
   * Get maximum file size in MB
   */
  getMaxFileSizeMB(): number {
    return this.maxFileSize / 1024 / 1024;
  }
}

// Singleton instance
export const documentImporter = new DocumentImporter();
