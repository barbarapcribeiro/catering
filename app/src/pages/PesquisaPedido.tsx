import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAppData } from "../mock/AppDataContext";
import type { SurveyQuestion } from "../types";
import "./PesquisaPedido.css";

const NPS_SCALE = Array.from({ length: 11 }, (_, i) => i);
const STARS = [1, 2, 3, 4, 5];

export function PesquisaPedido() {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, surveyQuestions, addSurveyResponse } = useAppData();
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [submitted, setSubmitted] = useState(false);

  const order = orders.find((o) => o.id.replace(/^#/, "") === orderId);
  const activeQuestions = surveyQuestions.filter((q) => q.active);
  const answeredCount = Object.keys(answers).length;

  const setAnswer = (questionId: string, value: number | string) => {
    setAnswers((a) => ({ ...a, [questionId]: value }));
  };

  const submit = () => {
    addSurveyResponse({
      kind: "pedido",
      orderId: order?.id,
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
    });
    setSubmitted(true);
  };

  const renderQuestion = (q: SurveyQuestion) => {
    const value = answers[q.id];
    if (q.type === "NPS") {
      return (
        <div className="pp-scale">
          {NPS_SCALE.map((n) => (
            <button key={n} className={`pp-scale__btn ${value === n ? "is-selected" : ""}`} onClick={() => setAnswer(q.id, n)}>
              {n}
            </button>
          ))}
        </div>
      );
    }
    if (q.type === "Estrelas") {
      return (
        <div className="pp-stars">
          {STARS.map((n) => (
            <button key={n} className="pp-stars__btn" onClick={() => setAnswer(q.id, n)} aria-label={`${n} estrelas`}>
              {typeof value === "number" && n <= value ? "★" : "☆"}
            </button>
          ))}
        </div>
      );
    }
    return (
      <textarea
        className="pp-textarea"
        rows={3}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => setAnswer(q.id, e.target.value)}
        placeholder="Escreva aqui..."
      />
    );
  };

  if (submitted) {
    return (
      <div className="pp-page">
        <div className="pp-card pp-card--thanks">
          <div className="pp-thanks-icon">✓</div>
          <h1 className="pp-thanks-title">Obrigado pela sua avaliação!</h1>
          <p className="pp-thanks-sub">Sua resposta foi registrada e ajuda a melhorar nosso atendimento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      <div className="pp-card">
        <div className="pp-brand">
          <span className="pp-brand__mark">S</span> Sodexo Direct
        </div>
        <h1 className="pp-title">Como foi sua experiência?</h1>
        <p className="pp-subtitle">
          {order ? (
            <>
              Pedido <strong>{order.id}</strong> · {order.type}
            </>
          ) : (
            "Conte pra gente como foi o seu pedido."
          )}
        </p>

        <div className="pp-questions">
          {activeQuestions.map((q) => (
            <div className="pp-question" key={q.id}>
              <div className="pp-question__text">{q.text}</div>
              {renderQuestion(q)}
            </div>
          ))}
          {activeQuestions.length === 0 && <div className="pp-empty">Nenhuma pergunta configurada no momento.</div>}
        </div>

        <button className="pp-submit" disabled={answeredCount === 0} onClick={submit}>
          Enviar avaliação
        </button>
      </div>
    </div>
  );
}
