# Installation Guide

Currently there is only one way to use this project, which is to download the
source code and ensure the script is in `PATH`.

> **NOTE** that if you delete the source directory after completing the
> installation, your installation will become corruput and will have to be
> reinstalled.

Before you get started you need to:

1. Have an intermediate understanding of the terminal and surrounding concepts
   such as _the shell_, _environment variables_ and _shell scripting_.
2. Have Git installed and on your `PATH`.
3. Have [Deno](https://deno.com/manual@v1.34.1/getting_started/installation)
   installed and on your `PATH`.

## Download the source code

If you have an SSH key configured for bitbucket you may use the following
command to download:

```sh
git clone ssh://git@prima.corp.telenor.no:7999/dcapi/telenor-id-cli.git
```

If you don't, you may use https instead:

```sh
git clone https://prima.corp.telenor.no/bitbucket/scm/dcapi/telenor-id-cli.git
```

## Install the script into path

Navigate into the source directory and execute the following commands.

```sh
deno install -Afn tid cli.ts
```

You should now be able to run `tid -h` in your termianl.

## Getting Started

You should now be able to tag along in the [documentation](./main.md).
