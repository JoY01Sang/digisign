import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {supabase} from "../../services/supabase";

export default function ViewEnrolledStudents() {
    const [students, setStudents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const lower = search.toLowerCase();
        const filteredList = students.filter(
            s =>
                s.full_name.toLowerCase().includes(lower) ||
                s.registration_number.toLowerCase().includes(lower)
        );
        setFiltered(filteredList);
    }, [search, students]);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch courses by lecturer
        const { data: lecturerCourses } = await supabase
            .from("courses")
            .select("id, name")
            .eq("lecturer_id", user.id);

        setCourses(lecturerCourses || []);
        if (lecturerCourses?.length) setSelectedCourse(lecturerCourses[0].id);

        // Fetch enrolled students
        const { data } = await supabase
            .from("enrollments")
            .select("student:students(id, full_name, registration_number, email), course_id")
            .in("course_id", lecturerCourses.map(c => c.id));

        const flattened = data.map((entry) => ({
            ...entry.student,
            course_id: entry.course_id,
        }));
        setStudents(flattened);
        setFiltered(flattened);
    };

    const handleDownload = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Name", "Reg No", "Email"]],
            body: filtered.map((s) => [s.full_name, s.registration_number, s.email]),
        });
        doc.save("enrolled-students.pdf");
    };

    const filteredByCourse = filtered.filter(s =>
        selectedCourse ? s.course_id === selectedCourse : true
    );

    return (
        <section className="bg-coolGray-50 py-4">
            <div className="container px-4 mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between -m-2 mb-4">
                    <div className="w-full md:w-1/2 p-2">
                        <p className="font-semibold text-xl text-coolGray-800">Enrolled Students</p>
                        <p className="font-medium text-sm text-coolGray-500">{filteredByCourse.length} Students</p>
                    </div>

                    {/* Search */}
                    <div className="w-full md:w-1/2 p-2 flex gap-2 justify-end">
                        <select
                            className="py-2 px-3 text-sm border rounded-md border-coolGray-200"
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                        >
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="relative md:max-w-max">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" fill="none">
                                <path d="..." fill="#BBC3CF" /> {/* truncated for brevity */}
                            </svg>
                            <input
                                className="pl-8 pr-4 py-2 text-sm text-coolGray-400 border border-coolGray-200 rounded-lg shadow-input"
                                type="text"
                                placeholder="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleDownload}
                            className="py-2 px-4 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                        >
                            Download PDF
                        </button>
                    </div>
                </div>

                <div className="mb-6 border border-coolGray-100"></div>

                {/* Table */}
                <div className="overflow-hidden border border-coolGray-100 rounded-md shadow-dashboard">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-coolGray-50 border-b border-coolGray-100 text-left text-xs uppercase text-coolGray-500">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Reg. Number</th>
                                <th className="px-4 py-3">Email</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredByCourse.map((s) => (
                                <tr key={s.id} className="bg-white border-b hover:bg-coolGray-50">
                                    <td className="px-4 py-3 font-medium text-coolGray-800">{s.full_name}</td>
                                    <td className="px-4 py-3">{s.registration_number}</td>
                                    <td className="px-4 py-3">{s.email}</td>
                                </tr>
                            ))}
                            {!filteredByCourse.length && (
                                <tr>
                                    <td colSpan="3" className="text-center py-4 text-coolGray-500">
                                        No students found
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
