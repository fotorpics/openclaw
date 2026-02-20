import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";

const callGatewayCli = vi.fn(async (_method: string, _opts: unknown, _params?: unknown) => ({
  ok: true,
}));
const gatewayStatusCommand = vi.fn(async (_opts: unknown, _runtime: unknown) => {});

const runtimeLogs: string[] = [];
const runtimeErrors: string[] = [];
const defaultRuntime = {
  log: (msg: string) => runtimeLogs.push(msg),
  error: (msg: string) => runtimeErrors.push(msg),
  exit: (code: number) => {
    throw new Error(`__exit__:${code}`);
  },
};

vi.mock("../cli-utils.js", () => ({
  runCommandWithRuntime: async (
    _runtime: unknown,
    action: () => Promise<void>,
    onError: (err: unknown) => void,
  ) => {
    try {
      await action();
    } catch (err) {
      onError(err);
    }
  },
}));

vi.mock("../../runtime.js", () => ({
  defaultRuntime,
}));

vi.mock("../../commands/gateway-status.js", () => ({
  gatewayStatusCommand: (opts: unknown, runtime: unknown) => gatewayStatusCommand(opts, runtime),
}));

vi.mock("./call.js", () => ({
  gatewayCallOpts: (cmd: Command) =>
    cmd
      .option("--url <url>", "Gateway WebSocket URL")
      .option("--timeout <ms>", "Timeout in ms", "10000")
      .option("--expect-final", "Wait for final response (agent)", false)
      .option("--json", "Output JSON", false),
  callGatewayCli: (method: string, opts: unknown, params?: unknown) =>
    callGatewayCli(method, opts, params),
}));

vi.mock("./run.js", () => ({
  addGatewayRunCommand: (cmd: Command) => cmd,
}));

vi.mock("../daemon-cli.js", () => ({
  addGatewayServiceCommands: () => undefined,
}));

vi.mock("../../commands/health.js", () => ({
  formatHealthChannelLines: () => [],
}));

vi.mock("../../config/config.js", () => ({
  loadConfig: () => ({}),
}));

vi.mock("../../infra/bonjour-discovery.js", () => ({
  discoverGatewayBeacons: async () => [],
}));

vi.mock("../../infra/widearea-dns.js", () => ({
  resolveWideAreaDiscoveryDomain: () => undefined,
}));

vi.mock("../../terminal/health-style.js", () => ({
  styleHealthChannelLine: (line: string) => line,
}));

vi.mock("../../terminal/links.js", () => ({
  formatDocsLink: () => "docs.openclaw.ai/cli/gateway",
}));

vi.mock("../../terminal/theme.js", () => ({
  colorize: (_rich: boolean, _fn: (value: string) => string, value: string) => value,
  isRich: () => false,
  theme: {
    heading: (value: string) => value,
    muted: (value: string) => value,
    success: (value: string) => value,
  },
}));

vi.mock("../../utils/usage-format.js", () => ({
  formatTokenCount: () => "0",
  formatUsd: () => "$0.00",
}));

vi.mock("../help-format.js", () => ({
  formatHelpExamples: () => "",
}));

vi.mock("../progress.js", () => ({
  withProgress: async (_opts: unknown, fn: () => Promise<unknown>) => await fn(),
}));

vi.mock("./discover.js", () => ({
  dedupeBeacons: (beacons: unknown[]) => beacons,
  parseDiscoverTimeoutMs: () => 2000,
  pickBeaconHost: () => null,
  pickGatewayPort: () => 18789,
  renderBeaconLines: () => [],
}));

describe("gateway register option collisions", () => {
  beforeEach(() => {
    runtimeLogs.length = 0;
    runtimeErrors.length = 0;
    callGatewayCli.mockClear();
    gatewayStatusCommand.mockClear();
  });

  it("no longer forwards --token to gateway call", async () => {
    const { registerGatewayCli } = await import("./register.js");
    const program = new Command();
    program.exitOverride();
    program.configureOutput({ writeErr: () => {} });
    registerGatewayCli(program);

    await expect(
      program.parseAsync(["gateway", "call", "health", "--token", "tok_call", "--json"], {
        from: "user",
      }),
    ).rejects.toThrow();
  });

  it("no longer forwards --token to gateway probe", async () => {
    const { registerGatewayCli } = await import("./register.js");
    const program = new Command();
    program.exitOverride();
    program.configureOutput({ writeErr: () => {} });
    registerGatewayCli(program);

    await expect(
      program.parseAsync(["gateway", "probe", "--token", "tok_probe", "--json"], {
        from: "user",
      }),
    ).rejects.toThrow();
  });
});
