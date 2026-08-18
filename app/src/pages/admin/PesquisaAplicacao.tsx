import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { APP_SURVEY_CATEGORIES, type AppSurveyCategory, type AppSurveyQuestion } from "../../types";
import "./ConfigurarPesquisa.css";

const TYPE_ORDER: AppSurveyQuestion["type"][] = ["NPS", "Estrelas", "Escala 1-5", "Texto"];
const TYPE_LABEL: Record<AppSurveyQuestion["type"], string> = {
  NPS: "Escala NPS (0-10)",
  Estrelas: "Estrelas (1-5)",
  "Escala 1-5": "Escala (1-5)",
  Texto: "Resposta em texto",
};

const CATEGORY_STYLE: Record<AppSurveyCategory, { bg: string; color: string }> = {
  CX: { bg: "var(--color-info-soft)", color: "var(--color-info)" },
  UX: { bg: "var(--color-primary-soft)", color: "var(--color-primary)" },
  NPS: { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
};

export function PesquisaAplicacao() {
  const { appSurveyQuestions, addAppSurveyQuestion, updateAppSurveyQuestion, removeAppSurveyQuestion, showToast } = useAppData();
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<AppSurveyQuestion["type"]>("NPS");
  const [newCategory, setNewCategory] = useState<AppSurveyCategory>("NPS");
  const [categoryFilter, setCategoryFilter] = useState<AppSurveyCategory | "todos">("todos");

  const activeCount = appSurveyQuestions.filter((q) => q.active).length;
  const totalCount = appSurveyQuestions.length;
  const newTextEmpty = !newText.trim();

  const filtered = categoryFilter === "todos" ? appSurveyQuestions : appSurveyQuestions.filter((q) => q.category === categoryFilter);

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    addAppSurveyQuestion({ text, type: newType, category: newCategory, active: true });
    setNewText("");
    showToast("Pergunta adicionada com sucesso!");
  };

  const handleRemove = (id: string) => {
    removeAppSurveyQuestion(id);
    showToast("Pergunta removida.");
  };

  return (
    <div className="pesquisa-page">
      <div className="pesquisa-header">
        <h1 className="pesquisa-title">Pesquisa da Aplicação</h1>
        <div className="pesquisa-subtitle">
          Configure as perguntas sobre a experiência com a própria plataforma — CX, UX e NPS. Alimentam o dashboard de Satisfação em Relatórios.
        </div>
      </div>

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={categoryFilter === "todos" ? "is-active" : ""} onClick={() => setCategoryFilter("todos")}>
          Todos
        </button>
        {APP_SURVEY_CATEGORIES.map((c) => (
          <button key={c} className={categoryFilter === c ? "is-active" : ""} onClick={() => setCategoryFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="card pesquisa-list-card">
        <div className="pesquisa-list-head">
          <div className="pesquisa-list-title">Perguntas ativas</div>
          <span className="pesquisa-count-pill">
            {activeCount} de {totalCount}
          </span>
        </div>
        <div className="pesquisa-list-hint">Edite o texto, ajuste a categoria, ou desative sem perder o histórico.</div>

        <div className="pesquisa-questions">
          {filtered.map((q) => {
            const cs = CATEGORY_STYLE[q.category];
            return (
              <div className={`pesquisa-question ${q.active ? "" : "is-inactive"}`} key={q.id}>
                <div className="pesquisa-question__body">
                  <div className="pesquisa-question__content">
                    <div className="pesquisa-question__meta">
                      <span className="pesquisa-type-badge" style={{ background: cs.bg, color: cs.color }}>
                        {q.category}
                      </span>
                      <span className="pesquisa-type-badge" style={{ background: "var(--color-border-soft)", color: "var(--color-text-secondary)" }}>
                        {TYPE_LABEL[q.type]}
                      </span>
                    </div>
                    <textarea
                      className="pesquisa-question__textarea"
                      value={q.text}
                      rows={2}
                      onChange={(e) => updateAppSurveyQuestion(q.id, { text: e.target.value })}
                    />
                  </div>

                  <div className="pesquisa-question__side">
                    <label className="pesquisa-question__active">
                      <input
                        type="checkbox"
                        checked={q.active}
                        onChange={() => updateAppSurveyQuestion(q.id, { active: !q.active })}
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

        {filtered.length === 0 && <div className="empty-state">Nenhuma pergunta encontrada.</div>}
      </div>

      <div className="card pesquisa-add-card">
        <div className="pesquisa-list-title" style={{ marginBottom: 14 }}>
          Adicionar nova pergunta
        </div>
        <div className="pesquisa-add-form">
          <label className="field-label">
            Texto da pergunta
            <textarea
              rows={2}
              placeholder="Ex: O quão fácil foi encontrar o que você precisava?"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
          </label>
          <div>
            <div className="pesquisa-add-form__label">Categoria</div>
            <div className="pesquisa-type-options">
              {APP_SURVEY_CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`pesquisa-type-option ${newCategory === c ? "is-active" : ""}`}
                  onClick={() => setNewCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="pesquisa-add-form__label">Tipo de resposta</div>
            <div className="pesquisa-type-options">
              {TYPE_ORDER.map((t) => (
                <button
                  key={t}
                  className={`pesquisa-type-option ${newType === t ? "is-active" : ""}`}
                  onClick={() => setNewType(t)}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
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
