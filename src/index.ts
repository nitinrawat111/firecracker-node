export * from "./api/api-client";
export * from "./types/api";

// Example usage:
// import { Firecracker } from "./core/firecracker";
// import { InstanceActions } from "./types/api";

// async function main() {
//   const api = new Firecracker({
//     apiSock: "/tmp/firecracker.socket",
//   });

//   await api.spawnFirecrackerProcess(true);
//   await api.setBootSource({
//     kernel_image_path: "/home/azios/Downloads/hello-vmlinux.bin",
//     boot_args: "console=ttyS0 reboot=k panic=1 pci=off",
//   });

//   await api.createOrUpdateDrive({
//     drive_id: "rootfs",
//     path_on_host: "/home/azios/Downloads/hello-rootfs.ext4",
//     is_root_device: true,
//     is_read_only: false,
//   });

//   await api.startAction(InstanceActions.InstanceStart);
//   await api.stopFirecrackerProcess();
// }
// main();
