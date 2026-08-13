import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppDataProvider } from "./mock/AppDataContext";
import { Home } from "./pages/Home";
import { CoffeeBreakOrder } from "./pages/CoffeeBreakOrder";
import { AbastecimentoOrder } from "./pages/AbastecimentoOrder";
import { EventoEspecialOrder } from "./pages/EventoEspecialOrder";
import { AguaOrder } from "./pages/AguaOrder";
import { Surpreenda } from "./pages/Surpreenda";
import { GerenciarPedidos } from "./pages/GerenciarPedidos";
import { Producao } from "./pages/Producao";
import { FiquePorDentro } from "./pages/FiquePorDentro";
import { Aprovacoes } from "./pages/Aprovacoes";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOperacao } from "./pages/admin/AdminOperacao";
import { Relatorios } from "./pages/admin/Relatorios";
import { ConfigurarPesquisa } from "./pages/admin/ConfigurarPesquisa";
import { Fornecedores } from "./pages/admin/Fornecedores";
import { Produtos } from "./pages/admin/Produtos";
import { Kits } from "./pages/admin/Kits";
import { Servicos } from "./pages/admin/Servicos";
import { Usuarios } from "./pages/admin/Usuarios";
import { Permissoes } from "./pages/admin/Permissoes";
import { Ocorrencias } from "./pages/admin/Ocorrencias";
import { Faturamento } from "./pages/admin/Faturamento";
import { CentrosCusto } from "./pages/admin/CentrosCusto";

export default function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pedido/coffee-break" element={<CoffeeBreakOrder />} />
          <Route path="/pedido/evento-especial" element={<EventoEspecialOrder />} />
          <Route path="/pedido/agua" element={<AguaOrder />} />
          <Route path="/pedido/abastecimento-simples" element={<AbastecimentoOrder />} />
          <Route path="/surpreenda" element={<Surpreenda />} />
          <Route path="/pedidos" element={<GerenciarPedidos />} />
          <Route path="/producao" element={<Producao />} />
          <Route path="/fique-por-dentro" element={<FiquePorDentro />} />
          <Route path="/aprovacoes" element={<Aprovacoes />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOperacao />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="pesquisa-satisfacao" element={<ConfigurarPesquisa />} />
            <Route path="ocorrencias" element={<Ocorrencias />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="kits" element={<Kits />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="permissoes" element={<Permissoes />} />
            <Route path="faturamento" element={<Faturamento />} />
            <Route path="centros-custo" element={<CentrosCusto />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}
