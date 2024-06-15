{
  description = "Zig project flake";

  inputs = {
    alejandra = {
      url = "github:kamadorueda/alejandra/3.0.0";
    };
    zig2nix.url = "github:Cloudef/zig2nix";
  };

  outputs = {
    zig2nix,
    self,
    ...
  }: let
    flake-utils = zig2nix.inputs.flake-utils;
  in (flake-utils.lib.eachDefaultSystem (system: let
    # Zig flake helper
    # Check the flake.nix in zig2nix project for more options:
    # https://github.com/Cloudef/zig2nix/blob/master/flake.nix
    env = zig2nix.outputs.zig-env.${system} {
      # zig = zig2nix.outputs.packages.${system}.zig.default.bin;
      zig = zig2nix.outputs.packages.${system}.zig.master.bin;
    };

    system-triple = env.lib.zigTripleFromString system;
  in
    with builtins;
    with env.lib;
    with env.pkgs.lib; rec {
      # nix build .#target.{zig-target}
      # e.g. nix build .#target.x86_64-linux-gnu
      packages.target = genAttrs allTargetTriples (target:
        env.packageForTarget target ({
            src = cleanSource ./.;

            nativeBuildInputs = with env.pkgs; [];
            buildInputs = with env.pkgsForTarget target; [];

            # Smaller binaries and avoids shipping glibc.
            zigPreferMusl = true;

            # This disables LD_LIBRARY_PATH mangling, binary patching etc...
            # The package won't be usable inside nix.
            zigDisableWrap = true;
          }
          // optionalAttrs (!pathExists ./build.zig.zon) {
            pname = "my-zig-project";
            version = "0.0.0";
          }));

      # nix build .
      packages.default = packages.target.${system-triple}.override {
        # Prefer nix friendly settings.
        zigPreferMusl = false;
        zigDisableWrap = false;
      };

      # For bundling with nix bundle for running outside of nix
      # example: https://github.com/ralismark/nix-appimage
      apps.bundle.target = genAttrs allTargetTriples (target: let
        pkg = packages.target.${target};
      in {
        type = "app";
        program = "${pkg}/bin/default";
      });

      # default bundle
      apps.bundle.default = apps.bundle.target.${system-triple};

      # nix run .
      apps.default = env.app [] "zig build run -- \"$@\"";

      # nix run .#build
      apps.build = env.app [] "zig build \"$@\"";

      # nix run .#echo
      apps.echo = env.app [] "zig build echo -- \"$@\"";
      # nix run .#unique-ids
      apps.unique-ids = env.app [] "zig build unique-ids -- \"$@\"";

      # nix run .#test
      apps.test = env.app [] "zig build test -- \"$@\"";

      # nix run .#version
      apps.version = env.app [] "zig version";

      # nix run .#zon2json
      apps.zon2json = env.app [env.zon2json] "zon2json \"$@\"";

      # nix run .#zon2json-lock
      apps.zon2json-lock = env.app [env.zon2json-lock] "zon2json-lock \"$@\"";

      # nix run .#zon2nix
      apps.zon2nix = env.app [env.zon2nix] "zon2nix \"$@\"";

      # nix develop
      devShells.default = env.mkShell {
        # jdk22 or temurin-bin
        packages = with env.pkgs; [
          babashka
          cowsay
          gnuplot
          graphviz
          nodejs
          ruby
          temurin-bin
        ];

        shellHook = ''
          cowsay "Welcome to the Gossip Glomers shell"
          echo "$(gnuplot --version)"
          echo "$(bb --version)"
          echo "$(java --version)"
          echo "Node.js $(node --version)"
          echo "$(ruby --version)"
          echo "Zig version $(zig version)"
          # Graphviz version
          echo "$(dot --version)"

          export FOO=bar
        '';
        DEBUG = "maelstrom:*,-maelstrom:handlers:read,solution:*";
        # DEBUG = "maelstrom:*,solution:*";
        MAELSTROM_VERSION = "v0.2.3";
      };
    }));
}
