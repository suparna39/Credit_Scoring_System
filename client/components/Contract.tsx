"use client";

import { useState, useCallback } from "react";
import {
  initUser,
  updateScore,
  getScore,
  getProfile,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendingDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Score Badge Config ────────────────────────────────────────

const getScoreConfig = (score: number) => {
  if (score >= 750) return { color: "#34d399", bg: "bg-[#34d399]/10", border: "border-[#34d399]/20", variant: "success" as const, label: "Excellent" };
  if (score >= 700) return { color: "#4fc3f7", bg: "bg-[#4fc3f7]/10", border: "border-[#4fc3f7]/20", variant: "info" as const, label: "Good" };
  if (score >= 650) return { color: "#fbbf24", bg: "bg-[#fbbf24]/10", border: "border-[#fbbf24]/20", variant: "warning" as const, label: "Fair" };
  return { color: "#f87171", bg: "bg-[#f87171]/10", border: "border-[#f87171]/20", variant: "error" as const, label: "Poor" };
};

// ── Main Component ───────────────────────────────────────────

type Tab = "profile" | "init" | "update";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Init user state
  const [initUserAddress, setInitUserAddress] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  // Update score state
  const [updateUserAddress, setUpdateUserAddress] = useState("");
  const [delta, setDelta] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile state
  const [profileUserAddress, setProfileUserAddress] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [profileData, setProfileData] = useState<{ score: number; transactions: number } | null>(null);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleInitUser = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!initUserAddress.trim()) return setError("Enter user address");
    setError(null);
    setIsInitializing(true);
    setTxStatus("Awaiting signature...");
    try {
      await initUser(walletAddress, initUserAddress.trim());
      setTxStatus("User profile initialized on-chain!");
      setInitUserAddress("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsInitializing(false);
    }
  }, [walletAddress, initUserAddress]);

  const handleUpdateScore = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!updateUserAddress.trim()) return setError("Enter user address");
    const deltaNum = parseInt(delta, 10);
    if (isNaN(deltaNum)) return setError("Enter a valid delta value");
    setError(null);
    setIsUpdating(true);
    setTxStatus("Awaiting signature...");
    try {
      await updateScore(walletAddress, updateUserAddress.trim(), deltaNum);
      setTxStatus("Score updated on-chain!");
      setDelta("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsUpdating(false);
    }
  }, [walletAddress, updateUserAddress, delta]);

  const handleGetProfile = useCallback(async () => {
    if (!profileUserAddress.trim()) return setError("Enter user address");
    setError(null);
    setIsFetching(true);
    setProfileData(null);
    try {
      const result = await getProfile(profileUserAddress.trim(), walletAddress || undefined);
      if (result && typeof result === "object" && "score" in result) {
        setProfileData(result as { score: number; transactions: number });
      } else {
        setError("User profile not found");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsFetching(false);
    }
  }, [profileUserAddress, walletAddress]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "profile", label: "Profile", icon: <SearchIcon />, color: "#4fc3f7" },
    { key: "init", label: "Initialize", icon: <UserPlusIcon />, color: "#7c6cf0" },
    { key: "update", label: "Update", icon: <TrendingUpIcon />, color: "#fbbf24" },
  ];

  const scoreConfig = profileData ? getScoreConfig(profileData.score) : null;

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") || txStatus.includes("updated") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Credit Score</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); setProfileData(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile */}
            {activeTab === "profile" && (
              <div className="space-y-5">
                <MethodSignature name="get_profile" params="(user: Address)" returns="-> CreditData" color="#4fc3f7" />
                <Input label="User Address" value={profileUserAddress} onChange={(e) => setProfileUserAddress(e.target.value)} placeholder="G..." />
                <ShimmerButton onClick={handleGetProfile} disabled={isFetching} shimmerColor="#4fc3f7" className="w-full">
                  {isFetching ? <><SpinnerIcon /> Fetching...</> : <><SearchIcon /> Get Profile</>}
                </ShimmerButton>

                {profileData && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Credit Profile</span>
                      {scoreConfig && (
                        <Badge variant={scoreConfig.variant}>
                          {scoreConfig.label}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="text-center py-2">
                        <div className="text-4xl font-bold" style={scoreConfig ? { color: scoreConfig.color } : undefined}>
                          {profileData.score}
                        </div>
                        <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Credit Score</div>
                      </div>
                      <div className="border-t border-white/[0.06] pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/35">Transactions</span>
                          <span className="font-mono text-sm text-white/80">{profileData.transactions}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-white/25">
                        <span>Range: 300 - 900</span>
                        <span>Base: 500</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Initialize */}
            {activeTab === "init" && (
              <div className="space-y-5">
                <MethodSignature name="init_user" params="(user: Address)" color="#7c6cf0" />
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs text-white/40">
                    Initialize a new user with a base credit score of 500. This creates their on-chain credit profile.
                  </p>
                </div>
                <Input label="User Address" value={initUserAddress} onChange={(e) => setInitUserAddress(e.target.value)} placeholder="G..." />
                {walletAddress ? (
                  <ShimmerButton onClick={handleInitUser} disabled={isInitializing} shimmerColor="#7c6cf0" className="w-full">
                    {isInitializing ? <><SpinnerIcon /> Initializing...</> : <><UserPlusIcon /> Initialize Profile</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to initialize profiles
                  </button>
                )}
              </div>
            )}

            {/* Update */}
            {activeTab === "update" && (
              <div className="space-y-5">
                <MethodSignature name="update_score" params="(user: Address, delta: i32)" color="#fbbf24" />
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs text-white/40">
                    Update a user&apos;s credit score by a delta value. Score is clamped between 300-900. Each update increments transaction count.
                  </p>
                </div>
                <Input label="User Address" value={updateUserAddress} onChange={(e) => setUpdateUserAddress(e.target.value)} placeholder="G..." />

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Score Delta</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDelta("-50")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95",
                        delta === "-50"
                          ? "border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]"
                          : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                      )}
                    >
                      <TrendingDownIcon /> -50
                    </button>
                    <button
                      onClick={() => setDelta("25")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95",
                        delta === "25"
                          ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]"
                          : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                      )}
                    >
                      <TrendingUpIcon /> +25
                    </button>
                    <button
                      onClick={() => setDelta("50")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-95",
                        delta === "50"
                          ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]"
                          : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                      )}
                    >
                      <TrendingUpIcon /> +50
                    </button>
                  </div>
                  <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#fbbf24]/30 focus-within:shadow-[0_0_20px_rgba(251,191,36,0.08)]">
                    <input
                      value={delta}
                      onChange={(e) => setDelta(e.target.value)}
                      placeholder="Or type a custom delta..."
                      className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
                    />
                  </div>
                </div>

                {walletAddress ? (
                  <ShimmerButton onClick={handleUpdateScore} disabled={isUpdating} shimmerColor="#fbbf24" className="w-full">
                    {isUpdating ? <><SpinnerIcon /> Updating...</> : <><TrendingUpIcon /> Update Score</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to update scores
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Credit Score &middot; Soroban</p>
            <div className="flex items-center gap-2">
              {["Poor", "Fair", "Good", "Excellent"].map((s, i) => {
                const cfg = getScoreConfig(s === "Poor" ? 500 : s === "Fair" ? 650 : s === "Good" ? 700 : 750);
                return (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="font-mono text-[9px] text-white/15">{s}</span>
                    {i < 3 && <span className="text-white/10 text-[8px]">&rarr;</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
