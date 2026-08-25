import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppDataProvider } from "./mock/AppDataContext";
import { Home } from "./pages/Home";
import { CoffeeBreakOrder } from "./pages/CoffeeBreakOrder";
import { AbastecimentoOrder } from "./pages/AbastecimentoOrder";
import { EventoEspecialOrder } from "./pages/EventoEspecialOrder";
import { AguaOrder } from "./pages/AguaOrder";
import { Surpreenda } from "./pages/Surpreenda";
import { LancheOrder } from "./pages/LancheOrder";
import { ConsumoCatraca } from "./pages/ConsumoCatraca";
import { SolicitarOrcamento } from "./pages/SolicitarOrcamento";
import { GerenciarPedidos } from "./pages/GerenciarPedidos";
import { Producao } from "./pages/Producao";
import { FiquePorDentro } from "./pages/FiquePorDentro";
import { Aprovacoes } from "./pages/Aprovacoes";
import { EventosPremium } from "./pages/EventosPremium";
import { PesquisaPedido } from "./pages/PesquisaPedido";
import { PesquisaAppForm } from "./pages/PesquisaAppForm";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOperacao } from "./pages/admin/AdminOperacao";
import { Relatorios } from "./pages/admin/Relatorios";
import { ConfigurarPesquisa } from "./pages/admin/ConfigurarPesquisa";
import { PesquisaAplicacao } from "./pages/admin/PesquisaAplicacao";
import { Fornecedores } from "./pages/admin/Fornecedores";
import { Produtos } from "./pages/admin/Produtos";
import { Kits } from "./pages/admin/Kits";
import { Servicos } from "./pages/admin/Servicos";
import { Decoracoes } from "./pages/admin/Decoracoes";
import { Popups } from "./pages/admin/Popups";
import { Parametros } from "./pages/admin/Parametros";
import { Ativos } from "./pages/admin/Ativos";
import { TiposAtivo } from "./pages/admin/TiposAtivo";
import { AtivoCheckInOut } from "./pages/admin/AtivoCheckInOut";
import { CatracaCheckIn } from "./pages/admin/CatracaCheckIn";
import { Orcamentos } from "./pages/admin/Orcamentos";
import { OrcamentoBuilder } from "./pages/admin/OrcamentoBuilder";
import { Usuarios } from "./pages/admin/Usuarios";
import { Permissoes } from "./pages/admin/Permissoes";
import { Ocorrencias } from "./pages/admin/Ocorrencias";
import { Faturamento } from "./pages/admin/Faturamento";
import { CentrosCusto } from "./pages/admin/CentrosCusto";
import { Contratos } from "./pages/admin/Contratos";

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
          <Route path="/pedido/lanche" element={<LancheOrder />} />
          <Route path="/consumo-catraca" element={<ConsumoCatraca />} />
          <Route path="/solicitar-orcamento" element={<SolicitarOrcamento />} />
          <Route path="/pedidos" element={<GerenciarPedidos />} />
          <Route path="/producao" element={<Producao />} />
          <Route path="/fique-por-dentro" element={<FiquePorDentro />} />
          <Route path="/aprovacoes" element={<Aprovacoes />} />
          <Route path="/eventos-premium" element={<EventosPremium />} />
          <Route path="/pesquisa-pedido/:orderId" element={<PesquisaPedido />} />
          <Route path="/pesquisa-pedido" element={<PesquisaPedido />} />
          <Route path="/pesquisa-app" element={<PesquisaAppForm />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOperacao />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="relatorios/:dash" element={<Relatorios />} />
            <Route path="pesquisa-satisfacao" element={<ConfigurarPesquisa />} />
            <Route path="pesquisa-aplicacao" element={<PesquisaAplicacao />} />
            <Route path="ocorrencias" element={<Ocorrencias />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="kits" element={<Kits />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="decoracoes" element={<Decoracoes />} />
            <Route path="popups" element={<Popups />} />
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="permissoes" element={<Permissoes />} />
            <Route path="faturamento" element={<Faturamento />} />
            <Route path="centros-custo" element={<CentrosCusto />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="parametros" element={<Parametros />} />
            <Route path="ativos" element={<Ativos />} />
            <Route path="tipos-ativo" element={<TiposAtivo />} />
            <Route path="ativos/checkin" element={<AtivoCheckInOut />} />
            <Route path="catraca-checkin" element={<CatracaCheckIn />} />
            <Route path="orcamentos" element={<Orcamentos />} />
            <Route path="orcamentos/:id/montar" element={<OrcamentoBuilder />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}
