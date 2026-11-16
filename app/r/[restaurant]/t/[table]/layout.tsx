"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

export default function TableLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tableNo = Number(params.table) || 0;
  const base = `/r/${params.restaurant}/t/${params.table}`;
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const call = async () => {
    setState("sending");
    const { error } = await supabase.from("calls").insert({ table_no: tableNo });
    if (error) {
      alert("Could not call waiter: " + error.message);
      setState("idle");
      return;
    }
    setState("sent");
    setTimeout(() => setState("idle"), 15000);
  };

  const pill = "rounded-full bg-[#2a2a2a] px-3 py-2 text-sm font-semibold text-white shadow";

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 flex justify-between gap-2 p-3">
        <Link href={`${base}/bill`} className={pill}>🧾 Bill</Link>
        <Link href={`${base}/review`} className={pill}>⭐ Review</Link>
        <button onClick={call} disabled={state !== "idle"} className={`${pill} disabled:opacity-70`}>
          {state === "sent" ? "Notified ✓" : state === "sending" ? "Calling..." : "🔔 Waiter"}
        </button>
      </div>
      <div className="pt-14">{children}</div>
    </>
  );
}