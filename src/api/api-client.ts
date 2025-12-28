import Dispatcher from "undici/types/dispatcher";
import {
  BootSource,
  FirecrackerAPIError,
  InstanceAction,
  InstanceActionInfo,
  InstanceInfo,
} from "../types/api";
import { Client } from "undici";

/**
 * API Client for interacting with the Firecracker API over a Unix socket.
 */
export class FirecrackerAPIClient {
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
   * Makes a request to the API.
   *
   * - Assumes JSON request body.
   * - Checks that the response status code is in the validStatusCodes array.
   * - If not, throws an Error with the fault_message from the API error response.
   *
   * @param options the options for the request. Everything will work except the 'Content-Type' header, which is always set to 'application/json'.
   * @param validStatusCodes array of valid status codes for the response
   * @returns the response from the API
   * @throws {Error} with the fault_message from the API if the response status code is not valid
   */
  protected async request(
    options: Dispatcher.RequestOptions,
    validStatusCodes: number[],
  ): Promise<Dispatcher.ResponseData> {
    const response = await this.undiciClient.request({
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
    });

    if (validStatusCodes.includes(response.statusCode) === false) {
      // All error responses from the Firecracker API have the same structure
      // { fault_message: string }
      const errorBody = (await response.body.json()) as FirecrackerAPIError;
      throw new Error(`API request failed: ${errorBody.fault_message}`);
    }

    return response;
  }

  /**
   * - Attempts to parse response body as JSON.
   * - Calls `request()` internally
   */
  protected async jsonRequest<ResponseBodyType extends object>(
    options: Dispatcher.RequestOptions,
    validStatusCodes: number[],
  ): Promise<ResponseBodyType> {
    const response = await this.request(options, validStatusCodes);
    const responseBody = (await response.body.json()) as ResponseBodyType;
    return responseBody;
  }

  /**
   * - Does not attempt to parse response body.
   * - Calls `request()` internally
   */
  protected async noContentRequest(
    options: Dispatcher.RequestOptions,
    validStatusCodes: number[],
  ): Promise<void> {
    await this.request(options, validStatusCodes);
  }

  /**
   * Returns general information about an instance
   * @throws {Error} with the fault_message from the API
   * @returns {Promise<InstanceInfo>} the instance information
   */
  async getInstanceInfo(): Promise<InstanceInfo> {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L27
    const instanceInfo = await this.jsonRequest<InstanceInfo>(
      {
        method: "GET",
        path: "/",
      },
      [200],
    );

    return instanceInfo;
  }

  /**
   * Starts an action on the instance
   * @param action The action to start
   * @throws {Error} with the fault_message from the API
   * @returns {Promise<void>} resolves when the action is successfully started
   */
  async startAction(action: InstanceAction): Promise<void> {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L41
    const actionInfo: InstanceActionInfo = {
      action_type: action,
    };

    await this.noContentRequest(
      {
        method: "PUT",
        path: "/actions",
        body: JSON.stringify(actionInfo),
      },
      [204],
    );
  }

  /**
   * Creates new boot source if one does not already exist, otherwise updates it.
   * This is works pre-boot only.
   * Will fail if update is not possible.
   * @param bootSource the bootsource
   */
  async setBootSource(bootSource: BootSource) {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L230
    await this.noContentRequest(
      {
        method: "PUT",
        path: "/boot-source",
        body: JSON.stringify(bootSource),
      },
      [204],
    );
  }
}
