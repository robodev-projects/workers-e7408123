export const AWS_S3_MEDIA_PROVIDER_NAME = 'aws-s3';

export interface IAwsS3MediaProviderRequestOptions {
  /**
   * Override bucket in requests
   */
  bucket?: string;

  /**
   * Expiration time in seconds
   */
  expiresIn?: number;
}

export interface IAwsS3MediaProviderFetchOptions {
  /**
   * Override bucket in requests
   */
  bucket?: string;

  /**
   * Override public url
   */
  publicUrl?: string;

  /**
   * Expiration time in seconds
   */
  expiresIn?: number;

  /**
   * Sign the fetch requests
   */
  signFetch?: 's3' | 'cloudfront' | 'none';
}
