import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./ready-to-celebrate.css";

const EASE = [0.16, 1, 0.3, 1];

export default function ReadyToCelebrate() {
  return (
    <section className="vc-ready" aria-label="Ready to celebrate">
      <div className="vc-ready__grain" />
      <motion.p
        className="vc-ready__kicker"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        VENUECONNECT / THE LAST STEP
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 46, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.95, ease: EASE, delay: 0.08 }}
      >
        Ready to<br /><i>celebrate?</i>
      </motion.h2>

      <motion.div
        className="vc-ready__actions"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.28 }}
      >
        <Link to="/venues" className="vc-ready__cta">
          EXPLORE VENUES <span>↗</span>
        </Link>
        <a href="#find" className="vc-ready__link">
          Search by city &amp; occasion
        </a>
      </motion.div>

      <motion.div
        className="vc-ready__meta"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <span>9K+ VENUES</span>
        <span>950+ CITIES</span>
        <span>ONE PLACE TO PLAN IT ALL</span>
      </motion.div>
    </section>
  );
}
