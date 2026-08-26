import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Film,
  Activity,
  UserPlus,
  CalendarPlus,
  Hash,
  FolderOpen,
  ShieldCheck,
  Crown,
  RefreshCw,
  Clock,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/api";
import type {
  AdminStats,
  AdminUserRow,
  AdminSeriesPoint,
  AdminTopUser,
} from "@/lib/admin";

const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

function timeAgo(iso?: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
}

const initialOf = (name?: string | null) => (name || "?").slice(0, 1).toUpperCase();

function StatCard({
  label,
  value,
  sub,
  icon,
  iconClass,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-elevated p-4 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption font-medium text-muted">{label}</p>
        <span className={iconClass}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-[28px] font-bold leading-none tracking-tight text-primary tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-1.5 text-caption text-muted">{sub}</p>}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-elevated">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-display text-ui font-semibold text-primary">
          <span className="text-muted">{icon}</span>
          {title}
        </h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ActivityChart({ series }: { series: AdminSeriesPoint[] }) {
  const max = Math.max(1, ...series.map((d) => Math.max(d.users, d.videos)));
  const totalVideos = series.reduce((a, d) => a + d.videos, 0);
  const totalUsers = series.reduce((a, d) => a + d.users, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-caption text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Videos added
          <span className="font-mono text-accent-strong">{totalVideos}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-info" /> New signups
          <span className="font-mono text-info">{totalUsers}</span>
        </span>
      </div>
      <div className="flex h-48 items-end gap-[3px]">
        {series.map((d) => {
          const vh = Math.max(3, Math.round((d.videos / max) * 100));
          const uh = Math.max(3, Math.round((d.users / max) * 100));
          return (
            <div
              key={d.day}
              className="group flex h-full flex-1 items-end justify-center"
              title={`${fmtDay(d.day)} · ${d.videos} videos added · ${d.users} signups`}
            >
              <div className="flex h-full w-full items-end justify-center gap-[2px]">
                <div
                  className="w-[45%] max-w-[9px] rounded-sm bg-accent/85 transition-colors group-hover:bg-accent"
                  style={{ height: `${vh}%` }}
                />
                <div
                  className="w-[45%] max-w-[9px] rounded-sm bg-info/70 transition-colors group-hover:bg-info"
                  style={{ height: `${uh}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex">
        {series.map((d, i) => (
          <div key={d.day} className="flex-1 text-center">
            {i % 5 === 0 || i === series.length - 1 ? (
              <span className="font-mono text-[9.5px] text-muted">{fmtDay(d.day)}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TopUsers({ topUsers }: { topUsers: AdminTopUser[] }) {
  const max = Math.max(1, ...topUsers.map((u) => u.video_count));
  if (topUsers.length === 0) {
    return <p className="text-ui text-muted">No videos saved yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {topUsers.map((u, i) => (
        <li key={u.user_id} className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-hover font-mono text-micro text-secondary">
            {i + 1}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-caption font-bold text-accent-strong">
            {initialOf(u.display_name ?? u.email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-ui font-medium text-primary">
              {u.display_name ?? "Unnamed user"}
            </p>
            <p className="truncate text-caption text-muted">{u.email ?? "no email"}</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-hover">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max(6, (u.video_count / max) * 100)}%` }}
              />
            </div>
            <span className="w-9 text-right font-mono text-caption tabular-nums text-secondary">
              {u.video_count}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RecentActivity({ items }: { items: AdminStats["recentActivity"] }) {
  if (items.length === 0) {
    return <p className="text-ui text-muted">No recent activity.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
            <Film className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-ui leading-snug text-primary">{item.title}</p>
            <p className="mt-0.5 truncate text-caption text-muted">{item.user_name}</p>
          </div>
          <span className="shrink-0 font-mono text-micro tabular-nums text-muted">
            {timeAgo(item.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function UsersTable({ users }: { users: AdminUserRow[] }) {
  if (users.length === 0) {
    return <p className="text-ui text-muted">No users yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-ui">
        <thead>
          <tr className="border-b border-border text-micro font-medium uppercase tracking-wider text-muted">
            <th className="py-2.5 pr-3 font-medium">User</th>
            <th className="py-2.5 pr-3 font-medium">Joined</th>
            <th className="py-2.5 pr-3 text-right font-medium">Videos</th>
            <th className="py-2.5 font-medium">Last active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => (
            <tr key={u.id} className="transition-colors hover:bg-hover/40">
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hover text-micro font-bold text-secondary">
                    {initialOf(u.display_name ?? u.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-medium text-primary">
                      {u.display_name ?? "Unnamed user"}
                      {u.is_super_admin && (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-accent" />
                      )}
                    </p>
                    <p className="truncate text-caption text-muted">{u.email ?? "no email"}</p>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap py-2.5 pr-3 text-secondary">
                {fmtDate(u.joined_at)}
              </td>
              <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-secondary">
                {u.video_count}
              </td>
              <td className="whitespace-nowrap py-2.5 text-muted">{timeAgo(u.last_active)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard({
  stats,
  admin,
  onRefresh,
}: {
  stats: AdminStats;
  admin: { displayName: string | null; email: string };
  onRefresh?: () => void;
}) {
  const navigate = useNavigate();
  const { totals, periods, series, topUsers, users, recentActivity } = stats;
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/");
  };

  const adminInitial = (admin.displayName || admin.email).slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
            Platform overview
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
            <span>Usage and account analytics across every user.</span>
            <span className="inline-flex items-center gap-1 font-mono text-micro">
              <Clock className="h-3 w-3" /> Updated {new Date().toLocaleTimeString("en-GB")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Link
            to="/admin/profile"
            title="Admin profile"
            aria-label="Admin profile"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-elevated text-ui font-bold text-accent-strong transition-colors hover:border-border-strong hover:bg-hover"
          >
            {adminInitial}
          </Link>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            loading={signingOut}
            aria-label="Sign out"
            className="text-muted hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={totals.users}
          sub={`${periods.users30d} joined in the last 30 days`}
          icon={<Users className="h-4 w-4" />}
          iconClass="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent"
        />
        <StatCard
          label="Total videos"
          value={totals.videos}
          sub={`${periods.videos30d} added in the last 30 days`}
          icon={<Film className="h-4 w-4" />}
          iconClass="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent"
        />
        <StatCard
          label="Active users · 30d"
          value={periods.active30d}
          sub={`${totals.users > 0 ? Math.round((periods.active30d / totals.users) * 100) : 0}% of all accounts`}
          icon={<Activity className="h-4 w-4" />}
          iconClass="flex h-7 w-7 items-center justify-center rounded-md bg-info/10 text-info"
        />
        <StatCard
          label="Active users · 7d"
          value={periods.active7d}
          sub="Saved a video in the last 7 days"
          icon={<TrendingUpIcon />}
          iconClass="flex h-7 w-7 items-center justify-center rounded-md bg-success/10 text-success"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New users · 30d"
          value={periods.users30d}
          sub={`${periods.users7d} in the last 7 days`}
          icon={<UserPlus className="h-4 w-4" />}
          iconClass="flex h-7 w-7 items-center justify-center rounded-md bg-hover text-secondary"
        />
        <StatCard
          label="New videos · 30d"
          value={periods.videos30d}
          sub={`${periods.videos7d} in the last 7 days`}
          icon={<CalendarPlus className="h-4 w-4" />}
          iconClass="flex h-7 w-7 items-center justify-center rounded-md bg-hover text-secondary"
        />
        <StatCard
          label="Categories"
          value={totals.categories}
          sub="Across all users"
          icon={<FolderOpen className="h-4 w-4" />}
          iconClass="flex h-7 w-7 items-center justify-center rounded-md bg-hover text-secondary"
        />
        <StatCard
          label="Tags"
          value={totals.tags}
          sub="Across all users"
          icon={<Hash className="h-4 w-4" />}
          iconClass="flex h-7 w-7 items-center justify-center rounded-md bg-hover text-secondary"
        />
      </div>

      {/* Chart */}
      <div className="mt-4">
        <Panel title="Activity — last 30 days" icon={<Activity className="h-4 w-4" />}>
          <ActivityChart series={series} />
        </Panel>
      </div>

      {/* Top users + recent activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Top users by videos" icon={<Crown className="h-4 w-4" />}>
          <TopUsers topUsers={topUsers} />
        </Panel>
        <Panel title="Recent activity" icon={<Film className="h-4 w-4" />}>
          <RecentActivity items={recentActivity} />
        </Panel>
      </div>

      {/* Users table */}
      <div className="mt-4">
        <Panel
          title="All users"
          icon={<Users className="h-4 w-4" />}
          action={
            <span className="font-mono text-micro tabular-nums text-muted">
              {users.length} shown
            </span>
          }
        >
          <UsersTable users={users} />
        </Panel>
      </div>
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}