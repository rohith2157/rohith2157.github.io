/* proof: a recruiter fit check and a live, in-browser port of bugzero's page audit.
   Everything runs locally; the only network calls are the audit's link checks. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var GH = "https://github.com/rohith2157/";
  var L = {
    bugzero: GH + "BUGZERO",
    veritas: GH + "VERITAS",
    waste: GH + "WASTAGE-DETECTION",
    hospital: GH + "Hospital_Automation_System_by_whatsapp",
    mind: GH + "Mind-Reader",
    comics: GH + "unemployment_project",
    regression: GH + "Simple-Linear-Regression-Sales-vs-Advertising-Analysis",
    site: GH + "rohith2157.github.io",
    vlm: "https://huggingface.co/spaces/rohith2157/vlm_for_bugzero",
    github: "https://github.com/rohith2157",
    work: "#work",
    awards: "#recognition"
  };

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".proof-tab"));

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      selectTab(tabs[(next + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- fit check ---------- */
  // level: shipped (in a real project), used (worked with it), partial (adjacent), learning, gap (not yet).
  var VALUE = { shipped: 1, used: 0.85, partial: 0.5, learning: 0.3, gap: 0 };
  var SKILLS = [
    { name: "python", terms: ["python"], level: "shipped", proof: "bugzero's ai core, wastevision and the hospital bot backend", link: L.bugzero },
    { name: "javascript / typescript", terms: ["javascript", "typescript", "js", "es6"], level: "shipped", proof: "bugzero and veritas front ends, express services", link: L.bugzero },
    { name: "java", terms: ["java", "j2ee"], level: "used", proof: "veritas backend on spring boot 3 and java 21", link: L.veritas },
    { name: "sql", terms: ["sql", "postgresql", "postgres", "mysql", "sqlite", "relational database", "relational databases", "rdbms"], level: "shipped", proof: "postgres in bugzero and the hospital bot, sqlite in kids comic library", link: L.hospital },
    { name: "c / c++", terms: ["c++", "c/c++", "c programming", "embedded c"], level: "partial", proof: "c from coursework; c++ isn't in a project yet", link: null },
    { name: "go, rust & co.", terms: ["golang", "rust", "kotlin", "swift", "scala", "c#", ".net", "ruby", "php"], level: "gap", proof: "not in my stack yet. i picked up java and spring boot for veritas and would ramp the same way", link: L.veritas },

    { name: "llms / genai", terms: ["llm", "llms", "large language model", "large language models", "genai", "gen ai", "generative ai", "gpt", "openai", "gemini", "chatgpt", "claude", "anthropic"], level: "shipped", proof: "lora-tuned phi-3 chatbot in production at codevocado; gemini apps on github", link: L.work },
    { name: "rag", terms: ["rag", "retrieval augmented generation", "retrieval-augmented generation", "retrieval augmented", "semantic search"], level: "shipped", proof: "the rag pipeline that grounds codevocado's msme chatbot", link: L.work },
    { name: "vector databases", terms: ["vector database", "vector databases", "vector db", "vector store", "embeddings", "pinecone", "faiss", "chroma", "chromadb", "qdrant", "weaviate", "milvus", "pgvector"], level: "partial", proof: "built the retrieval side of a rag pipeline; no specific managed vector db on my résumé yet", link: L.work },
    { name: "fine-tuning", terms: ["fine-tuning", "fine tuning", "finetuning", "fine-tune", "fine tune", "lora", "qlora", "peft"], level: "shipped", proof: "lora fine-tuned microsoft phi-3 for msme domain answers", link: L.work },
    { name: "llm serving", terms: ["ollama", "llm inference", "model inference", "inference optimization", "inference latency", "llama.cpp", "local llms"], level: "shipped", proof: "served and latency-tuned llms with ollama at codevocado", link: L.work },
    { name: "prompt engineering", terms: ["prompt engineering", "prompting", "prompt design", "prompts"], level: "used", proof: "gemini apps (career advisor, kids comic library) and a simplilearn certificate", link: L.comics },
    { name: "agents", terms: ["agent", "agents", "agentic", "multi-agent", "multi agent", "tool calling", "tool-calling", "function calling", "tool use"], level: "shipped", proof: "bugzero coordinates 6 specialised agents end to end", link: L.bugzero },
    { name: "langchain & co.", terms: ["langchain", "langgraph", "llamaindex", "llama index", "crewai", "autogen"], level: "partial", proof: "not on my résumé yet; i've built rag (codevocado) and agents (bugzero), so the concepts carry straight over", link: L.bugzero },
    { name: "pytorch", terms: ["pytorch", "torch"], level: "used", proof: "lora fine-tuning of phi-3", link: L.work },
    { name: "tensorflow / keras", terms: ["tensorflow", "keras", "tflite", "tensorflow lite"], level: "shipped", proof: "mobilenetv2 transfer learning exported to a 10 mb tflite model", link: L.waste },
    { name: "machine learning", terms: ["machine learning", "ml", "scikit-learn", "sklearn", "scikit learn", "random forest", "logistic regression", "regression", "classification", "decision tree", "decision trees", "model training", "model evaluation"], level: "shipped", proof: "diabetes predictor ensemble, the id3 mind reader, regression analysis", link: L.mind },
    { name: "deep learning", terms: ["deep learning", "neural network", "neural networks", "cnn", "cnns", "convolutional", "transfer learning"], level: "shipped", proof: "two-phase transfer learning on mobilenetv2, 93.4% over 7 classes", link: L.waste },
    { name: "computer vision", terms: ["computer vision", "opencv", "image classification", "image processing", "vision models"], level: "shipped", proof: "wastevision classifies a live webcam feed at 30+ fps", link: L.waste },
    { name: "object detection", terms: ["object detection", "yolo", "yolov5", "yolov8", "detectron", "segmentation"], level: "partial", proof: "explored yolov8 for waste detection; the shipped model is a classifier", link: L.waste },
    { name: "nlp", terms: ["nlp", "natural language processing", "text classification", "translation", "multilingual"], level: "shipped", proof: "5-language support for codevocado's chatbot", link: L.work },
    { name: "multimodal / vlms", terms: ["vlm", "vlms", "vision language", "vision-language", "multimodal", "multi-modal"], level: "used", proof: "nvidia eagle2-2b on hugging face zerogpu for bugzero's visual checks", link: L.vlm },
    { name: "hugging face", terms: ["hugging face", "huggingface", "transformers"], level: "used", proof: "bugzero's vision model runs on a hugging face space", link: L.vlm },
    { name: "mlops", terms: ["mlops", "mlflow", "kubeflow", "model monitoring", "model deployment", "model serving", "onnx", "triton", "vllm"], level: "partial", proof: "shipped a tflite edge model and served llms with ollama; no mlflow pipeline yet", link: L.waste },
    { name: "data analysis", terms: ["pandas", "numpy", "matplotlib", "seaborn", "data analysis", "eda", "exploratory data analysis", "data visualization", "statistics", "jupyter"], level: "used", proof: "regression analysis repo and the notebooks behind mind reader", link: L.regression },
    { name: "big data", terms: ["spark", "pyspark", "hadoop", "kafka", "airflow", "big data", "etl", "data pipelines", "databricks", "snowflake"], level: "gap", proof: "not yet; i'm at home with python data tooling, so spark is the natural next step", link: null },

    { name: "test automation", terms: ["test automation", "automation testing", "automated testing", "playwright", "selenium", "cypress", "puppeteer", "e2e", "end-to-end testing", "end to end testing", "qa", "quality assurance", "testing", "test cases"], level: "shipped", proof: "bugzero: zero-script crawling, testing and self-healing selectors on playwright", link: L.bugzero },
    { name: "accessibility", terms: ["accessibility", "a11y", "wcag", "axe", "aria", "screen reader", "screen readers"], level: "shipped", proof: "bugzero runs axe-core wcag 2.1 audits; this page passes the live audit next door", link: L.bugzero },
    { name: "web performance", terms: ["performance testing", "web vitals", "core web vitals", "lighthouse", "lcp", "page speed", "web performance"], level: "shipped", proof: "bugzero captures lcp, cls and ttfb for every page it crawls", link: L.bugzero },
    { name: "visual regression", terms: ["visual regression", "visual testing", "screenshot testing", "ssim", "pixel diff"], level: "shipped", proof: "ssim pixel diffing plus a vision-model review in bugzero", link: L.bugzero },
    { name: "unit & api tests", terms: ["api testing", "postman", "contract testing", "pytest", "jest", "unit testing", "unit tests", "tdd"], level: "partial", proof: "postman for api checks; unit-test suites are lighter in my repos so far", link: null },

    { name: "rest apis", terms: ["rest api", "rest apis", "restful", "api", "apis", "api design", "backend"], level: "shipped", proof: "flask, fastapi, express and spring boot services across my repos", link: L.veritas },
    { name: "fastapi", terms: ["fastapi"], level: "shipped", proof: "bugzero's ai core and veritas' similarity engine", link: L.veritas },
    { name: "flask", terms: ["flask"], level: "shipped", proof: "the hospital bot, mind reader and the diabetes predictor", link: L.hospital },
    { name: "django", terms: ["django"], level: "partial", proof: "flask and fastapi daily; django is a short hop from there", link: null },
    { name: "node.js / express", terms: ["node", "node.js", "nodejs", "express", "express.js", "expressjs"], level: "shipped", proof: "express services in bugzero", link: L.bugzero },
    { name: "spring boot", terms: ["spring", "spring boot", "springboot"], level: "used", proof: "veritas: security, classrooms, rubrics and submissions", link: L.veritas },
    { name: "microservices", terms: ["microservice", "microservices", "distributed systems", "system design", "scalable systems", "service-oriented"], level: "shipped", proof: "veritas runs 3 services; bugzero a 6-service stack", link: L.veritas },
    { name: "real-time", terms: ["websocket", "websockets", "socket.io", "real-time", "realtime", "real time"], level: "shipped", proof: "live defect streaming over socket.io in bugzero", link: L.bugzero },
    { name: "auth", terms: ["jwt", "authentication", "authorization", "oauth", "rbac", "role-based access", "role based access", "access control"], level: "shipped", proof: "jwt multi-role auth at codevocado; role-based dashboards in the hospital bot", link: L.work },
    { name: "redis", terms: ["redis", "caching", "cache"], level: "used", proof: "part of bugzero's stack", link: L.bugzero },
    { name: "graph databases", terms: ["neo4j", "graph database", "graph databases", "graph db", "cypher"], level: "used", proof: "neo4j maps page relationships in bugzero", link: L.bugzero },
    { name: "firebase / supabase", terms: ["firebase", "firestore", "supabase"], level: "used", proof: "supabase in the diabetes predictor, firebase in the career advisor (repos private)", link: null },
    { name: "mongodb", terms: ["mongodb", "mongo", "nosql", "dynamodb", "cassandra"], level: "partial", proof: "nosql via firebase; no mongodb in production yet", link: null },
    { name: "automation & chatbots", terms: ["n8n", "zapier", "workflow automation", "webhook", "webhooks", "whatsapp", "chatbot", "chatbots", "conversational ai"], level: "shipped", proof: "whatsapp booking bot: meta api → n8n → flask → postgres", link: L.hospital },

    { name: "react", terms: ["react", "react.js", "reactjs"], level: "shipped", proof: "bugzero, veritas (react 19) and the hospital dashboards", link: L.veritas },
    { name: "next.js", terms: ["next.js", "nextjs", "next js", "remix"], level: "partial", proof: "react daily; next.js is on my profile but not in a flagship app yet", link: null },
    { name: "html / css", terms: ["html", "css", "tailwind", "tailwind css", "tailwindcss", "sass", "responsive design", "ui"], level: "used", proof: "this site: hand-written html, css and an ascii ocean, no framework", link: L.site },
    { name: "svelte", terms: ["svelte", "sveltekit"], level: "used", proof: "mind reader's interface is svelte 4", link: L.mind },
    { name: "vue / angular", terms: ["vue", "vue.js", "vuejs", "angular"], level: "partial", proof: "react and svelte in my projects; vue or angular would be a short ramp", link: null },
    { name: "mobile", terms: ["react native", "flutter", "android", "ios", "mobile app", "mobile apps", "expo"], level: "learning", proof: "react native and flutter are on my profile, but no published app yet", link: null },

    { name: "docker", terms: ["docker", "containers", "containerization", "containerisation", "dockerfile", "docker compose"], level: "used", proof: "veritas ships with a dockerfile", link: L.veritas },
    { name: "ci/cd", terms: ["ci/cd", "ci cd", "cicd", "continuous integration", "continuous deployment", "github actions", "jenkins", "gitlab ci", "devops"], level: "partial", proof: "projects auto-deploy through vercel and github; i haven't owned a full ci pipeline yet", link: null },
    { name: "cloud", terms: ["aws", "amazon web services", "gcp", "google cloud", "azure", "cloud", "ec2", "s3", "cloud run", "serverless"], level: "partial", proof: "shipped on vercel, render and hugging face spaces; no production aws or gcp yet", link: null },
    { name: "kubernetes", terms: ["kubernetes", "k8s", "helm", "eks", "gke", "aks"], level: "gap", proof: "not yet. plan: docker is in place (veritas) → minikube → bugzero's services on k8s within a week", link: null },
    { name: "terraform / iac", terms: ["terraform", "infrastructure as code", "iac", "pulumi", "cloudformation", "ansible"], level: "gap", proof: "not yet; i'd learn it alongside a first real cloud deploy", link: null },
    { name: "linux", terms: ["linux", "bash", "shell scripting", "unix"], level: "partial", proof: "day-to-day development on the command line; no sysadmin work yet", link: null },
    { name: "git", terms: ["git", "github", "version control", "gitlab", "bitbucket"], level: "shipped", proof: "13 public repos on github", link: L.github },

    { name: "dsa / algorithms", terms: ["data structures", "algorithms", "dsa", "problem solving", "problem-solving", "leetcode", "competitive programming"], level: "used", proof: "levenshtein scoring in bugzero, winnowing fingerprints in veritas, id3 in mind reader", link: L.veritas },
    { name: "teamwork", terms: ["communication", "teamwork", "team player", "collaboration", "collaborate", "cross-functional", "stakeholder", "stakeholders", "leadership", "ownership"], level: "shipped", proof: "coordinator at enigma club; sih 2025 and 2026 team member; a remote internship", link: L.awards },
    { name: "research", terms: ["research", "papers", "publications"], level: "learning", proof: "sih 2026 proposal on vision-language models for satellite imagery; no publications yet", link: L.awards }
  ];

  // Word-ish boundaries that still allow symbols inside terms (c++, node.js, ci/cd).
  SKILLS.forEach(function (skill) {
    skill.res = skill.terms.map(function (term) {
      var body = term.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&").replace(/\s+/g, "[\\s\\-]+");
      return new RegExp("(^|[^a-z0-9+#])" + body + "(?=$|[^a-z0-9+#])");
    });
  });

  var OPTIONAL = /nice[\s-]to[\s-]have|good[\s-]to[\s-]have|preferred|bonus|a plus|desirable|optional/;
  var REQUIRED = /requirement|must|required|qualification|you have|you'll need|what you|responsibilit|skills/;
  var CITIES = /bangalore|bengaluru|chennai|pune|mumbai|delhi|gurgaon|gurugram|noida|kolkata|ahmedabad/;

  function analyse(text) {
    var found = [], index = {}, mode = "required";
    text.toLowerCase().split(/\n+/).forEach(function (raw) {
      var line = raw.trim();
      if (!line) return;
      var header = line.length < 48 && (/:$/.test(line) || line.split(/\s+/).length <= 4);
      var lineMode = mode;
      if (OPTIONAL.test(line)) { lineMode = "optional"; if (header) mode = "optional"; }
      else if (REQUIRED.test(line) && header) { mode = "required"; lineMode = mode; }
      SKILLS.forEach(function (skill, i) {
        if (!skill.res.some(function (re) { return re.test(line); })) return;
        if (index[i] === undefined) { index[i] = found.length; found.push({ skill: skill, optional: true }); }
        if (lineMode === "required") found[index[i]].optional = false;
      });
    });

    var weight = 0, earned = 0;
    found.forEach(function (it) {
      var w = it.optional ? 0.5 : 1;
      weight += w;
      earned += w * VALUE[it.skill.level];
    });
    var rank = { shipped: 0, used: 1, partial: 2, learning: 3, gap: 4 };
    found.sort(function (a, b) {
      return (a.optional - b.optional) || (rank[a.skill.level] - rank[b.skill.level]);
    });

    var lower = text.toLowerCase(), notes = [];
    var years = lower.match(/(\d+)\s*\+?\s*(?:(?:-|–|to)\s*\d+\s*)?(?:years|yrs)/);
    if (years && +years[1] >= 2) {
      notes.push("you're asking for " + years[1] + "+ years. i'm a student, so i'd be a stretch hire; the projects above are the best evidence of how fast i ramp.");
    } else if (/intern|internship|fresher|graduate|entry[\s-]level|student|new grad|campus|0\s*-\s*[12] years/.test(lower)) {
      notes.push("i'm a b.tech ai & ml student at anurag university (class of 2028) and available for internships.");
    }
    if (/hyderabad/.test(lower)) notes.push("i'm in hyderabad.");
    else if (CITIES.test(lower)) notes.push("i'm based in hyderabad.");
    if (/remote|hybrid|work from home/.test(lower)) notes.push("i've worked fully remote (codevocado, oct 2025 – jan 2026).");
    if (found.length) notes.push("rows with ↗ link to the code or role behind them. gaps are listed on purpose.");

    return { items: found, pct: weight ? Math.round((100 * earned) / weight) : 0, notes: notes };
  }

  function strong(it) { return it.skill.level === "shipped" || it.skill.level === "used"; }
  function gap(it) { return it.skill.level === "gap"; }

  function itemHtml(it) {
    var s = it.skill;
    var cls = strong(it) ? "is-strong" : gap(it) ? "is-gap" : "is-partial";
    var mark = strong(it) ? "✓" : gap(it) ? "✗" : "~";
    var link = "";
    if (s.link) {
      var external = s.link.charAt(0) !== "#";
      link = ' <a href="' + esc(s.link) + '"' + (external ? ' target="_blank" rel="noopener"' : "") +
        ' aria-label="evidence for ' + esc(s.name) + '">↗</a>';
    }
    return '<li class="fit-item ' + cls + '">' +
      '<span class="fit-mark" aria-hidden="true">' + mark + "</span>" +
      '<span class="fit-skill">' + esc(s.name) + "</span>" +
      '<span class="fit-level">' + s.level + (it.optional ? " · nice" : "") + "</span>" +
      '<span class="fit-proof">' + esc(s.proof) + link + "</span></li>";
  }

  function summaryText(res) {
    var resume = new URL("assets/Maheshwaram_Rohith_Resume.pdf", location.href).href;
    var pick = function (test) { return res.items.filter(test); };
    var strongOnes = pick(strong), partial = pick(function (it) { return !strong(it) && !gap(it); }), gaps = pick(gap);
    return [
      "Maheshwaram Rohith: " + res.pct + "% fit for this role (self-check on " + location.host + ")",
      strongOnes.length ? "Strong: " + strongOnes.map(function (it) { return it.skill.name; }).join(", ") : "",
      partial.length ? "Partial: " + partial.map(function (it) { return it.skill.name + " (" + it.skill.proof + ")"; }).join("; ") : "",
      gaps.length ? "Gaps: " + gaps.map(function (it) { return it.skill.name + " (" + it.skill.proof + ")"; }).join("; ") : "",
      "GitHub: " + L.github + " · Résumé: " + resume
    ].filter(Boolean).join("\n");
  }

  var jd = document.getElementById("jd");
  var fitBox = document.getElementById("fit-result");
  var fitStatus = document.getElementById("fit-status");
  var lastResult = null;

  function renderFit(res) {
    fitBox.hidden = false;
    if (!res.items.length) {
      fitBox.innerHTML = '<p class="proof-intro">i couldn\'t spot any skills i recognise in that text. paste the requirements part of the job description, or try one of the samples.</p>';
      fitStatus.textContent = "no recognisable skills found";
      return;
    }
    var on = Math.round(res.pct / 5), cells = "";
    for (var i = 0; i < 20; i++) cells += '<i class="' + (i < on ? "on" : "") + '"></i>';
    var count = function (test) { return res.items.filter(test).length; };
    var nStrong = count(strong), nGap = count(gap), nPartial = res.items.length - nStrong - nGap;
    fitBox.innerHTML =
      '<div class="fit-head">' +
        '<p class="fit-num">' + res.pct + "%<small> fit</small></p>" +
        '<div class="fit-cells" aria-hidden="true">' + cells + "</div>" +
        '<p class="fit-counts">' + res.items.length + " requirements found · " + nStrong + " strong · " + nPartial + " partial · " + nGap + " gap" + (nGap === 1 ? "" : "s") + "</p>" +
      "</div>" +
      '<ul class="fit-list">' + res.items.map(itemHtml).join("") + "</ul>" +
      '<ul class="fit-notes">' + res.notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" +
      '<div class="proof-row">' +
        '<button type="button" class="run-btn" id="fit-copy">copy summary for your hiring manager</button>' +
        '<a class="run-btn ghost" href="assets/Maheshwaram_Rohith_Resume.pdf" target="_blank" rel="noopener">résumé pdf</a>' +
      "</div>";
    fitStatus.textContent = "fit check done: " + res.pct + " percent, " + nStrong + " strong matches, " + nGap + (nGap === 1 ? " gap" : " gaps");
    document.getElementById("fit-copy").addEventListener("click", copySummary);
  }

  function copySummary(e) {
    var btn = e.currentTarget, text = summaryText(lastResult);
    var done = function () {
      btn.textContent = "copied ✓";
      fitStatus.textContent = "summary copied to clipboard";
      setTimeout(function () { btn.textContent = "copy summary for your hiring manager"; }, 2000);
    };
    var fallback = function () {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); done(); } catch (err) { btn.textContent = "copy failed, select the text instead"; }
      area.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  function runFit() {
    var text = jd.value.trim();
    if (!text) {
      fitStatus.textContent = "paste a job description first, or pick a sample";
      jd.focus();
      return;
    }
    lastResult = analyse(text);
    renderFit(lastResult);
    fitBox.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  var SAMPLES = {
    ml: "Machine Learning Intern (Hyderabad / Remote)\nWe're looking for a pre-final year student to join our ML team.\nRequirements:\n- Strong Python and data structures\n- Hands-on with scikit-learn, PyTorch or TensorFlow\n- Training and evaluating models; computer vision experience\n- Comfortable with SQL and Git\nNice to have:\n- LLMs or RAG\n- Docker, AWS",
    genai: "GenAI Engineer (0-2 years)\nBuild LLM-powered products end to end.\nRequirements:\n- Python and FastAPI\n- LLMs, prompt engineering and RAG with a vector database\n- Fine-tuning (LoRA / PEFT) and evaluation\n- Building agents with tool calling\n- REST APIs and PostgreSQL\nNice to have:\n- LangChain, Hugging Face\n- Kubernetes, AWS",
    fullstack: "Full-Stack Developer\nRequirements:\n- React and TypeScript\n- Node.js / Express\n- PostgreSQL and Redis\n- REST APIs, WebSockets and JWT authentication\n- Docker and CI/CD\nPreferred:\n- Next.js, Tailwind CSS\n- AWS or GCP",
    qa: "QA Automation Engineer\nRequirements:\n- Test automation with Playwright, Cypress or Selenium\n- JavaScript/TypeScript or Python\n- API testing and CI/CD integration\n- Accessibility (WCAG) and performance testing\nNice to have:\n- Visual regression testing\n- Experience with AI agents for testing"
  };

  document.getElementById("fit-run").addEventListener("click", runFit);
  jd.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runFit();
  });
  document.querySelectorAll("[data-sample]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      jd.value = SAMPLES[chip.getAttribute("data-sample")];
      runFit();
    });
  });

  /* ---------- live audit ---------- */
  var auditBtn = document.getElementById("audit-run");
  var term = document.getElementById("audit-log");
  var auditStatus = document.getElementById("audit-status");
  var tally;

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, reduceMotion.matches ? 0 : ms); });
  }

  // parts: [[text, className?, href?], ...]
  function print(parts) {
    var line = document.createElement("span");
    line.className = "t-line";
    parts.forEach(function (p) {
      var node = document.createElement(p[2] ? "a" : "span");
      if (p[1]) node.className = p[1];
      if (p[2]) { node.href = p[2]; node.target = "_blank"; node.rel = "noopener"; }
      node.textContent = p[0];
      line.appendChild(node);
    });
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  }
  function pad(text, n) { return text.length >= n ? text + " " : text + new Array(n - text.length + 1).join(" "); }
  function verdict(state, name, detail) {
    var label = { ok: "pass", warn: "warn", bad: "fail", skip: "skip" }[state];
    print([["  " + pad(label, 6), state === "skip" ? "t-dim" : "t-" + state], [pad(name, 20), "t-strong"], [detail, "t-dim"]]);
    if (tally[state] !== undefined) tally[state]++;
  }

  function visible(el) {
    return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  }
  function accName(el) {
    var label = (el.getAttribute("aria-label") || "").trim();
    if (label) return label;
    var by = el.getAttribute("aria-labelledby");
    if (by) {
      return by.split(/\s+/).map(function (id) { var n = document.getElementById(id); return n ? n.textContent : ""; }).join(" ").trim();
    }
    if (el.id) {
      var lab = document.querySelector('label[for="' + el.id + '"]');
      if (lab && lab.textContent.trim()) return lab.textContent.trim();
    }
    return (el.textContent || "").trim() || (el.getAttribute("title") || "").trim();
  }

  function parseColor(str) {
    var m = /rgba?\(([^)]+)\)/.exec(str);
    if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(top, base) {
    return {
      r: top.r * top.a + base.r * (1 - top.a),
      g: top.g * top.a + base.g * (1 - top.a),
      b: top.b * top.a + base.b * (1 - top.a),
      a: 1
    };
  }
  function backdrop(el) {
    var layers = [];
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) layers.push(c);
    }
    return layers.reduceRight(function (base, layer) { return over(layer, base); }, { r: 255, g: 255, b: 255, a: 1 });
  }
  function luminance(c) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function contrast(a, b) {
    var x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  function hasFocusRule() {
    var walk = function (rules) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.selectorText && r.selectorText.indexOf(":focus-visible") !== -1) return true;
        if (r.cssRules && walk(r.cssRules)) return true;
      }
      return false;
    };
    return Array.prototype.some.call(document.styleSheets, function (sheet) {
      try { return walk(sheet.cssRules); } catch (e) { return false; } // cross-origin sheets can't be read
    });
  }

  function observed(type) {
    return new Promise(function (resolve) {
      try {
        var entries = [];
        var po = new PerformanceObserver(function (list) { entries = entries.concat(list.getEntries()); });
        po.observe({ type: type, buffered: true });
        setTimeout(function () { po.disconnect(); resolve(entries); }, 60);
      } catch (e) { resolve(null); }
    });
  }

  // Background tabs get no animation frames, so give up after 1.5 s instead of hanging.
  function measureFps() {
    return new Promise(function (resolve) {
      if (document.hidden) { resolve(null); return; }
      var frames = 0, start = performance.now(), done = false;
      var finish = function (now) {
        if (done) return;
        done = true;
        resolve(frames > 1 ? Math.round((frames * 1000) / (now - start)) : null);
      };
      (function tick(now) {
        frames++;
        if (now - start < 1000) requestAnimationFrame(tick);
        else finish(now);
      })(start);
      setTimeout(function () { finish(performance.now()); }, 1500);
    });
  }

  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (_, reject) { setTimeout(function () { reject(new Error("timeout")); }, ms); })]);
  }

  function levenshtein(a, b) {
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }

  // Break the "view projects" selector on a hidden copy of the hero, then heal it the bugzero way:
  // tag + text distance + attributes + spatial decay, no llm involved.
  function healDemo() {
    var about = document.getElementById("about");
    var original = about.querySelector(".cta .inline-link.strong");
    if (!original) return null;
    var aboutBox = about.getBoundingClientRect(), r0 = original.getBoundingClientRect();
    var fp = {
      tag: "a",
      text: original.textContent.trim().toLowerCase(),
      href: original.getAttribute("href"),
      x: r0.left - aboutBox.left + r0.width / 2,
      y: r0.top - aboutBox.top + r0.height / 2
    };

    var host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.inert = true;
    host.style.cssText = "position:fixed;left:-10000px;top:0;visibility:hidden;width:" + aboutBox.width + "px";
    var copy = about.cloneNode(true);
    copy.removeAttribute("id");
    Array.prototype.forEach.call(copy.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
    host.appendChild(copy);
    document.body.appendChild(host);

    // the "deploy": class renamed, label reworded, a new link pushed in front
    var target = copy.querySelector(".cta .inline-link.strong");
    target.className = "btn btn-primary";
    target.textContent = "see projects";
    var extra = document.createElement("a");
    extra.href = "#work";
    extra.textContent = "case studies";
    target.parentNode.insertBefore(extra, target);
    target.parentNode.insertBefore(document.createTextNode(" | "), target);

    var broken = copy.querySelectorAll(".cta .inline-link.strong").length;
    var base = copy.getBoundingClientRect();
    var t0 = performance.now();
    var ranked = Array.prototype.map.call(copy.querySelectorAll("a[href], button"), function (el) {
      var r = el.getBoundingClientRect();
      var text = el.textContent.trim().toLowerCase();
      var dist = Math.hypot(r.left - base.left + r.width / 2 - fp.x, r.top - base.top + r.height / 2 - fp.y);
      var parts = {
        text: 35 * Math.max(0, 1 - levenshtein(fp.text, text) / Math.max(fp.text.length, text.length, 1)),
        tag: el.tagName.toLowerCase() === fp.tag ? 20 : 0,
        href: el.getAttribute("href") === fp.href ? 15 : 0,
        position: 30 * Math.exp(-dist / 160)
      };
      return { el: el, text: text, parts: parts, total: parts.text + parts.tag + parts.href + parts.position };
    }).sort(function (a, b) { return b.total - a.total; });
    var ms = performance.now() - t0;
    var healed = ranked[0] && ranked[0].el === target;
    host.remove();
    return { fp: fp, broken: broken, ranked: ranked.slice(0, 3), ms: ms, healed: healed, count: ranked.length };
  }

  function cachedRepos() {
    try {
      var data = JSON.parse(localStorage.getItem("gh-cache") || "null");
      return data ? data.repos.map(function (r) { return r.name.toLowerCase(); }) : null;
    } catch (e) { return null; }
  }

  async function runAudit() {
    auditBtn.disabled = true;
    auditBtn.textContent = "running…";
    term.hidden = false;
    term.textContent = "";
    auditStatus.textContent = "audit running";
    tally = { ok: 0, warn: 0, bad: 0 };
    var started = performance.now();

    print([["$ ", "t-dim"], ["bugzero audit --target " + location.host + location.pathname + " --in-browser", "t-cmd"]]);
    await wait(250);

    // crawler
    var sections = document.querySelectorAll(".deck-section");
    var anchors = Array.prototype.slice.call(document.querySelectorAll("a[href]"));
    var headings = Array.prototype.slice.call(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    print([["[crawler] ", "t-tag"], ["mapped " + sections.length + " sections, " + anchors.length + " links, " + headings.length + " headings"]]);
    await wait(220);

    // structure
    var skipped = 0, prev = 0;
    headings.forEach(function (h) { var lvl = +h.tagName.charAt(1); if (prev && lvl > prev + 1) skipped++; prev = lvl; });
    var h1 = document.querySelectorAll("h1").length;
    print([["[a11y] ", "t-tag"], ["walking the heading outline"]]);
    verdict(h1 === 1 && !skipped ? "ok" : "warn", "heading outline", h1 + " h1 · " + skipped + " skipped levels");
    await wait(160);

    // accessible names
    var controls = Array.prototype.filter.call(document.querySelectorAll("a[href], button, textarea, input, select, [role=tab]"), visible);
    var unnamed = controls.filter(function (el) { return !accName(el); });
    verdict(unnamed.length ? "bad" : "ok", "accessible names", (controls.length - unnamed.length) + "/" + controls.length + " controls have a name");
    await wait(160);

    // icons
    var icons = document.querySelectorAll("svg.icon");
    var exposed = Array.prototype.filter.call(icons, function (s) { return s.getAttribute("aria-hidden") !== "true"; });
    verdict(exposed.length ? "warn" : "ok", "decorative icons", (icons.length - exposed.length) + "/" + icons.length + " hidden from screen readers");
    await wait(160);

    // contrast
    print([["[contrast] ", "t-tag"], ["sampling every visible text node against its real backdrop"]]);
    await wait(200);
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var seen = new Set(), checked = 0, failing = 0, worst = null;
    for (var node = walker.nextNode(); node; node = walker.nextNode()) {
      var el = node.parentElement;
      if (!node.nodeValue.trim() || !el || seen.has(el)) continue;
      seen.add(el);
      if (el.closest("script, style, svg, .terminal, .sr-only, [hidden]") || !visible(el)) continue;
      var cs = getComputedStyle(el), fg = parseColor(cs.color);
      if (!fg) continue;
      var bg = backdrop(el);
      var ratio = contrast(fg.a < 1 ? over(fg, bg) : fg, bg);
      var size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
      var need = large ? 3 : 4.5;
      checked++;
      if (ratio < need) failing++;
      if (!worst || ratio / need < worst.ratio / worst.need) worst = { ratio: ratio, need: need, text: node.nodeValue.trim().slice(0, 24) };
    }
    verdict(failing ? "bad" : "ok", "text contrast",
      (checked - failing) + "/" + checked + " meet wcag aa · lowest " + (worst ? worst.ratio.toFixed(1) + ":1 on \"" + worst.text + "\"" : "n/a"));
    await wait(160);

    // target size (wcag 2.2, 2.5.8): links inside a sentence are exempt
    var small = controls.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width >= 24 && r.height >= 24) return false;
      var parent = el.parentElement;
      return !(el.tagName === "A" && parent && /^(P|LI|SPAN|DD)$/.test(parent.tagName) &&
        parent.textContent.trim().length > el.textContent.trim().length);
    });
    verdict(small.length ? "warn" : "ok", "tap targets", (controls.length - small.length) + "/" + controls.length + " are at least 24×24 px or inline");
    await wait(160);

    // keyboard
    var focusable = Array.prototype.filter.call(document.querySelectorAll("a[href], button:not([disabled]), textarea, input, select, [tabindex]"), visible);
    var positive = focusable.filter(function (el) { return el.tabIndex > 0; });
    var skipLink = document.querySelector('a.skip-link[href^="#"]');
    var ring = hasFocusRule();
    verdict(!positive.length && skipLink && ring ? "ok" : "warn", "keyboard",
      focusable.length + " focusable · " + positive.length + " positive tabindex · skip link " + (skipLink ? "yes" : "no") + " · focus ring " + (ring ? "yes" : "no"));
    await wait(160);

    // metadata
    var desc = document.querySelector('meta[name="description"]');
    var metaOk = document.documentElement.lang && document.title.trim() && desc && desc.content.length >= 50 &&
      document.querySelector('meta[name="viewport"]') && document.querySelector('meta[property="og:title"]');
    verdict(metaOk ? "ok" : "warn", "metadata", "lang=" + document.documentElement.lang + " · title · description (" + (desc ? desc.content.length : 0) + " chars) · viewport · open graph");
    await wait(160);

    // links
    print([["[links] ", "t-tag"], ["resolving in-page anchors, files and repositories"]]);
    var inPage = anchors.filter(function (a) { var h = a.getAttribute("href"); return h.charAt(0) === "#" && h.length > 1; });
    var deadAnchors = inPage.filter(function (a) { return !document.getElementById(a.getAttribute("href").slice(1)); });
    var files = Array.from(new Set(anchors.filter(function (a) {
      return a.origin === location.origin && a.pathname !== location.pathname;
    }).map(function (a) { return a.href; })));
    var fileResults = await Promise.all(files.map(function (url) {
      return withTimeout(fetch(url, { method: "HEAD", cache: "no-store" }), 5000)
        .then(function (r) { return r.ok; }, function () { return false; });
    }));
    var repoNames = Array.from(new Set(anchors.map(function (a) {
      var m = /github\.com\/rohith2157\/([^\/?#]+)/i.exec(a.href);
      return m && m[1].toLowerCase() !== "rohith2157.github.io" ? m[1] : null;
    }).filter(Boolean)));
    var known = cachedRepos(), repoOk;
    if (known) {
      repoOk = repoNames.map(function (n) { return known.indexOf(n.toLowerCase()) !== -1; });
    } else {
      repoOk = await Promise.all(repoNames.map(function (n) {
        return withTimeout(fetch("https://api.github.com/repos/rohith2157/" + n), 5000)
          .then(function (r) { return r.ok; }, function () { return null; });
      }));
    }
    var deadFiles = fileResults.filter(function (ok) { return !ok; }).length;
    var deadRepos = repoOk.filter(function (ok) { return ok === false; }).length;
    var external = anchors.length - inPage.length - files.length - repoNames.length;
    verdict(deadAnchors.length + deadFiles + deadRepos ? "bad" : "ok", "links",
      (inPage.length - deadAnchors.length) + "/" + inPage.length + " anchors · " + (files.length - deadFiles) + "/" + files.length + " files · " +
      (repoNames.length - deadRepos) + "/" + repoNames.length + " repos live on github");
    print([["         ", ""], ["(" + Math.max(external, 0) + " other external links skipped: browsers block cross-origin checks)", "t-dim"]]);
    await wait(160);

    // performance
    print([["[perf] ", "t-tag"], ["reading core web vitals from this page load"]]);
    var lcpEntries = await observed("largest-contentful-paint");
    var shiftEntries = await observed("layout-shift");
    var nav = performance.getEntriesByType("navigation")[0];
    if (lcpEntries && lcpEntries.length) {
      var lcp = lcpEntries[lcpEntries.length - 1].startTime;
      verdict(lcp <= 2500 ? "ok" : lcp <= 4000 ? "warn" : "bad", "largest paint", Math.round(lcp) + " ms (good is under 2500)");
    } else verdict("skip", "largest paint", "not exposed by this browser");
    if (shiftEntries) {
      var cls = shiftEntries.reduce(function (sum, e) { return e.hadRecentInput ? sum : sum + e.value; }, 0);
      verdict(cls <= 0.1 ? "ok" : cls <= 0.25 ? "warn" : "bad", "layout shift", cls.toFixed(3) + " cls (good is under 0.1)");
    } else verdict("skip", "layout shift", "not exposed by this browser");
    if (nav) {
      var weight = performance.getEntriesByType("resource").reduce(function (n, r) { return n + (r.transferSize || 0); }, nav.transferSize || 0);
      var requests = performance.getEntriesByType("resource").length + 1;
      verdict(nav.domContentLoadedEventEnd < 2000 ? "ok" : "warn", "load",
        "ttfb " + Math.round(nav.responseStart) + " ms · dom ready " + Math.round(nav.domContentLoadedEventEnd) + " ms · " + requests + " requests · " + Math.round(weight / 1024) + " kb");
    }
    var paused = document.getElementById("motion-toggle").getAttribute("aria-pressed") === "true";
    if (paused) verdict("skip", "ocean frame rate", "animation is paused");
    else {
      var fps = await measureFps();
      if (fps === null) verdict("skip", "ocean frame rate", "tab is in the background");
      else verdict(fps >= 50 ? "ok" : fps >= 30 ? "warn" : "bad", "ocean frame rate", fps + " fps while the sharks hunt");
    }
    await wait(200);

    // self-healing demo
    print([["[healer] ", "t-tag"], ["simulating a deploy that breaks a selector on a hidden copy of the hero…"]]);
    await wait(300);
    var heal = healDemo();
    if (heal) {
      print([["         ", ""], ["selector `.cta .inline-link.strong` now matches " + heal.broken + " elements", heal.broken ? "t-dim" : "t-warn"]]);
      print([["         ", ""], ["scoring " + heal.count + " candidates: text distance + tag + href + spatial decay", "t-dim"]]);
      heal.ranked.forEach(function (c) {
        var p = c.parts;
        print([["         ", ""], [pad(c.total.toFixed(1), 6), "t-strong"], [pad('"' + c.text + '"', 18)],
          ["text " + p.text.toFixed(1) + " · tag " + p.tag + " · href " + p.href + " · position " + p.position.toFixed(1), "t-dim"]]);
      });
      verdict(heal.healed ? "ok" : "bad", "self-healing", (heal.healed ? 'healed → a[href="' + heal.fp.href + '"]' : "could not heal") +
        " in " + heal.ms.toFixed(2) + " ms · 0 llm tokens");
    }
    await wait(200);

    var seconds = ((performance.now() - started) / 1000).toFixed(2);
    print([["", ""]]);
    print([["report  ", "t-strong"], [tally.ok + " passed", "t-ok"], [" · "], [tally.warn + " warnings", tally.warn ? "t-warn" : "t-dim"],
      [" · "], [tally.bad + " failed", tally.bad ? "t-bad" : "t-dim"], ["   ran in " + seconds + " s", "t-dim"]]);
    print([["the full version crawls any url with 6 agents → ", "t-dim"], ["github.com/rohith2157/BUGZERO", "", L.bugzero]]);
    auditStatus.textContent = "audit finished: " + tally.ok + " passed, " + tally.warn + " warnings, " + tally.bad + " failed";
    auditBtn.disabled = false;
    auditBtn.textContent = "run again ▶";
  }

  auditBtn.addEventListener("click", function () {
    runAudit().catch(function (err) {
      print([["audit crashed: " + err.message, "t-bad"]]);
      auditBtn.disabled = false;
      auditBtn.textContent = "run again ▶";
    });
  });
})();
