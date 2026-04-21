/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import SurveyList from "../features/surveys/SurveyList";
import SurveyDetail from "../features/surveys/SurveyDetail";
import SurveyFormWrapper from "../features/surveys/SurveyFormWrapper";

// Placeholders temporários
// const Dashboard = () => <div>Dashboard (protegido)</div>;
const Reports = () => <div>Relatórios (protegido)</div>;
const Profile = () => <div>Perfil (protegido)</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute />, // Protege todo o grupo
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/surveys" replace /> },
          { path: "surveys", element: <SurveyList /> },
          { path: "surveys/new", element: <SurveyFormWrapper /> }, // key fixa para nova pesquisa
          { path: "surveys/:id", element: <SurveyDetail /> },
          { path: "surveys/:id/edit", element: <SurveyFormWrapper /> }, // key será definida via useParams dentro de um wrapper
          // { path: "dashboards", element: <Dashboard /> },
          { path: "reports", element: <Reports /> },
          { path: "profile", element: <Profile /> },
        ],
      },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
]);
