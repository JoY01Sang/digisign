import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function ManageSessions() {
    const [courses, setCourses] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [newSession, setNewSession] = useState({
        session_title: "",
        start_time: "",
        end_time: "",
        meeting_link: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchSessions();
        }
    }, [selectedCourse]);

    const fetchCourses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from("courses")
            .select("id, name")
            .eq("lecturer_id", user.id);
        setCourses(data || []);
    };

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from("class_sessions")
            .select("*")
            .eq("course_id", selectedCourse)
            .order("start_time", { ascending: true });
        setSessions(data || []);
    };

    const handleChange = (e) => {
        setNewSession({ ...newSession, [e.target.name]: e.target.value });
    };

    const handleAddSession = async () => {
        if (!selectedCourse || !newSession.session_title || !newSession.start_time || !newSession.end_time) {
            setMessage("Fill in all required fields.");
            return;
        }

        setLoading(true);
        setMessage(null);

        const { error } = await supabase.from("class_sessions").insert([{
            course_id: selectedCourse,
            ...newSession,
        }]);

        if (error) {
            setMessage("Failed to add session.");
        } else {
            setMessage("Session added successfully.");
            fetchSessions();
            setNewSession({ session_title: "", start_time: "", end_time: "", meeting_link: "" });
        }

        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this session?")) return;
        await supabase.from("class_sessions").delete().eq("id", id);
        fetchSessions();
    };

    return (
        <div className="bg-white border rounded-lg shadow-sm p-6">
            <h4 className="text-xl font-bold mb-6 text-darkCoolGray-900">Manage Class Sessions</h4>

            {message && <p className="text-green-600 mb-4">{message}</p>}

            {/* Course Dropdown */}
            <div className="mb-4">
                <label className="block mb-2 font-medium">Select Course</label>
                <select
                    className="w-full py-2 px-4 border rounded-md"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                >
                    <option value="">-- Choose a Course --</option>
                    {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                            {course.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* New Session Form */}
            {selectedCourse && (
                <div className="mb-6 space-y-3">
                    <input
                        name="session_title"
                        placeholder="Session Title"
                        className="w-full py-2 px-4 border rounded-md"
                        value={newSession.session_title}
                        onChange={handleChange}
                    />
                    <input
                        name="start_time"
                        type="datetime-local"
                        className="w-full py-2 px-4 border rounded-md"
                        value={newSession.start_time}
                        onChange={handleChange}
                    />
                    <input
                        name="end_time"
                        type="datetime-local"
                        className="w-full py-2 px-4 border rounded-md"
                        value={newSession.end_time}
                        onChange={handleChange}
                    />
                    <input
                        name="meeting_link"
                        placeholder="Optional meeting link"
                        className="w-full py-2 px-4 border rounded-md"
                        value={newSession.meeting_link}
                        onChange={handleChange}
                    />
                    <button
                        onClick={handleAddSession}
                        disabled={loading}
                        className="py-2 px-6 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                    >
                        {loading ? "Adding..." : "Add Session"}
                    </button>
                </div>
            )}

            {/* Sessions List */}
            <div className="border rounded-md max-h-72 overflow-y-auto">
                {sessions.map((session) => (
                    <div key={session.id} className="flex justify-between items-start p-4 border-b">
                        <div>
                            <h5 className="font-semibold">{session.session_title}</h5>
                            <p className="text-sm text-coolGray-600">
                                {new Date(session.start_time).toLocaleString()} → {new Date(session.end_time).toLocaleString()}
                            </p>
                            {session.meeting_link && (
                                <a
                                    href={session.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 text-sm underline"
                                >
                                    Meeting Link
                                </a>
                            )}
                        </div>
                        <button
                            onClick={() => handleDelete(session.id)}
                            className="text-red-600 text-sm hover:underline"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
