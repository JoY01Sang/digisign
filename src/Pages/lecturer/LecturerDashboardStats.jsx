import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";

const COLORS = ["#34D399", "#60A5FA", "#FBBF24", "#F87171", "#A78BFA"];

export default function LecturerDashboardOverview() {
    const [lecturerId, setLecturerId] = useState(null);
    const [kpis, setKpis] = useState({});
    const [attendanceTrend, setAttendanceTrend] = useState([]);
    const [sessionRates, setSessionRates] = useState([]);
    const [coursePie, setCoursePie] = useState([]);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        // ✅ Get the logged-in user
        const {
            data: { user },
            error: userErr,
        } = await supabase.auth.getUser();

        if (userErr || !user) {
            console.error("User not authenticated", userErr);
            return;
        }

        // ✅ Get the lecturer linked to the user
        const { data: lecturer, error: lecErr } = await supabase
            .from("lecturers")
            .select("id")
            .eq("id", user.id)
            .single();

        if (lecErr || !lecturer) {
            console.error("Lecturer not found", lecErr);
            return;
        }

        // ✅ Store the lecturer ID
        const lecId = lecturer.id;
        setLecturerId(lecId);

        // ✅ Fetch all related data in parallel
        const [coursesRes, enrollmentsRes, sessionsRes, attendanceRes] = await Promise.all([
            supabase.from("courses").select("id").eq("lecturer_id", lecId),
            supabase.from("enrollments").select("id,course_id,student_id"),
            supabase.from("class_sessions").select("id,course_id,start_time"),
            supabase.from("attendance").select("id,session_id,timestamp")
        ]);

        const courses = coursesRes.data || [];
        const enrollments = enrollmentsRes.data || [];
        const sessions = sessionsRes.data || [];
        const attendance = attendanceRes.data || [];

        // ✅ KPI summary
        const courseCount = courses.length;
        const courseIds = courses.map(c => c.id);
        const sessionsFiltered = sessions.filter(s => courseIds.includes(s.course_id));
        const sessionCount = sessionsFiltered.length;

        const studentSet = new Set(
            enrollments
                .filter(e => courseIds.includes(e.course_id))
                .map(e => e.student_id)
        );
        const totalStudents = studentSet.size;
        const totalPossible = sessionCount * totalStudents;
        const attendanceRate = totalPossible ? (attendance.length / totalPossible) * 100 : 0;

        setKpis({ courseCount, totalStudents, sessionCount, attendanceRate });

        // ✅ Weekly trend data
        const weeklyData = {};
        attendance.forEach((a) => {
            const week = new Date(a.timestamp).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
            weeklyData[week] = (weeklyData[week] || 0) + 1;
        });
        setAttendanceTrend(
            Object.entries(weeklyData).map(([date, count]) => ({ date, attended: count }))
        );

        // ✅ Session attendance rate
        const sessionCounts = {};
        attendance.forEach((a) => {
            sessionCounts[a.session_id] = (sessionCounts[a.session_id] || 0) + 1;
        });

        const sessionStats = sessionsFiltered.map((s) => ({
            title: `Session ${s.id.slice(0, 4)}`,
            rate: totalStudents ? ((sessionCounts[s.id] || 0) / totalStudents) * 100 : 0,
        }));
        setSessionRates(sessionStats);

        // ✅ Course distribution (pie chart)
        const courseCounts = {};
        sessionsFiltered.forEach((s) => {
            courseCounts[s.course_id] = (courseCounts[s.course_id] || 0) + 1;
        });

        setCoursePie(
            Object.entries(courseCounts).map(([cid, count]) => ({
                name: `Course ${cid.slice(0, 4)}`,
                value: count,
            }))
        );
    };

    return (
        <section className="bg-coolGray-50 py-8">
            <div className="container mx-auto px-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Courses", value: kpis.courseCount },
                        { label: "Students", value: kpis.totalStudents },
                        { label: "Sessions", value: kpis.sessionCount },
                        {
                            label: "Attendance Rate",
                            value: `${kpis.attendanceRate?.toFixed(1)}%`,
                        },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-6 rounded-lg shadow text-center border"
                        >
                            <p className="text-sm text-coolGray-500 font-medium mb-1">
                                {item.label}
                            </p>
                            <h3 className="text-2xl font-bold text-coolGray-800">
                                {item.value}
                            </h3>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h4 className="text-coolGray-700 font-semibold mb-4">
                            Attendance Trend
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={attendanceTrend}>
                                <Line type="monotone" dataKey="attended" stroke="#34D399" />
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h4 className="text-coolGray-700 font-semibold mb-4">
                            Course Distribution
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={coursePie}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={80}
                                    label
                                >
                                    {coursePie.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border">
                    <h4 className="text-coolGray-700 font-semibold mb-4">
                        Session Attendance Rates
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={sessionRates}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="title" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="rate" fill="#60A5FA" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
}
