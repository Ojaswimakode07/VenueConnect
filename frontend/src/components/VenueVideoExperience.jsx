import { useEffect, useRef, useState } from "react";

const VIDEOS = {
  intro: { label: "Venue introduction", src: "/venue-experience/intro.mp4" },
  wedding: { label: "Wedding", src: "/venue-experience/wedding.mp4" },
  reception: { label: "Reception", src: "/venue-experience/reception.mp4" },
  "pool-party": { label: "Pool Party", src: "/venue-experience/pool-party.mp4" },
  conference: { label: "Conference", src: "/venue-experience/conference.mp4" },
};

const EVENT_OPTIONS = ["wedding", "reception", "pool-party", "conference"];

const clamp = (value) => Math.min(1, Math.max(0, value));

export default function VenueVideoExperience({ onClose }) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const frameRef = useRef(0);
  const progressRef = useRef(0);
  const [activeVideo, setActiveVideo] = useState("intro");
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);

  const isIntroduction = activeVideo === "intro";
  const atEnd = duration > 0 && progress >= 0.985;
  const availableOptions = isIntroduction
    ? EVENT_OPTIONS
    : EVENT_OPTIONS.filter((option) => option !== activeVideo);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const updateFromScroll = () => {
      frameRef.current = 0;
      const section = sectionRef.current;
      const active = videoRef.current;
      if (!section || !active || !Number.isFinite(active.duration)) return;

      const scrollRange = Math.max(section.offsetHeight - window.innerHeight, 1);
      const nextProgress = clamp(-section.getBoundingClientRect().top / scrollRange);
      const nextTime = nextProgress * active.duration;

      // The video is deliberately never played. Scroll position is the only
      // timeline source, so stopping scroll freezes the exact current frame.
      active.pause();
      if (Math.abs(active.currentTime - nextTime) > 0.012) {
        active.currentTime = nextTime;
      }
      progressRef.current = nextProgress;
      setProgress(nextProgress);
    };

    const onScroll = () => {
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(updateFromScroll);
    };

    const onMetadata = () => {
      setDuration(video.duration || 0);
      video.pause();
      video.currentTime = 0;
      progressRef.current = 0;
      setProgress(0);
      onScroll();
    };

    video.addEventListener("loadedmetadata", onMetadata);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frameRef.current);
      video.pause();
    };
  }, [activeVideo]);

  function chooseVideo(nextVideo) {
    setVideoError(false);
    setDuration(0);
    setProgress(0);
    progressRef.current = 0;
    setActiveVideo(nextVideo);

    // Each selection starts a fresh scroll timeline at the first frame.
    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }

  return (
    <section ref={sectionRef} className="relative h-[280vh] scroll-mt-0 bg-black">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-black px-4 py-6">
        <div className="relative h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-[#080b10] shadow-2xl">
          <video
            ref={videoRef}
            key={activeVideo}
            src={VIDEOS[activeVideo].src}
            className="h-full w-full object-contain"
            playsInline
            muted
            preload="metadata"
            onError={() => setVideoError(true)}
            aria-label={`${VIDEOS[activeVideo].label} scroll-controlled venue video`}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent p-5 text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">Venue experience</p>
              <h2 className="mt-1 font-serif text-xl">{VIDEOS[activeVideo].label}</h2>
              <p className="mt-1 text-xs text-white/70">Scroll to move through the video. Stop scrolling to hold the frame.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white hover:text-black"
            >
              Close
            </button>
          </div>

          <div className="pointer-events-none absolute inset-x-5 bottom-5 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-cyan-400 transition-none" style={{ width: `${progress * 100}%` }} />
          </div>

          {videoError && (
            <p className="absolute inset-0 grid place-items-center bg-black/80 p-8 text-center text-sm text-white">
              This video could not be loaded. Please refresh and try again.
            </p>
          )}

          {atEnd && !videoError && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 backdrop-blur-sm">
              <div className="w-full max-w-xl text-center text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Choose an experience</p>
                <h3 className="mt-2 font-serif text-3xl">What would you like to explore?</h3>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {availableOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => chooseVideo(option)}
                      className="rounded-xl border border-white/25 bg-white/10 px-4 py-4 text-sm font-bold text-white transition hover:border-cyan-300 hover:bg-cyan-400/20"
                    >
                      {VIDEOS[option].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
