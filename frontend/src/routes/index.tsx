/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";

// Placeholders temporários (serão substituídos nas fases seguintes)
const Dashboard = () => <div>Dashboard (protegido)</div>;
const Login = () => <div>Login Page</div>;
const Register = () => <div>Register Page</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // O Layout envolve as rotas filhas
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />, // Redireciona raiz para dashboard
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "reports",
        element: <div>Relatórios (protegido)</div>,
      },
      {
        path: "profile",
        element: <div>Perfil (protegido)</div>,
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
