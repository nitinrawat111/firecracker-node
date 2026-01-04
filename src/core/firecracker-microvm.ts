import { ChildProcess, spawn } from "child_process";
import { FirecrackerAPIClient } from "../api/api-client";
import {
  DefaultFirecrackerInitParams,
  FirecrackerInitParams,
} from "../types/firecracker";
import { unlink } from "fs/promises";

/**
 * Represents a firecracker microVM instance.
 *  - Before calling any API methods, ensure that the firecracker process is spawned using spawnFirecrackerProcess().
 *  - After finishing with the instance, call stopFirecrackerProcess() to clean up the process.
 *
 * @note This makes API calls for each configuration change. Use FirecrackerLauncher for easier microVM setup.
 */
export class FirecrackerMicroVM extends FirecrackerAPIClient {
  /**
   * Initialization parameters for the Firecracker process.
   * Defaults are taken from DefaultFirecrackerInitParams.
   */
  protected initParams: FirecrackerInitParams = DefaultFirecrackerInitParams;
  /**
   * The spawned Firecracker process.
   */
  protected firecrackerProcess?: ChildProcess;

  /**
   * Initializes the configuration for Firecracker instance. It does not start the microVM (or firecracker process) yet.
   *
   * To actually start the microVM, call spawnFirecrackerProcess().
   *
   * @param initParams the initialization parameters for the Firecracker process
   */
  constructor(initParams?: FirecrackerInitParams) {
    const socketPath =
      initParams?.apiSock ?? DefaultFirecrackerInitParams.apiSock;
    super(socketPath);

    this.initParams = {
      // This is done to ensure that any missing parameters in initParams are filled with defaults
      // Firecracker will use the default values if not provided
      // But we also want to have the default values available in this.initParams
      ...DefaultFirecrackerInitParams,
      ...initParams,
    };
  }

  /**
   * Builds the command line arguments array for the Firecracker binary based on initParams.
   * This follows the same logic as the Rust ArgParser in the Firecracker source.
   * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/src/main.rs#L144
   */
  protected buildFirecrackerArgs(): string[] {
    const args: string[] = [];

    // --api-sock
    if (typeof this.initParams.apiSock === "string") {
      args.push("--api-sock", this.initParams.apiSock);
    }

    // --id
    if (typeof this.initParams.id === "string") {
      args.push("--id", this.initParams.id);
    }

    // --seccomp-filter
    // TODO: Validate this if noSeccomp is provided
    if (typeof this.initParams.seccompFilter === "string") {
      args.push("--seccomp-filter", this.initParams.seccompFilter);
    }

    // --no-seccomp
    if (this.initParams.noSeccomp === true) {
      args.push("--no-seccomp");
    }

    // --start-time-us
    if (typeof this.initParams.startTimeUs === "number") {
      args.push("--start-time-us", this.initParams.startTimeUs.toString());
    }

    // --start-time-cpu-us
    if (typeof this.initParams.startTimeCpuUs === "number") {
      args.push(
        "--start-time-cpu-us",
        this.initParams.startTimeCpuUs.toString(),
      );
    }

    // --parent-cpu-time-us
    if (typeof this.initParams.parentCPUTimeUs === "number") {
      args.push(
        "--parent-cpu-time-us",
        this.initParams.parentCPUTimeUs.toString(),
      );
    }

    // --config-file
    if (typeof this.initParams.configFile === "string") {
      args.push("--config-file", this.initParams.configFile);
    }

    // --metadata
    if (typeof this.initParams.metadataFile === "string") {
      args.push("--metadata", this.initParams.metadataFile);
    }

    // --no-api (requires --config-file)
    if (
      this.initParams.noApi === true &&
      typeof this.initParams.configFile === "string"
    ) {
      args.push("--no-api");
    }

    // --log-path
    if (typeof this.initParams.logPath === "string") {
      args.push("--log-path", this.initParams.logPath);
    }

    // --level
    if (typeof this.initParams.level === "string") {
      args.push("--level", this.initParams.level);
    }

    // --module
    if (typeof this.initParams.module === "string") {
      args.push("--module", this.initParams.module);
    }

    // --show-level
    if (this.initParams.showLevel === true) {
      args.push("--show-level");
    }

    // --show-log-origin
    if (this.initParams.showLogOrigin === true) {
      args.push("--show-log-origin");
    }

    // --metrics-path
    if (typeof this.initParams.metricsPath === "string") {
      args.push("--metrics-path", this.initParams.metricsPath);
    }

    // --boot-timer
    if (this.initParams.bootTimer === true) {
      args.push("--boot-timer");
    }

    // --version
    if (this.initParams.version === true) {
      args.push("--version");
    }

    // --snapshot-version
    if (this.initParams.snapshotVersion === true) {
      args.push("--snapshot-version");
    }

    // --describe-snapshot
    if (typeof this.initParams.describeSnapshot === "string") {
      args.push("--describe-snapshot", this.initParams.describeSnapshot);
    }

    // --http-api-max-payload-size (has default)
    if (typeof this.initParams.httpApiMaxPayloadSize === "number") {
      args.push(
        "--http-api-max-payload-size",
        this.initParams.httpApiMaxPayloadSize.toString(),
      );
    }

    // --mmds-size-limit
    if (typeof this.initParams.mmdsSizeLimit === "number") {
      args.push("--mmds-size-limit", this.initParams.mmdsSizeLimit.toString());
    }

    // --enable-pci
    if (this.initParams.enablePci === true) {
      args.push("--enable-pci");
    }

    return args;
  }

  /**
   * Spawns a firecracker process
   *  - Does nothing if the process is already spawned.
   *  - Waits until the Firecracker API is ready to accept requests before returning.
   *  - If the API does not become ready within 5 seconds, throws an error.
   *
   * @param removeExistingSocket whether to remove an existing socket file before starting the process. This is useful to ensure that a stale socket does not prevent the Firecracker process from starting.
   */
  async spawnFirecrackerProcess(removeExistingSocket: boolean): Promise<void> {
    if (this.firecrackerProcess !== undefined) {
      // Process already spawned
      return;
    }

    if (removeExistingSocket === true) {
      // Try to remove existing socket file
      await unlink(
        this.initParams.apiSock ?? DefaultFirecrackerInitParams.apiSock,
      );
    }

    this.firecrackerProcess = spawn("firecracker", this.buildFirecrackerArgs());

    /////////////////////////////////////////////////////////////////////////
    // We want to make sure that firecracker is ready to accept API
    // Two possible ways:
    // 1. Reading stdout for the "API socket listening" message
    // 2. Polling the API until it responds
    // We go with API polling + timeout for more reliability
    /////////////////////////////////////////////////////////////////////////

    // Create an abort controller to stop polling when timeout occurs
    const abortController = new AbortController();
    const pollContinuously = async () => {
      while (abortController.signal.aborted === false) {
        try {
          await this.getInstanceInfo();
          break; // Exit loop if successful
        } catch {
          // Ignore errors and keep polling
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    const waitForTimeout = () => {
      return new Promise<void>((_, reject) => {
        setTimeout(() => {
          abortController.abort();
          reject(new Error("Timeout waiting for Firecracker API to be ready"));
        }, 5000);
      });
    };

    // Whichever completes first: polling success or timeout
    await Promise.race([pollContinuously(), waitForTimeout()]);
  }

  /**
   * Kills the Firecracker process and waits for it to exit.
   *  - If the process is not running, does nothing.
   */
  async stopFirecrackerProcess(): Promise<void> {
    if (this.firecrackerProcess === undefined) {
      // If process is not running, nothing to do
      return;
    }

    // Promise which waits for process to actually exit
    const waitForExit = new Promise<void>((resolve) => {
      this.firecrackerProcess?.on("exit", () => {
        resolve();
      });
    });

    // Kill the process and wait for it to exit
    this.firecrackerProcess.kill();
    await waitForExit;

    this.firecrackerProcess = undefined;
  }
}
