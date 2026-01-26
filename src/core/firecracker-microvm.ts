import { ChildProcess, spawn } from "child_process";
import { FirecrackerAPIClient } from "../api/api-client";
import {
  DefaultFirecrackerInitParams,
  FirecrackerInitParams,
  MicroVMConfig,
} from "../types/firecracker";
import { unlink } from "fs/promises";
import {
  InstanceActions,
  InstanceInfo,
  MachineConfiguration,
  PartialDrive,
} from "../types/api";
import { existsSync } from "fs";

/**
 * Represents a running Firecracker microVM instance.
 *
 * Use the static `create()` method to spawn and boot a microVM.
 * This class only exposes post-boot methods.
 */
export class FirecrackerMicroVM {
  /**
   * The API client for communicating with the Firecracker process.
   */
  private apiClient: FirecrackerAPIClient;

  /**
   * The spawned Firecracker process.
   */
  private firecrackerProcess: ChildProcess | null;

  /**
   * Initialization parameters for the Firecracker process.
   */
  private firecrackerInitParams: FirecrackerInitParams;

  /**
   * MicroVM configuration.
   */
  private microVMConfig: MicroVMConfig;

  /**
   * Whether the VM is running or not.
   */
  private isRunning: boolean = false;

  /**
   * Private constructor - use `FirecrackerMicroVM.create()` to create an instance.
   * @param firecrackerInitParams Firecracker process initialization parameters
   * @param microVMConfig The microVM configuration
   */
  private constructor(
    // TODO: Use Required<FirecrackerInitParams> after setting defaults. Same for MicroVMConfig
    firecrackerInitParams: FirecrackerInitParams,
    microVMConfig: MicroVMConfig,
  ) {
    const socketPath =
      firecrackerInitParams.apiSock ?? DefaultFirecrackerInitParams.apiSock;

    this.firecrackerInitParams = {
      // This is done to ensure consistent state at runtime (if nothing is provided, runtime should dictate defaults)
      ...DefaultFirecrackerInitParams,
      ...firecrackerInitParams,
    };

    // TODO: Setup Default values for microVMConfig
    this.microVMConfig = microVMConfig;

    this.apiClient = new FirecrackerAPIClient(socketPath);
    this.firecrackerProcess = spawn("firecracker", this.buildFirecrackerArgs());
  }

  /**
   * Builds the command line arguments array for the Firecracker binary based on firecrackerInitParams.
   * This follows the same logic as the Rust ArgParser in the Firecracker source.
   * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/src/main.rs#L144
   */
  protected buildFirecrackerArgs(): string[] {
    const args: string[] = [];

    // --api-sock
    if (typeof this.firecrackerInitParams.apiSock === "string") {
      args.push("--api-sock", this.firecrackerInitParams.apiSock);
    }

    // --id
    if (typeof this.firecrackerInitParams.id === "string") {
      args.push("--id", this.firecrackerInitParams.id);
    }

    // --seccomp-filter
    // TODO: Validate this if noSeccomp is provided
    if (typeof this.firecrackerInitParams.seccompFilter === "string") {
      args.push("--seccomp-filter", this.firecrackerInitParams.seccompFilter);
    }

    // --no-seccomp
    if (this.firecrackerInitParams.noSeccomp === true) {
      args.push("--no-seccomp");
    }

    // --start-time-us
    if (typeof this.firecrackerInitParams.startTimeUs === "number") {
      args.push(
        "--start-time-us",
        this.firecrackerInitParams.startTimeUs.toString(),
      );
    }

    // --start-time-cpu-us
    if (typeof this.firecrackerInitParams.startTimeCpuUs === "number") {
      args.push(
        "--start-time-cpu-us",
        this.firecrackerInitParams.startTimeCpuUs.toString(),
      );
    }

    // --parent-cpu-time-us
    if (typeof this.firecrackerInitParams.parentCPUTimeUs === "number") {
      args.push(
        "--parent-cpu-time-us",
        this.firecrackerInitParams.parentCPUTimeUs.toString(),
      );
    }

    // --config-file
    if (typeof this.firecrackerInitParams.configFile === "string") {
      args.push("--config-file", this.firecrackerInitParams.configFile);
    }

    // --metadata
    if (typeof this.firecrackerInitParams.metadataFile === "string") {
      args.push("--metadata", this.firecrackerInitParams.metadataFile);
    }

    // --no-api (requires --config-file)
    if (
      this.firecrackerInitParams.noApi === true &&
      typeof this.firecrackerInitParams.configFile === "string"
    ) {
      args.push("--no-api");
    }

    // --log-path
    if (typeof this.firecrackerInitParams.logPath === "string") {
      args.push("--log-path", this.firecrackerInitParams.logPath);
    }

    // --level
    if (typeof this.firecrackerInitParams.level === "string") {
      args.push("--level", this.firecrackerInitParams.level);
    }

    // --module
    if (typeof this.firecrackerInitParams.module === "string") {
      args.push("--module", this.firecrackerInitParams.module);
    }

    // --show-level
    if (this.firecrackerInitParams.showLevel === true) {
      args.push("--show-level");
    }

    // --show-log-origin
    if (this.firecrackerInitParams.showLogOrigin === true) {
      args.push("--show-log-origin");
    }

    // --metrics-path
    if (typeof this.firecrackerInitParams.metricsPath === "string") {
      args.push("--metrics-path", this.firecrackerInitParams.metricsPath);
    }

    // --boot-timer
    if (this.firecrackerInitParams.bootTimer === true) {
      args.push("--boot-timer");
    }

    // --version
    if (this.firecrackerInitParams.version === true) {
      args.push("--version");
    }

    // --snapshot-version
    if (this.firecrackerInitParams.snapshotVersion === true) {
      args.push("--snapshot-version");
    }

    // --describe-snapshot
    if (typeof this.firecrackerInitParams.describeSnapshot === "string") {
      args.push(
        "--describe-snapshot",
        this.firecrackerInitParams.describeSnapshot,
      );
    }

    // --http-api-max-payload-size (has default)
    if (typeof this.firecrackerInitParams.httpApiMaxPayloadSize === "number") {
      args.push(
        "--http-api-max-payload-size",
        this.firecrackerInitParams.httpApiMaxPayloadSize.toString(),
      );
    }

    // --mmds-size-limit
    if (typeof this.firecrackerInitParams.mmdsSizeLimit === "number") {
      args.push(
        "--mmds-size-limit",
        this.firecrackerInitParams.mmdsSizeLimit.toString(),
      );
    }

    // --enable-pci
    if (this.firecrackerInitParams.enablePci === true) {
      args.push("--enable-pci");
    }

    return args;
  }

  /**
   * Creates and boots a new Firecracker microVM.
   *
   * This method:
   * 1. Creates a new FirecrackerMicroVM instance which internally
   *     - Spawns the Firecracker process
   *     - Creates the API client to communicate with the process
   * 2. Then, waits for the API to be ready
   * 3. Configures boot source, drives, and machine configuration
   * 4. Starts the microVM and returns a running instance
   *
   * @param firecrackerInitParams Firecracker process initialization parameters
   * @param vmConfig The microVM configuration
   * @param cleanupExistingSocket Whether to clean up an existing socket file before starting the VM (default: true)
   * @returns A running FirecrackerMicroVM instance
   * @throws {Error} If the configuration is invalid or if the API/VM fails to start
   */
  static async create(
    firecrackerInitParams: FirecrackerInitParams,
    microVMConfig: MicroVMConfig,
    cleanupExistingSocket: boolean = true,
  ): Promise<FirecrackerMicroVM> {
    if (microVMConfig.drives.length === 0) {
      throw new Error("At least one drive is required");
    }

    const socketPath =
      firecrackerInitParams.apiSock ?? DefaultFirecrackerInitParams.apiSock;
    if (cleanupExistingSocket === true && existsSync(socketPath)) {
      await unlink(socketPath);
    }

    const firecrackerMicroVM = new FirecrackerMicroVM(
      firecrackerInitParams,
      microVMConfig,
    );
    await firecrackerMicroVM.apiClient.waitForAPIToBeReady();
    await firecrackerMicroVM.apiClient.setBootSource(microVMConfig.bootSource);
    await Promise.all(
      microVMConfig.drives.map((drive) =>
        firecrackerMicroVM.apiClient.createOrUpdateDrive(drive),
      ),
    );

    if (microVMConfig.machineConfig !== undefined) {
      await firecrackerMicroVM.apiClient.setMachineConfiguration(
        microVMConfig.machineConfig,
      );
    }

    await firecrackerMicroVM.apiClient.startAction(
      InstanceActions.InstanceStart,
    );

    firecrackerMicroVM.isRunning = true;
    return firecrackerMicroVM;
  }

  // =========================================================================
  // Post-boot methods
  // =========================================================================

  /**
   * Throws an error if the VM has been stopped.
   */
  private assertRunning(): void {
    if (this.isRunning === false) {
      throw new Error(
        "This FirecrackerMicroVM instance is not running. Create a new instance to start another VM.",
      );
    }
  }

  /**
   * Returns general information about the running instance.
   * @returns The instance information
   * @throws {Error} If the VM has been stopped
   */
  async getInstanceInfo(): Promise<InstanceInfo> {
    this.assertRunning();
    return this.apiClient.getInstanceInfo();
  }

  /**
   * Gets the machine configuration of the VM.
   * @returns The machine configuration
   * @throws {Error} If the VM has been stopped
   */
  async getMachineConfiguration(): Promise<MachineConfiguration> {
    this.assertRunning();
    return this.apiClient.getMachineConfiguration();
  }

  /**
   * Updates the properties of a drive.
   * This can be used to change the backing file or rate limiter of a drive post-boot.
   * @param partialDrive The drive properties to update
   * @throws {Error} If the VM has been stopped
   */
  async updateDriveProperties(partialDrive: PartialDrive): Promise<void> {
    this.assertRunning();
    return this.apiClient.updateDriveProperties(partialDrive);
  }

  /**
   * Stops the Firecracker microVM and cleans up resources.
   * This kills the Firecracker process, removes the socket file and closes the API client connection.
   *
   * After calling this method, the instance is no longer usable.
   * Any subsequent method calls will throw an error.
   */
  async cleanup(): Promise<void> {
    if (this.isRunning === false) {
      return; // Already stopped, nothing to do
    }

    // Promise which waits for process to actually exit
    const waitForExit = new Promise<void>((resolve) => {
      this.firecrackerProcess?.on("exit", () => {
        resolve();
      });
    });

    // Kill the process and wait for it to exit
    this.firecrackerProcess?.kill();
    await waitForExit;
    this.firecrackerProcess = null;

    // Clean up socket file
    const socketPath =
      this.firecrackerInitParams.apiSock ??
      DefaultFirecrackerInitParams.apiSock;

    await unlink(socketPath);
    await this.apiClient.cleanup();
  }
}
