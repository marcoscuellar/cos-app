import { useEffect, useState } from "react";
import type { User } from "../types";
import { authHeaders } from "../auth";
import { Icon } from "../components/Icon";

function fmtDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function AdminUsers({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteErr, setInviteErr] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/users", { headers: authHeaders() });
      if (r.status === 403) {
        setError("Admin access required.");
        setUsers([]);
        return;
      }
      const d = (await r.json()) as { ok?: boolean; users?: User[]; error?: string };
      if (d.ok && d.users) setUsers(d.users);
      else setError(d.error || "Failed to load users.");
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    setInviteBusy(true);
    setInviteErr("");
    setInviteLink("");
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "invite", email: inviteEmail, name: inviteName, role: inviteRole }),
      });
      const d = (await r.json()) as { ok?: boolean; inviteLink?: string; error?: string };
      if (r.ok && d.ok && d.inviteLink) {
        setInviteLink(d.inviteLink);
        setInviteEmail("");
        setInviteName("");
      } else {
        setInviteErr(d.error || "Couldn't create invite.");
      }
    } catch {
      setInviteErr("Couldn't create invite.");
    } finally {
      setInviteBusy(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "setActive", email: u.email, active: !u.active }),
      });
      const d = (await r.json()) as { ok?: boolean; user?: User };
      if (r.ok && d.ok && d.user) setUsers((list) => list.map((x) => (x.email === u.email ? d.user! : x)));
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="main">
      <div className="wrap">
        <button className="back-link" onClick={onBack}><Icon.chevron style={{ width: 15, height: 15 }} /> Back to COS</button>
        <h1 className="disp" style={{ margin: "14px 0 8px", fontSize: "clamp(34px,4.4vw,52px)" }}>Users</h1>
        <p className="dim" style={{ fontSize: 16, marginBottom: 28 }}>Invite teammates, manage access, and see who's active.</p>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-eyebrow">Invite a new user</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 6 }}>
            <label style={{ flex: "1 1 220px" }}>
              <div className="flbl">Email</div>
              <input className="lfield" style={{ marginBottom: 0 }} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@email.com" />
            </label>
            <label style={{ flex: "1 1 160px" }}>
              <div className="flbl">Name</div>
              <input className="lfield" style={{ marginBottom: 0 }} value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" />
            </label>
            <label>
              <div className="flbl">Role</div>
              <select className="lfield" style={{ marginBottom: 0 }} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="btn btn-solid" onClick={invite} disabled={inviteBusy}>{inviteBusy ? "Creating…" : "Create invite"}</button>
          </div>
          {inviteErr && <div style={{ color: "var(--a-coral)", fontSize: 13, marginTop: 10 }}>{inviteErr}</div>}
          {inviteLink && (
            <div style={{ marginTop: 16 }}>
              <div className="flbl" style={{ marginBottom: 6 }}>Invite link · expires in 24h</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input className="lfield" style={{ marginBottom: 0, flex: 1, minWidth: 240 }} readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} />
                <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(inviteLink)}>Copy</button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="card" style={{ color: "var(--a-coral)" }}>{error}</div>}
        {loading ? (
          <div className="dim">Loading…</div>
        ) : (
          !error && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="utable">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Last login</th><th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email}>
                      <td>{u.name || "—"}</td>
                      <td>{u.email}</td>
                      <td><span className={"rolepill" + (u.role === "admin" ? " admin" : "")}>{u.role}</span></td>
                      <td>
                        {u.active
                          ? <span className="status in-motion"><span className="d" />Active</span>
                          : <span className="status dormant"><span className="d" />Inactive</span>}
                      </td>
                      <td>{fmtDate(u.createdAt)}</td>
                      <td>{fmtDate(u.lastLogin)}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => toggleActive(u)}>
                          {u.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr><td colSpan={7} className="dim" style={{ textAlign: "center", padding: "28px" }}>No users yet — invite someone above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </main>
  );
}
