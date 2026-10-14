import { useEffect, useRef } from "react";

const VIDEO_URL = "/auth-robot.mp4";

/*
  Higher = less mouse movement needed.

  2.2 means you don't have to move
  all the way to the edge of the screen.
*/
const SENSITIVITY = 2.2;

/*
  ScrubVideoBackground now always renders its own darkening layer on
  top of the video. Whatever text sits over this component — a
  headline, a form, a step counter — gets a guaranteed contrast
  floor instead of depending on where the video happens to be
  bright or dark at any given moment.

  Props (all optional, existing call sites keep working unchanged):
  - overlayStrength: 0–1, how dark the layer gets at its darkest
    point. Default 0.55 is enough to keep white text readable over
    a bright frame (fireworks, city lights, daylight) without
    crushing the video to near-black.
  - overlayDirection: CSS gradient angle, so the dark side can be
    placed under wherever the text actually sits rather than always
    favoring one corner. Default darkens the bottom, since that's
    the most common place captions/forms sit.
*/
export default function ScrubVideoBackground({
  overlayStrength = 0.55,
  overlayDirection = "to top",
}) {
  const videoRef = useRef(null);

  const targetTime = useRef(0);
  const seeking = useRef(false);
  const prevX = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    // -----------------------------
    // SEEK
    // -----------------------------
    const seekTo = (time) => {
      if (!video.duration || Number.isNaN(video.duration)) {
        return;
      }

      seeking.current = true;

      video.currentTime = Math.max(
        0,
        Math.min(time, video.duration)
      );
    };

    // -----------------------------
    // SEEK COMPLETE
    // -----------------------------
    const handleSeeked = () => {
      seeking.current = false;

      if (
        Math.abs(
          video.currentTime - targetTime.current
        ) > 0.01
      ) {
        seekTo(targetTime.current);
      }
    };

    // -----------------------------
    // MOUSE SCRUB
    // -----------------------------
    const handleMouseMove = (event) => {
      if (
        !video.duration ||
        Number.isNaN(video.duration)
      ) {
        return;
      }

      // First mouse position
      if (prevX.current === null) {
        prevX.current = event.clientX;
        return;
      }

      const delta =
        event.clientX - prevX.current;

      prevX.current = event.clientX;

      /*
        VIDEO IS FLIPPED HORIZONTALLY

        Mouse → RIGHT
          = video goes BACKWARD

        Mouse ← LEFT
          = video goes FORWARD

        Therefore we use -delta.
      */
      const offset =
        (-delta / window.innerWidth) *
        SENSITIVITY *
        video.duration;

      targetTime.current += offset;

      // Never go outside the video
      targetTime.current = Math.max(
        0,
        Math.min(
          targetTime.current,
          video.duration
        )
      );

      if (!seeking.current) {
        seekTo(targetTime.current);
      }
    };

    // Reset mouse reference when leaving page
    const handleMouseLeave = () => {
      prevX.current = null;
    };

    video.addEventListener(
      "seeked",
      handleSeeked
    );

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseleave",
      handleMouseLeave
    );

    return () => {
      video.removeEventListener(
        "seeked",
        handleSeeked
      );

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );
    };
  }, []);

  return (
    <div
      className="scrub-video-wrap"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // Shows instantly, before the video has a frame to paint,
        // so there's never a flash of white while it loads.
        background: "#0c0c0c",
      }}
    >
      <video
        ref={videoRef}
        className="scrub-video"
        src={VIDEO_URL}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Darkens the video enough that white text stays readable no
          matter which frame is showing. A directional gradient
          (heavier where text usually sits) plus a flat wash so even
          the brightest frame can't wash text out. */}
      <div
        className="scrub-video-overlay"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${overlayDirection}, rgba(0,0,0,${overlayStrength}) 0%, rgba(0,0,0,${overlayStrength * 0.35}) 55%, rgba(0,0,0,${overlayStrength * 0.6}) 100%)`,
        }}
      />
    </div>
  );
}