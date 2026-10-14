import React from "react";

// Wraps the whole app. Without this, any uncaught error thrown while
// rendering a page (e.g. a component reading a field that isn't present on
// some particular piece of data) unmounts the entire React tree and leaves
// the visitor looking at a blank white page with no way to recover except
// a manual refresh. This catches that and shows a friendly, actionable
// screen instead.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("VenueConnect UI error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            background: "#070706",
            color: "#F4F0E7",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>😕</div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            Something went wrong loading this page.
          </h1>
          <p style={{ color: "#C8A96B", maxWidth: 420, margin: 0 }}>
            This is usually temporary. Head back to the homepage and try again.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: "0.5rem",
              padding: "0.65rem 1.5rem",
              borderRadius: "999px",
              border: "none",
              background: "#7DD3FC",
              color: "#05070B",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Go to Homepage
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
