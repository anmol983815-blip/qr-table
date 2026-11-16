"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <main className="min-h-screen bg-white p-5 text-black">
      <h1 className="text-2xl font-bold">Table QR codes</h1>
      <p className="mb-6 text-sm text-gray-600">Scan to open the menu for that table</p>
      {origin && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {tables.map((t) => (
            <div key={t} className="flex flex-col items-center rounded-2xl border p-4">
              <QRCodeSVG value={`${origin}/r/cafe/t/${t}`} size={140} />
              <p className="mt-3 font-semibold">Table {t}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}