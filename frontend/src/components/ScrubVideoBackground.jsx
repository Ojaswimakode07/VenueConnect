import { useEffect, useRef } from "react";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4";

export default function ScrubVideoBackground() {
  const videoRef = useRef(null);
  const targetTime = useRef(0);
  const seeking = useRef(false);
  const previousX = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const seek = (time) => { seeking.current = true; video.currentTime = time; };
    const handleSeeked = () => {
      seeking.current = false;
      if (Math.abs(video.currentTime - targetTime.current) > 0.01) seek(targetTime.current);
    };
    const handleMove = (event) => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      if (previousX.current === null) { previousX.current = event.clientX; return; }
      const offset = ((event.clientX - previousX.current) / window.innerWidth) * 0.8 * video.duration;
      previousX.current = event.clientX;
      targetTime.current = Math.min(Math.max(targetTime.current + offset, 0), video.duration);
      if (!seeking.current) seek(targetTime.current);
    };
    video.addEventListener("seeked", handleSeeked);
    window.addEventListener("mousemove", handleMove);
    return () => { video.removeEventListener("seeked", handleSeeked); window.removeEventListener("mousemove", handleMove); };
  }, []);

  return <video ref={videoRef} className="auth-scrub-video" src={VIDEO_URL} muted playsInline preload="auto" aria-hidden="true" />;
}
