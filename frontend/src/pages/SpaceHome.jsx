import React,{useEffect,useRef,useState}from"react";
import{Link,useNavigate}from"react-router-dom";
import{AnimatePresence,motion,useAnimationFrame,useMotionValue,useScroll,useSpring,useTransform}from"framer-motion";
import{EVENT_TYPES,categoriesForEvent}from"../data/eventTypes.js";
import VenuePhotoScroll from "../components/VenuePhotoScroll.jsx";
import"./space-home.css";
import"./spaceedu-overrides.css";
import"./visual-cleanup.css";
const people = [

  {
    name: "Rutuja Avhad",
    role: "Frontend Developer & UI/UX Specialist",
    quote: "I focus on creating intuitive, responsive and visually engaging experiences that make VenueConnect simple and enjoyable to use.",
    image: "/makers/rutuja-avhad.png"
  },

  {
    name: "Ojaswi Makode",
    role: "Frontend & Backend Developer",
    quote: "I work across the frontend and backend to connect ideas, functionality and user experience into one complete platform.",
    image: "/makers/ojaswi-makode.jpeg"
  },

  {
    name: "Anjali Sune",
    role: "Backend Developer",
    quote: "I build reliable backend services and APIs that keep VenueConnect secure, efficient and connected.",
    image: "/makers/anjali-sune-framed.jpeg"
  },

  {
    name: "Dhiraj Badre",
    role: "Database Developer",
    quote: "I design and manage the database structure that keeps VenueConnect data organized, reliable and accessible.",
    image: "/makers/dhiraj-badre.jpeg"
  }

];
const steps=[["01","Find your venue","Search banquet halls and event venues by city, guest count, budget and occasion."],["02","Tour in 3D","Visualise the hall, seating layout, stage and décor before you schedule a visit."],["03","Book with confidence","Compare details, secure your date and manage your celebration from one place."]];
const Reveal=({children,delay=0,className=""})=><motion.div className={className} initial={{opacity:0,y:44}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.18}} transition={{duration:.8,delay,ease:[.16,1,.3,1]}}>{children}</motion.div>;
function PinnedVenueStory(){const ref=useRef(null),{scrollYProgress}=useScroll({target:ref,offset:["start start","end end"]}),p=useSpring(scrollYProgress,{stiffness:90,damping:26,mass:.22}),s=useTransform(p,[0,1],[1.3,1.36]),y=useTransform(p,[0,1],["0%","-2%"]);return <section className="vc-pinned" ref={ref}><div className="vc-pinned__sticky"><motion.video className="vc-pinned__video" style={{scale:s,y}} autoPlay muted loop playsInline preload="metadata"><source src="/venue-story.mp4" type="video/mp4"/></motion.video><div className="vc-pinned__shade"/><div className="vc-pinned__copy"><h2 className="vc-pinned__phrase">Find the venue<br/><i>your celebration deserves.</i></h2><span className="vc-pinned__baseline"/></div></div></section>}
function ReadingWord({word,index,progress}){const start=index*.019,end=Math.min(start+.09,.99),opacity=useTransform(progress,[Math.max(0,start-.045),start,end],[.14,1,1]),y=useTransform(progress,[Math.max(0,start-.045),start],[18,0]);return <motion.span style={{opacity,y}}>{word}{" "}</motion.span>}
function ReadingStatement(){const ref=useRef(null),{scrollYProgress}=useScroll({target:ref,offset:["start 78%","end 42%"]}),words="VenueConnect gives every celebration a beautiful place to begin. Explore inspiring venues, compare every detail, and choose with confidence. It turns the search for the right setting into a simple, joyful part of the story you are about to create.".split(" ");return <section className="vc-reading" ref={ref}><p className="vc-reading__label">A NOTE FROM THE VENUECONNECT COMMUNITY</p><h2>{words.map((word,index)=><ReadingWord key={`${word}-${index}`} word={word} index={index} progress={scrollYProgress}/>)}</h2><div className="vc-reading__author"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85" alt="Riya Malhotra"/><div><strong>Riya Malhotra</strong><span>Wedding planner, Mumbai</span></div></div></section>}
function ImpactNumber({end,label,finalValue}){const ref=useRef(null),[value,setValue]=useState(0);useEffect(()=>{const node=ref.current;if(!node)return;let frame;const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)return;const startTime=performance.now(),duration=1450;const tick=now=>{const progress=Math.min((now-startTime)/duration,1),eased=1-Math.pow(1-progress,4);setValue(Math.round(end*eased));if(progress<1)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);observer.disconnect()},{threshold:.5});observer.observe(node);return()=>{observer.disconnect();cancelAnimationFrame(frame)}},[end]);return <div className="vc-impact__stat" ref={ref}><strong>{value>=end?finalValue:value.toLocaleString("en-IN")}</strong><span>{label}</span></div>}
function VenueImpact(){return <section className="vc-impact"><p>VENUECONNECT, AT A GLANCE</p><h2>Every celebration begins with a place that feels right. We make finding it simpler, more visual and more certain.</h2><div className="vc-impact__stats"><ImpactNumber end={9000} finalValue="9K+" label="VENUES TO EXPLORE"/><ImpactNumber end={950} finalValue="950+" label="CITIES REPRESENTED"/></div></section>}
export default function SpaceHome(){
 const navigate=useNavigate(),[city,setCity]=useState(""),[eventType,setEventType]=useState(""),[active,setActive]=useState(0),teamRailRef=useRef(null),teamX=useRef(null),teamOffset=useMotionValue(0),teamPaused=useRef(false),teamLoopWidth=useRef(0),person=people[active];
 useEffect(()=>{const timer=setInterval(()=>setActive(x=>(x+1)%people.length),5600);return()=>clearInterval(timer)},[]);
 const wrapTeamOffset=value=>{const unit=teamLoopWidth.current;if(!unit)return value;const span=unit*2;return -unit*3+((((value+unit*3)%span)+span)%span)};
 useEffect(()=>{const positionTrack=()=>{if(!teamX.current)return;const unit=teamX.current.scrollWidth/5;if(!unit)return;teamLoopWidth.current=unit;teamOffset.set(-unit*2)};positionTrack();window.addEventListener("resize",positionTrack);return()=>window.removeEventListener("resize",positionTrack)},[teamOffset]);
 useAnimationFrame((_,delta)=>{if(teamPaused.current||!teamLoopWidth.current)return;teamOffset.set(wrapTeamOffset(teamOffset.get()-delta*.028))});
 const search=e=>{e.preventDefault();const params=new URLSearchParams();if(city)params.set("city",city);if(eventType){params.set("event_type",eventType);params.set("categories",categoriesForEvent(eventType).join(","))}navigate("/venues?"+params+"#results")};
 return <div className="vc-space">
  <PinnedVenueStory/>
  <ReadingStatement/>
  <VenuePhotoScroll/>
  <section className="vc-hero"><div className="vc-hero__grain"/><div className="vc-meta"><span>VENUECONNECT<sup>®</sup></span><span>INDIA / 2026</span></div><motion.p className="vc-eyebrow" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.25}}>A NEW WAY TO FIND THE ROOM</motion.p><motion.h1 initial={{opacity:0,y:70}} animate={{opacity:1,y:0}} transition={{duration:1.1,ease:[.16,1,.3,1]}}>Every gathering<br/><i>starts somewhere.</i></motion.h1><motion.div className="vc-circle" initial={{scale:.55,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:1.15,delay:.15}}><a href="#find">FIND A<br/>VENUE <b>↓</b></a></motion.div><div className="vc-meta vc-meta--bottom"><span>SCROLL TO DISCOVER</span><span>01 — 05</span></div></section>
  <section className="vc-manifesto" id="manifesto"><Reveal><p className="vc-label">VENUES WITH A POINT OF VIEW</p><h2>Not just a place<br/>to meet. A place<br/><i>to remember.</i></h2></Reveal><Reveal className="vc-aside" delay={.12}><p>From a first look at a sunlit terrace to the last song beneath a ballroom ceiling, VenueConnect makes finding your setting feel as exciting as the occasion itself.</p><Link to="/venues" onClick={(e)=>{e.preventDefault();navigate("/venues",{state:{scrollToSearch:true}})}}>MEET VENUECONNECT <b>↗</b></Link></Reveal></section>
  <section className="vc-process"><Reveal><p className="vc-label">THE VENUECONNECT WAY</p><h2>A beautiful plan,<br/><i>without the hunt.</i></h2></Reveal><div className="vc-steps">{steps.map((s,i)=><Reveal key={s[0]} delay={i*.09}><article><span>{s[0]}</span><h3>{s[1]}</h3><b>{s[2]}</b></article></Reveal>)}</div></section>
  <VenueImpact/>
  <section className="vc-proof"><div><span>ONE DATE</span><i>✳</i><span>ONE PLACE</span><i>✳</i><span>ALL YOUR PEOPLE</span><i>✳</i><span>ONE DATE</span><i>✳</i><span>ONE PLACE</span><i>✳</i><span>ALL YOUR PEOPLE</span><i>✳</i></div></section>
  <section className="vc-team"><Reveal><p className="vc-label">THE PEOPLE BEHIND THE FEELING</p><h2 className="vc-team__title">Our Team</h2></Reveal><div className="vc-team-drag" ref={teamRailRef}><motion.div className="vc-team-rail" ref={teamX} style={{x:teamOffset}} drag="x" dragElastic={0} dragMomentum={false} onDragStart={()=>{teamPaused.current=true}} onDrag={()=>teamOffset.set(wrapTeamOffset(teamOffset.get()))} onDragEnd={()=>{teamOffset.set(wrapTeamOffset(teamOffset.get()));teamPaused.current=false}}><>{Array.from({length:5},(_,repeat)=>people.map((member,index)=><article key={`${member.name}-${repeat}-${index}`} className="vc-team-card"><motion.div className="vc-team-card__image" animate={{filter:"grayscale(0)"}} style={{backgroundImage:`url(${member.image})`}}/><strong>{member.name}</strong><small>{member.role}</small><em>{member.quote}</em></article>))}</></motion.div></div></section>
  <section className="vc-find" id="find"><Reveal><p className="vc-label">PLAN YOUR EVENT, VISUALLY</p><h2>Our venue.<br/>Our layout.<br/><i>Your celebration.</i></h2></Reveal><Reveal className="vc-form" delay={.1}><form onSubmit={search}><label>CITY OR DESTINATION<input value={city} onChange={e=>setCity(e.target.value)} placeholder="Mumbai, Jaipur, Amravati..."/></label><label>THE OCCASION<select value={eventType} onChange={e=>setEventType(e.target.value)}><option value="">Anything worth celebrating</option>{EVENT_TYPES.map(x=><option key={x.value} value={x.value}>{x.value}</option>)}</select></label><button>EXPLORE VENUES IN 3D <span>↗</span></button></form></Reveal></section>
 </div>
}
