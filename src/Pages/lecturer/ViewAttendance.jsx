import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ViewAttendance() {
    const [records, setRecords] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [sessionFilter, setSessionFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => {
        fetchAttendance();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [search, sessionFilter, dateFrom, dateTo, records]);

    const fetchAttendance = async () => {
        const { data, error } = await supabase
            .from("attendance")
            .select(`
        id,
        timestamp,
        verified,
        signature_url,
        students (full_name, registration_number),
        class_sessions (session_title)
      `)
            .order("timestamp", { ascending: false });

        if (error) console.error("Error:", error);
        else {
            setRecords(data);
            setFiltered(data);
        }
    };

    const applyFilters = () => {
        const filteredData = records.filter((r) => {
            const studentMatch =
                r.students?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                r.students?.registration_number?.toLowerCase().includes(search.toLowerCase());

            const sessionMatch = r.class_sessions?.session_title
                ?.toLowerCase()
                .includes(sessionFilter.toLowerCase());

            const timestamp = new Date(r.timestamp);
            const afterFrom = dateFrom ? timestamp >= new Date(dateFrom) : true;
            const beforeTo = dateTo ? timestamp <= new Date(dateTo) : true;

            return studentMatch && sessionMatch && afterFrom && beforeTo;
        });

        setFiltered(filteredData);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Attendance Records", 14, 16);
        autoTable(doc, {
            startY: 20,
            head: [["Student", "Reg No.", "Session", "Timestamp", "Verified"]],
            body: filtered.map((r) => [
                r.students?.full_name || "—",
                r.students?.registration_number || "—",
                r.class_sessions?.session_title || "—",
                new Date(r.timestamp).toLocaleString(),
                r.verified ? "Yes" : "No",
            ]),
        });
        doc.save("attendance_records.pdf");
    };

    return (
        <section className="bg-coolGray-50 py-4">
            <div className="container px-4 mx-auto">
                <div className="pt-6 bg-white border border-coolGray-100 rounded-md shadow-dashboard">
                    <div className="px-6 mb-4 flex flex-wrap items-center gap-4 justify-between">
                        <h2 className="text-lg text-coolGray-900 font-semibold">Attendance Records</h2>
                        <button
                            onClick={exportToPDF}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded-md"
                        >
                            Export PDF
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="px-6 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search student name or reg no."
                            className="px-4 py-2 border rounded-md text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Filter by session title"
                            className="px-4 py-2 border rounded-md text-sm"
                            value={sessionFilter}
                            onChange={(e) => setSessionFilter(e.target.value)}
                        />
                        <input
                            type="date"
                            className="px-4 py-2 border rounded-md text-sm"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <input
                            type="date"
                            className="px-4 py-2 border rounded-md text-sm"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    {/* Table */}
                    <div className="px-6 overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="whitespace-nowrap h-11 bg-coolGray-50 bg-opacity-80">
                                <th className="px-4 text-xs font-semibold text-coolGray-500 uppercase text-left rounded-l-md">
                                    Student
                                </th>
                                <th className="px-4 text-xs font-semibold text-coolGray-500 uppercase text-left">Reg No.</th>
                                <th className="px-4 text-xs font-semibold text-coolGray-500 uppercase text-left">Session</th>
                                <th className="px-4 text-xs font-semibold text-coolGray-500 uppercase text-left">Timestamp</th>
                                <th className="px-4 text-xs font-semibold text-coolGray-500 uppercase text-left">Signature</th>
                                <th className="px-4 text-xs font-semibold text-coolGray-500 uppercase text-left rounded-r-md">
                                    Verified
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map((r) => (
                                <tr
                                    key={r.id}
                                    className="h-18 border-b border-coolGray-100 bg-white"
                                >
                                    <td className="px-4 text-sm text-coolGray-800">{r.students?.full_name || "—"}</td>
                                    <td className="px-4 text-sm text-coolGray-800">{r.students?.registration_number || "—"}</td>
                                    <td className="px-4 text-sm text-coolGray-800">{r.class_sessions?.session_title || "—"}</td>
                                    <td className="px-4 text-sm text-coolGray-800">
                                        {new Date(r.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-4 text-sm text-green-600 underline">
                                        <a href={r.signature_url} target="_blank" rel="noopener noreferrer">View</a>
                                    </td>
                                    <td className="px-4 text-sm">
                      <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                              r.verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                      >
                        {r.verified ? "Yes" : "No"}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-6 text-coolGray-500">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center px-6 py-4 text-sm text-coolGray-500">
                        <p>Showing {filtered.length} filtered record(s)</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
