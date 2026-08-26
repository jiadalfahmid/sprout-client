import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleGenAI } from "@google/genai";

// This is a placeholder for the real API key which is injected by the environment
process.env.API_KEY = "YOUR_API_KEY";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
