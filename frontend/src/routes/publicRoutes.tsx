import PublicSurveyView from "../features/public-survey/PublicSurveyView";
import SurveySession from "../features/public-survey/SurveySession";
import DemographicForm from "../features/public-survey/DemographicForm";
import ThankYou from "../features/public-survey/ThankYou";

export const publicRoutes = [
  { path: "/s/:slug", element: <PublicSurveyView /> },
  { path: "/s/:slug/session", element: <SurveySession /> },
  { path: "/s/:slug/demographics", element: <DemographicForm /> },
  { path: "/s/:slug/thank-you", element: <ThankYou /> },
];
