import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { ORDER_CATEGORIES, type SurveyQuestion } from "../../types";
import "./ConfigurarPesquisa.css";

const TYPE_STYLE: Record<SurveyQuestion["type"], { label: string; bg: string; color: string; scale: string | null }> = {
  NPS: { label: "Escala NPS (0-10)", bg: "var(--color-primary-soft)", color: "var(--color-primary)", scale: "0 a 10" },
  Estrelas: { label: "Estrelas (1-5)", bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)", scale: "1 a 5 estrelas" },
  Texto: { label: "Resposta em texto", bg: "var(--color-info-soft)", color: "var(--color-info)", scale: null },
};
const TYPE_ORDER: SurveyQuestion["type"][] = ["NPS", "Estrelas", "Texto"];

export function ConfigurarPesquisa() {
  const { surveyQuestions, addSurveyQuestion, updateSurveyQuestion, removeSurveyQuestion, reorderSurveyQuestion, showToast } = useAppData();
  const [category, setCategory] = useState<(typeof ORDER_CATEGORIES)[number]>(ORDER_CATEGORIES[0]);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<SurveyQuestion["type"]>("NPS");

  const categoryQuestions = surveyQuestions.filter((q) => q.orderCategory === category);
  const activeCount = categoryQuestions.filter((q) => q.active).length;
  const totalCount = categoryQuestions.length;
  const newTextEmpty = !newText.trim();

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    addSurveyQuestion(text, newType, category);
    setNewText("");
    showToast("Pergunta adicionada com sucesso!");
  };

  const handleRemove = (id: string) => {
    removeSurveyQuestion(id);
    showToast("Pergunta removida.");
  };

  return (
    <div className="pesquisa-page">
      <div className="pesquisa-header">
        <h1 className="pesquisa-title">Pesquisa de Satisfação</h1>
        <div className="pesquisa-subtitle">
          Cada tipo de pedido tem seu próprio conjunto de perguntas, enviadas após a entrega. Elas alimentam o relatório de satisfação daquele tipo.
        </div>
      </div>

      <div className="tab-row" style={{ marginBottom: 18 }}>
        {ORDER_CATEGORIES.map((c) => (
          <button key={c} className={category === c ? "is-active" : ""} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="card pesquisa-list-card">
        <div className="pesquisa-list-head">
          <div className="pesquisa-list-title">Perguntas ativas &middot; {category}</div>
          <span className="pesquisa-count-pill">
            {activeCount} de {totalCount}
          </span>
        </div>
        <div className="pesquisa-list-hint">Reordene com as setas, edite o texto, ou desative sem perder o histórico.</div>

        <div className="pesquisa-questions">
          {categoryQuestions.map((q, i) => {
            const ts = TYPE_STYLE[q.type];
            const isFirst = i === 0;
            const isLast = i === categoryQuestions.length - 1;
            return (
              <div className={`pesquisa-question ${q.active ? "" : "is-inactive"}`} key={q.id}>
                <div className="pesquisa-question__body">
                  <div className="pesquisa-question__reorder">
                    <button
                      className="pesquisa-question__arrow pesquisa-question__arrow--up"
                      disabled={isFirst}
                      onClick={() => reorderSurveyQuestion(q.id, -1)}
                      aria-label="Mover para cima"
                    >
                      ▲
                    </button>
                    <button
                      className="pesquisa-question__arrow pesquisa-question__arrow--down"
                      disabled={isLast}
                      onClick={() => reorderSurveyQuestion(q.id, 1)}
                      aria-label="Mover para baixo"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="pesquisa-question__content">
                    <div className="pesquisa-question__meta">
                      <span className="pesquisa-type-badge" style={{ background: ts.bg, color: ts.color }}>
                        {ts.label}
                      </span>
                    </div>
                    <textarea
                      className="pesquisa-question__textarea"
                      value={q.text}
                      rows={2}
                      onChange={(e) => updateSurveyQuestion(q.id, { text: e.target.value })}
                    />
                    {ts.scale && <div className="pesquisa-question__scale">Escala: {ts.scale}</div>}
                  </div>

                  <div className="pesquisa-question__side">
                    <label className="pesquisa-question__active">
                      <input
                        type="checkbox"
                        checked={q.active}
                        onChange={() => updateSurveyQuestion(q.id, { active: !q.active })}
                      />
                      Ativa
                    </label>
                    <button className="pesquisa-question__remove" onClick={() => handleRemove(q.id)}>
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {categoryQuestions.length === 0 && <div className="empty-state">Nenhuma pergunta cadastrada ainda para {category}.</div>}
      </div>

      <div className="card pesquisa-add-card">
        <div className="pesquisa-list-title" style={{ marginBottom: 14 }}>
          Adicionar nova pergunta &middot; {category}
        </div>
        <div className="pesquisa-add-form">
          <label className="field-label">
            Texto da pergunta
            <textarea
              rows={2}
              placeholder="Ex: O quanto você recomendaria nosso serviço a um colega?"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
          </label>
          <div>
            <div className="pesquisa-add-form__label">Tipo de resposta</div>
            <div className="pesquisa-type-options">
              {TYPE_ORDER.map((t) => {
                const active = newType === t;
                return (
                  <button
                    key={t}
                    className={`pesquisa-type-option ${active ? "is-active" : ""}`}
                    onClick={() => setNewType(t)}
                  >
                    {TYPE_STYLE[t].label}
                  </button>
                );
              })}
            </div>
          </div>
          <button className="btn btn--primary pesquisa-add-btn" disabled={newTextEmpty} onClick={handleAdd}>
            + Adicionar pergunta
          </button>
        </div>
      </div>
    </div>
  );
}
