import { useGetSurveysQuery } from "../surveys/surveysApi";
import { Link } from "react-router-dom";

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: surveys } = useGetSurveysQuery();
  const totalSurveys = surveys?.length ?? 0;
  const activeSurveys = surveys?.filter((s) => s.active).length ?? 0;
  const totalResponses =
    surveys?.reduce((sum, s) => sum + s.responsesCount, 0) ?? 0;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Pesquisas" value={totalSurveys} />
        <StatsCard label="Ativas" value={activeSurveys} />
        <StatsCard label="Respostas" value={totalResponses} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="font-medium mb-2">Pesquisas Recentes</h2>
        <ul className="divide-y">
          {surveys?.slice(0, 5).map((s) => (
            <li key={s.id} className="py-2 flex justify-between">
              <Link
                to={`/surveys/${s.id}`}
                className="text-blue-600 hover:underline"
              >
                {s.title}
              </Link>
              <span className="text-sm text-gray-500">
                {s.responsesCount} respostas
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-4">
        <Link
          to="/admin/users"
          className="py-2 px-4 bg-blue-600 text-white rounded-lg"
        >
          Gerenciar Usuários
        </Link>
        <Link
          to="/admin/roles"
          className="py-2 px-4 bg-blue-600 text-white rounded-lg"
        >
          Gerenciar Roles
        </Link>
      </div>
    </div>
  );
}
