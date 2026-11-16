"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const menu = [
  { id: 1, name: "Chicken Karahi", price: 450, desc: "Slow cooked with tomato, ginger and green chili", tags: ["Dairy", "Spicy"] },
  { id: 2, name: "Paneer Tikka", price: 280, desc: "Smoky tandoor paneer with mint chutney", tags: ["Dairy"] },
  { id: 3, name: "Butter Naan", price: 60, desc: "Soft tandoor bread brushed with butter", tags: ["Gluten", "Dairy"] },
];

export default function Home() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [placed, setPlaced] = useState(false);
  const [sending, setSending] = useState(false);

  const change = (id: number, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) }));

  const items = menu.filter((d) => (cart[d.id] || 0) > 0);
  const count = items.reduce((s, d) => s + cart[d.id], 0);
  const total = items.reduce((s, d) => s + cart[d.id] * d.price, 0);

  const placeOrder = async () => {
    setSending(true);
    const { error } = await supabase.from("orders").insert({
      table_no: 4,
      items: items.map((d) => ({ name: d.name, qty: cart[d.id], price: d.price })),
      total,
    });
    setSending(false);
    if (error) {
      alert("Order failed: " + error.message);
      return;
    }
    setPlaced(true);
  };

  if (placed) {
    return (
      <main className="min-h-screen bg-[#121212] text-white p-5 max-w-md mx-auto flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold">Order sent to kitchen!</h1>
        <p className="mt-2 text-gray-400">Table 4 · Total ₹{total}</p>
        <button
          onClick={() => { setCart({}); setPlaced(false); }}
          className="mt-6 rounded-full bg-[#F26B3A] px-6 py-3 font-semibold"
        >
          Order more
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white p-5 pb-28 max-w-md mx-auto">
      <p className="text-xs tracking-widest text-[#F26B3A]">TABLE 4</p>
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