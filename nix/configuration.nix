# Merge this example into your server's /etc/nixos/configuration.nix.
# Keep your existing hardware configuration and other system settings.
{ ... }:
let
  # Change this path to the repository checkout on your server.
  # The checkout must include flake.nix and flake.lock.
  tryglasses = builtins.getFlake "path:/srv/tryglasses-web";
in
{
  imports = [ tryglasses.nixosModules.default ];

  # nginx serves the production build at http://localhost:9000.
  services.tryglasses-web = {
    enable = true;
    port = 9000;
  };
}
