"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../../lib/supabase";

export default function Review() {
  const params = useParams();
  const tableNo = Number(params.table) || 0;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    const { error } = await supabase
      .from("reviews")
      .insert({ table_no: tableNo, rating, comment: comment.trim() || null });
    setBusy(false);
    if (error) {
      alert("Could not send review: " + error.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[#121212] p-5 text-center text-white">
        <div className="mb-4 text-5xl">🙏</div>
        <h1 className="text-2xl font-bold">Thank you!</h1>
        <p className="mt-2 text-gray-400">Your {rating}-star review was sent.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#121212] p-5 text-white">
      <p className="text-xs tracking-widest text-[#F26B3A]">TABLE {tableNo}</p>
      <h1 className="mb-6 text-2xl font-bold">How was your meal?</h1>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`text-5xl ${n <= rating ? "text-[#F26B3A]" : "text-[#3a3a3a]"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Anything to add? (optional)"
        className="mt-6 h-28 w-full rounded-2xl bg-[#1e1e1e] p-4 text-sm outline-none"
      />
      <button
        onClick={submit}
        disabled={!rating || busy}
        className="mt-4 w-full rounded-2xl bg-[#F26B3A] py-4 font-semibold disabled:opacity-50"
      >
        {busy ? "Sending..." : "Send review"}
      </button>
    </main>
  );
}