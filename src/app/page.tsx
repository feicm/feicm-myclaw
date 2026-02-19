"use client";

import { useEffect, useMemo, useState } from "react";
import MarkdownRenderer from "./components/MarkdownRenderer";

const RULES_MD = `
## 玩法说明

- **点击红包**：每个红包有随机分值，点击后加分。
- **炸雷包**（黑色）：点击后扣分，小心避开！
- **连击奖励**：连续点中普通红包可获得额外奖励：
  - 连击 ≥ 3：每包 +3 分奖励
  - 连击 ≥ 6：每包 +8 分奖励
- **计时 30 秒**：时间到后自动结算，最高分记入本机排行榜。
`;

type Packet = {
  id: number;
  x: number;
  y: number;
  value: number;
  bad?: boolean;
};

type RecordItem = {
  score: number;
  at: string;
};

const GAME_SECONDS = 30;
const FIELD_W = 340;
const FIELD_H = 460;

function randomPacket(id: number): Packet {
  const bad = Math.random() < 0.18;
  const value = bad
    ? -(Math.floor(Math.random() * 7) + 2)
    : Math.floor(Math.random() * 18) + 3;

  return {
    id,
    x: Math.floor(Math.random() * (FIELD_W - 56)),
    y: Math.floor(Math.random() * (FIELD_H - 56)),
    value,
    bad,
  };
}

export default function Home() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [running, setRunning] = useState(false);
  const [seed, setSeed] = useState(1);
  const [records, setRecords] = useState<RecordItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("cny-redpacket-records");
    if (!raw) return;
    try {
      setRecords(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const spawner = setInterval(() => {
      setPackets((prev) => {
        const next = prev
          .slice(-10)
          .map((p) => ({ ...p, y: Math.min(FIELD_H - 52, p.y + 8) }));

        if (next.length < 12) {
          next.push(randomPacket(Date.now() + Math.floor(Math.random() * 9999)));
        }
        return next;
      });
    }, 550);

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [running]);

  useEffect(() => {
    if (timeLeft !== 0 || running) return;

    const nextRecords = [
      { score, at: new Date().toLocaleString("zh-CN", { hour12: false }) },
      ...records,
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setRecords(nextRecords);
    localStorage.setItem("cny-redpacket-records", JSON.stringify(nextRecords));
  }, [running, timeLeft, score, records]);

  const rankText = useMemo(() => {
    if (score >= 360) return "财神附体";
    if (score >= 260) return "手气爆棚";
    if (score >= 180) return "新春锦鲤";
    if (score >= 100) return "好运常在";
    return "再来一局";
  }, [score]);

  function startGame() {
    setSeed((s) => s + 1);
    setPackets(Array.from({ length: 6 }).map((_, i) => randomPacket(i + seed)));
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_SECONDS);
    setRunning(true);
  }

  function hitPacket(item: Packet) {
    if (!running) return;

    setPackets((prev) => prev.filter((p) => p.id !== item.id));

    if (item.bad) {
      setCombo(0);
      setScore((s) => Math.max(0, s + item.value));
      return;
    }

    setCombo((c) => {
      const nextCombo = c + 1;
      const bonus = nextCombo >= 6 ? 8 : nextCombo >= 3 ? 3 : 0;
      setScore((s) => s + item.value + bonus);
      return nextCombo;
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff1db_0%,#fff8ee_52%,#fff4e6_100%)] px-4 py-6 text-[#351d15]">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <section className="rounded-2xl border border-[#f4d6b0] bg-white/90 p-5 shadow-[0_10px_28px_rgba(120,44,14,0.08)]">
          <p className="inline-block rounded-full bg-[#ffe6c5] px-3 py-1 text-xs font-bold text-[#8d511d]">
            新春红包挑战 · 30 秒
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#8f1f17]">红包雨 · 手速版</h1>
          <p className="mt-2 text-sm text-[#815f4d]">
            点中红包加分，点到“炸雷包”会扣分。连击越高，奖励越多。更快、更刺激、更耐玩。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={startGame}
              className="rounded-xl bg-gradient-to-r from-[#d6352b] to-[#b81f1f] px-5 py-2.5 text-sm font-bold text-white shadow hover:brightness-105"
            >
              {running ? "重新开局" : "开始挑战"}
            </button>
            <div className="rounded-xl bg-[#fff4e8] px-4 py-2 text-sm font-semibold text-[#7f4c20]">
              当前称号：{rankText}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#efceaa] bg-[#fffdf8] p-4 shadow-[0_8px_20px_rgba(120,44,14,0.07)]">
            <div className="mb-3 flex items-center justify-between text-sm font-bold text-[#7d4124]">
              <span>剩余时间：{timeLeft}s</span>
              <span>连击：x{combo}</span>
            </div>

            <div
              className="relative mx-auto overflow-hidden rounded-xl border border-[#f0cfa5] bg-[linear-gradient(180deg,#fff5e6,#ffe8cf)]"
              style={{ width: FIELD_W, height: FIELD_H }}
            >
              {!running && timeLeft === GAME_SECONDS && (
                <p className="absolute inset-0 grid place-items-center px-8 text-center text-sm font-semibold text-[#8a5a42]">
                  点击“开始挑战”后，红包会不断掉落。快点快点，手慢无！
                </p>
              )}

              {!running && timeLeft === 0 && (
                <p className="absolute inset-0 grid place-items-center px-8 text-center text-sm font-semibold text-[#8a5a42]">
                  本局结束：{score} 分（{rankText}）
                </p>
              )}

              {packets.map((item) => (
                <button
                  key={item.id}
                  onClick={() => hitPacket(item)}
                  className={`absolute grid h-14 w-14 place-items-center rounded-full border text-xs font-black text-white shadow-md transition active:scale-95 ${
                    item.bad
                      ? "border-[#4f2012] bg-[#6a2d1a]"
                      : "border-[#b6241a] bg-gradient-to-b from-[#de3a2d] to-[#b61d1c]"
                  }`}
                  style={{ left: item.x, top: item.y }}
                  aria-label={item.bad ? "炸雷包" : `红包 +${item.value}`}
                >
                  {item.bad ? "雷" : "+" + item.value}
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-4 rounded-2xl border border-[#f1d3ae] bg-white/90 p-4 shadow-[0_8px_20px_rgba(120,44,14,0.07)]">
            <div className="rounded-xl bg-[#fff3e2] p-3">
              <p className="text-xs font-bold text-[#8a5220]">当前得分</p>
              <p className="text-3xl font-black text-[#9d231b]">{score}</p>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-black text-[#7e4422]">历史最佳（本机）</h2>
              <ol className="space-y-2 text-sm">
                {records.length === 0 ? (
                  <li className="rounded-lg bg-[#fff7ec] p-2 text-[#8b664f]">还没有记录，先来一局！</li>
                ) : (
                  records.map((r, i) => (
                    <li key={`${r.at}-${r.score}`} className="rounded-lg bg-[#fff7ec] p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#8a4b23]">#{i + 1}</span>
                        <span className="font-black text-[#9a2119]">{r.score} 分</span>
                      </div>
                      <p className="mt-1 text-xs text-[#8b664f]">{r.at}</p>
                    </li>
                  ))
                )}
              </ol>
            </div>
          </aside>
        </section>
        <section className="rounded-2xl border border-[#f4d6b0] bg-white/90 p-5 shadow-[0_10px_28px_rgba(120,44,14,0.08)]">
          <MarkdownRenderer
            content={RULES_MD}
            className="prose prose-sm max-w-none text-[#5a3520] [&_h2]:text-[#8f1f17] [&_h2]:font-black [&_strong]:text-[#7c3918]"
          />
        </section>
      </div>
    </main>
  );
}
