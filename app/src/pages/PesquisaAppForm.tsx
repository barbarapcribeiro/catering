import { useState } from "react";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import { APP_SURVEY_CATEGORIES, type AppSurveyCategory, type AppSurveyQuestion } from "../types";
import "./PesquisaAppForm.css";

const NPS_SCALE = Array.from({ length: 11 }, (_, i) => i);
const STARS = [1, 2, 3, 4, 5];
const SCALE_5 = [1, 2, 3, 4, 5];

const CATEGORY_LABEL: Record<AppSurveyCategory, string> = {
  CX: "Experiência com o atendimento (CX)",
  UX: "Facilidade de uso (UX)",
  NPS: "Recomendação (NPS)",
};
const CATEGORY_COLOR: Record<AppSurveyCategory, string> = {
  CX: "var(--color-info)",
  UX: "var(--color-primary)",
  NPS: "var(--color-star)",
};

export function PesquisaAppForm() {
  const { appSurveyQuestions, addSurveyResponse, currentUser } = useAppData();
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [submitted, setSubmitted] = useState(false);

  const activeQuestions = appSurveyQuestions.filter((q) => q.active);
  const answeredCount = Object.keys(answers).length;

  const setAnswer = (questionId: string, value: number | string) => {
    setAnswers((a) => ({ ...a, [questionId]: value }));
  };

  const submit = () => {
    addSurveyResponse({
      kind: "aplicacao",
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
    });
    setSubmitted(true);
  };

  const renderQuestion = (q: AppSurveyQuestion) => {
    const value = answers[q.id];
    if (q.type === "NPS") {
      return (
        <div className="paf-scale">
          {NPS_SCALE.map((n) => (
            <button key={n} className={`paf-scale__btn ${value === n ? "is-selected" : ""}`} onClick={() => setAnswer(q.id, n)}>
              {n}
            </button>
          ))}
        </div>
      );
    }
    if (q.type === "Estrelas") {
      return (
        <div className="paf-stars">
          {STARS.map((n) => (
            <button key={n} className="paf-stars__btn" onClick={() => setAnswer(q.id, n)} aria-label={`${n} estrelas`}>
              {typeof value === "number" && n <= value ? "★" : "☆"}
            </button>
          ))}
        </div>
      );
    }
    if (q.type === "Escala 1-5") {
      return (
        <div className="paf-scale paf-scale--sm">
          {SCALE_5.map((n) => (
            <button key={n} className={`paf-scale__btn ${value === n ? "is-selected" : ""}`} onClick={() => setAnswer(q.id, n)}>
              {n}
            </button>
          ))}
        </div>
      );
    }
    return (
      <textarea
        className="paf-textarea"
        rows={3}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => setAnswer(q.id, e.target.value)}
        placeholder="Escreva aqui..."
      />
    );
  };

  const byCategory = (cat: AppSurveyCategory) => activeQuestions.filter((q) => q.category === cat);

  return (
    <Layout>
      <div className="page-container paf-page">
        {submitted ? (
          <div className="card paf-thanks">
            <div className="paf-thanks-icon">✓</div>
            <h1 className="paf-thanks-title">Obrigado pelo seu feedback!</h1>
            <p className="paf-thanks-sub">Suas respostas ajudam a melhorar a plataforma Sodexo Direct.</p>
          </div>
        ) : (
          <>
            <div className="paf-header">
              <h1 className="paf-title">Pesquisa da Aplicação</h1>
              <p className="paf-subtitle">
                Olá, {currentUser?.name ?? "colaborador"}! Conte pra gente como está sendo sua experiência de uso da plataforma.
              </p>
            </div>

            {APP_SURVEY_CATEGORIES.map((cat) => {
              const questions = byCategory(cat);
              if (questions.length === 0) return null;
              return (
                <div className="card paf-category" key={cat}>
                  <div className="paf-category__title" style={{ color: CATEGORY_COLOR[cat] }}>
                    <span className="paf-category__dot" style={{ background: CATEGORY_COLOR[cat] }} />
                    {CATEGORY_LABEL[cat]}
                  </div>
                  <div className="paf-questions">
                    {questions.map((q) => (
                      <div className="paf-question" key={q.id}>
                        <div className="paf-question__text">{q.text}</div>
                        {renderQuestion(q)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {activeQuestions.length === 0 && <div className="empty-state">Nenhuma pergunta configurada no momento.</div>}

            {activeQuestions.length > 0 && (
              <button className="btn btn--primary paf-submit" disabled={answeredCount === 0} onClick={submit}>
                Enviar respostas
              </button>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
