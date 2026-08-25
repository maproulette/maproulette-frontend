/**
 * Utility functions for interacting with MapRoulette server data, including
 * fetchEndpoint, submitEndpoint, updateEndpoint, and deleteEndpoint functions
 * for retrieving and managing server content.
 *
 * A CORS "credentials" header is automatically included with each request so
 * that cookies will be included. Learn more at
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 *
 * @see See also Server/Endpoints
 */

import _isEmpty from "lodash/isEmpty";
import { normalize } from "normalizr";
import apiRoutes from "./APIRoutes";
import { cache, resetCache } from "./RequestCache";
import RouteFactory from "./RouteFactory";
import WebSocketClient from "./WebSocketClient";

const baseURL = window.env.REACT_APP_MAP_ROULETTE_SERVER_URL;
const apiKey = window.env.REACT_APP_SERVER_API_KEY;

// In development mode, be less strict about CORS so that the frontend and
// backend can run on separate servers/ports. Otherwise insist on same-origin
// policy
export const credentialsPolicy = process.env.NODE_ENV === "development" ? "include" : "same-origin";

export const serverRouteFactory = new RouteFactory(baseURL);
export const defaultRoutes = Object.freeze(apiRoutes(serverRouteFactory));
export const websocketClient = new WebSocketClient();

const dataAtUrl = function (url, fetchFunction) {
  const cachedData = cache.get(url);
  if (cachedData) {
    return cachedData;
  } else {
    return fetchFunction();
  }
};

/**
 * fetchContent fetches content from the given url, and return a promise that
 * resolves with the JSON response (pre-normalized with the optional
 * normalizationSchema if provided) or rejects on error.
 *
 * @param {string} url
 * @param [normalizationSchema] - optional schema for normalizing json response
 *
 * @returns {Promise} Promise that resolves with response data or rejects on
 *          error
 */
export const fetchContent = function (url, normalizationSchema, options = {}) {
  return dataAtUrl(url, () => {
    const retrieval = new Promise((resolve, reject) => {
      const headers = new Headers();
      if (!_isEmpty(apiKey)) {
        headers.append("apiKey", apiKey);
      }

      const fetchOptions = {
        credentials: options.omitCredentials ? "omit" : credentialsPolicy,
        headers,
      };

      fetch(url, fetchOptions)
        .then(checkStatus)
        .then(parseJSON)
        .then((jsonData) => {
          let result = jsonData;
          if (jsonData && normalizationSchema) {
            result = normalize(jsonData, normalizationSchema);
          }

          resolve(result);
        })
        .catch((error) => {
          if (error.response) {
            // 404 is used by the scala server to indicate no results. Treat as
            // successful response with empty data
            if (error.response.status === 404) {
              resolve(normalize(Array.isArray(normalizationSchema) ? [] : {}, normalizationSchema));
            } else {
              // Attach any details in the response body to the error
              parseJSON(error.response)
                .then((jsonData) => {
                  error.details = jsonData;
                  reject(error);
                })
                .catch(() => reject(error));
            }
          } else {
            reject(error);
          }
        });
    });

    if (!options.noCache) {
      cache.set(url, retrieval);
    }

    return retrieval;
  });
};

/**
 * sendContent sends JSON content to the given url, and return a promise that
 * resolves with the JSON response (pre-normalized with the optional
 * normalizationSchema if provided) or rejects on error.
 *
 * @param {string} method - 'POST' or 'PUT'
 * @param {string} url
 * @param {Object} [jsonBody] - optional JSON data to include with request
 * @param {FormData} [formData] - form data to include with request (alternative to jsonBody)
 * @param [normalizationSchema] - optional schema for normalizing json response
 * @param {boolean} expectXMLResponse - optional flag indicating an XML response is expected
 *
 * @returns {Promise} Promise that resolves with response data or rejects on
 *          error
 */
export const sendContent = function (
  method,
  url,
  jsonBody,
  formData,
  normalizationSchema,
  expectXMLResponse,
) {
  return new Promise((resolve, reject) => {
    resetCache(); // Clear the cache on updates to ensure fetches are fresh.

    const headers = new Headers();
    if (!_isEmpty(apiKey)) {
      headers.append("apiKey", apiKey);
    }
    if (jsonBody) {
      headers.append("Content-Type", "text/json");
    }
    // Note: do not set multipart/form-data Content-Type header for formData --
    // fetch will set that automatically (with the correct boundary included)

    fetch(url, {
      method,
      credentials: credentialsPolicy,
      headers,
      body: jsonBody ? JSON.stringify(jsonBody) : formData,
    })
      .then(checkStatus)
      .then((response) => {
        if (expectXMLResponse) {
          response
            .text()
            .then((text) => resolve(text))
            .catch((error) => reject(error));
          return;
        }

        parseJSON(response)
          .then((jsonData) => {
            if (jsonData && normalizationSchema) {
              resolve(normalize(jsonData, normalizationSchema));
            } else {
              resolve(jsonData);
            }
          })
          .catch((error) => reject(error));
      })
      .catch((error) => {
        if (error.response) {
          // Attach any details in the response body to the error, same as fetchContent
          parseJSON(error.response)
            .then((jsonData) => {
              error.details = jsonData;
              reject(error);
            })
            .catch(() => reject(error));
        } else {
          reject(error);
        }
      });
  });
};

/**
 * deleteContent sends a DELETE to the given url. Returns a promise that
 * resolves to successful response or rejects if there is an error.
 *
 * @param {string} url
 *
 * @returns {Promise} Promise that resolves to the response or rejects on error
 */
export const deleteContent = function (url) {
  return new Promise((resolve, reject) => {
    resetCache(); // Clear the cache on deletes to ensure fetches are fresh.

    const headers = new Headers();
    if (!_isEmpty(apiKey)) {
      headers.append("apiKey", apiKey);
    }

    fetch(url, { method: "DELETE", credentials: credentialsPolicy, headers })
      .then(checkStatus)
      .then((response) => resolve(response))
      .catch((error) => reject(error));
  });
};

/**
 * Returns true for 401 and 403 errors, false for all others.
 */
export const isSecurityError = function (serverError) {
  return (
    serverError.response &&
    (serverError.response.status === 401 || serverError.response.status === 403)
  );
};

/**
 * checkStatus evaluates the given response and throws an error for non-2xx
 * responses, or otherwise just returns the response on success.
 *
 * @param response
 *
 * @returns the given response on success
 */
const checkStatus = function (response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
};

/**
 * parseJson retrieves the JSON payload from the given response.
 *
 * @param response
 *
 * @returns null if there is no content (204) or if the response content-type
 *          isn't json
 */
const parseJSON = function (response) {
  if (response.status === 204) {
    return Promise.resolve(null);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || contentType.indexOf("application/json") === -1) {
    return Promise.resolve(null);
  }

  return response.json();
};
