import { InstanceInfo } from "../types/api";
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
   */
  async getInstanceInfo() {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L27
    const response = await this.jsonRequest({
      method: "GET",
      path: "/",
    });

    // TODO: Handle errors here
    const instanceInfo = await response.body.json();
    return instanceInfo as InstanceInfo;
  }
}
