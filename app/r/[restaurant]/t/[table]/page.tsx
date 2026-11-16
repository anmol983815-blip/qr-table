"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

const menu = [
  { id: 1, name: "Chicken Karahi", price: 450, desc: "Slow cooked with tomato, ginger and green chili", tags: ["Dairy", "Spicy"] },
  { id: 2, name: "Paneer Tikka", price: 280, desc: "Smoky tandoor paneer with mint chutney", tags: ["Dairy"] },
  { id: 3, name: "Butter Naan", price: 60, desc: "Soft tandoor bread brushed with butter", tags: ["Gluten", "Dairy"] },
];

const STEPS = [
  ["new", "Received"],
  ["cooking", "Cooking"],
  ["ready", "Ready"],
  ["done", "Served"],
];

export default function TableMenu() {
  const params = useParams();
  const tableNo = Number(params.table) || 0;
  const [cart, setCart] = useState<Record<number, number>>({});
  const [placed, setPlaced] = useState(false);
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [status, setStatus] = useState("new");

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel("order-" + orderId)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => setStatus((payload.new as { status: string }).status)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const change = (id: number, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) }));

  const items = menu.filter((d) => (cart[d.id] || 0) > 0);
  const count = items.reduce((s, d) => s + cart[d.id], 0);
  const total = items.reduce((s, d) => s + cart[d.id] * d.price, 0);

  const placeOrder = async () => {
    setSending(true);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        table_no: tableNo,
        items: items.map((d) => ({ name: d.name, qty: cart[d.id], price: d.price })),
        total,
      })
      .select("id")
      .single();
    setSending(false);
    if (error || !data) {
      alert("Order failed: " + (error?.message || "unknown error"));
      return;
    }
    setOrderId(data.id);
    setStatus("new");
    setPlaced(true);
  };

  if (placed) {
    const current = STEPS.findIndex(([k]) => k === status);
    return (
      <main className="min-h-screen bg-[#121212] text-white p-5 max-w-md mx-auto">
        <p className="text-xs tracking-widest text-[#F26B3A]">TABLE {tableNo}</p>
        <h1 className="text-2xl font-bold">Your food is on its way</h1>
        <p className="mt-1 text-sm text-gray-400">Order total ₹{total}</p>

        <div className="mt-6 rounded-2xl bg-[#1e1e1e] p-4">
          {STEPS.map(([k, label], i) => (
            <div key={k} className="flex items-center gap-3 py-2">
              <span
                className={`h-3 w-3 rounded-full ${i <= current ? "bg-[#F26B3A]" : "bg-[#3a3a3a]"}`}
              />
              <span className={i <= current ? "text-white" : "text-gray-500"}>{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-[#1e1e1e] p-4">
          <p className="text-xs tracking-widest text-gray-400">GUEST WI-FI</p>
          <p className="mt-2 text-sm">Network: <span className="font-semibold">Cafe-Guest</span></p>
          <p className="text-sm">Password: <span className="font-semibold">welcome123</span></p>
        </div>

        <button
          onClick={() => { setCart({}); setPlaced(false); setOrderId(null); }}
          className="mt-6 w-full rounded-full bg-[#F26B3A] px-6 py-3 font-semibold"
        >
          Order more
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white p-5 pb-28 max-w-md mx-auto">
      <p className="text-xs tracking-widest text-[#F26B3A]">TABLE {tableNo}</p>
      <h1 className="text-2xl font-bold mb-5">Our Menu</h1>
      <div className="space-y-3">
        {menu.map((d) => (
          <div key={d.id} className="rounded-2xl bg-[#1e1e1e] p-4">
            <div className="flex justify-between">
              <h2 className="font-semibold">{d.name}</h2>
              <span className="font-semibold text-[#F26B3A]">₹{d.price}</span>
            </div>
            <p className="mt-1 text-sm text-gray-400">{d.desc}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                {d.tags.map((t) => (
                  <span key={t} className="rounded-full bg-[#2a2a2a] px-2 py-1 text-xs">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => change(d.id, -1)} className="h-8 w-8 rounded-full bg-[#2a2a2a] text-lg">−</button>
                <span className="w-4 text-center">{cart[d.id] || 0}</span>
                <button onClick={() => change(d.id, 1)} className="h-8 w-8 rounded-full bg-[#F26B3A] text-lg">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#121212] p-4">
          <button
            onClick={placeOrder}
            disabled={sending}
            className="mx-auto flex w-full max-w-md justify-between rounded-2xl bg-[#F26B3A] px-5 py-4 font-semibold disabled:opacity-60"
          >
            <span>{sending ? "Sending..." : `Place Order (${count})`}</span>
            <span>₹{total}</span>
          </button>
        </div>
      )}
    </main>
  );
}