import { useAppData } from "../mock/AppDataContext";
import { HomeCliente } from "./HomeCliente";
import { HomeGestor } from "./HomeGestor";
import { HomeGU } from "./HomeGU";
import { HomeProducao } from "./HomeProducao";
import { HomeFaturamento } from "./HomeFaturamento";
import { HomeConsumidor } from "./HomeConsumidor";

export function Home() {
  const { currentProfileId } = useAppData();

  switch (currentProfileId) {
    case "prof-gestor":
      return <HomeGestor />;
    case "prof-gu":
      return <HomeGU />;
    case "prof-producao":
      return <HomeProducao />;
    case "prof-faturamento":
      return <HomeFaturamento />;
    case "prof-consumidor":
      return <HomeConsumidor />;
    default:
      return <HomeCliente />;
  }
}
