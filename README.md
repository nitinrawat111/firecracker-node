# firecracker-node

Type-safe TypeScript SDK for Firecracker microVMs.

## Warning

_This is an early-stage project and is still under active development. The API may change significantly in future releases. DO NOT use in production environments._

## Documentation

Take a look at the docs [here](https://nitinrawat111.github.io/firecracker-node/)

## Quickstart

### 1. Using FirecrackerMicroVMLauncher (Recommended)

The easiest way to launch a microVM. First, configure everything and then launch with a single call.

```typescript
import { FirecrackerMicroVMLauncher } from "firecracker-node";

async function main() {
  // Create a launcher instance
  // Configure the initial parameters for Firecracker
  const launcher = new FirecrackerMicroVMLauncher({
    apiSock: "/tmp/firecracker.socket",
  });

  // Configure and launch the microVM
  const vm = await launcher
    .setBootSource({
      kernel_image_path: "./vmlinux.bin",
      boot_args: "console=ttyS0 reboot=k panic=1 pci=off",
    })
    .addDrive({
      drive_id: "rootfs",
      path_on_host: "./rootfs.ext4",
      is_root_device: true,
      is_read_only: false,
    })
    .setMachineConfiguration({
      vcpu_count: 2,
      mem_size_mib: 512,
    })
    // Finally, launch the VM
    // This returns a FirecrackerMicroVM instance
    .launch();

  // VM is now running, interact with it
  const info = await vm.getInstanceInfo();
  console.log("VM is running:", info.state);

  // When done, stop the VM
  await vm.stopFirecrackerProcess();
}

main().catch((err) => {
  console.error("Failed to start VM:", err);
});
```

---

### 2. Using FirecrackerMicroVM

You can also use `FirecrackerMicroVM` directly.

There are two ways to use it

1. You spawn the Firecracker process manually and use the API client methods. (Why though?)
2. You can use the built-in method to spawn the Firecracker process.

```typescript
import { FirecrackerMicroVM, InstanceActions } from "firecracker-node";

async function main() {
  const vm = new FirecrackerMicroVM({
    apiSock: "/tmp/firecracker.socket",
  });

  // Step 1: Spawn the Firecracker process (this starts the API server)
  // If this is not called, subsequent API calls will fail
  // Alternatively, you can start Firecracker manually (systemd or external spawn) and skip this step
  await vm.spawnFirecrackerProcess(true); // true = remove existing socket

  // Step 2: Configure the VM (pre-boot)
  await vm.setBootSource({
    kernel_image_path: "./vmlinux.bin",
    boot_args: "console=ttyS0 reboot=k panic=1 pci=off",
  });

  await vm.createOrUpdateDrive({
    drive_id: "rootfs",
    path_on_host: "./rootfs.ext4",
    is_root_device: true,
    is_read_only: false,
  });

  await vm.setMachineConfiguration({
    vcpu_count: 2,
    mem_size_mib: 512,
  });

  // Step 3: Boot the VM
  await vm.startAction(InstanceActions.InstanceStart);

  // VM is now running
  const info = await vm.getInstanceInfo();
  console.log("VM state:", info.state);

  // When done, stop the process
  await vm.stopFirecrackerProcess();
}

main().catch((err) => {
  console.error("Failed to start VM:", err);
});
```

---

### 3. Using FirecrackerAPIClient

Use `FirecrackerAPIClient` when you're managing the Firecracker process yourself (e.g., via systemd, or manual spawn) and only need to interact with the API.

```typescript
import { FirecrackerAPIClient, InstanceActions } from "firecracker-node";

async function main() {
  // Connect to an already-running Firecracker socket
  const api = new FirecrackerAPIClient("/tmp/firecracker.socket");

  // Configure boot source
  await api.setBootSource({
    kernel_image_path: "./vmlinux.bin",
    boot_args: "console=ttyS0 reboot=k panic=1 pci=off",
  });

  // Attach rootfs drive
  await api.createOrUpdateDrive({
    drive_id: "rootfs",
    path_on_host: "./rootfs.ext4",
    is_root_device: true,
    is_read_only: false,
  });

  // Start the instance
  await api.startAction(InstanceActions.InstanceStart);

  // Query instance info
  const info = await api.getInstanceInfo();
  console.log("Instance:", info.id, "State:", info.state);
}

main().catch((err) => {
  console.error("Failed to start VM:", err);
});
```

## Contributing

The project is in early stages and needs community suggestions/feedback. Feel free to open issues or submit pull requests!
