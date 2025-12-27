{
  description = "Minimal flake with Node.js 24";

  inputs = { nixpkgs.url = "nixpkgs"; };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default =
        pkgs.mkShell { packages = [ pkgs.nodejs_24 ]; };
    };
}
