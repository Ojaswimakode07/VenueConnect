import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios.js";
import RefundPolicy from "../components/RefundPolicy.jsx";

const STATUS_STYLES = {
  pending:
    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",

  confirmed:
    "bg-green-500/10 text-green-400 border border-green-500/20",

  cancelled:
    "bg-red-500/10 text-red-400 border border-red-500/20",

  completed:
    "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [venueMap, setVenueMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [refundPreview, setRefundPreview] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // ==========================================
  // CUSTOM SCROLLBAR
  // ==========================================

  const [scrollProgress, setScrollProgress] =
    useState(0);

  useEffect(() => {
    function updateScrollbar() {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop;

      const scrollHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

      if (scrollHeight <= 0) {
        setScrollProgress(0);
        return;
      }

      const progress =
        scrollTop / scrollHeight;

      setScrollProgress(
        Math.min(
          1,
          Math.max(0, progress)
        )
      );
    }

    updateScrollbar();

    window.addEventListener(
      "scroll",
      updateScrollbar,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      updateScrollbar
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateScrollbar
      );

      window.removeEventListener(
        "resize",
        updateScrollbar
      );
    };
  }, []);

  async function load() {
    setLoading(true);

    try {
      const [res, notificationRes] = await Promise.all([
        api.get("/bookings/mine"),
        api.get("/bookings/notifications").catch(() => ({ data: [] })),
      ]);

      setBookings(res.data);
      setNotifications(notificationRes.data);

      const ids = [
        ...new Set(
          res.data.map(
            (b) => b.venue_id
          )
        ),
      ];

      const details = {};

      await Promise.all(
        ids.map(async (id) => {
          const v =
            await api.get(
              `/venues/${id}`
            );

          details[id] = v.data;
        })
      );

      setVenueMap(details);
    } catch (error) {
      console.error(
        "Failed to load bookings:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const [bookingRes, notificationRes] = await Promise.all([
          api.get("/bookings/mine"),
          api.get("/bookings/notifications").catch(() => ({ data: [] })),
        ]);
        setBookings(bookingRes.data);
        setNotifications(notificationRes.data);
      } catch (error) {
        console.warn("Unable to refresh booking updates", error);
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  async function markNotificationRead(notification) {
    if (notification.is_read) return;
    try {
      const result = await api.patch(`/bookings/notifications/${notification.id}`, { is_read: true });
      setNotifications((items) => items.map((item) => item.id === notification.id ? result.data : item));
    } catch (error) {
      console.warn("Unable to mark notification as read", error);
    }
  }

  async function openCancelDialog(
    booking
  ) {
    setCancelTarget(booking);
    setRefundPreview(null);

    try {
      const res =
        await api.get(
          `/bookings/${booking.id}/refund-preview`
        );

      setRefundPreview(res.data);
    } catch (error) {
      console.error(
        "Failed to calculate refund:",
        error
      );
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;

    setCancelling(true);

    try {
      await api.post(
        `/bookings/${cancelTarget.id}/cancel`
      );

      setCancelTarget(null);
      setRefundPreview(null);

      await load();
    } catch (error) {
      console.error(
        "Failed to cancel booking:",
        error
      );
    } finally {
      setCancelling(false);
    }
  }

  // ==========================================
  // CUSTOM SCROLLBAR
  // SHORT BLUE THUMB
  // ==========================================

  const thumbHeight = 16;
  const thumbTravel =
    100 - thumbHeight;

  const thumbTop =
    scrollProgress * thumbTravel;

  return (
    <>
      {/* =========================================
          HIDE NATIVE SCROLLBAR
      ========================================== */}

      <style>
        {`
          html {
            scrollbar-width: none;
          }

          body {
            scrollbar-width: none;
          }

          html::-webkit-scrollbar,
          body::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
        `}
      </style>

      {/* =========================================
          CUSTOM BLUE SCROLLBAR
      ========================================== */}

      <div
        className="
          fixed
          right-0
          top-0
          z-[9999]
          w-[6px]
          h-screen
          pointer-events-none
        "
      >
        <div
          className="
            absolute
            right-0
            w-[6px]
            rounded-full
            bg-blue-500
            shadow-[0_0_8px_rgba(47,128,255,0.45)]
          "
          style={{
            height: "16vh",
            top: `${thumbTop}vh`,
          }}
        />
      </div>

      {/* =========================================
          MAIN PAGE
      ========================================== */}

      <div
        className="min-h-screen w-full text-white"
        style={{
          backgroundColor: "#000000",
        }}
      >

        {/* =========================================
            PAGE CONTENT
        ========================================== */}

        <div className="max-w-5xl mx-auto px-5 py-10">

          {/* =========================================
              PAGE HEADER
          ========================================== */}

          <div className="mb-8">

            <h1 className="font-serif text-3xl font-bold text-white mb-1">
              My Bookings
            </h1>

            <p className="text-zinc-400">
              Track, review and manage your venue
              bookings.
            </p>

          </div>

          {notifications.length > 0 && (
            <section className="mb-6 rounded-2xl border border-sky-400/20 bg-[#111111] p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-serif text-lg font-bold text-white">Booking updates</h2>
                <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-300">{notifications.filter((item) => !item.is_read).length} unread</span>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <button key={notification.id} type="button" onClick={() => markNotificationRead(notification)} className={`w-full rounded-lg border p-3 text-left ${notification.is_read ? "border-white/5 bg-white/[0.02]" : "border-sky-300/20 bg-sky-300/[0.06]"}`}>
                    <span className="block text-sm font-semibold text-white">{notification.title}</span>
                    <span className="mt-1 block whitespace-pre-line text-xs text-zinc-400">{notification.message}</span>
                    <span className="mt-1 block text-[10px] text-zinc-500">{new Date(notification.created_at).toLocaleString("en-IN")}{!notification.is_read ? " · Click to mark as read" : ""}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* =========================================
              LOADING
          ========================================== */}

          {loading ? (

            <p className="text-zinc-500 text-center py-16">
              Loading…
            </p>

          ) : bookings.length === 0 ? (

            /* =========================================
               EMPTY BOOKINGS
            ========================================== */

            <div
              className="
                bg-[#111111]
                border
                border-zinc-800
                rounded-2xl
                p-10
                text-center
                shadow-xl
              "
            >

              <p className="text-zinc-400 mb-5">
                You haven't booked any venues yet.
              </p>

              <Link
                to="/venues"
                className="
                  inline-flex
                  items-center
                  justify-center
                  px-5
                  py-2.5
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  font-semibold
                  transition-colors
                  shadow-lg
                  shadow-blue-600/20
                "
              >
                Browse Venues
              </Link>

            </div>

          ) : (

            /* =========================================
               BOOKINGS LIST
            ========================================== */

            <div className="space-y-4">

              {bookings.map((b) => {

                const venue =
                  venueMap[b.venue_id];

                return (

                  <motion.div
                    key={b.id}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="
                      bg-[#111111]
                      border
                      border-zinc-800
                      rounded-2xl
                      p-5
                      flex
                      flex-col
                      sm:flex-row
                      sm:items-center
                      gap-4
                      shadow-lg
                    "
                  >

                    {/* VENUE IMAGE */}

                    {venue && (
                      <img
                        src={venue.image_url}
                        alt={venue.name}
                        className="
                          w-full
                          sm:w-32
                          h-28
                          object-cover
                          rounded-xl
                        "
                      />
                    )}

                    {/* BOOKING INFORMATION */}

                    <div className="flex-1">

                      <div className="flex items-center gap-2 mb-1 flex-wrap">

                        <h3 className="font-serif font-bold text-white">
                          {venue?.name ||
                            `Venue #${b.venue_id}`}
                        </h3>

                        <span
                          className={`
                            text-xs
                            font-semibold
                            px-2.5
                            py-0.5
                            rounded-full
                            capitalize
                            ${
                              STATUS_STYLES[
                                b.status
                              ]
                            }
                          `}
                        >
                          {b.status}
                        </span>

                      </div>

                      <p className="text-sm text-zinc-400">
                        {b.event_date} ·{" "}
                        {b.guest_count} guests · Ref:{" "}
                        {b.payment_ref || "—"}
                      </p>

                      {b.catering_service_id && (
                        <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.025] p-3 text-xs">
                          <p className="font-semibold capitalize text-white">Catering: {b.catering_service_name || "Selected caterer"} · {String(b.catering_request_status || "pending").replace("_", " ")}</p>
                          {b.catering_request_note && <p className="mt-1 whitespace-pre-line text-zinc-400">{b.catering_request_note}</p>}
                        </div>
                      )}

                      <p className="text-sm font-semibold text-blue-400 mt-1">
                        Total ₹
                        {b.total_amount.toLocaleString(
                          "en-IN"
                        )}{" "}
                        · Paid (30% advance) ₹
                        {b.advance_paid.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      {/* REFUND */}

                      {b.status === "cancelled" && (
                        <p className="text-xs text-red-400 mt-1 font-semibold">
                          Refunded: ₹
                          {b.refund_amount.toLocaleString(
                            "en-IN"
                          )}{" "}
                          (
                          {b.refund_percent}% of
                          advance)
                        </p>
                      )}

                      {/* PLAYLIST */}

                      {b.playlist?.length > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">
                          🎵 {b.playlist.length} songs
                          submitted
                        </p>
                      )}

                    </div>

                    {/* CANCEL */}

                    {b.status !== "cancelled" &&
                      b.status !== "completed" && (

                        <button
                          onClick={() =>
                            openCancelDialog(b)
                          }
                          className="
                            border
                            border-zinc-700
                            text-zinc-300
                            hover:text-white
                            hover:border-blue-500
                            hover:bg-blue-500/10
                            rounded-lg
                            px-4
                            py-1.5
                            text-xs
                            font-semibold
                            transition-colors
                            self-start
                            sm:self-center
                          "
                        >
                          Cancel
                        </button>

                      )}

                  </motion.div>
                );
              })}

            </div>
          )}

          {/* =========================================
              CANCEL MODAL
          ========================================== */}

          <AnimatePresence>

            {cancelTarget && (

              <div
                className="
                  fixed
                  inset-0
                  bg-black/85
                  backdrop-blur-sm
                  z-[100]
                  flex
                  items-center
                  justify-center
                  p-4
                "
              >

                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="
                    bg-[#111111]
                    border
                    border-zinc-800
                    rounded-2xl
                    w-full
                    max-w-md
                    p-6
                    shadow-2xl
                  "
                >

                  {/* TITLE */}

                  <h3 className="font-serif text-xl font-bold text-white mb-1">
                    Cancel Booking
                  </h3>

                  <p className="text-sm text-zinc-400 mb-4">
                    Event date:{" "}
                    <strong className="text-white">
                      {cancelTarget.event_date}
                    </strong>
                  </p>

                  {/* REFUND PREVIEW */}

                  {refundPreview ? (

                    <div
                      className="
                        rounded-xl
                        bg-blue-500/5
                        border
                        border-blue-500/20
                        p-4
                        mb-4
                      "
                    >

                      <p className="text-sm text-zinc-400 mb-1">
                        {refundPreview.label}
                      </p>

                      <p className="text-2xl font-bold text-white">

                        ₹
                        {refundPreview.refund_amount.toLocaleString(
                          "en-IN"
                        )}

                        <span className="text-sm font-normal text-zinc-400">
                          {" "}
                          refund (
                          {
                            refundPreview.refund_percent
                          }
                          %)
                        </span>

                      </p>

                      <p className="text-xs text-zinc-500 mt-1">

                        {refundPreview.days_before_event >=
                        0
                          ? `${refundPreview.days_before_event} day(s) before the event.`
                          : "Event date has already passed."}

                      </p>

                    </div>

                  ) : (

                    <p className="text-sm text-zinc-500 mb-4">
                      Calculating refund…
                    </p>

                  )}

                  {/* REFUND POLICY */}

                  <RefundPolicy compact />

                  {/* BUTTONS */}

                  <div className="flex gap-3 mt-5">

                    <button
                      onClick={() =>
                        setCancelTarget(null)
                      }
                      className="
                        flex-1
                        py-2
                        text-sm
                        border
                        border-zinc-700
                        text-zinc-300
                        hover:text-white
                        hover:bg-white/5
                        rounded-lg
                        transition-colors
                      "
                    >
                      Keep Booking
                    </button>

                    <button
                      onClick={confirmCancel}
                      disabled={
                        cancelling ||
                        !refundPreview
                      }
                      className="
                        flex-1
                        py-2
                        text-sm
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        rounded-lg
                        font-semibold
                        transition-colors
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                      "
                    >
                      {cancelling
                        ? "Cancelling…"
                        : "Confirm Cancellation"}
                    </button>

                  </div>

                </motion.div>

              </div>

            )}

          </AnimatePresence>

        </div>

      </div>
    </>
  );
}
