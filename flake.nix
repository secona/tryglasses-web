{
  description = "Build and serve TryGlasses on localhost:9000";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      inherit (nixpkgs) lib;
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems = lib.genAttrs systems;
      packageJson = builtins.fromJSON (builtins.readFile ./package.json);
      source = lib.fileset.toSource {
        root = ./.;
        fileset = lib.fileset.unions [
          ./package.json
          ./package-lock.json
          ./index.html
          ./vite.config.js
          ./src
          ./public
        ];
      };
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          website = pkgs.buildNpmPackage {
            pname = packageJson.name;
            version = packageJson.version;
            src = source;
            nodejs = pkgs.nodejs_22;

            # Update this hash when package-lock.json changes.
            npmDepsHash = "sha256-DqAaYgk1JVx8bDWVJsQ852VoVzEn8TMnmm2qH7pmMjE=";

            installPhase = ''
              runHook preInstall
              mkdir -p "$out"
              cp -r dist/. "$out/"
              runHook postInstall
            '';

            meta = {
              description = "Virtual eyewear simulation on portrait images";
              license = lib.licenses.mit;
              platforms = systems;
            };
          };
        in
        {
          default = website;
          tryglasses-web = website;
        });

      nixosModules.default = { config, lib, pkgs, ... }:
        let
          cfg = config.services.tryglasses-web;
        in
        {
          options.services.tryglasses-web = {
            enable = lib.mkEnableOption "TryGlasses on localhost";
            port = lib.mkOption {
              type = lib.types.port;
              default = 9000;
              description = "Local port on which to serve TryGlasses.";
            };
          };

          config = lib.mkIf cfg.enable {
            services.nginx.enable = true;
            services.nginx.virtualHosts.tryglasses-web = {
              serverName = "localhost";
              listen = [
                {
                  addr = "127.0.0.1";
                  port = cfg.port;
                }
              ];
              root = "${self.packages.${pkgs.stdenv.hostPlatform.system}.default}";
              locations."/".tryFiles = "$uri $uri/ =404";
            };
          };
        };
    };
}
