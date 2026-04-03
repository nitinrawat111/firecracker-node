{
  description = "Minimal flake with Node.js 24";

  inputs = { nixpkgs.url = "nixpkgs"; };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default = pkgs.mkShell {
        # nixfmt-classic is included to format Nix files
        packages = [ pkgs.nixfmt-classic pkgs.nodejs_24 pkgs.firecracker ];
      };
    };
}
