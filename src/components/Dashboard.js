import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import './Dashboard.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const STORAGE_BUCKET = 'financial-results';

function Dashboard() {
  const [file, setFile] = useState(null);
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const [deleteLoading, setDeleteLoading] = useState(null);

  const years = Array.from({ length: 6 }, (_, i) => (2020 + i).toString());
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const fetchReports = useCallback(async () => {
    try {
      // First, get all files from the storage bucket
      const { data: files, error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list();

      if (storageError) throw storageError;

      // Then get metadata from the database
      const { data: metadata, error: dbError } = await supabase
        .from('reports')
        .select('*')
        .order('upload_date', { ascending: sortOrder === 'asc' });

      if (dbError) throw dbError;

      // Combine storage and database data
      const combinedData = metadata.map(meta => {
        const fileInfo = files.find(f => f.name === meta.filename);
        return {
          ...meta,
          size: fileInfo?.metadata?.size || 0,
          lastModified: fileInfo?.metadata?.lastModified || meta.upload_date
        };
      });

      setReports(combinedData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Error fetching reports: ' + error.message);
    }
  }, [sortOrder]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !year || !quarter) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${year}_${quarter}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('reports')
        .insert([
          {
            filename: fileName,
            year: year,
            quarter: quarter,
            upload_date: new Date().toISOString(),
          },
        ]);

      if (dbError) throw dbError;

      setFile(null);
      setYear('');
      setQuarter('');
      fetchReports();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Error uploading file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    setDeleteLoading(report.id);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([report.filename]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);

      if (dbError) throw dbError;

      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Error deleting report: ' + error.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="dashboard">
      <h1>Annual Report Upload Dashboard</h1>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>PDF File:</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Year:</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} required>
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quarter:</label>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            required
          >
            <option value="">Select Quarter</option>
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Report'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="reports-list">
        <div className="reports-header">
          <h2>Uploaded Reports</h2>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Year</th>
              <th>Quarter</th>
              <th>Size</th>
              <th>Upload Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.filename}</td>
                <td>{report.year}</td>
                <td>{report.quarter}</td>
                <td>{formatFileSize(report.size)}</td>
                <td>{new Date(report.upload_date).toLocaleDateString()}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(report)}
                    disabled={deleteLoading === report.id}
                  >
                    {deleteLoading === report.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard; 