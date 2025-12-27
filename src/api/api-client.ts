import { FirecrackerAPIError, InstanceInfo } from "../types/api";
import { BaseAPIClient } from "./base-api-client";

/**
 * API Client for interacting with the Firecracker API over a Unix socket.
 */
export class FirecrackerAPIClient extends BaseAPIClient {
  constructor(socketPath: string, baseUrl?: string) {
    super(socketPath, baseUrl);
  }

  /**
   * Returns general information about an instance
   * @throws {Error} with the fault_message from the API
   */
  async getInstanceInfo(): Promise<InstanceInfo> {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L27
    const response = await this.jsonRequest({
      method: "GET",
      path: "/",
    });

    if (response.statusCode !== 200) {
      const errorBody = (await response.body.json()) as FirecrackerAPIError;
      throw new Error(
        `Failed to get instance info: ${errorBody.fault_message}`,
      );
    }

    const instanceInfo = await response.body.json();
    return instanceInfo as InstanceInfo;
  }
}
