import React, { useEffect, useState } from "react";

const STORAGE_KEY = "vc_consent_preferences";

function VenueConnectMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#1269ba" />
      <path d="M15 18.5c0-2.2 1.7-4 3.9-4 1.6 0 3 .9 3.6 2.3.7-1.6 2.3-2.8 4.2-2.8 2.6 0 4.7 2.1 4.7 4.7 0 5.6-7.4 11.2-7.4 11.2S15 24.2 15 18.5Z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="m20.3 23.7 2.5 2.6 5.4-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="1.5" fill="#fff" /><circle cx="35" cy="12" r="1.5" fill="#fff" /><circle cx="12" cy="32" r="1.5" fill="#fff" />
    </svg>
  );
}

export default function ConsentPreferences() {
  const [open, setOpen] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        setFunctional(Boolean(saved.functional));
        setAnalytics(Boolean(saved.analytics));
      }
    } catch { /* Keep default privacy-first choices. */ }
  }, []);

  const save = (choices) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...choices, savedAt: new Date().toISOString() }));
    setFunctional(choices.functional);
    setAnalytics(choices.analytics);
    setOpen(false);
  };

  return (
    <>
      <button className="vc-consent-launcher" onClick={() => setOpen(true)} aria-label="Open privacy preferences">
        <VenueConnectMark />
        <span>Consent Preferences</span>
      </button>
      {open && (
        <div className="vc-consent-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="vc-consent-modal" role="dialog" aria-modal="true" aria-labelledby="consent-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><h2 id="consent-title">Privacy preferences</h2><button onClick={() => setOpen(false)} aria-label="Close privacy preferences">×</button></header>
            <div className="vc-consent-content">
              <p>VenueConnect uses essential storage to keep the website secure and remember choices such as your sign-in session. Optional settings help us improve venue discovery and provide a smoother experience.</p>
              <ConsentRow title="Essential" description="Required for secure sign-in, booking requests, and the basic features of VenueConnect." locked />
              <ConsentRow title="Functional" description="Allows us to remember preferences such as saved filters and recently viewed venues." checked={functional} onChange={setFunctional} />
              <ConsentRow title="Analytics" description="Helps us understand which features are useful so we can improve the venue-search experience." checked={analytics} onChange={setAnalytics} />
            </div>
            <footer>
              <button className="vc-consent-button" onClick={() => save({ functional: false, analytics: false })}>Reject optional</button>
              <button className="vc-consent-button" onClick={() => save({ functional, analytics })}>Save preferences</button>
              <button className="vc-consent-button vc-consent-button--accept" onClick={() => save({ functional: true, analytics: true })}>Accept all</button>
            </footer>
            <div className="vc-consent-brand">VENUECONNECT · PRIVACY SETTINGS</div>
          </section>
        </div>
      )}
    </>
  );
}

function ConsentRow({ title, description, locked, checked, onChange }) {
  return <div className="vc-consent-row"><div><h3>{title}</h3><p>{description}</p></div>{locked ? <span className="vc-consent-required">Always active</span> : <button className={`vc-consent-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}><span /></button>}</div>;
}
