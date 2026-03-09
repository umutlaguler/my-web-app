/* ===========================
   Beta Enerji • İK CHAT – FULL VERSION
   Entry Modal + Mode Select (CV / Test / Chat)
   Timer + LOCAL TEST + CV Analyzer
   =========================== */

const { useEffect, useRef, useState } = React;

let CONFIG = { brand: "Beta X", links: {}, whitelist: [] };
let SSS_TR = [];
let SSS_EN = [];

/* ---------------------------
   AUTO SCROLL (GELİŞTİRİLMİŞ)
---------------------------- */
function useAutoScroll(dep) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        ref.current.scrollTop = ref.current.scrollHeight;
      }, 50);
    }
  }, [dep]);
  return ref;
}

/* ---------------------------
      CONFIG + SSS LOAD
---------------------------- */
async function loadConfig() {
  const [cfg, tr, en] = await Promise.all([
    fetch("./config.json").then((r) => r.json()),
    fetch("./sss.tr.json").then((r) => r.json()),
    fetch("./sss.en.json").then((r) => r.json()).catch(() => []),
  ]);

  CONFIG = cfg;
  SSS_TR = tr;
  SSS_EN = en;
}

/* ---------------------------
        LINK STERİLİZASYONU
---------------------------- */
function sanitizeLinks(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\[link kaldırıldı\]/g, "");
}

/* ---------------------------
       CHAT BACKEND REQUEST
---------------------------- */
async function askBackend(userText) {
  const res = await fetch("http://localhost:3001/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: userText }),
  });

  const data = await res.json();
  return data.answer;
}

/* ==========================================================
   ✅ LOCAL TEST (Senin Soruların)
=========================================================== */
const BETA_TEST = [
  {
    id: "q1",
    text: "Bir işi yaparken zamanın yetmeyeceğini fark ettiğiniz an genelde ne yaparsınız?",
    options: {
      A: "Yapabildiğim kısmı en iyi şekilde bitirmeye odaklanırım",
      B: "Süreyi uzatma ihtimalini araştırırım",
      C: "Öncelikleri değiştirerek işi sadeleştiririm",
      D: "Son ana kadar çalışmaya devam ederim",
    },
  },
  {
    id: "q2",
    text: "Ekip içinde sizden farklı düşünen biriyle çalışırken hangisi size daha yakındır?",
    options: {
      A: "Kendi bakış açımı korurum",
      B: "Ortak bir yol bulmaya çalışırım",
      C: "Tartışmayı fazla uzatmam",
      D: "Karşı tarafın yaklaşımını denerim",
    },
  },
  {
    id: "q3",
    text: "Size yabancı bir konuda sorumluluk verildiğinde ilk adımınız genelde ne olur?",
    options: {
      A: "Benzer örnekleri incelerim",
      B: "Birinden hızlıca yönlendirme isterim",
      C: "Deneme–yanılma ile ilerlerim",
      D: "Süreci gözlemleyip sonra harekete geçerim",
    },
  },
  {
    id: "q4",
    text: "Hata yaptığınız bir durumda sizi en iyi tanımlayan davranış hangisidir?",
    options: {
      A: "Hatanın neden oluştuğunu anlamaya çalışırım",
      B: "Telafi etmenin yolunu ararım",
      C: "Süreci yeniden planlarım",
      D: "Bir dahaki sefer tekrarlamamak için not alırım",
    },
  },
  {
    id: "q5",
    text: "Aynı anda birden fazla görev olduğunda hangisi size daha doğaldır?",
    options: {
      A: "Zor olanla başlamak",
      B: "Hızlı bitecekleri aradan çıkarmak",
      C: "En kritik olanı öncelemek",
      D: "Görevleri sıraya koymak",
    },
  },
  {
    id: "q6",
    text: "Bir ekip arkadaşınız beklenen performansı gösteremediğinde ne yaparsınız?",
    options: {
      A: "Kendi sorumluluğuma odaklanırım",
      B: "Destek ihtiyacı olup olmadığını sorarım",
      C: "Durumu yöneticimle paylaşırım",
      D: "Sürecin kendiliğinden düzelmesini beklerim",
    },
  },
  {
    id: "q7",
    text: "Aldığınız geri bildirimler genelde sizde nasıl bir etki bırakır?",
    options: {
      A: "Üzerinde düşünürüm",
      B: "Anında uygulamaya çalışırım",
      C: "Önce sindirmeye ihtiyaç duyarım",
      D: "Zamanla anlam kazanır",
    },
  },
  {
    id: "q8",
    text: "Yeni bir araç veya teknolojiyle çalışmanız gerektiğinde hangisi sizi daha iyi anlatır?",
    options: {
      A: "Temelini öğrenip ilerlerim",
      B: "Detaylara hâkim olmaya çalışırım",
      C: "İhtiyacım kadar öğrenirim",
      D: "Önce başkalarının nasıl kullandığını izlerim",
    },
  },
  {
    id: "q9",
    text: "Uzun süren, tekrar eden işlerde genelde nasıl ilerlersiniz?",
    options: {
      A: "Rutin oluşturarak",
      B: "Kendime ara hedefler koyarak",
      C: "Arada yöntem değiştirerek",
      D: "Sonuca odaklanarak",
    },
  },
  {
    id: "q10",
    text: "Beklenmedik bir problemle karşılaştığınızda ilk refleksiniz hangisine yakındır?",
    options: {
      A: "Mevcut durumu analiz etmek",
      B: "Alternatifleri düşünmek",
      C: "Birine danışmak",
      D: "Hızlı bir geçici çözüm üretmek",
    },
  },
];

/* ==========================================================
   ✅ Local Skorlama (OpenAI yok)
=========================================================== */
function scoreBetaTest(answers) {
  const WEIGHTS = {
    analytic: 20,
    teamwork: 15,
    learning: 15,
    responsibility: 15,
    timePriority: 15,
    communication: 10,
    riskInitiative: 10,
  };

  const DIM_ITEMS = {
    analytic: ["q1", "q3", "q10"],
    teamwork: ["q2", "q6"],
    learning: ["q3", "q8"],
    responsibility: ["q4"],
    timePriority: ["q5"],
    communication: ["q2", "q7"],
    riskInitiative: ["q3", "q10"],
  };

  const RUBRIC = {
    q1: { ideal: ["C"], mid: ["A", "B"] },
    q2: { ideal: ["B"], mid: ["D"] },
    q3: { ideal: ["A", "B"], mid: ["D"] },
    q4: { ideal: ["B", "C", "D"], mid: ["A"] },
    q5: { ideal: ["C", "D"], mid: ["A"] },
    q6: { ideal: ["B"], mid: ["A", "C"] },
    q7: { ideal: ["A", "C"], mid: ["B", "D"] },
    q8: { ideal: ["A", "D"], mid: ["B"] },
    q10: { ideal: ["A"], mid: ["B", "D"] },
  };

  const RISK_OVERRIDES = {
    q3: { ideal: ["C"], mid: ["D"] },
    q10: { ideal: ["D"], mid: ["B"] },
  };

  function itemScore(qid, choice, mode = "default") {
    const map = mode === "risk" ? (RISK_OVERRIDES[qid] || RUBRIC[qid]) : RUBRIC[qid];
    if (!map || !choice) return 0;

    const c = String(choice).trim().toUpperCase();
    if (map.ideal?.includes(c)) return 1.0;
    if (map.mid?.includes(c)) return 0.5;
    return 0;
  }

  const dimScores = {};
  for (const dim of Object.keys(DIM_ITEMS)) {
    const items = DIM_ITEMS[dim];
    let raw = 0;

    for (const qid of items) {
      const choice = answers[qid];
      const s = dim === "riskInitiative" ? itemScore(qid, choice, "risk") : itemScore(qid, choice, "default");
      raw += s;
    }

    const normalized = raw / items.length;
    dimScores[dim] = Math.round(normalized * 100);
  }

  let overall = 0;
  for (const dim of Object.keys(WEIGHTS)) {
    overall += (dimScores[dim] / 100) * WEIGHTS[dim];
  }
  overall = Math.round(overall);

  function levelText(v) {
    if (v >= 75) return "güçlü";
    if (v >= 50) return "orta";
    return "geliştirilebilir";
  }

  const summary =
    `Test Skoru: ${overall}/100.\n` +
    `Analitik: ${levelText(dimScores.analytic)} | Takım uyumu: ${levelText(dimScores.teamwork)} | ` +
    `Öğrenme: ${levelText(dimScores.learning)} | Sorumluluk: ${levelText(dimScores.responsibility)}\n` +
    `Zaman & öncelik: ${levelText(dimScores.timePriority)} | İletişim: ${levelText(dimScores.communication)} | ` +
    `Risk & inisiyatif: ${levelText(dimScores.riskInitiative)}.`;

  return { overall, dimScores, summary };
}

/* ==========================================================
                        APP COMPONENT
=========================================================== */
function App() {
  const [ready, setReady] = useState(false);

  /* Chat */
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Merhaba! Ben BetaX İK asistanıyım. Nasıl yardımcı olabilirim?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  /* CV Upload */
  const [showPopup, setShowPopup] = useState(false);

  /* Giriş Seçimi + Bilgi Formu */
  const [showEntryModal, setShowEntryModal] = useState(true);
  const [entryStep, setEntryStep] = useState("choose");
  const [selectedMode, setSelectedMode] = useState(null);
  const [entryError, setEntryError] = useState("");

  //mobil ekran linkler kayma sorunu
  const [showLinks, setShowLinks] = useState(false);


  const [candidate, setCandidate] = useState({
    name: "",
    surname: "",
    university: "",
    department: "",
    grade: "",
  });

  /* LOCAL Test */
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [testStep, setTestStep] = useState("questions");
  const [testAnswers, setTestAnswers] = useState({});
  const [sendingResult, setSendingResult] = useState(false);
  const [testError, setTestError] = useState("");

  /* TIMER STATE */
  const [testStartTime, setTestStartTime] = useState(null);
  const [answerTimestamps, setAnswerTimestamps] = useState([]);

    /* THEME (dark/light) */
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("beta_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("beta_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }


  const chatRef = useAutoScroll([messages, busy]);

  /* ---------------------------
           LOAD CONFIG
  ---------------------------- */
  useEffect(() => {
    loadConfig().then(() => setReady(true));
  }, []);

  /* ---------------------------
        CV ANALYZE
  ---------------------------- */
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    analyzeCV(file);
  }

  async function analyzeCV(file) {
    const formData = new FormData();
    formData.append("file", file);

    formData.append("flowType", "cv");
    formData.append("name", candidate.name || "");
    formData.append("surname", candidate.surname || "");
    formData.append("university", candidate.university || "");
    formData.append("department", candidate.department || "");
    formData.append("grade", candidate.grade || "");

    setBusy(true);
    try {
      const res = await fetch("http://localhost:3001/api/analyze-cv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // ✅ UI bozulmasın: backend analysis alanına candidateFeedback döndürüyor
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "📄 CV Analizi:\n\n" + data.analysis },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "CV analizinde hata oluştu: " + err.message },
      ]);
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------
          SEND MESSAGE
  ---------------------------- */
  async function send() {
    if (!input.trim()) return;
    const text = input.trim();

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setBusy(true);

    try {
      const reply = await askBackend(text);
      setMessages((m) => [...m, { role: "assistant", content: sanitizeLinks(reply) }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "Hata oluştu: " + err.message }]);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleCandidateChange(e) {
    setCandidate((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  /* ---------------------------
       ENTRY MODAL LOGIC
  ---------------------------- */
  function chooseMode(mode) {
    setSelectedMode(mode);
    setEntryError("");

    if (mode === "chat") {
      setShowEntryModal(false);
      return;
    }
    setEntryStep("info");
  }

  function handleEntryInfoSubmit(e) {
    e.preventDefault();
    setEntryError("");

    const { name, surname, university, department, grade } = candidate;
    if (!name || !surname || !university || !department || !grade) {
      setEntryError("Lütfen tüm alanları doldurduğunuzdan emin olun.");
      return;
    }

    if (selectedMode === "cv") {
      setShowEntryModal(false);
      setShowPopup(true);
    } else if (selectedMode === "test") {
      setShowEntryModal(false);
      startLocalTestFlow();
    } else {
      setShowEntryModal(false);
    }
  }

  function startLocalTestFlow() {
    setTestAnswers({});
    setAnswerTimestamps([]);
    setTestError("");
    setTestStartTime(Date.now());
    setTestStep("questions");
    setShowPersonalityModal(true);
  }

  /* ---------------------------
      STORE EACH TEST ANSWER
  ---------------------------- */
  function handleTestAnswer(qid, value) {
    setTestAnswers((prev) => ({ ...prev, [qid]: String(value).toUpperCase() }));
    setAnswerTimestamps((prev) => [...prev, Date.now()]);
  }

  /* ---------------------------
         FINISH LOCAL TEST
  ---------------------------- */
  async function finishLocalTest() {
    const missing = BETA_TEST.filter((q) => !testAnswers[q.id]);
    if (missing.length > 0) {
      setTestError("Tüm soruları işaretlediğinizden emin olun.");
      return;
    }

    const totalDuration = Math.round((Date.now() - testStartTime) / 1000);
    const avgDuration = Math.round((Date.now() - testStartTime) / BETA_TEST.length / 1000);

    const scored = scoreBetaTest(testAnswers);

    setSendingResult(true);

    try {
      const payload = {
        type: "test",
        name: candidate.name || null,
        surname: candidate.surname || null,
        university: candidate.university || null,
        department: candidate.department || null,
        grade: candidate.grade || null,

        answers: testAnswers,
        score: Number(scored.overall),
        dimensions: scored.dimScores,
        summary: scored.summary,

        totalDuration: Number(totalDuration),
        avgDuration: Number(avgDuration),
        timestamps: answerTimestamps.map((t) => Number(t)),
      };

      const res = await fetch("http://localhost:3001/api/send-test-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bilinmeyen hata");

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "✅ Testi başarıyla tamamladınız.\n\n" +
            scored.summary +
            "\n\nSonuçlarınız İK ekibimize iletildi.",
        },
      ]);

      setTestStep("finished");
    } catch (err) {
      setTestError("Gönderim hatası: " + err.message);
    } finally {
      setSendingResult(false);
    }
  }

  /* ---------------------------
           RENDER
  ---------------------------- */
  if (!ready) return <div className="app">Yükleniyor...</div>;

  return (
    <div className="app">

      <header className="header">
             
        <h1>
          <img src="./logo-beta-enerji.png" className="brandLogo" />
          Beta X
        </h1>
         <div className="mobileBrand">
  <div className="mobileBrandTitle">Beta Enerji</div>
  <div className="mobileBrandSub">Türkiye’nin dönüştürücü gücü</div>
</div>
        <div className="headerRight">
          <div className="small">
            Başvurular için: {CONFIG?.links?.careers_tr} • Staj: {CONFIG?.links?.intern_tr}
          </div>
          <button
            type="button"
            className="themeBtn"
            onClick={toggleTheme}
            aria-label="Tema değiştir"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            className="linksBtn"
            onClick={() => setShowLinks((s) => !s)}
            aria-label="Linkler"
            title="Linkler"
          >
            🔗
          </button>
        </div>
      </header>
      {showLinks && (
        <div className="linksMenu" onMouseLeave={() => setShowLinks(false)}>
          <a href={CONFIG?.links?.careers_tr} target="_blank" rel="noreferrer">
            Başvurular
          </a>
          <a href={CONFIG?.links?.intern_tr} target="_blank" rel="noreferrer">
            Staj
          </a>
        </div>
      )}

      <main ref={chatRef} className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div
              className="bubble"
              dangerouslySetInnerHTML={{ __html: marked.parse(m.content || "") }}
            ></div>
          </div>
        ))}
        {busy && (
          <div className="msg assistant">
            <div className="bubble">Yazıyor…</div>
          </div>
        )}
      </main>

      {/* INPUT BAR */}
      <div className="inputBar">
        <div className="row">
          <input
            type="text"
            placeholder="Sorunuzu yazın..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={busy}
          />

          <button type="button" onClick={send} disabled={busy}>
            📤
          </button>

          <button type="button" className="plusBtn" onClick={() => setShowPopup(!showPopup)}>
            ➕
          </button>
        </div>
      </div>

      {/* CV POPUP */}
      {showPopup && (
        <div className="popup">
          <label htmlFor="cvFile" className="uploadBtn">
            📄 Özgeçmiş Yükle
          </label>
          <input
            id="cvFile"
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* GİRİŞ MODALI */}
      {showEntryModal && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <h2>Başlamadan Önce</h2>
              <button
                className="closeBtn"
                onClick={() => {
                  setShowEntryModal(false);
                  setSelectedMode("chat");
                }}
              >
                ✕
              </button>
            </div>

            {entryStep === "choose" && (
              <div className="modalBody">
                <p className="modalDesc">
                  Devam etmek için aşağıdaki seçeneklerden birini tercih edebilirsiniz.
                </p>
                <div className="modeGrid">
                  <button
                    type="button"
                    className={`modeBtn ${selectedMode === "cv" ? "active" : ""}`}
                    onClick={() => chooseMode("cv")}
                  >
                    <span className="modeEmoji">📄</span>
                    <span className="modeTitle">CV Yükle</span>
                    <span className="modeText">Özgeçmişinizi yükleyin, sistem sizin için analiz etsin.</span>
                  </button>

                  <button
                    type="button"
                    className={`modeBtn ${selectedMode === "test" ? "active" : ""}`}
                    onClick={() => chooseMode("test")}
                  >
                    <span className="modeEmoji">🧠</span>
                    <span className="modeTitle">Kısa Test</span>
                    <span className="modeText">Kısa bir davranış testi ile eğilimlerinizi ölçelim.</span>
                  </button>

                  <button
                    type="button"
                    className={`modeBtn ${selectedMode === "chat" ? "active" : ""}`}
                    onClick={() => chooseMode("chat")}
                  >
                    <span className="modeEmoji">💬</span>
                    <span className="modeTitle">Sadece Sohbet</span>
                    <span className="modeText">Doğrudan İK asistanı ile sohbet etmeye başlayın.</span>
                  </button>
                </div>
              </div>
            )}

            {entryStep === "info" && (
              <form className="modalBody" onSubmit={handleEntryInfoSubmit}>
                <p className="modalDesc">Devam edebilmemiz için lütfen temel bilgilerinizi doldun.</p>

                <div className="fieldRow">
                  <div className="field">
                    <label>Ad</label>
                    <input name="name" value={candidate.name} onChange={handleCandidateChange} />
                  </div>
                  <div className="field">
                    <label>Soyad</label>
                    <input name="surname" value={candidate.surname} onChange={handleCandidateChange} />
                  </div>
                </div>

                <div className="field">
                  <label>Üniversite</label>
                  <input name="university" value={candidate.university} onChange={handleCandidateChange} />
                </div>

                <div className="field">
                  <label>Bölüm</label>
                  <input name="department" value={candidate.department} onChange={handleCandidateChange} />
                </div>

                <div className="field">
                  <label>Sınıf</label>
                  <input
                    name="grade"
                    value={candidate.grade}
                    onChange={handleCandidateChange}
                    placeholder="Örn: 3, 4, Mezun"
                  />
                </div>

                {entryError && <div className="errorBox">{entryError}</div>}

                <div className="modalFooter">
                  <button
                    type="button"
                    className="ghostBtn"
                    onClick={() => {
                      setShowEntryModal(false);
                      setSelectedMode("chat");
                    }}
                  >
                    Atla ve Sohbete Başla
                  </button>
                  <button type="submit" className="primaryBtn">
                    Kaydet ve Devam Et
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* LOCAL TEST MODALI */}
      {showPersonalityModal && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <h2>Kısa Davranış Testi</h2>
              <button className="closeBtn" onClick={() => setShowPersonalityModal(false)}>
                ✕
              </button>
            </div>

            {testStep === "questions" && (
              <div className="modalBody testModalBody">
                <p className="modalDesc">
                  Aşağıdaki sorular için <strong>A–B–C–D</strong> seçeneklerinden birini işaretleyin.
                </p>

                <div className="questionsList">
                  {BETA_TEST.map((q, i) => (
                    <div key={q.id} className="hexacoQuestion">
                      <div className="qText">
                        <span className="qIndex">{i + 1}.</span> {q.text}
                      </div>

                      <div className="likertRow" style={{ gap: 10, flexWrap: "wrap" }}>
                        {["A", "B", "C", "D"].map((k) => (
                          <label key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="radio"
                              name={q.id}
                              value={k}
                              checked={testAnswers[q.id] === k}
                              onChange={(e) => handleTestAnswer(q.id, e.target.value)}
                            />
                            <span>
                              <strong>{k})</strong> {q.options[k]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {testError && <div className="errorBox">{testError}</div>}

                <div className="modalFooter">
                  <button
                    type="button"
                    className="ghostBtn"
                    onClick={() => setShowPersonalityModal(false)}
                    disabled={sendingResult}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    className="primaryBtn"
                    onClick={finishLocalTest}
                    disabled={sendingResult}
                  >
                    {sendingResult ? "Gönderiliyor..." : "Testi Bitir ve Gönder"}
                  </button>
                </div>
              </div>
            )}

            {testStep === "finished" && (
              <div className="modalBody">
                <p className="modalDesc">
                  Testi tamamladığınız için teşekkür ederiz. 🌟
                  <br />
                  Sonuçlarınız insan kaynakları ekibine iletildi.
                </p>
                <div className="modalFooter">
                  <button type="button" className="primaryBtn" onClick={() => setShowPersonalityModal(false)}>
                    Sohbete Başla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
