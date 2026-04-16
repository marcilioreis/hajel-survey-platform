export const typeDefs = `#graphql
  type Survey {
    id: ID!
    title: String!
    questions: [Question!]!
  }

  type Question {
    id: ID!
    text: String!
    type: String!
    options: JSON
  }

  type ReportResult {
    labels: [String!]!
    datasets: [Dataset!]!
  }

  type Dataset {
    label: String!
    data: [Float!]!
  }

  type Query {
    surveyResults(surveyId: ID!, filters: FiltersInput): ReportResult!
    crossTabulation(surveyId: ID!, questionA: ID!, questionB: ID!): [[String!]!]!
  }

  input FiltersInput {
    ageRange: [String!]
    gender: String
    location: String
  }

  scalar JSON
`;