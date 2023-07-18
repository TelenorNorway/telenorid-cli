#!/usr/bin/env -S deno run -A
import {
  Command,
  CompletionsCommand,
  EnumType,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import {
  Input,
  Secret,
} from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import { TerminalSpinner } from "https://deno.land/x/spinners@v1.1.2/mod.ts";
import version from "./version.ts";
import signInAndGetJwt, { ReportTask, Task } from "./lib/tokens/jwt.ts";
import getSamlAssertionToken from "./lib/tokens/saml.ts";

const helpOptions = { long: false, hints: Deno.env.get("SHOW_HINTS") == "1" };

let spinner: undefined | TerminalSpinner = undefined;

function startSpinner(text: string): TerminalSpinner {
  return new TerminalSpinner({
    text,
    color: "blue",
    indent: 1,
  }).start();
}

const e = new TextEncoder();

async function output(text: string, copyToClipboard = false) {
  console.log(text);
  if (!copyToClipboard) return;
  const data = e.encode(text);
  switch (Deno.build.os) {
    case "darwin":
      {
        const cmd = new Deno.Command("/usr/bin/pbcopy", {
          args: ["-Prefer", "txt"],
          stdin: "piped",
        });
        const proc = cmd.spawn();
        const writer = proc.stdin.getWriter();
        await writer.write(data);
        writer.releaseLock();
        await proc.stdin.close();
        if ((await proc.output()).code === 0) {
          startSpinner("Copied to clipboard!").succeed();
        } else {
          startSpinner("Could not copy to clipboard").fail();
        }
      }
      break;
    default:
      startSpinner("Could not copy to clipboard").fail();
      break;
  }
}

function handleReportedTask(task: ReportTask) {
  switch (task.type) {
    case Task.End:
      return spinner = (spinner?.stop(), undefined);
    case Task.Start:
      if (spinner) {
        throw new Error("Cannot report new task when a task is already going");
      }
      spinner = startSpinner(task.text);
      break;
    case Task.Update:
      if (!spinner) {
        spinner = startSpinner(task.text);
      } else {
        spinner.set(task.text);
      }
      break;
    case Task.Completed:
      if (!spinner) {
        startSpinner(task.text).succeed();
        spinner = undefined;
      } else {
        spinner.succeed(task.text);
        spinner = undefined;
      }
      break;
    case Task.Failed:
      if (!spinner) {
        startSpinner(task.text).fail();
        spinner = undefined;
      } else {
        spinner.fail(task.text);
        spinner = undefined;
      }
      break;
  }
}

// deno-lint-ignore no-explicit-any
const cmd: any = new Command()
  .name("tid")
  .help(helpOptions)
  .version(version)
  .description("A quality of life developer tool to interact with Telenor ID")
  .meta("Author", "James Bradlee")
  .meta("Email", "james.bradlee@telenor.no")
  .action(() => cmd.showHelp())
  .env("SHOW_HINTS", "Set to 1 to show hints in help")
  .command("help", new HelpCommand())
  .command(
    "token",
    new Command().name("token")
      .help(helpOptions)
      .type("token-type", new EnumType(["jwt", "saml", "saml64"]))
      .description("Generate token")
      .option(
        "-o, --origin <url:string>",
        "The origin endpoint",
        { required: true },
      )
      .option(
        "-t, --type <type:token-type>",
        "The type of token to be returned",
        { default: "jwt" },
      )
      .option(
        "-s, --silent",
        "Silent output the token",
        { depends: ["username", "code", "password"] },
      )
      .option(
        "-u, --username <phone:string>",
        "The phone number (XXXXXXXX)",
        { required: false },
      )
      .option("-c, --code <code:string>", "The OTP code")
      .option("-p, --password <value:string>", "The account password")
      .option(
        "--fail",
        "Fail if the username, otp, or password is incorrect",
        { depends: ["username", "code", "password"] },
      )
      .option("-d, --debug", "Show full stack traces")
      .option("--clipboard", "Copy to clipboard")
      .action(async (options) => {
        const { accessToken, issuer } = await signInAndGetJwt(
          options.origin,
          (error) => {
            if (!error && options.username) return options.username;
            if (options.fail && error) throw new Error("Invalid username");
            return Input.prompt({ message: "Username (8 digits)" });
          },
          (error) => {
            if (!error && options.code) return options.code;
            if (options.fail && error) throw new Error("Invalid OTP");
            return Input.prompt({ message: "One Time Password" });
          },
          (error) => {
            if (!error && options.password) return options.password;
            if (options.fail && error) throw new Error("Invalid password");
            return Secret.prompt({ message: "Password" });
          },
          options.silent ? undefined : handleReportedTask,
        ).catch((error) => {
          if (options.silent) {
            handleReportedTask({
              type: Task.Failed,
              text: options.debug ? error.stack : error.message,
            });
            Deno.exit(1);
          } else {
            console.error(
              "error: " + options.debug ? error.stack : error.message,
            );
            Deno.exit(1);
          }
        }) || {};
        if (!accessToken) return;
        if (options.type === "jwt") {
          return await output(accessToken, !!options.clipboard);
        }
        if (!options.silent) {
          handleReportedTask({
            type: Task.Start,
            text: "Converting to SAML Assertion Token",
          });
        }
        const samlAssertionToken = await getSamlAssertionToken(
          issuer!,
          accessToken,
        );
        if (!options.silent) {
          handleReportedTask({
            type: Task.Completed,
            text: "Converted to SAML Assertion Token",
          });
        }
        if (options.type === "saml") {
          return await output(samlAssertionToken, !!options.clipboard);
        }
        if (!options.silent) {
          handleReportedTask({
            type: Task.Completed,
            text: "Encoded with Base64",
          });
        }
        return await output(btoa(samlAssertionToken), !!options.clipboard);
      }),
  )
  .command("completions", new CompletionsCommand());

await cmd.parse();
