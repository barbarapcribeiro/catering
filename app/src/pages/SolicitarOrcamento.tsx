import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import { QUOTE_SERVICE_TYPES, QUOTE_EXPERIENCE_OPTIONS, type QuoteServiceType, type QuoteExperience } from "../types";
import "./SolicitarOrcamento.css";

type StepId =
  | "serviceType"
  | "expectedDate"
  | "peopleCount"
  | "experience"
  | "wants"
  | "specialDiet"
  | "specialDietDetails"
  | "decoration"
  | "costCenter"
  | "review"
  | "done";

interface ChatMsg {
  from: "bot" | "user";
  text: string;
}

const STEP_QUESTIONS: Record<Exclude<StepId, "review" | "done">, string> = {
  serviceType: "Olá! Vou te ajudar a montar um orçamento personalizado. Qual o tipo de serviço?",
  expectedDate: "Para quando você precisa?",
  peopleCount: "Quantas pessoas vão participar?",
  experience: "Qual experiência você quer proporcionar?",
  wants: "Me conta o que você imagina para esse evento — o que vai querer?",
  specialDiet: "Vai querer itens para dietas especiais?",
  specialDietDetails: "Quais restrições ou preferências? (ex.: vegetariano, sem glúten, sem lactose...)",
  decoration: "Quer decoração ou outros itens para melhorar a experiência?",
  costCenter: "Por qual centro de custo isso deve ser faturado?",
};

export function SolicitarOrcamento() {
  const navigate = useNavigate();
  const { costCenters, currentUser, addQuoteRequest, addNotification, showToast } = useAppData();
  const activeCostCenters = costCenters.filter((c) => c.active);

  const [step, setStep] = useState<StepId>("serviceType");
  const [messages, setMessages] = useState<ChatMsg[]>([{ from: "bot", text: STEP_QUESTIONS.serviceType }]);
  const [serviceType, setServiceType] = useState<QuoteServiceType | null>(null);
  const [expectedDate, setExpectedDate] = useState("");
  const [peopleCount, setPeopleCount] = useState("");
  const [experience, setExperience] = useState<QuoteExperience | null>(null);
  const [wants, setWants] = useState("");
  const [specialDiet, setSpecialDiet] = useState<boolean | null>(null);
  const [specialDietDetails, setSpecialDietDetails] = useState("");
  const [decoration, setDecoration] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step]);

  const say = (from: ChatMsg["from"], text: string) => setMessages((m) => [...m, { from, text }]);

  const advanceTo = (next: StepId, userAnswerText: string) => {
    say("user", userAnswerText);
    setStep(next);
    if (next !== "review" && next !== "done") {
      setTimeout(() => say("bot", STEP_QUESTIONS[next]), 250);
    }
  };

  const pickServiceType = (v: QuoteServiceType) => {
    setServiceType(v);
    advanceTo("expectedDate", v);
  };
  const submitDate = () => {
    if (!expectedDate) return;
    advanceTo("peopleCount", new Date(`${expectedDate}T00:00:00`).toLocaleDateString("pt-BR"));
  };
  const submitPeople = () => {
    const n = parseInt(peopleCount);
    if (!n || n <= 0) return;
    advanceTo("experience", `${n} pessoas`);
  };
  const pickExperience = (v: QuoteExperience) => {
    setExperience(v);
    advanceTo("wants", v);
  };
  const submitWants = () => {
    if (!wants.trim()) return;
    advanceTo("specialDiet", wants.trim());
  };
  const pickSpecialDiet = (v: boolean) => {
    setSpecialDiet(v);
    if (v) advanceTo("specialDietDetails", "Sim");
    else advanceTo("decoration", "Não");
  };
  const submitSpecialDietDetails = () => {
    advanceTo("decoration", specialDietDetails.trim() || "Sem detalhes informados");
  };
  const submitDecoration = () => {
    advanceTo("costCenter", decoration.trim() || "Sem preferências de decoração");
  };
  const submitCostCenter = () => {
    if (!costCenter) return;
    const cc = activeCostCenters.find((c) => c.code === costCenter);
    advanceTo("review", cc ? `${cc.code} · ${cc.name}` : costCenter);
  };

  const send = () => {
    if (!serviceType || !experience) return;
    addQuoteRequest({
      serviceType,
      expectedDate,
      peopleCount: parseInt(peopleCount) || 0,
      experience,
      wants: wants.trim(),
      specialDiet: !!specialDiet,
      specialDietDetails: specialDiet ? specialDietDetails.trim() || undefined : undefined,
      decorationNotes: decoration.trim() || undefined,
      costCenterCode: costCenter || undefined,
      requestedBy: currentUser?.name,
    });
    addNotification("Nova solicitação de orçamento recebida — aguardando montagem pela GU.");
    showToast("Solicitação enviada! Você será avisado quando o orçamento estiver pronto.");
    setStep("done");
    say("bot", "Solicitação enviada! Nossa equipe vai preparar um orçamento personalizado e você recebe um aviso assim que estiver pronto.");
  };

  return (
    <Layout>
      <div className="page-container" style={{ paddingTop: 24, maxWidth: 640 }}>
        <button className="order-back-link" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar para a página inicial
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div className="order-header-icon">OR</div>
          <div>
            <h1 className="order-title">Solicitar Orçamento</h1>
            <div className="order-subtitle">Responda as perguntas e receba um orçamento personalizado da nossa equipe.</div>
          </div>
        </div>

        <div className="card orc-chat-card">
          <div className="orc-chat-log">
            {messages.map((m, i) => (
              <div key={i} className={`orc-msg orc-msg--${m.from}`}>
                {m.from === "bot" && <div className="orc-msg__avatar">D</div>}
                <div className="orc-msg__bubble">{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="orc-chat-input">
            {step === "serviceType" && (
              <div className="orc-chip-row">
                {QUOTE_SERVICE_TYPES.map((c) => (
                  <button key={c} className="orc-chip" onClick={() => pickServiceType(c)}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {step === "expectedDate" && (
              <div className="orc-inline-row">
                <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                <button className="btn btn--primary" disabled={!expectedDate} onClick={submitDate}>
                  Avançar
                </button>
              </div>
            )}

            {step === "peopleCount" && (
              <div className="orc-inline-row">
                <input type="number" min={1} value={peopleCount} onChange={(e) => setPeopleCount(e.target.value)} placeholder="Ex.: 25" />
                <button className="btn btn--primary" disabled={!peopleCount || parseInt(peopleCount) <= 0} onClick={submitPeople}>
                  Avançar
                </button>
              </div>
            )}

            {step === "experience" && (
              <div className="orc-chip-row">
                {QUOTE_EXPERIENCE_OPTIONS.map((e) => (
                  <button key={e} className="orc-chip" onClick={() => pickExperience(e)}>
                    {e}
                  </button>
                ))}
              </div>
            )}

            {step === "wants" && (
              <div className="orc-inline-col">
                <textarea rows={3} value={wants} onChange={(e) => setWants(e.target.value)} placeholder="Descreva o que você imagina para esse evento..." />
                <button className="btn btn--primary" disabled={!wants.trim()} onClick={submitWants}>
                  Avançar
                </button>
              </div>
            )}

            {step === "specialDiet" && (
              <div className="orc-chip-row">
                <button className="orc-chip" onClick={() => pickSpecialDiet(true)}>
                  Sim
                </button>
                <button className="orc-chip" onClick={() => pickSpecialDiet(false)}>
                  Não
                </button>
              </div>
            )}

            {step === "specialDietDetails" && (
              <div className="orc-inline-col">
                <textarea rows={2} value={specialDietDetails} onChange={(e) => setSpecialDietDetails(e.target.value)} placeholder="Ex.: 3 vegetarianos, 1 sem glúten..." />
                <button className="btn btn--primary" onClick={submitSpecialDietDetails}>
                  Avançar
                </button>
              </div>
            )}

            {step === "decoration" && (
              <div className="orc-inline-col">
                <textarea rows={2} value={decoration} onChange={(e) => setDecoration(e.target.value)} placeholder="Ex.: balões, backdrop temático... (opcional)" />
                <button className="btn btn--primary" onClick={submitDecoration}>
                  Avançar
                </button>
              </div>
            )}

            {step === "costCenter" && (
              <div className="orc-inline-row">
                <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                  <option value="">Selecione o centro de custo</option>
                  {activeCostCenters.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
                <button className="btn btn--primary" disabled={!costCenter} onClick={submitCostCenter}>
                  Avançar
                </button>
              </div>
            )}

            {step === "review" && (
              <div className="orc-review">
                <div className="orc-review__title">Confirme sua solicitação</div>
                <div className="orc-review__grid">
                  <div>
                    <span>Serviço</span>
                    <strong>{serviceType}</strong>
                  </div>
                  <div>
                    <span>Data</span>
                    <strong>{expectedDate ? new Date(`${expectedDate}T00:00:00`).toLocaleDateString("pt-BR") : "—"}</strong>
                  </div>
                  <div>
                    <span>Participantes</span>
                    <strong>{peopleCount}</strong>
                  </div>
                  <div>
                    <span>Experiência</span>
                    <strong>{experience}</strong>
                  </div>
                  <div>
                    <span>Dietas especiais</span>
                    <strong>{specialDiet ? specialDietDetails || "Sim" : "Não"}</strong>
                  </div>
                  <div>
                    <span>Centro de custo</span>
                    <strong>{costCenter}</strong>
                  </div>
                </div>
                <button className="btn btn--primary btn--full" onClick={send}>
                  Enviar solicitação
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="orc-done">
                <button className="btn btn--outline" onClick={() => navigate("/")}>
                  Voltar para a Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
