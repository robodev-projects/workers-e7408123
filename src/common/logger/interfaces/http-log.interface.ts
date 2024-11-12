import type { ILog } from './log.interface';

/**
 * Http Request Log
 */
export interface IHttpRequestLog extends ILog {
  data: {
    /**
     * IP address of the remote request
     */
    remoteIp?: string | undefined;

    /**
     * The endpoint used
     * - grouping by resource for analytics
     */
    requestRoute?: string;

    /**
     * The requested resource
     * - useful for auditing read access
     */
    requestUrl?: string;

    /**
     * User-Agent header
     */
    userAgent?: string;
  };
}

/**
 * Http Response Log
 */
export interface IHttpResponseLog extends IHttpRequestLog {
  data: IHttpRequestLog['data'] & {
    /**
     * HTTP response code
     */
    responseCode?: number | undefined;

    /**
     * Time it took to handle this request in milliseconds
     */
    responseTime?: number;

    /**
     * User ID
     */
    userId?: string;
  };
}
