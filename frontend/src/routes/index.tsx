/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazyPage } from "../components/common/LazyPage";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import AdminRoute from "../features/auth/AdminRoute";
import { publicRoutes } from "./publicRoutes";

// ──────────────────────────────────────────────
// Guia do usuário (sem controle de acesso)
// ──────────────────────────────────────────────
const GuiaPage = lazyPage(() => import("../features/guide/GuiaPage"));

// ──────────────────────────────────────────────
// Rotas públicas (login, registro)
// ──────────────────────────────────────────────
const Login = lazyPage(() => import("../features/auth/Login"));
const Register = lazyPage(() => import("../features/auth/Register"));
const ForgotPassword = lazyPage(
  () => import("../features/auth/ForgotPassword"),
);
const ResetPassword = lazyPage(() => import("../features/auth/ResetPassword"));
import PublicSurveyView from "../features/public-survey/PublicSurveyView";
import SurveySession from "../features/public-survey/SurveySession";

// ──────────────────────────────────────────────
// Rotas administrativas (admin)
// ──────────────────────────────────────────────
const Dashboard = lazyPage(() => import("../features/admin/Dashboard"));
const UserList = lazyPage(() => import("../features/admin/UserList"));
const UserFormWrapper = lazyPage(
  () => import("../features/admin/UserFormWrapper"),
);
const RoleList = lazyPage(() => import("../features/admin/RoleList"));
const RoleFormWrapper = lazyPage(
  () => import("../features/admin/RoleFormWrapper"),
);

// ──────────────────────────────────────────────
// Rotas protegidas (área do pesquisador)
// ──────────────────────────────────────────────
const SurveyList = lazyPage(() => import("../features/surveys/SurveyList"));
const SurveyFormWrapper = lazyPage(
  () => import("../features/surveys/SurveyFormWrapper"),
);
const SurveyDetail = lazyPage(() => import("../features/surveys/SurveyDetail"));
const SurveyExecution = lazyPage(
  () => import("../features/surveys/SurveyExecution"),
);
const SurveyReport = lazyPage(() => import("../features/reports/SurveyReport"));
const Profile = lazyPage(() => import("../features/auth/Profile"));
const LocationList = lazyPage(
  () => import("../features/locations/LocationList"),
);
const LocationFormWrapper = lazyPage(
  () => import("../features/locations/LocationFormWrapper"),
);

// Placeholders temporários
const Reports = () => <div>Relatórios (em definição)</div>;

export const router = createBrowserRouter([
  ...publicRoutes,
  { path: "/guia", element: GuiaPage },
  { path: "/login", element: Login },
  { path: "/register", element: Register },
  { path: "/forgot-password", element: ForgotPassword },
  { path: "/reset-password/:token", element: ResetPassword },
  // Rotas protegidas (área administrativa)
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/surveys" replace /> },
          { path: "surveys", element: SurveyList },
          { path: "surveys/new", element: SurveyFormWrapper },
          { path: "surveys/:id", element: SurveyDetail },
          { path: "surveys/:id/edit", element: SurveyFormWrapper },
          { path: "surveys/:id/execute", element: SurveyExecution },
          { path: "/s/:slug", element: <PublicSurveyView /> },
          { path: "/s/:token/continue", element: <SurveySession /> },
          { path: "reports/:surveyId", element: SurveyReport },
          { path: "locations", element: LocationList },
          { path: "locations/new", element: LocationFormWrapper },
          { path: "locations/:id/edit", element: LocationFormWrapper },
          { path: "reports", element: <Reports /> },
          { path: "profile", element: Profile },
        ],
      },
      {
        path: "/admin",
        element: <AdminRoute />,
        children: [
          { index: true, element: Dashboard },
          { path: "users", element: UserList },
          { path: "users/new", element: UserFormWrapper },
          { path: "users/:id/edit", element: UserFormWrapper },
          { path: "roles", element: RoleList },
          { path: "roles/new", element: RoleFormWrapper },
          { path: "roles/:id/edit", element: RoleFormWrapper },
        ],
      },
    ],
  },
]);
