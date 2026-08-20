import { useState } from "react";
import { useAppData } from "../mock/AppDataContext";
import { ProfileSwitcher } from "../components/ProfileSwitcher";
import { QrPlaceholder } from "../components/QrPlaceholder";
import { Toast } from "../components/Toast";
import "./HomeConsumidor.css";

export function HomeConsumidor() {
  const { orders, surveyQuestions, addSurveyResponse, showToast } = useAppData();
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);

  const starsQuestion = surveyQuestions.find((q) => q.active && q.type === "Estrelas");

  const submit = () => {
    if (!starsQuestion || rating === 0) return;
    const lastDelivered = [...orders]
      .filter((o) => o.status === "Entregue" || o.status === "Finalizado")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    addSurveyResponse({
      kind: "pedido",
      orderId: lastDelivered?.id,
      answers: [{ questionId: starsQuestion.id, value: rating }],
    });
    setSent(true);
    showToast("Obrigado pelo seu feedback!");
  };

  return (
    <div className="consumidor-page">
      <div className="consumidor-page__bar">
        <ProfileSwitcher />
      </div>
      <div className="consumidor-card">
        <QrPlaceholder size={120} />
        <h1 className="consumidor-card__title">Como foi sua experiência?</h1>
        <div className="consumidor-card__subtitle">
          {starsQuestion?.text ?? "Avalie o pedido que você acabou de receber."}
        </div>

        {!sent ? (
          <>
            <div className="consumidor-card__stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`consumidor-card__star ${n <= rating ? "is-active" : ""}`}
                  onClick={() => setRating(n)}
                  aria-label={`${n} estrelas`}
                >
                  ★
                </button>
              ))}
            </div>
            <button className="btn btn--primary btn--full" disabled={rating === 0 || !starsQuestion} onClick={submit}>
              Enviar avaliação
            </button>
            {!starsQuestion && (
              <div className="consumidor-card__subtitle" style={{ marginTop: 8 }}>
                Nenhuma pergunta de estrelas configurada ainda.
              </div>
            )}
          </>
        ) : (
          <div className="consumidor-card__thanks">Avaliação enviada. Obrigado! 🎉</div>
        )}
      </div>
      <Toast />
    </div>
  );
}
