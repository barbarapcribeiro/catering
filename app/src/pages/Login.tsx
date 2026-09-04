import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../mock/AppDataContext";
import "./Login.css";

export function Login() {
  const { login } = useAppData();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }
    const ok = login(email, password);
    if (!ok) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    setError("");
    navigate("/");
  };

  return (
    <div className="login-page">
      <form className="login-card card" onSubmit={submit}>
        <div className="login-card__brand">Direct Eventos</div>
        <div className="login-card__title">Entrar na sua conta</div>
        <div className="login-card__sub">Use o e-mail e a senha cadastrados para acessar seus pedidos.</div>

        <label className="field-label">
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com" autoFocus />
        </label>
        <label className="field-label">
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </label>

        {error && <div className="error-text">{error}</div>}

        <button type="submit" className="btn btn--primary btn--full" style={{ marginTop: 6 }}>
          Entrar
        </button>

        <div className="login-card__signup">
          Ainda não tem conta? <Link to="/autocadastro">Cadastre-se</Link>
        </div>
      </form>
    </div>
  );
}
