"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Download, Loader2, Lock, RefreshCw, X } from "lucide-react";
import { formatDisplayDate } from "@/lib/date";
import { LIST_STATUSES, STATUSES, type ListStatus, type ProfileRecord, type ProfileStatus } from "@/lib/types";

type VerifyTarget = {
  queue: string;
  name: string;
  status: ProfileStatus;
} | null;

type AdminView = "dashboard" | "list" | "statusLog";

type SortDirection = "asc" | "desc";

type SortKey =
  | "queue"
  | "userAccess"
  | "name"
  | "nickname"
  | "team"
  | "creator"
  | "email"
  | "social"
  | "profile"
  | "picture"
  | "status"
  | "submittedAt"
  | "lastUpdatedAt"
  | "supervisor";

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

const csvHeaders: Array<[keyof ProfileRecord, string]> = [
  ["queue", "queue"],
  ["userAccess", "user_access"],
  ["thaiFirstName", "ชื่อ"],
  ["thaiLastName", "นามสกุล"],
  ["englishFirstName", "name"],
  ["englishLastName", "surname"],
  ["nickname", "ชื่อเล่น / นามปากกา"],
  ["team", "team"],
  ["creatorTypes", "creator_type"],
  ["newscasterProgram", "newscaster_program"],
  ["organizationEmail", "email องค์กร"],
  ["personalEmail", "email ส่วนตัว"],
  ["facebook", "facebook"],
  ["instagram", "ig"],
  ["tiktok", "tiktok"],
  ["x", "X"],
  ["profile", "profile"],
  ["pictureUrl", "link upload picture"],
  ["status", "status"],
  ["listStatus", "list_status"],
  ["submittedAt", "submitted_at"],
  ["completedAt", "completed_at"],
  ["lastUpdatedAt", "last_update"],
  ["statusLog", "status_log"],
  ["supervisorEmail", "supervisor_email"],
  ["supervisorApprovedAt", "supervisor_approved_at"],
  ["isNonStaff", "is_non_staff"],
];

const ADMIN_PAGE_SIZE = 10;
const PAGINATION_WINDOW_SIZE = 3;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [records, setRecords] = useState<ProfileRecord[]>([]);
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProfileStatus | "All">("All");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingQueue, setUpdatingQueue] = useState("");
  const [verifyTarget, setVerifyTarget] = useState<VerifyTarget>(null);
  const [profilePreview, setProfilePreview] = useState<ProfileRecord | null>(null);
  const [verifyNote, setVerifyNote] = useState("");
  const [selectedQueues, setSelectedQueues] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "submittedAt",
    direction: "desc",
  });

  const dashboardRecords = useMemo(
    () => records.filter((record) => record.status !== "Completed"),
    [records],
  );
  const completedRecords = useMemo(
    () =>
      records
        .filter((record) => record.status === "Completed")
        .sort((a, b) => compareText(a.queue, b.queue)),
    [records],
  );
  const statusLogRecords = useMemo(
    () => [...records].sort((a, b) => compareText(a.queue, b.queue)),
    [records],
  );

  const filteredRecords = useMemo(() => {
    return dashboardRecords.filter((record) => {
      const matchesStatus = filter === "All" || record.status === filter;
      const target = [
        record.queue,
        record.userAccess,
        record.thaiFirstName,
        record.thaiLastName,
        record.englishFirstName,
        record.englishLastName,
        record.nickname,
        record.team,
        record.creatorTypes?.join(" ") ?? "",
        record.newscasterProgram,
        record.organizationEmail,
        record.personalEmail,
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && target.includes(search.toLowerCase());
    });
  }, [dashboardRecords, filter, search]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => compareRecords(a, b, sortConfig));
  }, [filteredRecords, sortConfig]);
  const filteredQueues = useMemo(() => sortedRecords.map((record) => record.queue), [sortedRecords]);
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / ADMIN_PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const startIndex = (activePage - 1) * ADMIN_PAGE_SIZE;
    return sortedRecords.slice(startIndex, startIndex + ADMIN_PAGE_SIZE);
  }, [activePage, sortedRecords]);
  const selectedCount = selectedQueues.size;
  const isAllFilteredSelected =
    filteredQueues.length > 0 && filteredQueues.every((queue) => selectedQueues.has(queue));

  async function loadProfiles(nextToken = token) {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/profiles", {
        headers: { authorization: `Bearer ${nextToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to load profiles.");
      setRecords(data.records);
      setSelectedQueues(new Set());
      setCurrentPage(1);
      setToken(nextToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load profiles.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadProfiles(password);
  }

  async function updateStatus(queue: string, status: ProfileStatus, note = "") {
    setUpdatingQueue(queue);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/profiles/${encodeURIComponent(queue)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to update status.");

      setRecords((current) =>
        current.map((record) => (record.queue === queue ? { ...record, ...data.record } : record)),
      );

      setMessage(
        data.email?.sent
          ? `อัปเดตสถานะเป็น ${status} และส่งอีเมลเรียบร้อยแล้ว`
          : `อัปเดตสถานะเป็น ${status} แล้ว แต่ส่งอีเมลไม่สำเร็จ: ${data.email?.message ?? "กรุณาตรวจ SMTP settings"}`,
      );
      setVerifyTarget(null);
      setVerifyNote("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update status.");
    } finally {
      setUpdatingQueue("");
    }
  }

  async function downloadImage(record: ProfileRecord) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/profiles/${encodeURIComponent(record.queue)}/image`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Unable to download image.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${record.queue}-profile-image`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to download image.");
    }
  }

  function toggleQueue(queue: string) {
    setSelectedQueues((current) => {
      const next = new Set(current);
      if (next.has(queue)) next.delete(queue);
      else next.add(queue);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelectedQueues((current) => {
      const next = new Set(current);
      if (isAllFilteredSelected) {
        filteredQueues.forEach((queue) => next.delete(queue));
      } else {
        filteredQueues.forEach((queue) => next.add(queue));
      }
      return next;
    });
  }

  async function deleteSelectedProfiles() {
    const queues = Array.from(selectedQueues);
    if (queues.length === 0) return;
    const confirmed = window.confirm(`Delete ${queues.length} selected record(s)? This cannot be undone.`);
    if (!confirmed) return;

    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/profiles", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ queues }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to delete profiles.");

      const deletedQueues = new Set<string>(data.deletedQueues ?? []);
      setRecords((current) => current.filter((record) => !deletedQueues.has(record.queue)));
      setSelectedQueues(new Set());
      setMessage(`ลบข้อมูลเรียบร้อยแล้ว ${deletedQueues.size} รายการ`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete profiles.");
    } finally {
      setIsLoading(false);
    }
  }

  async function resendSupervisorEmail(record: ProfileRecord) {
    setUpdatingQueue(`supervisor:${record.queue}`);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/profiles/${encodeURIComponent(record.queue)}/supervisor-email`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to send supervisor email.");
      setMessage(`ส่งอีเมลให้ผู้บังคับบัญชาเรียบร้อยแล้ว: ${record.supervisorEmail}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send supervisor email.");
    } finally {
      setUpdatingQueue("");
    }
  }

  async function updateListStatus(queue: string, listStatus: ListStatus) {
    setUpdatingQueue(`list:${queue}`);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/profiles/${encodeURIComponent(queue)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to update list status.");
      setRecords((current) =>
        current.map((record) => (record.queue === queue ? { ...record, ...data.record } : record)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update list status.");
    } finally {
      setUpdatingQueue("");
    }
  }

  function getStatusClass(status: ProfileStatus) {
    if (status === "In progress") return "status-in-progress";
    return `status-${status.toLowerCase()}`;
  }

  function getSupervisorApprovalState(record: ProfileRecord) {
    const value = record.supervisorApprovedAt.trim();
    if (!record.supervisorEmail) return "none";
    if (value.startsWith("DENIED:")) return "denied";
    if (value) return "approved";
    return "waiting";
  }

  function changeSort(key: SortKey) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }

  if (!token) {
    return (
      <main className="page page-narrow">
        <div className="heading">
          <h1>Admin</h1>
          <p>เข้าสู่ระบบด้วยรหัส admin จาก environment variable</p>
        </div>
        <form className="panel" onSubmit={handleLogin}>
          <div className="panel-body">
            <label className="field">
              <span>Admin password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {message ? <div className="alert alert-error" style={{ marginTop: "1rem" }}>{message}</div> : null}
            <div className="actions" style={{ marginTop: "1rem" }}>
              <button className="button" type="submit" disabled={isLoading || !password}>
                {isLoading ? <Loader2 size={18} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}
                Login
              </button>
            </div>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="page page-wide">
      <div className="heading">
        <h1>Admin dashboard</h1>
        <p>ค้นหา ตรวจสอบรูป ส่งอีเมลแจ้งข้อมูลที่ขาด และเปลี่ยนสถานะงาน</p>
      </div>

      <section className="panel">
        <div className="panel-body">
          <div className="grid">
            <label className="field">
              <span>Search queue, user, team or email</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
            <label className="field">
              <span>Filter status</span>
              <select
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value as ProfileStatus | "All");
                  setCurrentPage(1);
                }}
              >
                <option value="All">All</option>
                {STATUSES.filter((status) => status !== "Completed").map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="actions" style={{ marginTop: "1rem" }}>
            <button className="button-secondary" onClick={() => loadProfiles()} type="button" disabled={isLoading}>
              {isLoading ? <Loader2 size={18} aria-hidden="true" /> : <RefreshCw size={18} aria-hidden="true" />}
              Refresh
            </button>
            <button className="button-secondary" onClick={() => downloadCsv(filteredRecords, "all-profile-report.csv")} type="button">
              <Download size={18} aria-hidden="true" />
              Download all CSV
            </button>
            <button
              className="button-danger"
              onClick={deleteSelectedProfiles}
              type="button"
              disabled={isLoading || selectedCount === 0}
            >
              Delete selected ({selectedCount})
            </button>
            <button
              className="button-danger"
              onClick={() => {
                setToken("");
                setPassword("");
                setRecords([]);
              }}
              type="button"
            >
              Logout
            </button>
            <span className="muted">{filteredRecords.length} records</span>
          </div>
          {message ? <div className="alert alert-error" style={{ marginTop: "1rem" }}>{message}</div> : null}
        </div>
      </section>

      <div className="admin-view-tabs" role="tablist" aria-label="Admin views">
        <button
          className={`admin-view-tab${activeView === "dashboard" ? " admin-view-tab-active" : ""}`}
          type="button"
          onClick={() => setActiveView("dashboard")}
        >
          Dashboard
          <span>{dashboardRecords.length}</span>
        </button>
        <button
          className={`admin-view-tab${activeView === "list" ? " admin-view-tab-active" : ""}`}
          type="button"
          onClick={() => setActiveView("list")}
        >
          List
          <span>{completedRecords.length}</span>
        </button>
        <button
          className={`admin-view-tab${activeView === "statusLog" ? " admin-view-tab-active" : ""}`}
          type="button"
          onClick={() => setActiveView("statusLog")}
        >
          Status log
          <span>{statusLogRecords.length}</span>
        </button>
      </div>

      {activeView === "dashboard" ? (
      <section className="panel admin-view-panel">
        <div className="table-wrap">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    aria-label="Select all filtered records"
                    checked={isAllFilteredSelected}
                    type="checkbox"
                    onChange={toggleAllFiltered}
                  />
                </th>
                <SortHeader label="Queue" sortKey="queue" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="User access" sortKey="userAccess" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Nickname" sortKey="nickname" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Team" sortKey="team" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Creator" sortKey="creator" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Social" sortKey="social" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Profile" sortKey="profile" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Picture" sortKey="picture" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Submitted" sortKey="submittedAt" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Last update" sortKey="lastUpdatedAt" sortConfig={sortConfig} onSort={changeSort} />
                <SortHeader label="Supervisor" sortKey="supervisor" sortConfig={sortConfig} onSort={changeSort} />
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record) => (
                <tr key={record.queue}>
                  <td>
                    <input
                      aria-label={`Select ${record.queue}`}
                      checked={selectedQueues.has(record.queue)}
                      type="checkbox"
                      onChange={() => toggleQueue(record.queue)}
                    />
                  </td>
                  <td className="mono-cell queue-cell">
                    <strong>{record.queue}</strong>
                    <div className="queue-actions">
                      <button
                        className="queue-action-button action-status-verify"
                        type="button"
                        disabled={
                          updatingQueue === record.queue ||
                          record.status === "Verify" ||
                          record.status === "In progress" ||
                          record.status === "Completed"
                        }
                        onClick={() => setVerifyTarget({
                          queue: record.queue,
                          name: `${record.thaiFirstName} ${record.thaiLastName}`,
                          status: "Verify",
                        })}
                      >
                        verify
                      </button>
                      <button
                        className="queue-action-button action-status-progress"
                        type="button"
                        disabled={
                          updatingQueue === record.queue ||
                          record.status === "In progress" ||
                          record.status === "Completed"
                        }
                        onClick={() => setVerifyTarget({
                          queue: record.queue,
                          name: `${record.thaiFirstName} ${record.thaiLastName}`,
                          status: "In progress",
                        })}
                      >
                        progress
                      </button>
                      <button
                        className="queue-action-button action-status-completed"
                        type="button"
                        disabled={updatingQueue === record.queue || record.status === "Completed"}
                        onClick={() => setVerifyTarget({
                          queue: record.queue,
                          name: `${record.thaiFirstName} ${record.thaiLastName}`,
                          status: "Completed",
                        })}
                      >
                        completed
                      </button>
                    </div>
                  </td>
                  <td>{record.userAccess || "-"}</td>
                  <td className="name-cell">
                    <div>{record.thaiFirstName} {record.thaiLastName}</div>
                    <div className="muted">{record.englishFirstName} {record.englishLastName}</div>
                  </td>
                  <td>{record.nickname || "-"}</td>
                  <td>{record.team || "-"}</td>
                  <td>
                    <div>{(record.creatorTypes?.length ?? 0) > 0 ? record.creatorTypes.join(", ") : "-"}</div>
                    <div className="muted">{record.newscasterProgram || "-"}</div>
                  </td>
                  <td className="email-cell">
                    <div>องค์กร: {record.organizationEmail || "-"}</div>
                    <div className="muted">ส่วนตัว: {record.personalEmail || "-"}</div>
                  </td>
                  <td className="social-cell">
                    <div>FB: {record.facebook || "-"}</div>
                    <div>IG: {record.instagram || "-"}</div>
                    <div>TikTok: {record.tiktok || "-"}</div>
                    <div>X: {record.x || "-"}</div>
                  </td>
                  <td className="profile-cell">
                    {record.profile ? (
                      <div className="profile-preview-block">
                        <div className="profile-preview-text">{record.profile}</div>
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => setProfilePreview(record)}
                        >
                          View
                        </button>
                        <div className="profile-view-hint">คลิก View เพื่อดูทั้งหมด</div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {record.pictureUrl ? (
                      <div className="mini-actions">
                        <a className="image-link" href={record.pictureUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                        <button className="link-button" type="button" onClick={() => downloadImage(record)}>
                          Download
                        </button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{formatDisplayDate(record.submittedAt)}</td>
                  <td>{formatDisplayDate(record.lastUpdatedAt || record.submittedAt)}</td>
                  <td>
                    <div>{record.isNonStaff ? "Non staff" : "Staff"}</div>
                    <div className="muted">{record.supervisorEmail || "-"}</div>
                    {record.supervisorEmail ? (
                      <div className={`approval-${getSupervisorApprovalState(record)}`}>
                        {getSupervisorApprovalState(record) === "approved"
                          ? "Approved"
                          : getSupervisorApprovalState(record) === "denied"
                            ? "Denied"
                            : "Waiting for approval"}
                      </div>
                    ) : null}
                    {getSupervisorApprovalState(record) === "waiting" ? (
                      <button
                        className="link-button approval-resend"
                        disabled={updatingQueue === `supervisor:${record.queue}`}
                        type="button"
                        onClick={() => resendSupervisorEmail(record)}
                      >
                        Resend approval email
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={15} className="muted">
                    No records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <AdminPagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
      ) : activeView === "list" ? (
        <section className="panel admin-view-panel">
          <div className="completed-list-header">
            <div>
              <strong>Completed list</strong>
              <p className="muted">รายชื่อที่ completed แล้ว เรียงตามหมายเลข queue</p>
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() => downloadCsv(completedRecords, "completed-list.csv")}
            >
              <Download size={18} aria-hidden="true" />
              Download CSV
            </button>
          </div>
          <div className="table-wrap">
            <table className="table completed-table">
              <thead>
                <tr>
                  <th>Queue</th>
                  <th>Name</th>
                  <th>Team</th>
                  <th>Last update</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedRecords.map((record) => (
                  <tr key={record.queue}>
                    <td className="mono-cell"><strong>{record.queue}</strong></td>
                    <td>
                      <button className="completed-name-button" type="button" onClick={() => setProfilePreview(record)}>
                        {record.thaiFirstName} {record.thaiLastName}
                      </button>
                      <div className="muted">{record.englishFirstName} {record.englishLastName}</div>
                    </td>
                    <td>{record.team || "-"}</td>
                    <td>{formatDisplayDate(record.lastUpdatedAt || record.completedAt || record.submittedAt)}</td>
                    <td>
                      <select
                        className="list-status-select"
                        value={record.listStatus ?? "Active"}
                        disabled={updatingQueue === `list:${record.queue}`}
                        onChange={(event) => updateListStatus(record.queue, event.target.value as ListStatus)}
                      >
                        {LIST_STATUSES.map((listStatus) => (
                          <option key={listStatus} value={listStatus}>
                            {listStatus}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {completedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No completed records found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="panel admin-view-panel">
          <div className="completed-list-header">
            <div>
              <strong>Status log</strong>
              <p className="muted">รวมประวัติการเคลื่อนสถานะ แยกตามรายชื่อ</p>
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() => downloadCsv(statusLogRecords, "status-log-report.csv")}
            >
              <Download size={18} aria-hidden="true" />
              Download CSV
            </button>
          </div>
          <div className="status-log-list">
            {statusLogRecords.map((record) => (
              <article className="status-log-card" key={record.queue}>
                <div className="status-log-card-header">
                  <div>
                    <strong>{record.thaiFirstName} {record.thaiLastName}</strong>
                    <div className="muted">{record.englishFirstName} {record.englishLastName}</div>
                  </div>
                  <div className="status-log-card-meta">
                    <span className="mono-cell">{record.queue}</span>
                    <span className={`status-pill ${getStatusClass(record.status)}`}>{record.status}</span>
                  </div>
                </div>
                <div className="status-log-card-details">
                  <span>User access: <strong>{record.userAccess || "-"}</strong></span>
                  <span>Team: <strong>{record.team || "-"}</strong></span>
                  <span>Last update: <strong>{formatDisplayDate(record.lastUpdatedAt || record.submittedAt)}</strong></span>
                </div>
                <pre>{record.statusLog || "-"}</pre>
              </article>
            ))}
            {statusLogRecords.length === 0 ? (
              <div className="muted status-log-empty">No status log found.</div>
            ) : null}
          </div>
        </section>
      )}

      {verifyTarget ? (
        <VerifyModal
          isSubmitting={updatingQueue === verifyTarget.queue}
          note={verifyNote}
          target={verifyTarget}
          onChange={setVerifyNote}
          onClose={() => {
            setVerifyTarget(null);
            setVerifyNote("");
          }}
          onSubmit={() => updateStatus(verifyTarget.queue, verifyTarget.status, verifyNote)}
        />
      ) : null}

      {profilePreview ? (
        <ProfilePreviewModal target={profilePreview} onClose={() => setProfilePreview(null)} />
      ) : null}
    </main>
  );
}

function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pageGroupStart =
    Math.floor((currentPage - 1) / PAGINATION_WINDOW_SIZE) * PAGINATION_WINDOW_SIZE + 1;
  const visiblePages = Array.from(
    { length: Math.min(PAGINATION_WINDOW_SIZE, totalPages - pageGroupStart + 1) },
    (_, index) => pageGroupStart + index,
  );

  return (
    <nav className="pagination" aria-label="Admin table pagination">
      <button
        className="pagination-button pagination-control"
        disabled={currentPage === 1}
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
      >
        ก่อนหน้า
      </button>
      <div className="pagination-pages">
        {visiblePages.map((page) => (
          <button
            className={`pagination-button${page === currentPage ? " pagination-active" : ""}`}
            key={page}
            type="button"
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        className="pagination-button pagination-control"
        disabled={currentPage === totalPages}
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
      >
        ถัดไป
      </button>
    </nav>
  );
}

function SortHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
}) {
  const isActive = sortConfig.key === sortKey;
  const directionLabel = sortConfig.direction === "asc" ? "ascending" : "descending";

  return (
    <th aria-sort={isActive ? directionLabel : "none"}>
      <button
        className={`sort-header${isActive ? " sort-header-active" : ""}`}
        type="button"
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <span className="sort-indicator" aria-hidden="true">
          {isActive ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function compareRecords(a: ProfileRecord, b: ProfileRecord, sortConfig: SortConfig) {
  const direction = sortConfig.direction === "asc" ? 1 : -1;
  const result =
    sortConfig.key === "submittedAt" || sortConfig.key === "lastUpdatedAt"
      ? compareDates(getSortValue(a, sortConfig.key), getSortValue(b, sortConfig.key))
      : compareText(getSortValue(a, sortConfig.key), getSortValue(b, sortConfig.key));

  if (result !== 0) return result * direction;
  return compareText(a.queue, b.queue);
}

function getSortValue(record: ProfileRecord, key: SortKey) {
  switch (key) {
    case "queue":
      return record.queue;
    case "userAccess":
      return record.userAccess || "";
    case "name":
      return `${record.thaiFirstName} ${record.thaiLastName} ${record.englishFirstName} ${record.englishLastName}`;
    case "nickname":
      return record.nickname || "";
    case "team":
      return record.team || "";
    case "creator":
      return `${record.creatorTypes?.join(" ") ?? ""} ${record.newscasterProgram || ""}`;
    case "email":
      return `${record.organizationEmail || ""} ${record.personalEmail || ""}`;
    case "social":
      return `${record.facebook || ""} ${record.instagram || ""} ${record.tiktok || ""} ${record.x || ""}`;
    case "profile":
      return record.profile || "";
    case "picture":
      return record.pictureUrl || "";
    case "status":
      return record.status;
    case "submittedAt":
      return record.submittedAt;
    case "lastUpdatedAt":
      return record.lastUpdatedAt || record.submittedAt;
    case "supervisor":
      return `${record.isNonStaff ? "Non staff" : "Staff"} ${record.supervisorEmail || ""} ${record.supervisorApprovedAt || ""}`;
  }
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "th", {
    numeric: true,
    sensitivity: "base",
  });
}

function compareDates(a: string, b: string) {
  const firstTime = Date.parse(a);
  const secondTime = Date.parse(b);
  const normalizedFirst = Number.isFinite(firstTime) ? firstTime : 0;
  const normalizedSecond = Number.isFinite(secondTime) ? secondTime : 0;
  return normalizedFirst - normalizedSecond;
}

function ProfilePreviewModal({
  target,
  onClose,
}: {
  target: ProfileRecord;
  onClose: () => void;
}) {
  const rows = [
    ["Queue", target.queue],
    ["User access", target.userAccess || "-"],
    ["ชื่อ", `${target.thaiFirstName} ${target.thaiLastName}`],
    ["Name", `${target.englishFirstName} ${target.englishLastName}`],
    ["ชื่อเล่น / นามปากกา", target.nickname || "-"],
    ["Team", target.team || "-"],
    ["Creator Type", target.creatorTypes?.join(", ") || "-"],
    ["ชื่อรายการ", target.newscasterProgram || "-"],
    ["email องค์กร", target.organizationEmail || "-"],
    ["email ส่วนตัว", target.personalEmail || "-"],
    ["Facebook", target.facebook || "-"],
    ["Instagram", target.instagram || "-"],
    ["TikTok", target.tiktok || "-"],
    ["X/Twitter", target.x || "-"],
    ["Status", target.status],
    ["List status", target.listStatus || "Active"],
    ["Submitted", formatDisplayDate(target.submittedAt)],
    ["Last update", formatDisplayDate(target.lastUpdatedAt || target.submittedAt)],
    ["Supervisor", target.supervisorEmail || "-"],
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal modal-wide">
        <div className="modal-header">
          <div>
            <strong>User preview</strong>
            <div className="muted">
              {target.thaiFirstName} {target.thaiLastName} · {target.queue}
            </div>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="profile-preview-layout">
          {target.pictureUrl ? (
            <a href={target.pictureUrl} target="_blank" rel="noreferrer" className="profile-preview-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={target.pictureUrl} alt={`${target.thaiFirstName} ${target.thaiLastName}`} />
            </a>
          ) : (
            <div className="profile-preview-image profile-preview-image-empty">No image</div>
          )}
          <div className="profile-preview-details">
            {rows.map(([label, value]) => (
              <div className="profile-preview-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="profile-full-text" style={{ marginTop: "1rem" }}>
          {target.profile || "-"}
        </div>
        <div className="actions" style={{ marginTop: "1rem" }}>
          <button className="button" type="button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function VerifyModal({
  target,
  note,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  target: NonNullable<VerifyTarget>;
  note: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal modal-wide">
        <div className="modal-header">
          <div>
            <strong>Move to {target.status}</strong>
            <div className="muted">{target.name} · {target.queue}</div>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <label className="field">
          <span>{target.status === "Verify" ? "แจ้ง user ว่าขาดข้อมูลอะไรบ้าง" : "ข้อความที่ต้องการแจ้ง user ทางอีเมล"}</span>
          <textarea
            value={note}
            onChange={(event) => onChange(event.target.value)}
            placeholder={
              target.status === "Verify"
                ? "เช่น รูปไม่ชัด, ขาด email ส่วนตัว, ชื่ออังกฤษสะกดไม่ถูกต้อง"
                : "เช่น กำลังดำเนินการตรวจสอบข้อมูล, บันทึกข้อมูลเรียบร้อยแล้ว"
            }
          />
        </label>
        <div className="actions" style={{ marginTop: "1rem" }}>
          <button className="button" type="button" disabled={isSubmitting || !note.trim()} onClick={onSubmit}>
            {isSubmitting ? <Loader2 size={18} aria-hidden="true" /> : null}
            Submit & send email
          </button>
          <button className="button-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function downloadCsv(records: ProfileRecord[], filename: string) {
  const header = csvHeaders.map(([, label]) => label);
  const rows = records.map((record) =>
    csvHeaders.map(([key]) => {
      const value = record[key];
      return typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : String(value ?? "");
    }),
  );
  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
