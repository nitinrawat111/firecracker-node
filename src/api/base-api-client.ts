import { Client, Dispatcher } from "undici";

/**
 * Base API Client for communicating over a Unix socket.
 *
 * This is only responsible for handling sockets config + making requests.
 *
 * This doesn't / won't implement any specific API methods.
 * The child classes should implement those as they are more suitable to handle the specific errors and responses.
 */
export class BaseAPIClient {
  protected undiciClient: Client;

  /**
   * Initializes the API client with the specified socket path.
   * @param socketPath The path to the Unix socket (e.g., '/tmp/firecracker.socket')
   * @param baseUrl The base URL for the API (default is 'http://localhost'). Don't include trailing slash.
   */
  constructor(socketPath: string, baseUrl?: string) {
    this.undiciClient = new Client(baseUrl ?? "http://localhost", {
      connect: { socketPath },
    });
  }

  /**
   * Makes a JSON request to the API.
   * @param options the options for the request. Everything will work except the 'Content-Type' header, which is always set to 'application/json'.
   * @returns the JSON response from the API
   */
  protected async jsonRequest(
    options: Dispatcher.RequestOptions,
  ): Promise<Dispatcher.ResponseData> {
    const response = await this.undiciClient.request({
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
    });

    // Not handling errors here; the caller should handle them explicitly
    // Hence, returing the entire response
    return response;
  }
}
