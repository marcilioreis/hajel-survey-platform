/* eslint-disable react-refresh/only-export-components */
import { lazyPage } from "../components/common/LazyPage";
import { createBrowserRouter, Navigate } from "react-router-dom";

import Layout from "../components/layout/Layout";
import ProtectedRoute from "../features/auth/ProtectedRoute";

// Importa as rotas públicas
import { publicRoutes } from "./publicRoutes";

const Login = lazyPage(() => import("../features/auth/Login"));
const Register = lazyPage(() => import("../features/auth/Register"));
const SurveyList = lazyPage(() => import("../features/surveys/SurveyList"));
const SurveyFormWrapper = lazyPage(
  () => import("../features/surveys/SurveyFormWrapper"),
);
const SurveyDetail = lazyPage(() => import("../features/surveys/SurveyDetail"));
const SurveyExecution = lazyPage(
  () => import("../features/surveys/SurveyExecution"),
);
const SurveyReport = lazyPage(() => import("../features/reports/SurveyReport"));
const PublicSurveyView = lazyPage(
  () => import("../features/public-survey/PublicSurveyView"),
);
const SurveySession = lazyPage(
  () => import("../features/public-survey/SurveySession"),
);

// Placeholders temporários
// const Dashboard = () => <div>Dashboard (protegido)</div>;
const Reports = () => <div>Relatórios (protegido)</div>;
const Profile = () => <div>Perfil (protegido)</div>;

export const router = createBrowserRouter([
  ...publicRoutes,
  { path: "/login", element: Login },
  { path: "/register", element: Register },
  // Rotas protegidas (área administrativa)
  {
    path: "/",
    element: <ProtectedRoute />, // Protege todo o grupo
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/surveys" replace /> },
          { path: "surveys", element: SurveyList },
          { path: "surveys/new", element: SurveyFormWrapper }, // key fixa para nova pesquisa
          { path: "surveys/:id", element: SurveyDetail },
          { path: "surveys/:id/edit", element: SurveyFormWrapper }, // key será definida via useParams dentro de um wrapper
          { path: "surveys/:id/execute", element: SurveyExecution },
          { path: "/s/:slug", element: PublicSurveyView },
          { path: "/s/:token/continue", element: SurveySession }, // rota opcional para continuar sessão
          { path: "reports/:surveyId", element: SurveyReport },
          { path: "reports", element: <Reports /> },
          { path: "profile", element: <Profile /> },
        ],
      },
    ],
  },
]);
