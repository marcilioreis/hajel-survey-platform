import { lazyPage } from "../components/common/LazyPage";

const PublicSurveyView = lazyPage(
  () => import("../features/public-survey/PublicSurveyView"),
);
const SurveySession = lazyPage(
  () => import("../features/public-survey/SurveySession"),
);
const DemographicForm = lazyPage(
  () => import("../features/public-survey/DemographicForm"),
);
const ThankYou = lazyPage(() => import("../features/public-survey/ThankYou"));

export const publicRoutes = [
  { path: "/s/:slug", element: PublicSurveyView },
  { path: "/s/:slug/session", element: SurveySession },
  { path: "/s/:slug/demographics", element: DemographicForm },
  { path: "/s/:slug/thank-you", element: ThankYou },
];
