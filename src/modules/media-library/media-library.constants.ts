import type { INamedIMediaConstraints } from '~common/media';

export class MediaLibrary {
  static SmallImage: INamedIMediaConstraints = {
    name: 'small-image',
    mimeTypes: ['image/jpeg', 'image/png', 'image/jpeg'],
    // 2mb
    fileSize: 1024 * 1024 * 2,
  };
  static LargeImage: INamedIMediaConstraints = {
    name: 'large-image',
    mimeTypes: ['image/jpeg', 'image/png', 'image/jpeg'],
    // 20mb
    fileSize: 1024 * 1024 * 20,
  };
  static CompressedFile: INamedIMediaConstraints = {
    name: 'compressed-file',
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/gzip',
      'application/x-7z-compressed',
      'application/x-bzip2',
    ],
    // 50mb
    fileSize: 1024 * 1024 * 50,
  };
  static Document: INamedIMediaConstraints = {
    name: 'document',
    mimeTypes: [
      'application/msword', // DOC
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.ms-excel', // XLS
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-powerpoint', // PPT
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.oasis.opendocument.text', // ODT
      'application/vnd.oasis.opendocument.spreadsheet', // ODS
      'application/pdf', // PDF
    ],
    // 50mb
    fileSize: 1024 * 1024 * 50,
  };
  static Any: INamedIMediaConstraints = {
    name: 'any',
    mimeTypes: ['*/*'],
    // 100mb
    fileSize: 1024 * 1024 * 50,
  };
}
