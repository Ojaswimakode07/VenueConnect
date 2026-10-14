import AuthExperience from "./AuthExperience.jsx";

// Same shared container as Login, opened in "signup" mode.
export default function Register() {
  return <AuthExperience initialMode="signup" initialScreen="profile" />;
}
