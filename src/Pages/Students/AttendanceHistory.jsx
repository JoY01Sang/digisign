import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function StudentAttendanceHistory() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from("attendance")
                .select(`
    id,
    timestamp,
    signature_url,
    class_sessions (
      session_title,
      courses (
        name
      )
    )
  `)
                .order("timestamp", { ascending: false });

            if (error) {
                console.error("❌ Error fetching attendance:", error);
                setError("Failed to load attendance.");
                setLoading(false);
                return;
            }

            setRecords(data);
            setLoading(false);
        };

        fetchAttendance();
    }, []);

    return (
        <section className="py-6">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Attendance History</h2>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : records.length === 0 ? (
                    <p className="text-gray-500">No attendance records yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2">Course</th>
                                <th className="px-4 py-2">Session</th>
                                <th className="px-4 py-2">Timestamp</th>
                                <th className="px-4 py-2">Signature</th>
                                <th className="px-4 py-2">Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {records.map((r) => (
                                <tr key={r.id} className="border-b">
                                    <td className="px-4 py-2">
                                        {r.class_sessions?.courses?.name || "—"}
                                    </td>
                                    <td className="px-4 py-2">
                                        {r.class_sessions?.session_title || "—"}
                                    </td>
                                    <td className="px-4 py-2">
                                        {new Date(r.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-blue-600 underline">
                                        {r.signature_url ? (
                                            <a
                                                href={r.signature_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
  <span
      className={`px-2 py-1 text-xs rounded font-semibold ${
          r.signature_url ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
  >
    {r.signature_url ? "Present" : "Absent"}
  </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
