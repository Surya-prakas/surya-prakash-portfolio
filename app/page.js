import Image from "next/image";
import { Fragment } from "react";
import TerminalHero from "../components/TerminalHero";
import NovaStatus from "../components/NovaStatus";
import HeroRobot3D from "../components/HeroRobot3D";
import ScrollReveal from "../components/ScrollReveal";
import CountUp from "../components/CountUp";
import SectionLabel from "../components/SectionLabel";
import AchievementCard from "../components/AchievementCard";
import ProjectFlow from "../components/ProjectFlow";
import CinematicNovaIntro from "../components/CinematicNovaIntro";
import ContactForm from "../components/ContactForm";
import MagneticLink from "../components/MagneticLink";
import SpotlightTilt from "../components/SpotlightTilt";
import StarBorder from "../components/StarBorder";
import { LINKEDIN_URL, GITHUB_URL } from "./site";

const projects = [
  {
    title: "Cloud-Driven Credit Card Fraud Detection",
    subtitle: "AI-powered fraud detection using Deep Learning and XGBoost",
    description:
      "A cloud-ready fraud detection platform identifying fraudulent credit card transactions from highly imbalanced datasets. Integrated explainable AI with SHAP and deployed via FastAPI.",
    features: [
      "Deep Neural Network",
      "XGBoost hybrid model",
      "SHAP explainability",
      "SMOTE preprocessing",
      "FastAPI REST API",
      "Docker deployment",
    ],
    stack: ["Python", "TensorFlow", "Keras", "XGBoost", "FastAPI", "Docker", "Azure"],
    stats: [
      { label: "ROC-AUC", value: 0.968, decimals: 3 },
      { label: "Precision", value: 88.6, decimals: 1, suffix: "%" },
      { label: "Recall", value: 79.6, decimals: 1, suffix: "%" },
    ],
    flow: ["Dataset", "SMOTE", "Training", "Evaluation", "FastAPI", "Deployment"],
    type: "Research project",
    link: "https://github.com/Surya-prakas/credit-card-fraud-detection",
    linkLabel: "View on GitHub",
    image: "/project-assets/fraud-detection/roc.png",
    // Intrinsic pixel size of the file above. next/image needs the real ratio
    // to reserve the right box before the image loads -- a generic 800x450
    // would reserve a wider box than roc.png (567x455) actually occupies and
    // reintroduce the layout shift the component exists to prevent.
    imageSize: { width: 567, height: 455 },
  },
  {
    title: "HireSync",
    subtitle: "AI-powered resume matching & job recommendation platform",
    description:
      "An intelligent recruitment platform that matches resumes with job descriptions using NLP and machine learning, including resume strength analysis, application tracking, and job recommendations.",
    features: [
      "Resume analysis",
      "Job matching",
      "Profile strength score",
      "Application tracker",
      "Email notifications",
    ],
    stack: ["React", "Flask", "PostgreSQL", "spaCy", "Scikit-learn", "JWT"],
    result: "Runs on local server (not publicly deployed)",
    stats: null,
    type: "Academic / personal project",
    link: "https://github.com/Surya-prakas/hiresync",
    linkLabel: "View on GitHub",
    image: null,
  },
  {
    title: "Crop Yield Prediction Using Machine Learning",
    subtitle: "Multi-model regression system for agricultural yield estimation",
    description:
      "Predicted agricultural yield from historical crop, weather, and pesticide data (28,000+ records from FAO and Kaggle). Compared five regression algorithms and optimized the best performer.",
    features: [
      "KNN, Decision Tree, Linear, Ridge, Lasso compared",
      "RandomizedSearchCV tuning",
      "MAE + R² evaluation",
    ],
    stack: ["Python", "Pandas", "NumPy", "Scikit-learn", "Matplotlib"],
    stats: [
      { label: "R² (KNN)", value: 98.75, decimals: 2, suffix: "%" },
      { label: "MAE", value: 3554.86, decimals: 2 },
    ],
    flow: ["Dataset", "Cleaning", "Model Comparison", "Tuning", "Evaluation"],
    type: "B.Tech mini-project",
    link: null,
    linkLabel: null,
    image: "/project-assets/crop-yield-prediction/knn.jpg",
    imageSize: { width: 1600, height: 1200 },
  },
];

const experience = [
  {
    role: "Salesforce Developer Virtual Intern",
    org: "Salesforce",
    dates: "Oct 2023 – Dec 2023",
    location: "Virtual",
    bullets: [
      "Worked on Salesforce development concepts, including CRM customization and Apex fundamentals",
      "Completed assigned virtual internship tasks covering the Lightning Platform",
    ],
    tags: ["Salesforce", "Apex", "Lightning Platform"],
  },
];

const achievements = [
  { title: "Salesforce Certified", detail: "Completed the Salesforce Developer Virtual Internship" },
  { title: "Anomaly Hunter", detail: "Built a hybrid fraud detection system (DNN + XGBoost + SHAP), ROC-AUC 0.968" },
  { title: "Full-Stack Shipper", detail: "Built multiple AI-powered full-stack applications end to end" },
  { title: "Cloud Deployer", detail: "Deployed ML applications using FastAPI on Azure" },
];

const skills = {
  Languages: ["Python", "JavaScript", "SQL", "HTML", "CSS"],
  "ML / AI": [
    "Deep Learning",
    "TensorFlow",
    "Keras",
    "Scikit-learn",
    "XGBoost",
    "SHAP",
    "SMOTE",
    "Pandas",
    "NumPy",
  ],
  "Systems / Backend": ["FastAPI", "Flask", "REST APIs", "JWT"],
  "Web / Frontend": ["React", "Tailwind CSS", "Vite", "Framer Motion"],
  Databases: ["PostgreSQL", "NeonDB"],
  Tools: ["Git", "GitHub", "Docker", "Google Colab", "VS Code"],
};

// Marquee rows. The six source categories above are flattened and re-chunked
// into three balanced rows rather than getting one row each: "Databases" has
// two tags and two others have four, and a marquee that short has to repeat its
// own content several times per screen width, which reads as a stutter rather
// than a scroll. Chunking in category order keeps related tags adjacent, so the
// grouping still comes across without a per-row label.
const SKILL_MARQUEE_ROWS = (() => {
  const flat = Object.values(skills).flat();
  const per = Math.ceil(flat.length / 3);
  return [flat.slice(0, per), flat.slice(per, per * 2), flat.slice(per * 2)];
})();

// How many times each row's tags are repeated inside the track. The loop shifts
// by exactly one copy (translateX(-25%) of a 4-copy track), so seamlessness
// requires the other three copies to still span the viewport at the moment the
// shift wraps -- i.e. 3 copies wider than the widest screen. A row is ~850px, so
// 3 spare copies cover ~2550px. Raise this if the layout ever goes wider.
const MARQUEE_COPIES = 4;

const education = [  {
    degree: "M.Tech, Software Engineering (in progress)",
    institution: "JNTUH",
    session: "2025 – 2027",
    score: null,
  },
  {
    degree: "B.Tech, Information Technology",
    institution: "Vardhaman College of Engineering",
    session: "2021 – 2025",
    score: "8.46 CGPA",
  },
  {
    degree: "Intermediate (TSBIE)",
    institution: "TSWR Sainik School, Karimnagar",
    session: "2019 – 2021",
    score: "96.6%",
  },
  {
    degree: "SSC",
    institution: "Aditya Talent School, Hyderabad",
    session: "2018 – 2019",
    score: "95%",
  },
];

const faqs = [
  {
    q: "Who is Surya Prakash?",
    a: "Surya Prakash is an M.Tech Software Engineering student at JNTUH, India, with a B.Tech in Information Technology from Vardhaman College of Engineering. He specializes in AI, Machine Learning, and Full-Stack Development.",
  },
  {
    q: "What does Surya Prakash work on?",
    a: "Surya builds AI-powered web applications and conducts research in deep learning, with a primary focus on fraud detection systems using hybrid deep learning and XGBoost models.",
  },
  {
    q: "What technologies does Surya Prakash use?",
    a: "Python, TensorFlow, Keras, Scikit-learn, XGBoost, FastAPI, React, Docker, and cloud platforms like Azure, among others.",
  },
  {
    q: "Is Surya Prakash open to opportunities?",
    a: "Yes — currently open to Full-Time Software Engineer, AI/ML Engineer, Full-Stack Developer, and Research roles.",
  },
];

function ProjectCard({ p, featured = false }) {
  // The star border rings ONE card (see StarBorder.jsx for why). Fragment stands
  // in for it on the others so the card markup below is written once instead of
  // duplicated on both sides of a ternary.
  const Ring = featured ? StarBorder : Fragment;
  return (
    <ScrollReveal variant="up">
      {/* Tilt outermost, so on the featured card the ring travels with the card
          instead of the card tilting inside a stationary ring. */}
      <SpotlightTilt>
        <Ring>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <span className="tag">{p.type}</span>
            </div>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "var(--text-card-title)", fontWeight: 500 }}>{p.title}</h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>{p.subtitle}</p>
            </div>
            {p.image && (
              <ScrollReveal variant="scale" delay={0.15}>
                <Image
                  src={p.image}
                  alt={`${p.title} result visualization`}
                  width={p.imageSize.width}
                  height={p.imageSize.height}
                  // Below the fold in every case, so no `priority`: these should
                  // stay lazy rather than competing with the hero for bandwidth.
                  sizes="(max-width: 928px) 100vw, 832px"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    display: "block",
                  }}
                />
              </ScrollReveal>
            )}
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>{p.description}</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)" }}>
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {p.flow && <ProjectFlow stages={p.flow} />}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {p.stack.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
            {p.stats ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13 }}>
                {p.stats.map((s) => (
                  <div key={s.label}>
                    <span style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                      {s.label.toUpperCase()}{" "}
                    </span>
                    <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix || ""} />
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--accent-teal-bright)",
                }}
              >
                {p.result}
              </p>
            )}
            {p.link && (
              <MagneticLink style={{ alignSelf: "flex-start" }}>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--accent-blue-pale)",
                  }}
                >
                  {p.linkLabel} ↗
                </a>
              </MagneticLink>
            )}
          </div>
        </Ring>
      </SpotlightTilt>
    </ScrollReveal>
  );
}

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section id="hero" className="section">
        <div className="container">
          {/* Ghost word behind the robot. Same treatment as
              CinematicNovaIntro's .nova-ghost-word (var(--font-sans), weight
              800, -0.04em tracking, opacity 0.05) so the two sections read as
              one idea rather than two different "big faint word" styles.

              Wrapped in its own stacking context: the ghost and the robot both
              become positioned elements here, and relying on DOM order alone to
              keep the ghost behind is fragile once anything else in the hero
              gains a position. Explicit z-index on both layers instead. */}
          <div className="hero-stage">
            <span className="hero-ghost-word" aria-hidden="true">
              SURYA
            </span>
            <div className="hero-robot-layer">
              <HeroRobot3D />
            </div>
          </div>
          <TerminalHero />
        </div>
      </section>

      {/* CINEMATIC ORIGIN STORY */}
      <CinematicNovaIntro />

      {/* CURRENTLY / NOVA STATUS */}
      {/* Keeps the standard .section 96px top padding rather than overriding it
          to 0. The override made sense when this sat directly under the hero,
          but arriving out of the pinned cinematic it put the card flush against
          the section's top edge (measured gapToFirstContent: 0), immediately
          under the outro fade -- the cramped drop this is meant to avoid. */}
      <section className="section">
        <div className="container">
          <SectionLabel>Currently</SectionLabel>
          <NovaStatus />
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="section"
      >
        <div className="container">
          {/* Local premium label: accent monospace "ABOUT" with a 40px gradient
             underline. Inlined here so the shared <SectionLabel /> used by the
             other eight sections keeps its existing one-line + solid-underline
             treatment. */}
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent-teal-bright)",
                fontWeight: 500,
              }}
            >
              About
            </p>
            <div
              style={{
                height: 2,
                width: 40,
                marginTop: 8,
                borderRadius: 2,
                background:
                  "linear-gradient(to right, var(--accent-teal-bright), transparent)",
              }}
            />
          </div>
          <ScrollReveal>
            <p
              style={{
                fontSize: 16,
                maxWidth: "60ch",
                lineHeight: 1.7,
                letterSpacing: "-0.01em",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              I&apos;m currently pursuing an{" "}
              <span
                style={{
                  color: "var(--accent-teal-bright)",
                  fontWeight: 500,
                }}
              >
                M.Tech in Software Engineering
              </span>{" "}
              at JNTUH, building on a B.Tech in Information Technology from
              Vardhaman College of Engineering (2021–2025, 8.46 CGPA). My work
              combines deep learning, backend development, and modern frontend
              technologies to build practical software solutions. My primary
              research focus has been{" "}
              <span
                style={{
                  color: "var(--accent-teal-bright)",
                  fontWeight: 500,
                }}
              >
                fraud detection using deep learning
              </span>
              , and I also enjoy developing AI-powered full-stack applications
              and experimenting with modern LLMs and agentic AI workflows.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 24,
              }}
            >
              {["M.Tech · JNTUH", "B.Tech · IT · 8.46 CGPA", "2021–2025"].map(
                (label) => (
                  <span
                    key={label}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      padding: "6px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      color: "var(--text-muted)",
                    }}
                  >
                    {label}
                  </span>
                )
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* PROJECTS */}
      <section
        id="projects"
        className="section"
      >
        <div className="container">
          <SectionLabel>Projects</SectionLabel>
          <div style={{ display: "grid", gap: 20 }}>
            {projects.map((p, i) => (
              // Featured = whichever project is ordered first; today that is the
              // fraud-detection one. Keyed off position rather than a flag on the
              // data so reordering the array moves the highlight with it.
              <ProjectCard key={p.title} p={p} featured={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section
        id="experience"
        className="section"
      >
        <div className="container">
          <SectionLabel>Experience</SectionLabel>
          <div style={{ display: "grid", gap: 12 }}>
          {experience.map((e) => (
            <ScrollReveal key={e.role}>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: "var(--text-card-title)", fontWeight: 500 }}>{e.role}</h3>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                    {e.dates}
                  </span>
                </div>
                <p style={{ margin: "4px 0 12px", fontSize: 14, color: "var(--text-secondary)" }}>
                  {e.org} · {e.location}
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "var(--text-secondary)" }}>
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  {e.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section id="achievements" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionLabel>Achievements</SectionLabel>
          <div style={{ display: "grid", gap: 12 }}>
            {achievements.map((a, idx) => (
              <AchievementCard key={a.title} title={a.title} detail={a.detail} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section
        id="skills"
        className="section"
      >
        <div className="container">
          <SectionLabel>Skills</SectionLabel>
          {/* Marquee rows. Each row's tags are repeated MARQUEE_COPIES times and
              the track slides by exactly one copy's width, so the wrap lands on
              an identical arrangement and there is no visible jump. Alternate
              rows run in reverse for a bit of counter-motion.

              The static wrapped grid for reduced-motion is a real DOM swap
              (.skills-marquee-static) rather than just a paused animation:
              pausing would leave the row scrolled to an arbitrary offset with
              tags clipped off both edges and no way to reach them. */}
          <ScrollReveal>
            <div className="skills-marquee-static">
              {Object.entries(skills).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 14 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>
                    {category.toUpperCase()}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {items.map((i) => (
                      <span key={i} className="tag">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="skills-marquee" aria-hidden="true">
              {SKILL_MARQUEE_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="skills-marquee-row">
                  <div
                    className={`skills-marquee-track${rowIdx % 2 ? " skills-marquee-track--reverse" : ""}`}
                    // Duration scales with row length so every row moves at the
                    // same visual speed; a fixed duration would make the longest
                    // row race the shortest.
                    style={{ animationDuration: `${row.length * 3.2}s` }}
                  >
                    {Array.from({ length: MARQUEE_COPIES }).map((_, copy) =>
                      row.map((tag) => (
                        <span key={`${copy}-${tag}`} className="tag">
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* EDUCATION */}
      <section id="education" className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionLabel>Education</SectionLabel>
          <div style={{ display: "grid", gap: 12 }}>
            {education.map((e) => (
              <div
                key={e.degree}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                  padding: "14px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "var(--text-row-title)", fontWeight: 500 }}>{e.degree}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                    {e.institution}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                    {e.session}
                  </p>
                  {e.score && (
                    <p style={{ margin: "2px 0 0", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent-teal-bright)" }}>
                      {e.score}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="section"
      >
        <div className="container">
          <SectionLabel>FAQ</SectionLabel>
          <div style={{ display: "grid", gap: 16 }}>
            {faqs.map((f) => (
              <div key={f.q}>
                <p style={{ margin: "0 0 6px", fontSize: "var(--text-row-title)", fontWeight: 500 }}>{f.q}</p>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="section"
      >
        <div className="container">
          <SectionLabel>Contact</SectionLabel>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Ranga Reddy District, Telangana, India
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 14 }}>
            <MagneticLink>
              <a href="mailto:gaddamsuryaprakash960@gmail.com">Email</a>
            </MagneticLink>
            <MagneticLink>
              <a href="https://github.com/Surya-prakas" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </MagneticLink>
            <MagneticLink>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </MagneticLink>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
            Currently open to: Full-Time Software Engineer · AI/ML Engineer ·
            Full-Stack Developer · Research Opportunities
          </p>
          <ContactForm />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 0" }}>
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          <span>Surya Prakash © {new Date().getFullYear()}</span>
          <span>
            src v1.0 · deployed{" "}
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </footer>
    </main>
  );
}
