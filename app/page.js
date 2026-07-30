import TerminalHero from "../components/TerminalHero";
import NovaStatus from "../components/NovaStatus";
import HeroRobot3D from "../components/HeroRobot3D";
import ScrollReveal from "../components/ScrollReveal";
import CountUp from "../components/CountUp";
import SectionLabel from "../components/SectionLabel";
import AchievementCard from "../components/AchievementCard";
import ProjectFlow from "../components/ProjectFlow";
import CinematicNovaIntro from "../components/CinematicNovaIntro";

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

const education = [
  {
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

function ProjectCard({ p }) {
  return (
    <ScrollReveal variant="up">
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <span className="tag">{p.type}</span>
        </div>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>{p.title}</h3>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>{p.subtitle}</p>
        </div>
        {p.image && (
          <ScrollReveal variant="scale" delay={0.15}>
            <img
              src={p.image}
              alt={`${p.title} result visualization`}
              style={{
                width: "100%",
                maxWidth: "100%",
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
        )}
      </div>
    </ScrollReveal>
  );
}

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section id="hero" className="section">
        <div className="container">
          <HeroRobot3D />
          <TerminalHero />
        </div>
      </section>

      {/* CINEMATIC ORIGIN STORY */}
      <CinematicNovaIntro />

      {/* CURRENTLY / NOVA STATUS */}
      <section className="section" style={{ paddingTop: 0 }}>
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
          <SectionLabel>About</SectionLabel>
          <ScrollReveal>
            <p style={{ fontSize: 17, maxWidth: 640, color: "var(--text-secondary)" }}>
              I&apos;m currently pursuing an M.Tech in Software Engineering at JNTUH,
              building on a B.Tech in Information Technology from Vardhaman
              College of Engineering (2021–2025, 8.46 CGPA). My work combines
              deep learning, backend development, and modern frontend
              technologies to build practical software solutions. My primary
              research focus has been fraud detection using deep learning, and
              I also enjoy developing AI-powered full-stack applications and
              experimenting with modern LLMs and agentic AI workflows.
            </p>
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
            {projects.map((p) => (
              <ProjectCard key={p.title} p={p} />
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
          {experience.map((e) => (
            <ScrollReveal key={e.role}>
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{e.role}</h3>
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
          <div style={{ display: "grid", gap: 20 }}>
            {Object.entries(skills).map(([category, items], idx) => (
              <ScrollReveal key={category} delay={idx * 0.08}>
                <div>
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
              </ScrollReveal>
            ))}
          </div>
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
                  <p style={{ margin: 0, fontSize: 15 }}>{e.degree}</p>
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
                <p style={{ margin: "0 0 6px", fontWeight: 500 }}>{f.q}</p>
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
            <a href="mailto:gaddamsuryaprakash960@gmail.com">Email</a>
            <a href="https://github.com/Surya-prakas" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/suryaprakash-458700228"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
            Currently open to: Full-Time Software Engineer · AI/ML Engineer ·
            Full-Stack Developer · Research Opportunities
          </p>
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
