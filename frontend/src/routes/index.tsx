/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";

// Placeholders temporários
const Dashboard = () => <div>Dashboard (protegido)</div>;
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
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "reports",
            element: <Reports />,
          },
          {
            path: "profile",
            element: <Profile />,
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);
