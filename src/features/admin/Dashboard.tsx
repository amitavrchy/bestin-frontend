import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
type Stats = {
  books: number;
  ready_books: number;
  users: number;
  conversations: number;
  questions: number;
  questions_last_7d: { date: string; count: number }[];
};
export function Dashboard() {
  const { data, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/admin/stats"),
  });
  return (
    <div className="page">
      <p className="eyebrow">THE BIG PICTURE</p>
      <h1>
        Overview<span className="accent">.</span>
      </h1>
      <p className="muted">A little look at your growing library.</p>
      {error && <p className="error">{error.message}</p>}
      <div className="stats">
        {[
          ["Books", data?.books],
          ["Ready to read", data?.ready_books],
          ["Readers", data?.users],
          ["Conversations", data?.conversations],
          ["Questions", data?.questions],
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>Questions this week</h2>
        <div className="chart">
          {data?.questions_last_7d.map((d) => (
            <div key={d.date}>
              <span>{d.count}</span>
              <div
                style={{
                  height: `${Math.max(4, (d.count / Math.max(1, ...data.questions_last_7d.map((x) => x.count))) * 130)}px`,
                }}
              />
              <small>{d.date.slice(5)}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
