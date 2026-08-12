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
import { AdminStub } from "./pages/admin/AdminStub";

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
            <Route path="ocorrencias" element={<AdminStub title="Ocorrências" />} />
            <Route path="produtos" element={<AdminStub title="Produtos e serviços" />} />
            <Route path="fornecedores" element={<AdminStub title="Fornecedores" />} />
            <Route path="usuarios" element={<AdminStub title="Usuários" />} />
            <Route path="permissoes" element={<AdminStub title="Perfis e permissões" />} />
            <Route path="faturamento" element={<AdminStub title="Faturamento" />} />
            <Route path="centros-custo" element={<AdminStub title="Centros de custo" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}
