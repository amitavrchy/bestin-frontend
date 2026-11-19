import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { User } from "../../lib/types";
export function UsersPage() {
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<User[]>("/api/admin/users"),
  });
  return (
    <div className="page">
      <p className="eyebrow">THE PEOPLE BEHIND THE QUESTIONS</p>
      <h1>
        Readers<span className="accent">.</span>
      </h1>
      <div className="panel list">
        {users.map((u) => (
          <div className="user-row" key={u.id}>
            <div className="user-badge">{u.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{u.name}</strong>
              <small>{u.email}</small>
            </div>
            <span className="badge">{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
