import AuthExperience from "./AuthExperience.jsx";

// Deep link straight to the reset-password screen, still inside
// the same container so "Back" behaves consistently.
export default function ForgotPassword() {
  return <AuthExperience initialMode="login" initialScreen="forgot" />;
}
