export * from "./api/api-client";
export * from "./types/api";

// import { FirecrackerAPIClient } from "./api/api-client";
// import { InstanceActions } from "./types/api";

// // This is just an example usage of the API client. Added temporarily until the testing is setup
// async function main() {
//   const api = new FirecrackerAPIClient("/tmp/firecracker.socket");
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
// }
// main();
