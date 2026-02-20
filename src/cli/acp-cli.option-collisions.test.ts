import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";

const runAcpClientInteractive = vi.fn(async (_opts: unknown) => {});
const serveAcpGateway = vi.fn(async (_opts: unknown) => {});

const defaultRuntime = {
  error: vi.fn(),
  exit: vi.fn(),
};

vi.mock("../acp/client.js", () => ({
  runAcpClientInteractive: (opts: unknown) => runAcpClientInteractive(opts),
}));

vi.mock("../acp/server.js", () => ({
  serveAcpGateway: (opts: unknown) => serveAcpGateway(opts),
}));

vi.mock("../runtime.js", () => ({
  defaultRuntime,
}));

describe("acp cli option collisions", () => {
  beforeEach(() => {
    runAcpClientInteractive.mockClear();
    serveAcpGateway.mockClear();
    defaultRuntime.error.mockClear();
    defaultRuntime.exit.mockClear();
  });

  it("forwards --verbose to `acp client` when parent and child option names collide", async () => {
    const { registerAcpCli } = await import("./acp-cli.js");
    const program = new Command();
    registerAcpCli(program);

    await program.parseAsync(["acp", "client", "--verbose"], { from: "user" });

    expect(runAcpClientInteractive).toHaveBeenCalledWith(
      expect.objectContaining({
        verbose: true,
      }),
    );
  });

  it("does not pass --token and --password to serveAcpGateway", async () => {
    const { registerAcpCli } = await import("./acp-cli.js");
    const program = new Command();
    registerAcpCli(program);

    // Passing unknown options will normally cause commander to throw or exit,
    // but we want to verify the action handler doesn't get them.
    // Since we removed them from the command definition, they shouldn't be in `opts`.
    await program.parseAsync(["acp", "--url", "ws://test"], { from: "user" });

    expect(serveAcpGateway).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayUrl: "ws://test",
      }),
    );
    const callArgs = serveAcpGateway.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.gatewayToken).toBeUndefined();
    expect(callArgs.gatewayPassword).toBeUndefined();
  });

  it("throws error when --token or --password are used as unknown options", async () => {
    const { registerAcpCli } = await import("./acp-cli.js");
    const program = new Command();
    program.exitOverride(); // Prevent process.exit
    program.configureOutput({ writeErr: () => {} }); // Silence stderr
    registerAcpCli(program);

    await expect(program.parseAsync(["acp", "--token", "secret"], { from: "user" })).rejects.toThrow();
    await expect(
      program.parseAsync(["acp", "--password", "secret"], { from: "user" }),
    ).rejects.toThrow();
  });
});
