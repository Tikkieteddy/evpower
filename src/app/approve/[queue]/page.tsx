"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

type Decision = "approve" | "deny";
type Result = "approved" | "denied" | "";

export default function SupervisorApprovePage() {
  const params = useParams<{ queue: string }>();
  const searchParams = useSearchParams();
  const queue = decodeURIComponent(params.queue);
  const token = searchParams.get("token") ?? "";
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result>("");
  const [submittingDecision, setSubmittingDecision] = useState<Decision | "">("");

  async function submitDecision(action: Decision) {
    setSubmittingDecision(action);
    setMessage("");
    try {
      const response = await fetch(`/api/approve/${encodeURIComponent(queue)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to submit supervisor decision.");
      setResult(action === "approve" ? "approved" : "denied");
      setMessage(action === "approve" ? "Approved เรียบร้อยแล้ว" : "Deny เรียบร้อยแล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit supervisor decision.");
    } finally {
      setSubmittingDecision("");
    }
  }

  return (
    <main className="page page-narrow">
      <div className="heading">
        <h1>Supervisor approval</h1>
        <p>Queue: {queue}</p>
      </div>

      <section className="panel">
        <div className="panel-body">
          {result ? (
            <div className={result === "approved" ? "alert alert-success" : "alert alert-error"}>
              <strong>{result === "approved" ? "Approved" : "Denied"}</strong>
              <div>
                {result === "approved"
                  ? "ระบบบันทึกการอนุมัติเรียบร้อยแล้ว"
                  : "ระบบบันทึกการปฏิเสธเรียบร้อยแล้ว"}
              </div>
            </div>
          ) : (
            <>
              <p className="muted">
                กรุณาเลือก Approve หากบุคคลนี้เป็นบุคลากรในบังคับบัญชา หรือเลือก Deny หากไม่ใช่
              </p>
              <div className="actions" style={{ marginTop: "1rem" }}>
                <button
                  className="button"
                  type="button"
                  disabled={Boolean(submittingDecision) || !token}
                  onClick={() => submitDecision("approve")}
                >
                  {submittingDecision === "approve" ? <Loader2 size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
                  Approve
                </button>
                <button
                  className="button-danger"
                  type="button"
                  disabled={Boolean(submittingDecision) || !token}
                  onClick={() => submitDecision("deny")}
                >
                  {submittingDecision === "deny" ? <Loader2 size={18} aria-hidden="true" /> : <XCircle size={18} aria-hidden="true" />}
                  Deny
                </button>
                <Link className="button-secondary" href={`/track?queue=${encodeURIComponent(queue)}`}>
                  View status
                </Link>
              </div>
            </>
          )}

          {message && !result ? (
            <div className="alert alert-error" style={{ marginTop: "1rem" }}>{message}</div>
          ) : null}
          {message && result ? (
            <div className={result === "approved" ? "approval-success-note" : "approval-denied-note"}>{message}</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
