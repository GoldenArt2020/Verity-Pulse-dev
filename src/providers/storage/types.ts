export interface StorageProvider {
  name: string;
  upload(key: string, data: Blob | string): Promise<string>;
  getUrl(key: string): Promise<string>;
}