import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Menu, User, BookOpen, Clock, CheckCircle, LayoutDashboard } from "lucide-react";
import logo from "../assets/logo.png";
import {supabase} from "../services/supabase";

export default function DashboardLayout({ children, role = "student" }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [session, setSession] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
            setSession(session);
        });

        return () => listener?.subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    const studentNav = [
        { label: "Dashboard", href: "/student/dashboard", icon: <LayoutDashboard size={18}/> },
        { label: "Mark Attendance", href: "/student/mark-attendance", icon: <CheckCircle size={18}/> },
        { label: "Attendance History", href: "/student/attendance-history", icon: <Clock size={18}/> },
    ];

    const lecturerNav = [
        { label: "Dashboard", href: "/lecturer/dashboard", icon: <LayoutDashboard size={18}/> },
        { label: "Courses", href: "/lecturer/courses", icon: <BookOpen size={18}/> },
        { label: "Enrollments", href: "/lecturer/enrollments", icon: <User size={18}/> },
        { label: "Attendance Records", href: "/lecturer/attendance", icon: <Clock size={18}/> },
    ];

    const navItems = role === "student" ? studentNav : lecturerNav;

    return (
        <section className="min-h-screen bg-slate-50 flex">
            {/* Sidebar for XL screens */}
            <aside className="hidden xl:flex fixed flex-col justify-between w-64 h-screen border-r bg-white">
                <div>
                    <div className="px-6 py-4">
                        <img src={logo} alt="Logo" className="h-12" />
                    </div>
                    <nav className="mt-6 space-y-1 px-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition ${
                                    location.pathname.startsWith(item.href)
                                        ? "bg-orange-100 text-orange-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="px-4 py-6 border-t text-xs text-gray-500">
                    <p className="mb-1">Signed in as</p>
                    <p className="font-medium text-gray-700 truncate">
                        {session?.user?.email || "Anonymous"}
                    </p>
                    <button
                        onClick={handleLogout}
                        className="mt-3 text-red-500 text-sm hover:underline flex items-center gap-1"
                    >
                        <LogOut size={16}/> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 xl:ml-64 min-h-screen overflow-x-hidden">
                {/* Mobile Navbar */}
                <div className="xl:hidden sticky top-0 z-50 flex items-center justify-between bg-white border-b px-6 py-4">
                    <Link to="/">
                        <img src={logo} alt="Logo" className="h-8" />
                    </Link>
                    <div className="relative">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <Menu size={28} />
                        </button>
                        {sidebarOpen && (
                            <div className="absolute right-0 mt-3 w-56 bg-white border rounded-lg shadow-lg z-50">
                                <div className="px-4 py-3 border-b">
                                    <p className="text-xs text-gray-500 mb-1">Signed in as</p>
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                        {session?.user?.email || "Anonymous"}
                                    </p>
                                </div>
                                <nav className="px-2 py-2 space-y-1">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t"
                                >
                                    <LogOut size={16} className="inline mr-2" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Outlet />
                </main>
            </div>
        </section>
    );
}
