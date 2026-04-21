// src/graphql/schema.ts
export const typeDefs = `#graphql
  scalar JSON
  scalar DateTime

  type Question {
    id: ID!
    text: String!
    type: String!
    required: Boolean!
    order: Int!
    options: JSON
    conditionalLogic: JSON
  }

  type Survey {
    id: ID!
    title: String!
    description: String
    public: Boolean!
    slug: String
    startDate: DateTime
    endDate: DateTime!
    active: Boolean!
    status: String!
    responsesCount: Int!
    questions: [Question!]!
  }

  type AggregatedResult {
    questionId: ID!
    questionText: String!
    type: String!
    totalResponses: Int!
    data: [ResultData!]!
  }

  type ResultData {
    option: String
    count: Int!
    percentage: Float!
  }

  type CrossTabulation {
    rows: [String!]!
    columns: [String!]!
    data: [[Int!]!]!
  }

  input FiltersInput {
    startDate: DateTime
    endDate: DateTime
    locationIds: [Int!]
  }

  type Query {
    # Lista pesquisas acessíveis ao usuário autenticado
    surveys: [Survey!]!

    # Obtém uma pesquisa específica
    survey(id: ID!): Survey

    # Resultados agregados de uma pesquisa
    surveyResults(surveyId: ID!, filters: FiltersInput): [AggregatedResult!]!

    # Cruzamento entre duas perguntas de múltipla escolha
    crossTabulation(surveyId: ID!, questionA: ID!, questionB: ID!): CrossTabulation
  }
`;
