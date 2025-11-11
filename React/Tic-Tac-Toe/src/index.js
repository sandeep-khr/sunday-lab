// Import React's StrictMode component.
// This is a development tool that helps identify potential problems in your app,
// such as deprecated APIs, side effects in render, and unexpected behavior.
// It doesn't affect production builds.
import { StrictMode } from "react";

// Import the createRoot API from React DOM's client package.
// This is the modern way to initialize a React app (introduced in React 18),
// enabling features like concurrent rendering and improved performance.
import { createRoot } from "react-dom/client";

// Import global CSS styles for the application.
// These styles apply across all components unless scoped or overridden.
import "./styles.css";

// Import the root App component.
// This is the top-level component that contains your entire UI tree.
import App from "./App";

// Find the DOM element with the ID 'root'.
// This is the container where your React app will be mounted.
// Typically, this element lives in public/index.html.
const root = createRoot(document.getElementById("root"));

// Render the App component inside the root container.
// Wrapping it in <StrictMode> enables additional checks and warnings in development.
// This helps catch bugs early and ensures your code adheres to best practices.
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);