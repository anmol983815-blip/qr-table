"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Order = {
  id: number;
  table_no: number;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
};

const NEXT: Record<string, string> = { new: "cooking", cooking: "ready", ready: "done" };
const LABEL: Record<string, string> = { new: "Start cooking", cooking: "Mark ready", ready: "Mark served" };

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .neq("status", "done")
      .order("created_at", { ascending: true });
    setOrders((data as Order[]) || []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const advance = async (o: Order) => {
    await supabase.from("orders").update({ status: NEXT[o.status] }).eq("id", o.id);
    load();
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white p-5">
      <h1 className="text-2xl font-bold mb-1">Kitchen</h1>
      <p className="mb-5 text-sm text-gray-400">{orders.length} active orders</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl bg-[#1e1e1e] p-4">
            <div className="flex justify-between">
              <span className="font-semibold">Table {o.table_no}</span>
              <span className="rounded-full bg-[#2a2a2a] px-2 py-1 text-xs uppercase text-[#F26B3A]">{o.status}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {o.items.map((it, i) => (
                <li key={i}>{it.qty} × {it.name}</li>
              ))}
            </ul>
            <button
              onClick={() => advance(o)}
              className="mt-4 w-full rounded-xl bg-[#F26B3A] py-2 font-semibold"
            >
              {LABEL[o.status]}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}