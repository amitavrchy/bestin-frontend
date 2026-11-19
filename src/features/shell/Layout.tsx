import { Link, Outlet } from "react-router-dom";
import { BookOpen, LayoutDashboard, LogOut, Settings as SettingsIcon, Library, Users, MessageSquare } from "lucide-react";
import { useAuth } from "../../lib/contexts";
export function Layout() {
  const { user, signOut } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <BookOpen size={21} />
          </span>{" "}
          bestin<span className="brand-dot">.</span>
        </Link>
        <p className="nav-label">YOUR SPACE</p>
        <nav>
          <Link to="/">
            <Library size={18} /> Library
          </Link>
          <Link to="/settings">
            <SettingsIcon size={18} /> Settings
          </Link>
          {user?.role === "admin" && (
            <>
              <p className="nav-label">MANAGE</p>
              <Link to="/admin">
                <LayoutDashboard size={18} /> Overview
              </Link>
              <Link to="/admin/books">
                <BookOpen size={18} /> Books
              </Link>
              <Link to="/admin/qa">
                <MessageSquare size={18} /> Questions
              </Link>
              <Link to="/admin/users">
                <Users size={18} /> Readers
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-badge">
            {user?.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.role}</small>
          </div>
          <button
            className="icon-button"
            onClick={signOut}
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
