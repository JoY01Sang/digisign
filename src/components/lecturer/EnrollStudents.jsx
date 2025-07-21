import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function EnrollStudents() {
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("Auth error or user not found", authError);
            return;
        }

        const { data: lecturer, error: lecturerError } = await supabase
            .from("lecturers")
            .select("id")
            .eq("id", user.id) // ✅ use id instead of user_id
            .single();

        if (lecturerError || !lecturer) {
            console.error("Lecturer record not found", lecturerError);
            return;
        }

        const { data: coursesData } = await supabase
            .from("courses")
            .select("id, name")
            .eq("lecturer_id", lecturer.id);

        const { data: studentsData, error: studentError } = await supabase
            .from("students")
            .select("id, full_name, registration_number");

        if (studentError) {
            console.error("Student fetch error", studentError);
        }
        setCourses(coursesData || []);
        setStudents(studentsData || []);
    };

    const toggleStudent = (id) => {
        setSelectedStudents((prev) => {
            const copy = new Set(prev);
            copy.has(id) ? copy.delete(id) : copy.add(id);
            return copy;
        });
    };

    const handleEnroll = async () => {
        if (!selectedCourse || selectedStudents.size === 0) {
            setMessage("Please select a course and at least one student.");
            return;
        }

        setLoading(true);
        setMessage(null);

        const payload = Array.from(selectedStudents).map((student_id) => ({
            course_id: selectedCourse,
            student_id,
        }));

        const { error } = await supabase.from("enrollments").insert(payload, {
            upsert: true, // avoids duplicate entries
            onConflict: "student_id,course_id",
        });

        if (error) {
            setMessage("Enrollment failed.");
        } else {
            setMessage("Students enrolled successfully.");
            setSelectedStudents(new Set());
        }

        setLoading(false);
    };

    const filteredStudents = students.filter((s) =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.registration_number?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white border rounded-lg shadow-sm p-6">
            <h4 className="text-xl font-bold mb-6 text-darkCoolGray-900">
                Enroll Students
            </h4>

            {message && <p className="text-sm mb-4 text-green-600">{message}</p>}

            {/* Select Course */}
            <div className="mb-6">
                <label className="block mb-2 font-medium text-coolGray-800">
                    Select Course
                </label>
                <select
                    className="w-full py-2 px-4 border rounded-md"
                    value={selectedCourse || ""}
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

            {/* Search Field */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search students by name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full py-2 px-4 border rounded-md"
                />
            </div>

            {/* Student List */}
            <div className="max-h-64 overflow-y-auto border rounded-md mb-6">
                {filteredStudents.map((student) => (
                    <div
                        key={student.id}
                        className="flex items-center px-4 py-2 border-b hover:bg-gray-50"
                    >
                        <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="mr-3"
                        />
                        <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-sm text-coolGray-600">
                                {student.registration_number}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-right">
                <button
                    onClick={handleEnroll}
                    disabled={loading}
                    className="py-3 px-6 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                    {loading ? "Enrolling..." : "Enroll Selected Students"}
                </button>
            </div>
        </div>
    );
}
