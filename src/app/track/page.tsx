"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { formatDisplayDate } from "@/lib/date";
import type { ProfileStatus } from "@/lib/types";

const steps: ProfileStatus[] = ["Upload", "Verify", "In progress", "Completed"];

type TrackRecord = {
  queue: string;
  thaiFirstName: string;
  thaiLastName: string;
  status: ProfileStatus;
  submittedAt: string;
  completedAt: string;
  canEdit: boolean;
  verifyNote: string;
};

export default function TrackPage() {
  const [queue, setQueue] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("queue") ?? "";
  });
  const [record, setRecord] = useState<TrackRecord | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initialQueue = new URLSearchParams(window.location.search).get("queue");
    if (!initialQueue) return;
    void fetchRecord(initialQueue);
  }, []);

  async function fetchRecord(targetQueue: string) {
    setRecord(null);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/track/${encodeURIComponent(targetQueue.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Queue not found.");
      setRecord(data.record);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Queue not found.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchRecord(queue);
  }

  return (
    <main className="page page-narrow">
      <div className="heading">
        <h1>Track status</h1>
        <p>กรอกเลข queue เพื่อดูสถานะล่าสุดของงาน</p>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-body">
          <label className="field">
            <span>Queue number</span>
            <input
              placeholder="01-02-04-2026"
              value={queue}
              onChange={(event) => setQueue(event.target.value)}
            />
          </label>
          <div className="actions" style={{ marginTop: "1rem" }}>
            <button className="button" type="submit" disabled={isLoading || !queue.trim()}>
              {isLoading ? <Loader2 size={18} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
              Search
            </button>
          </div>
        </div>
      </form>

      {message ? <div className="alert alert-error" style={{ marginTop: "1rem" }}>{message}</div> : null}

      {record ? (
        <section className="panel" style={{ marginTop: "1rem" }}>
          <div className="panel-body">
            <div className="progress">
              {steps.map((step) => (
                <div
                  className={`step ${steps.indexOf(record.status) >= steps.indexOf(step) ? "step-active" : ""}`}
                  key={step}
                >
                  {step}
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className="grid">
              <Info label="Queue number" value={record.queue} />
              <Info label="Current status" value={record.status}>
                {record.status === "Verify" && record.verifyNote ? (
                  <div className="verify-note">{record.verifyNote}</div>
                ) : null}
              </Info>
              <Info label="ชื่อ user" value={`${record.thaiFirstName} ${record.thaiLastName}`} />
              <Info label="วันที่ส่งข้อมูล" value={formatDisplayDate(record.submittedAt)} />
            </div>
            {record.canEdit ? (
              <div className="actions" style={{ marginTop: "1rem" }}>
                <Link className="button-secondary" href={`/edit-profile/${encodeURIComponent(record.queue)}`}>
                  แก้ไขข้อมูล
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Info({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
      {children}
    </div>
  );
}
