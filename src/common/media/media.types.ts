export interface IMediaAssociation {
  /**
   * Module scoped resourceName
   *  - can contain a unique resource combination or a generic resource name
   */
  resourceName?: IMediaResourceName;

  /**
   * Module that owns this media
   */
  module?: string;

  /**
   * Module scoped type of this file
   */
  type?: string;

  /**
   * Module scope id of the associated resource
   *  - combined with a type, this could be a database relation
   * @type {UUID}
   */
  resourceId?: string;

  /**
   * User that uploaded the image
   */
  userId?: string;
}

export interface IMediaConstraints {
  /**
   * Maximum file size in bytes
   */
  fileSize?: number;

  /**
   * List of allowed mime types
   */
  mimeTypes?: string[];
}

export interface INamedIMediaConstraints extends IMediaConstraints {
  name: IMediaResourceName;
}

export interface IMediaFile {
  /**
   * Original file name
   */
  fileName: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * Mime type of the file
   */
  mimeType: string;
}

export interface IMedia extends IMediaAssociation, IMediaFile {
  resourceName: IMediaResourceName;

  /**
   * Internal id of this resource
   * @type {UUID}
   */
  id: IMediaId;

  /**
   * Provider key/id
   */
  key: string;

  /**
   * Additional provider specific meta data
   */
  meta?: Record<string, any>;

  /**
   * If the file was uploaded
   */
  uploaded?: boolean;

  /**
   * If the file was validated
   */
  validated?: boolean;

  /**
   * If the file was validated
   */
  provider: string;
}

export type IMediaResourceName = string;
export type IMediaId = string;

/**
 * Request the client does to upload a file
 *  - the resource name is associated with constraints
 */
export interface IMediaUploadRequest extends IMediaFile {
  resourceName?: IMediaResourceName;
}

/**
 * Instructions for the client to upload a file
 *  - includes constraints and other provider details
 *  - provides all the necessary authorization
 */
export interface IMediaUploadInstructions {
  /**
   * Provider defined type of upload
   */
  method: 'put' | 'post' | string;

  /**
   * Provider specific upload url
   */
  url?: string;

  /**
   * Fields to send with the POST request
   */
  fields?: [string, string][];

  /**
   * Media ID the client can use to associate the file
   */
  id: IMediaId;

  /**
   * Media provider
   */
  provider: string;
}

/**
 * Request the client does to fetch a file
 */
export interface IMediaFetchRequest {
  resourceName?: IMediaResourceName;
  id: IMediaId;
}

export interface IMediaFetchInstructions extends Record<string, any> {
  id?: IMediaId;
  url?: string;
}

export interface IMediaAttachRequest extends Record<string, any> {
  id: IMediaId;
}
