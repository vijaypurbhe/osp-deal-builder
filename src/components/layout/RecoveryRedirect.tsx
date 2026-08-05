import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Password-recovery links can land on any route (the auth provider may drop the
 * user on "/" instead of "/reset-password"). This watches for recovery tokens in
 * the URL hash or query string and forwards them to the reset screen.
 */
export default function RecoveryRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/reset-password") return;
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    const isRecovery =
      hashParams.get("type") === "recovery" ||
      queryParams.get("type") === "recovery" ||
      (hashParams.has("access_token") && hashParams.get("type") === "recovery");

    if (isRecovery) {
      navigate(`/reset-password${window.location.search}${window.location.hash}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}
