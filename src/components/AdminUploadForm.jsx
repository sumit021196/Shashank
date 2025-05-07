import { useState } from 'react';

export default function AdminUploadForm() {
  const [file, setFile] = useState(null);
    const [year, setYear] = useState('');
      const [quarter, setQuarter] = useState('');
        const [loading, setLoading] = useState(false);

          const handleUpload = async (e) => {
              e.preventDefault();
                  if (!file || !year || !quarter) return alert('All fields required');

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
                                                                                  <form onSubmit={handleUpload}>
                                                                                        <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
                                                                                              <input type="text" placeholder="Year" value={year} onChange={e => setYear(e.target.value)} />
                                                                                                    <input type="text" placeholder="Quarter" value={quarter} onChange={e => setQuarter(e.target.value)} />
                                                                                                          <button type="submit" disabled={loading}>
                                                                                                                  {loading ? 'Uploading...' : 'Upload PDF'}
                                                                                                                        </button>
                                                                                                                            </form>
                                                                                                                              );
                                                                                                                              }
                                                                                                                              