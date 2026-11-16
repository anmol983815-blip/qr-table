"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Floor() {
  const [calls, setCalls] = useState<number[]>([]);
  const [busy, setBusy] = useState<number[]>([]);

  const load = async () => {
    const { data: c } = await supabase.from("calls").select("table_no").eq("status", "open");
    const { data: o } = await supabase.from("orders").select("table_no").neq("status", "done");
    setCalls(Array.from(new Set(((c || []) as { table_no: number }[]).map((r) => r.table_no))));
    setBusy(Array.from(new Set(((o || []) as { table_no: number }[]).map((r) => r.table_no))));
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("floor-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "calls" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const attend = async (t: number) => {
    await supabase.from("calls").update({ status: "done" }).eq("table_no", t).eq("status", "open");
    load();
  };

  return (
    <main className="min-h-screen bg-[#121212] p-5 text-white">
      <h1 className="text-2xl font-bold">Floor map</h1>
      <p className="mb-5 text-sm text-gray-400">
        {calls.length} calling · {busy.length} active
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TABLES.map((t) => {
          const calling = calls.includes(t);
          const isBusy = busy.includes(t);
          return (
            <div
              key={t}
              className={`rounded-2xl p-4 ${calling ? "bg-[#3a1d14] ring-2 ring-[#F26B3A]" : "bg-[#1e1e1e]"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">T{t}</span>
                <span className={`h-3 w-3 rounded-full ${isBusy ? "bg-green-500" : "bg-[#3a3a3a]"}`} />
              </div>
              {calling ? (
                <>
                  <p className="mt-3 text-sm text-[#F26B3A]">🔔 Calling waiter</p>
                  <button
                    onClick={() => attend(t)}
                    className="mt-3 w-full rounded-xl bg-[#F26B3A] py-2 text-sm font-semibold"
                  >
                    Attended
                  </button>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-500">{isBusy ? "Eating" : "Free"}</p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}