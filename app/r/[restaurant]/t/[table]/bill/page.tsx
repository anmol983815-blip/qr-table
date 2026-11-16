"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../../lib/supabase";

type Order = { id: number; items: { name: string; qty: number; price: number }[]; total: number };
const METHODS = ["Cash", "Bank transfer", "Card"];

export default function Bill() {
  const params = useParams();
  const tableNo = Number(params.table) || 0;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState(1);
  const [tipPct, setTipPct] = useState(10);
  const [method, setMethod] = useState("Cash");
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, items, total")
        .eq("table_no", tableNo)
        .eq("paid", false);
      setOrders((data as Order[]) || []);
      setLoading(false);
    })();
  }, [tableNo]);

  const lines: Record<string, { qty: number; amount: number }> = {};
  orders.forEach((o) =>
    o.items.forEach((it) => {
      const l = lines[it.name] || { qty: 0, amount: 0 };
      l.qty += it.qty;
      l.amount += it.qty * it.price;
      lines[it.name] = l;
    })
  );

  const subtotal = orders.reduce((s, o) => s + o.total, 0);
  const tip = Math.round((subtotal * tipPct) / 100);
  const grand = subtotal + tip;
  const each = Math.ceil(grand / people);

  const pay = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("payments")
      .insert({ table_no: tableNo, subtotal, tip, total: grand, people, method });
    if (!error) {
      await supabase.from("orders").update({ paid: true }).in("id", orders.map((o) => o.id));
    }
    setBusy(false);
    if (error) {
      alert("Payment failed: " + error.message);
      return;
    }
    setPaid(true);
  };

  if (loading) {
    return <main className="min-h-screen bg-[#121212] p-5 pt-16 text-white">Loading...</main>;
  }

  if (paid) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[#121212] p-5 text-center text-white">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Payment recorded</h1>
        <p className="mt-2 text-gray-400">
          Table {tableNo} · ₹{grand} · {method}
        </p>
        <p className="mt-6 text-sm text-gray-500">Thank you for dining with us!</p>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="mx-auto min-h-screen max-w-md bg-[#121212] p-5 pt-16 text-white">
        <h1 className="text-2xl font-bold">Table {tableNo} · Bill</h1>
        <p className="mt-4 text-gray-400">No unpaid orders for this table.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#121212] p-5 pb-32 pt-16 text-white">
      <p className="text-xs tracking-widest text-[#F26B3A]">TABLE {tableNo}</p>
      <h1 className="mb-5 text-2xl font-bold">Your bill</h1>

      <div className="rounded-2xl bg-[#1e1e1e] p-4">
        {Object.entries(lines).map(([name, l]) => (
          <div key={name} className="flex justify-between py-1 text-sm">
            <span>{l.qty} × {name}</span>
            <span>₹{l.amount}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-[#333] pt-2 font-semibold">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
      </div>

      <p className="mb-2 mt-5 text-xs tracking-widest text-gray-400">SPLIT BETWEEN</p>
      <div className="flex items-center gap-4">
        <button onClick={() => setPeople(Math.max(1, people - 1))} className="h-9 w-9 rounded-full bg-[#2a2a2a] text-lg">−</button>
        <span className="w-6 text-center">{people}</span>
        <button onClick={() => setPeople(Math.min(12, people + 1))} className="h-9 w-9 rounded-full bg-[#F26B3A] text-lg">+</button>
        <span className="text-sm text-gray-400">{people === 1 ? "person" : "people"}</span>
      </div>

      <p className="mb-2 mt-5 text-xs tracking-widest text-gray-400">ADD TIP</p>
      <div className="flex gap-2">
        {[0, 5, 10, 15].map((p) => (
          <button
            key={p}
            onClick={() => setTipPct(p)}
            className={`rounded-full px-4 py-2 text-sm ${tipPct === p ? "bg-[#F26B3A]" : "bg-[#2a2a2a]"}`}
          >
            {p === 0 ? "No tip" : `${p}%`}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-xs tracking-widest text-gray-400">PAY WITH</p>
      <div className="space-y-2">
        {METHODS.map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`w-full rounded-xl px-4 py-3 text-left ${method === m ? "bg-[#3a1d14] ring-2 ring-[#F26B3A]" : "bg-[#1e1e1e]"}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-[#1e1e1e] p-4 text-sm">
        <div className="flex justify-between"><span>Tip</span><span>₹{tip}</span></div>
        <div className="mt-1 flex justify-between font-semibold"><span>Total</span><span>₹{grand}</span></div>
        {people > 1 && (
          <div className="mt-2 flex justify-between text-[#F26B3A]">
            <span>Each person pays</span><span>₹{each}</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#121212] p-4">
        <button
          onClick={pay}
          disabled={busy}
          className="mx-auto flex w-full max-w-md justify-between rounded-2xl bg-[#F26B3A] px-5 py-4 font-semibold disabled:opacity-60"
        >
          <span>{busy ? "Processing..." : `Pay with ${method}`}</span>
          <span>₹{grand}</span>
        </button>
      </div>
    </main>
  );
}