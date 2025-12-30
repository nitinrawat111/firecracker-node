import Dispatcher from "undici/types/dispatcher";
import {
  BootSource,
  Drive,
  FirecrackerAPIError,
  InstanceAction,
  InstanceActionInfo,
  InstanceInfo,
  MachineConfiguration,
  PartialDrive,
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

  /**
   * Creates new drive with ID specified by drive_id or updates existing drive.
   * This works pre-boot only.
   * Will fail if update is not possible.
   * @param drive Guest drive properties
   */
  async createOrUpdateDrive(drive: Drive): Promise<void> {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L282
    await this.noContentRequest(
      {
        method: "PUT",
        path: `/drives/${drive.drive_id}`,
        body: JSON.stringify(drive),
      },
      [204],
    );
  }

  /**
   * Updates the properties of a drive with the specified ID.
   * This works post-boot only.
   * Will fail if update is not possible.
   * @param partialDrive Guest drive properties to update
   */
  async updateDriveProperties(partialDrive: PartialDrive): Promise<void> {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L312
    await this.noContentRequest(
      {
        method: "PATCH",
        path: `/drives/${partialDrive.drive_id}`,
        body: JSON.stringify(partialDrive),
      },
      [204],
    );
  }

  /**
   * Gets the machine configuration of the VM.
   * When called before the PUT operation, it will return the default values for the vCPU count (=1), memory size (=128 MiB).
   * By default SMT is disabled and there is no CPU Template.
   * @returns {Promise<MachineConfiguration>} the machine configuration
   * @throws {Error} with the fault_message from the API
   */
  async getMachineConfiguration(): Promise<MachineConfiguration> {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L398
    const machineConfig = await this.jsonRequest<MachineConfiguration>(
      {
        method: "GET",
        path: "/machine-config",
      },
      [200],
    );

    return machineConfig;
  }

  /**
   * Updates the Machine Configuration of the VM.
   * Pre-boot only.
   * - Firecracker starts with default values for vCPU count (=1) and memory size (=128 MiB).
   * - The vCPU count is restricted to the [1, 32] range.
   * - With SMT enabled, the vCPU count is required to be either 1 or an even number in the range. otherwise there are no restrictions regarding the vCPU count.
   * - If 2M hugetlbfs pages are specified, then `mem_size_mib` must be a multiple of 2.
   * - If any of the parameters has an incorrect value, the whole update fails.
   * - All parameters that are optional and are not specified are set to their default values (smt = false, track_dirty_pages = false, cpu_template = None, huge_pages = None).
   * @param machineConfig Machine Configuration Parameters
   * @throws {Error} with the fault_message from the API
   */
  async setMachineConfiguration(
    machineConfig: MachineConfiguration,
  ): Promise<void> {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L415
    await this.noContentRequest(
      {
        method: "PUT",
        path: "/machine-config",
        body: JSON.stringify(machineConfig),
      },
      [204],
    );
  }

  /**
   * Partially updates the Machine Configuration of the VM.
   * Pre-boot only.
   * - If any of the parameters has an incorrect value, the whole update fails.
   * - Same as setMachineConfig, expect that this accepts partial updates. Kept for covering the firecracker API.
   * @param machineConfig A subset of Machine Configuration Parameters
   * @throws {Error} with the fault_message from the API
   */
  async partiallyUpdateMachineConfiguration(
    machineConfig: Partial<MachineConfiguration>,
  ): Promise<void> {
    // See https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L446
    await this.noContentRequest(
      {
        method: "PATCH",
        path: "/machine-config",
        body: JSON.stringify(machineConfig),
      },
      [204],
    );
  }
}
