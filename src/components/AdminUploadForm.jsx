import { useState } from 'react';

export default function AdminUploadForm() {
  const [file, setFile] = useState(null);
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !year || !quarter) return alert('All fields are required');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('year', year);
    formData.append('quarter', quarter);

    setLoading(true);
    const res = await fetch('/.netlify/functions/uploadPdf', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) alert('Uploaded successfully');
    else alert('Upload failed');
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50" />

      <input type="text" placeholder="Year" value={year} onChange={e => setYear(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded" />

      <input type="text" placeholder="Quarter" value={quarter} onChange={e => setQuarter(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded" />

      <button type="submit" disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
        {loading ? 'Uploading...' : 'Upload PDF'}
      </button>
    </form>
  );
}
