# TryGlasses: Virtual Eyewear Simulation on Portrait Images

![system design](./docs/system-design.png)

TryGlasses is a web application designed to simulate wearing eyewear using 3D rendering.

## Prerequisites

Ensure the following software is installed on your local environment before proceeding:
- Node.js: Version 22.21.1
- NPM: Version 10.9.4

## Usage

### HRN Inference

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/secona/tryglasses-web/blob/master/notebooks/hrn_head_reconstruction.ipynb)

We provide the notebook for HRN inference at [`notebooks/hrn_head_reconstruction.ipynb`](notebooks/hrn_head_reconstruction.ipynb). The authors run the notebook using Google Colab. Use this notebook to transform your 2D image to data for the frontend WebGL using HRN-based head reconstruction.

### Frontend WebGL

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Install the required dependencies:
   ```bash
   npm install
   ```

To start the local development server:

```bash
npm run dev
```

## Deploy on NixOS at localhost:9000

See [`nix/configuration.nix`](nix/configuration.nix) for a commented example.

Put this repository (including `flake.lock`) at `/srv/tryglasses-web` on the server.
With Nix flakes enabled, add the following to `/etc/nixos/configuration.nix`, merging
it with your existing configuration:

```nix
{ ... }:
let
  tryglasses = builtins.getFlake "path:/srv/tryglasses-web";
in
{
  imports = [ tryglasses.nixosModules.default ];
  services.tryglasses-web.enable = true;
}
```

Apply it:

```bash
sudo nixos-rebuild switch
```

For a flake-based system, keep your usual `--flake ...` argument and add `--impure`
to allow the local checkout import.

The production build is served by nginx at **http://localhost:9000** on the server
and starts automatically on boot. Change `services.tryglasses-web.port` to use a
different port.

To view it from your own computer, forward the server's local port:

```bash
ssh -L 9000:127.0.0.1:9000 user@server
```

Then open http://localhost:9000 locally. To build the static files separately,
run `nix build path:.` from the repository; the files will be in `result/`.

## Attributions

This project uses external assets.

### 3D Models
- https://free3d.com/3d-model/frame-glasses-314946.html
- https://free3d.com/3d-model/heart-glasses-v1--264833.html
- https://free3d.com/3d-model/snowflakes-v1--581116.html

### Textures
- https://ambientcg.com/view?id=Ground080
- https://ambientcg.com/view?id=Onyx015

### Portrait Examples
- https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_O-77_matte_collodion_print.jpg
- https://commons.wikimedia.org/wiki/File:Tracy_Caldwell.jpg
- https://commons.wikimedia.org/wiki/File:President_Barack_Obama.jpg

## Acknowledgements

Thank you to the following for their contributions and resources:
- The developers of the open-source libraries used in this project.
- The creators of the 3D assets.

## License

This project's source code (frontend WebGL logic and notebook scripts) is released under the MIT License.

> [!IMPORTANT]
> While the source code in this repository is permissive, the inference backend relies on third-party
> libraries (such as `nvdiffrast`) with strict licensing constraints. See each of them to know more.
