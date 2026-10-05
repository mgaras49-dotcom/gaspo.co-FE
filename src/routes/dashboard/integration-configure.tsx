import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Loader2, Lock, Pencil, Plus, Search, Users, Zap } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { IntegrationIcon } from "@/components/dashboard/IntegrationIcon";
import { ConnectAccountModal } from "@/components/dashboard/ConnectAccountModal";
import { Toast } from "@/components/dashboard/Toast";
import {
  fetchIntegrationTools,
  integrationAccountPath,
  parseConfigureProvider,
  startMetaConnect,
  NATIVE_APPS,
  type AppTool,
  type ConnectedIntegration,
} from "@/lib/api";
import { connectFailureMessage } from "@/lib/connect-errors";
import { loadConnected } from "@/lib/integrations-cache";
import { usePipedreamConnect, type ConnectOptions } from "@/lib/pipedream";

export default function DashboardIntegrationConfigure() {
  const { provider = "" } = useParams();
  const appSlug = parseConfigureProvider(provider);
  const navigate = useNavigate();
  const { connect, ready } = usePipedreamConnect();

  /** Set when this app is brokered natively rather than through Pipedream. */
  const nativeProvider = useMemo(
    () => NATIVE_APPS.find((native) => native.nameSlug === appSlug)?.provider,
    [appSlug],
  );

  const [accounts, setAccounts] = useState<ConnectedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Why a connect failed, e.g. Shopify refusing the key; stays until dismissed.
  const [connectError, setConnectError] = useState<string | null>(null);

  const [tools, setTools] = useState<AppTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [toolsError, setToolsError] = useState<string | null>(null);

  // Shares the Integrations page cache; `force` refreshes it after a mutation.
  const load = useCallback(
    async (force = false) => {
      if (!appSlug) return;
      try {
        const all = await loadConnected(force);
        setAccounts(all.filter((account) => account.appSlug === appSlug));
      } catch (error) {
        console.error("Failed to load connected accounts", error);
      } finally {
        setLoading(false);
      }
    },
    [appSlug],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // The actions this app exposes — what Gaspo can actually do with it.
  useEffect(() => {
    if (!appSlug) return;
    let cancelled = false;
    setToolsLoading(true);
    setToolsError(null);
    fetchIntegrationTools(appSlug)
      .then((result) => {
        if (!cancelled) setTools(result.tools);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load app tools", error);
        setToolsError(
          error instanceof Error && error.message
            ? error.message
            : "Could not load this app's actions.",
        );
      })
      .finally(() => {
        if (!cancelled) setToolsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appSlug]);

  // The app's display name/icon come from any of its connected accounts.
  const app = accounts[0];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) =>
      (account.nickname ?? account.accountName ?? account.externalAccountId ?? "")
        .toLowerCase()
        .includes(query),
    );
  }, [accounts, search]);

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter((tool) =>
      `${tool.name} ${tool.description ?? ""}`.toLowerCase().includes(query),
    );
  }, [tools, search]);

  const handleAddAccount = useCallback(
    async (options: ConnectOptions) => {
      if (!appSlug) return;
      // Native providers (Meta) use their own OAuth, exactly as the Integrations
      // page does: fetch the consent URL and hand off the browser. Pipedream has
      // no Meta app in its catalogue at all, so falling through to `connect`
      // here fails with an opaque "session has expired" from its popup.
      if (nativeProvider === "meta") {
        setAdding(true);
        try {
          const { url } = await startMetaConnect(options.accessLevel);
          window.location.href = url;
        } catch (error) {
          console.error("Failed to start Meta connect", error);
          setAdding(false);
        }
        return;
      }
      if (!ready) return;
      setAdding(true);
      try {
        setConnectError(null);
        await connect(appSlug, options);
        await load(true);
        setToast(`Successfully connected your ${app?.appName ?? appSlug} account!`);
      } catch (error) {
        console.error("Failed to connect account", error);
        setConnectError(connectFailureMessage(app?.appName ?? appSlug, error));
      } finally {
        setAdding(false);
      }
    },
    [app?.appName, appSlug, connect, load, nativeProvider, ready],
  );

  // Bad route param, or every account was disconnected elsewhere — go back.
  useEffect(() => {
    if (!appSlug) navigate("/dashboard/integrations", { replace: true });
  }, [appSlug, navigate]);

  if (!appSlug) return null;

  const appName = app?.appName ?? appSlug;

  return (
    <>
      <PageMeta
        title={`${appName} — Integrations`}
        description={`Manage your ${appName} accounts.`}
      />
      <div className="flex h-full min-h-0 flex-1 flex-col font-sans text-foreground">
        <div
          className="flex-1 overflow-y-auto px-2 sm:px-12 py-8 "
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="mx-auto w-full max-w-[1000px]">
            <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
              <Link to="/dashboard/integrations" className="hover:text-foreground">
                Integrations
              </Link>
              <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
              <span className="text-foreground">{appName}</span>
            </nav>

            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card p-1">
                  <IntegrationIcon name={appName} iconUrl={app?.iconUrl ?? undefined} />
                </div>
                <h1 className="truncate text-3xl font-bold leading-8 text-foreground">{appName}</h1>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                disabled={adding || !ready}
                className="gaspo-focus-ring inline-flex min-h-9 shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-[7px] bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-[background-color,transform] duration-200 hover:bg-accent active:scale-[0.98] disabled:cursor-default disabled:opacity-70"
              >
                {adding ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4 shrink-0" strokeWidth={1.5} />
                )}
                Add another account
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : (
              <div className="flex w-full flex-col gap-4">
                <div className="flex h-10 w-full items-center gap-2 rounded-[7px] border border-border bg-muted px-3 text-sm leading-5 transition-colors outline-none hover:border-border/80 focus-within:outline-2 focus-within:outline-ring focus-within:outline-offset-2">
                  <Search
                    className="size-4 shrink-0 text-muted-foreground"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search accounts and actions"
                    className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground placeholder:opacity-50"
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  {accounts.length} account{accounts.length === 1 ? "" : "s"} connected
                </p>

                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                        <th className="px-4 py-3">Account label</th>
                        <th className="px-4 py-3">Access</th>
                        <th className="px-4 py-3">Added by</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                            No accounts match your search.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((account) => (
                          <tr
                            key={account.id}
                            className="border-b border-border last:border-b-0 text-foreground"
                          >
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2">
                                <span
                                  className={`size-2 shrink-0 rounded-full ${account.isActive ? "bg-highlight" : "bg-muted-foreground"}`}
                                />
                                <span className="truncate font-medium">
                                  {account.nickname ||
                                    account.accountName ||
                                    account.externalAccountId ||
                                    "Account"}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                {account.accessLevel === "private" ? (
                                  <>
                                    <Lock className="size-3.5" strokeWidth={1.5} aria-hidden />
                                    Private
                                  </>
                                ) : (
                                  <>
                                    <Users className="size-3.5" strokeWidth={1.5} aria-hidden />
                                    Team-only
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium uppercase text-secondary-foreground">
                                  {(account.userName ?? "?").trim().charAt(0)}
                                </span>
                                {account.userName ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(integrationAccountPath(appSlug, account.id))
                                }
                                className="gaspo-focus-ring inline-flex cursor-pointer items-center gap-1 rounded-[7px] px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              >
                                <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* What Gaspo can do with this app — the live MCP tool list. */}
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Zap
                      className="size-4 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <h2 className="text-sm font-semibold text-foreground">
                      What Gaspo can do with {appName}
                    </h2>
                    {!toolsLoading && !toolsError && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {tools.length}
                      </span>
                    )}
                  </div>

                  {toolsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                    </div>
                  ) : toolsError ? (
                    <p className="rounded-xl border border-border bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                      {toolsError}
                    </p>
                  ) : tools.length === 0 ? (
                    <p className="rounded-xl border border-border bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                      This app doesn’t expose any actions Gaspo can use yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {filteredTools.length === 0 ? (
                        <p className="col-span-full px-1 py-4 text-sm text-muted-foreground">
                          No actions match your search.
                        </p>
                      ) : (
                        filteredTools.map((tool) => (
                          <div
                            key={tool.key}
                            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3"
                          >
                            <span className="truncate text-sm font-medium text-foreground">
                              {tool.name}
                            </span>
                            {tool.description && (
                              <span className="line-clamp-2 text-xs leading-4 text-muted-foreground">
                                {tool.description}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConnectAccountModal
        open={addOpen}
        appName={appName}
        appSlug={appSlug}
        onClose={() => setAddOpen(false)}
        onConfirm={(options) => {
          setAddOpen(false);
          void handleAddAccount(options);
        }}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {connectError && (
        <Toast
          tone="error"
          duration={0}
          message={connectError}
          onClose={() => setConnectError(null)}
        />
      )}
    </>
  );
}
