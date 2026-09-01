import { useAppData } from "../mock/AppDataContext";
import { HomeCliente } from "./HomeCliente";
import { HomeGestor } from "./HomeGestor";
import { HomeGU } from "./HomeGU";
import { HomeProducao } from "./HomeProducao";
import { HomeCopeira } from "./HomeCopeira";
import { HomeFaturamento } from "./HomeFaturamento";
import { HomeConsumidor } from "./HomeConsumidor";

export function Home() {
  const { currentProfileId } = useAppData();

  switch (currentProfileId) {
    case "prof-gestor":
      return <HomeGestor />;
    case "prof-gu":
    case "prof-admin":
      return <HomeGU />;
    case "prof-producao":
      return <HomeProducao />;
    case "prof-copeira":
      return <HomeCopeira />;
    case "prof-faturamento":
      return <HomeFaturamento />;
    case "prof-consumidor":
      return <HomeConsumidor />;
    default:
      return <HomeCliente />;
  }
}
