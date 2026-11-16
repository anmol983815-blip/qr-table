"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Ord = { table_no: number; status: string; created_at: string };
type Rev = { rating: number; comment: string | null; table_no: number };

export default function Dashboard() {
  const [live, setLive] = useState(0);
  const [tables, setTables] = useState(0);
  const [sales, setSales] = useState(0);
  const [hours, setHours] = useState<number[]>(Array(24).fill(0));
  const [avg, setAvg] = useState(0);
  const [reviews, setReviews] = useState<Rev[]>([]);

  const load = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const iso = start.toISOString();
    const { data: o } = await supabase.from("orders").select("table_no,status,created_at").gte("created_at", iso);
    const { data: p } = await supabase.from("payments").select("total").gte("created_at", iso);
    const { data: r } = await supabase.from("reviews").select("rating,comment,table_no").order("created_at", { ascending: false });

    const orders = (o || []) as Ord[];
    const active = orders.filter((x) => x.status !== "done");
    setLive(active.length);
    setTables(new Set(active.map((x) => x.table_no)).size);
    setSales(((p || []) as { total: number }[]).reduce((s, x) => s + x.total, 0));

    const h = Array(24).fill(0);
    orders.forEach((x) => (h[new Date(x.created_at).getHours()] += 1));
    setHours(h);

    const revs = (r || []) as Rev[];
    setAvg(revs.length ? revs.reduce((s, x) => s + x.rating, 0) / revs.length : 0);
    setReviews(revs.slice(0, 5));
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("dash-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const shown = hours.slice(9);
  const max = Math.max(1, ...shown);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#121212] p-5 text-white">
      <h1 className="mb-5 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#1e1e1e] p-4">
          <p className="text-xs tracking-widest text-gray-400">LIVE ORDERS</p>
          <p className="mt-1 text-3xl font-bold">{live}</p>
        </div>
        <div className="rounded-2xl bg-[#1e1e1e] p-4">
          <p className="text-xs tracking-widest text-gray-400">TABLES ACTIVE</p>
          <p className="mt-1 text-3xl font-bold">{tables}</p>
        </div>
        <div className="rounded-2xl bg-[#1e1e1e] p-4">
          <p className="text-xs tracking-widest text-gray-400">TODAY&apos;S SALES</p>
          <p className="mt-1 text-3xl font-bold">₹{sales}</p>
        </div>
        <div className="rounded-2xl bg-[#1e1e1e] p-4">
          <p className="text-xs tracking-widest text-gray-400">AVG RATING</p>
          <p className="mt-1 text-3xl font-bold">{avg ? avg.toFixed(1) : "–"} ★</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-[#1e1e1e] p-4">
        <p className="mb-3 text-xs tracking-widest text-gray-400">GUEST FLOW (ORDERS PER HOUR)</p>
        <div className="flex h-28 items-end gap-1">
          {shown.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end">
              <div
                className={`w-full rounded-t ${v === max && v > 0 ? "bg-[#F26B3A]" : "bg-[#3a3a3a]"}`}
                style={{ height: `${(v / max) * 100}%`, minHeight: v ? 4 : 2 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1 text-[10px] text-gray-500">
          {shown.map((_, i) => (
            <span key={i} className="flex-1 text-center">{(i + 9) % 3 === 0 ? i + 9 : ""}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-[#1e1e1e] p-4">
        <p className="mb-3 text-xs tracking-widest text-gray-400">LATEST REVIEWS</p>
        {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
        {reviews.map((r, i) => (
          <div key={i} className="border-t border-[#2a2a2a] py-2 text-sm first:border-0">
            <span className="text-[#F26B3A]">{"★".repeat(r.rating)}</span>
            <span className="text-[#3a3a3a]">{"★".repeat(5 - r.rating)}</span>
            <span className="ml-2 text-gray-400">Table {r.table_no}</span>
            {r.comment && <p className="mt-1 text-gray-300">{r.comment}</p>}
          </div>
        ))}
      </div>
    </main>
  );
}