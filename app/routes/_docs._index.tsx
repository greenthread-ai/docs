import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function DocsIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/getting-started", { replace: true });
  }, [navigate]);

  return null;
}
