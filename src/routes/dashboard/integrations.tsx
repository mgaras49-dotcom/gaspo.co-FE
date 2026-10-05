import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Search } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { IntegrationCard } from "@/components/dashboard/IntegrationCard";
import { ConnectAccountModal } from "@/components/dashboard/ConnectAccountModal";
import { Toast } from "@/components/dashboard/Toast";
import type { ConnectOptions } from "@/lib/pipedream";
import {
  fetchIntegrationApps,
  integrationConfigurePath,
  startMetaConnect,
  NATIVE_APPS,
  type CatalogApp,
  type ConnectedIntegration,
} from "@/lib/api";
import { connectFailureMessage } from "@/lib/connect-errors";
import {
  getCachedConnected,
  getCatalogVisibleCount,
  loadConnected,
  setCatalogVisibleCount,
} from "@/lib/integrations-cache";
import { getLoadedCatalog, loadIntegrationCatalog, searchCatalog } from "@/lib/integration-catalog";
import { usePipedreamConnect } from "@/lib/pipedream";

// How many cards to reveal at a time. The catalogue is local, so this is purely
// a rendering window over it — 3,000-odd cards at once would cost more than the
// data ever does — grown as the user scrolls to the end.
const PAGE_SIZE = 48;

// How many catalogue apps get promoted into the "Popular" section; the
// catalogue is already popularity-ordered so the first slice is the top apps.
const POPULAR_COUNT = 16;

const accountsLabel = (count: number) => `${count} account${count === 1 ? "" : "s"} connected`;

const reconnectLabel = (count: number) =>
  `${count} account${count === 1 ? " needs" : "s need"} to be reconnected`;

function SectionHeading({
  label,
  count,
  attention = false,
}: {
  label: string;
  count?: number;
  attention?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {attention && <span className="size-1.5 shrink-0 rounded-full bg-warning" />}
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs font-medium text-muted-foreground opacity-60">{count}</span>
      )}
    </div>
  );
}

export default function DashboardIntegrations() {
  const { connect, ready } = usePipedreamConnect();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // The catalogue ships with the app, so a warm module cache renders it on the
  // first frame with no network call at all; a cold one only waits on a local
  // chunk. `visibleCount` is restored so a revisit lands at the same depth.
  const [apps, setApps] = useState<CatalogApp[]>(() => getLoadedCatalog() ?? []);
  const [visibleCount, setVisibleCount] = useState(() => getCatalogVisibleCount() ?? PAGE_SIZE);
  const [loading, setLoading] = useState(() => !getLoadedCatalog());
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Apps added to Pipedream since the catalogue was built: when a search has no
  // local match we ask the live endpoint before declaring "no results".
  const [remoteResults, setRemoteResults] = useState<CatalogApp[]>([]);
  const [remoteSearching, setRemoteSearching] = useState(false);

  const [connected, setConnected] = useState<ConnectedIntegration[]>(
    () => getCachedConnected() ?? [],
  );
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Why a connect failed, e.g. Shopify refusing the key; stays until dismissed.
  const [connectError, setConnectError] = useState<string | null>(null);
  // The app awaiting access-level/nickname selection before its connect popup.
  const [pendingApp, setPendingApp] = useState<CatalogApp | null>(null);

  // Connected accounts grouped by app slug — an app can have several accounts.
  const connectedGroups = useMemo(() => {
    const map = new Map<string, ConnectedIntegration[]>();
    for (const integration of connected) {
      const group = map.get(integration.appSlug) ?? [];
      group.push(integration);
      map.set(integration.appSlug, group);
    }
    return map;
  }, [connected]);

  // Split connected apps into ones needing reconnection (any inactive account)
  // and healthy ones, one representative entry per app.
  const { attentionApps, healthyApps } = useMemo(() => {
    const attention: { app: ConnectedIntegration; inactiveCount: number }[] = [];
    const healthy: { app: ConnectedIntegration; accountCount: number }[] = [];
    for (const group of connectedGroups.values()) {
      const inactiveCount = group.filter((account) => !account.isActive).length;
      if (inactiveCount > 0) {
        attention.push({ app: group[0], inactiveCount });
      } else {
        healthy.push({ app: group[0], accountCount: group.length });
      }
    }
    return { attentionApps: attention, healthyApps: healthy };
  }, [connectedGroups]);

  const goToConfigure = useCallback(
    (appSlug: string) => navigate(integrationConfigurePath(appSlug)),
    [navigate],
  );

  // `force` refetches after a connect/disconnect; otherwise the cached list is
  // reused so revisiting the page makes no extra call.
  const refreshConnected = useCallback(async (force = false) => {
    try {
      setConnected(await loadConnected(force));
    } catch (error) {
      console.error("Failed to load connected integrations", error);
    }
  }, []);

  useEffect(() => {
    void refreshConnected();
  }, [refreshConnected]);

  // After a native OAuth round-trip (e.g. Meta) the backend bounces back here
  // with a status flag; surface it, refresh the connected list, and clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedFlag = params.get("connected");
    const errorFlag = params.get("error");
    if (!connectedFlag && !errorFlag) return;
    if (connectedFlag === "meta") {
      setToast("Successfully connected your Meta Ads account!");
      void refreshConnected(true);
    } else if (errorFlag === "meta") {
      setToast("Could not connect Meta Ads. Please try again.");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [refreshConnected]);

  // Debounce the search box.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  // Load the bundled catalogue once (a retry re-attempts the import).
  useEffect(() => {
    if (getLoadedCatalog()) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadIntegrationCatalog()
      .then((catalog) => {
        if (!cancelled) setApps(catalog);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load integration catalogue", err);
        setApps([]);
        setError("Could not load the integration catalogue.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Reset the window whenever the query changes; matching itself is local.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch]);

  const searching = debouncedSearch !== "";

  const localMatches = useMemo(
    () => (searching ? searchCatalog(apps, debouncedSearch) : apps),
    [apps, debouncedSearch, searching],
  );

  // Native apps (e.g. Meta Ads) aren't in the Pipedream catalogue, so they are
  // matched separately and shown first, like featured apps.
  const nativeMatches = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return NATIVE_APPS.filter(
      (app) => !q || app.name.toLowerCase().includes(q) || app.nameSlug.toLowerCase().includes(q),
    );
  }, [debouncedSearch]);

  const noLocalMatch = localMatches.length === 0 && nativeMatches.length === 0;

  // Only a search nothing local can answer reaches the network, so a stale
  // snapshot costs latency on misses rather than hiding new apps.
  useEffect(() => {
    setRemoteResults([]);
    if (!searching || loading || !noLocalMatch) {
      setRemoteSearching(false);
      return;
    }
    let cancelled = false;
    setRemoteSearching(true);
    fetchIntegrationApps(debouncedSearch)
      .then((result) => {
        if (!cancelled) setRemoteResults(result.apps);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to search the live catalogue", err);
      })
      .finally(() => {
        if (!cancelled) setRemoteSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, searching, loading, noLocalMatch]);

  // Remember how deep the default view was scrolled, for the next visit.
  useEffect(() => {
    if (!searching) setCatalogVisibleCount(visibleCount);
  }, [visibleCount, searching]);

  const catalogApps = useMemo(() => {
    const nativeSlugs = new Set(nativeMatches.map((app) => app.nameSlug));
    const matches = localMatches.length > 0 ? localMatches : remoteResults;
    return [...nativeMatches, ...matches.filter((app) => !nativeSlugs.has(app.nameSlug))];
  }, [localMatches, nativeMatches, remoteResults]);

  // Connected apps get their own sections, so drop them from the catalogue
  // groups; search results keep them, with their status shown inline.
  const availableApps = useMemo(
    () => catalogApps.filter((app) => !connectedGroups.has(app.nameSlug)),
    [catalogApps, connectedGroups],
  );

  const matchedApps = searching ? catalogApps : availableApps;
  const visibleApps = matchedApps.slice(0, visibleCount);
  // The catalogue is popularity-ordered: the first slice is "Popular", the
  // rest is "All", which keeps revealing more of the catalogue on scroll.
  const popularApps = visibleApps.slice(0, POPULAR_COUNT);
  const remainingApps = visibleApps.slice(POPULAR_COUNT);
  const hasMore = visibleCount < matchedApps.length;

  const loadMore = useCallback(() => setVisibleCount((count) => count + PAGE_SIZE), []);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const handleConnect = useCallback(
    async (app: CatalogApp, options: ConnectOptions) => {
      // Native providers (Meta) use their own OAuth: fetch the consent URL and
      // hand off the browser; the backend callback returns to this page.
      if (app.provider === "meta") {
        setBusySlug(app.nameSlug);
        try {
          const { url } = await startMetaConnect(options.accessLevel);
          window.location.href = url;
        } catch (error) {
          console.error(`Failed to start ${app.name} connect`, error);
          setBusySlug(null);
        }
        return;
      }
      if (!ready) return;
      setBusySlug(app.nameSlug);
      try {
        setConnectError(null);
        await connect(app.nameSlug, options);
        await refreshConnected(true);
        setToast(`Successfully connected your ${app.name} account!`);
      } catch (error) {
        console.error(`Failed to connect ${app.name}`, error);
        setConnectError(connectFailureMessage(app.name, error));
      } finally {
        setBusySlug(null);
      }
    },
    [connect, ready, refreshConnected],
  );

  // Renders a catalogue app card; in search results connected apps show their
  // status inline, in the grouped view `group` is always absent.
  const renderCatalogCard = (app: CatalogApp) => {
    const group = connectedGroups.get(app.nameSlug);
    const inactiveCount = group?.filter((account) => !account.isActive).length ?? 0;
    return (
      <IntegrationCard
        key={app.nameSlug || app.name}
        name={app.name}
        iconUrl={app.iconUrl || undefined}
        tone={group ? (inactiveCount > 0 ? "attention" : "connected") : undefined}
        subtitle={
          group
            ? inactiveCount > 0
              ? reconnectLabel(inactiveCount)
              : accountsLabel(group.length)
            : undefined
        }
        busy={busySlug === app.nameSlug}
        onClick={group ? () => goToConfigure(app.nameSlug) : () => setPendingApp(app)}
      />
    );
  };

  return (
    <>
      <PageMeta title="Integrations — Gaspo" description="Connect the tools you use with Gaspo." />
      <div className="flex h-full min-h-0 flex-1 flex-col font-sans text-foreground">
        <div
          className="flex-1 overflow-y-auto px-2 sm:px-12 py-8 "
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="mx-auto w-full max-w-[1000px]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <h1 className="text-3xl font-bold leading-8 text-foreground">Integrations</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="gaspo-focus-ring inline-flex min-h-8 cursor-pointer select-none items-center justify-center gap-2 rounded-[7px] border-0 bg-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-[background-color,border-color,transform] duration-200 hover:bg-accent active:scale-[0.98]"
                >
                  <Plus className="size-4 shrink-0" strokeWidth={1.5} />
                  Add Custom MCP
                </button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-6">
              <p className="text-sm text-secondary-foreground">
                Connect the tools you use and let Gaspo perform tasks across various apps. Choose
                Team-only to share an account with your workspace, or Private to keep it to
                yourself.
              </p>

              <div className="flex w-full flex-col gap-1.5">
                <div className="flex h-10 w-full items-center gap-2 rounded-[7px] border border-border bg-muted px-3 text-sm leading-5 transition-colors outline-none hover:border-border/80 focus-within:outline-2 focus-within:outline-ring focus-within:outline-offset-2">
                  <div className="flex shrink-0 items-center text-muted-foreground">
                    <Search className="size-4" strokeWidth={1.5} aria-hidden />
                  </div>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search from 3,000 integrations"
                    className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground placeholder:opacity-50"
                  />
                </div>
              </div>

              {loading || remoteSearching ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="gaspo-focus-ring inline-flex min-h-8 cursor-pointer select-none items-center justify-center rounded-[7px] bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-[background-color,transform] duration-200 hover:bg-accent active:scale-[0.98]"
                  >
                    Retry
                  </button>
                </div>
              ) : searching ? (
                visibleApps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No integrations match your search.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {visibleApps.map(renderCatalogCard)}
                  </div>
                )
              ) : (
                <>
                  {attentionApps.length > 0 && (
                    <section className="flex flex-col gap-3">
                      <SectionHeading
                        label="Needs attention"
                        count={attentionApps.length}
                        attention
                      />
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {attentionApps.map(({ app, inactiveCount }) => (
                          <IntegrationCard
                            key={app.appSlug}
                            name={app.appName}
                            iconUrl={app.iconUrl ?? undefined}
                            tone="attention"
                            subtitle={reconnectLabel(inactiveCount)}
                            onClick={() => goToConfigure(app.appSlug)}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {healthyApps.length > 0 && (
                    <section className="flex flex-col gap-3">
                      <SectionHeading label="Connected" count={healthyApps.length} />
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {healthyApps.map(({ app, accountCount }) => (
                          <IntegrationCard
                            key={app.appSlug}
                            name={app.appName}
                            iconUrl={app.iconUrl ?? undefined}
                            tone="connected"
                            subtitle={accountsLabel(accountCount)}
                            onClick={() => goToConfigure(app.appSlug)}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {popularApps.length > 0 && (
                    <section className="flex flex-col gap-3">
                      <SectionHeading label="Popular" />
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {popularApps.map(renderCatalogCard)}
                      </div>
                    </section>
                  )}

                  {remainingApps.length > 0 && (
                    <section className="flex flex-col gap-3">
                      <SectionHeading label="All" />
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {remainingApps.map(renderCatalogCard)}
                      </div>
                    </section>
                  )}
                </>
              )}

              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {pendingApp && (
        <ConnectAccountModal
          open
          appName={pendingApp.name}
          appSlug={pendingApp.nameSlug}
          onClose={() => setPendingApp(null)}
          onConfirm={(options) => {
            const app = pendingApp;
            setPendingApp(null);
            void handleConnect(app, options);
          }}
        />
      )}
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
