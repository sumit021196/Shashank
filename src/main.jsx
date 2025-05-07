import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminUploadForm from './components/AdminUploadForm';

const App = () => (
  <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
    <h1>Admin PDF Upload</h1>
    <AdminUploadForm />
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

        