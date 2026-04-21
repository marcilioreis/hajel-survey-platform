export const formatDate = (dateStr: string) => {
  try {
    // Substitui espaço por T e remove microssegundos se necessário
    const isoString = dateStr.replace(" ", "T").split(".")[0];
    return new Date(isoString).toLocaleDateString();
  } catch {
    return "Data inválida";
  }
};

export const parseBackendDate = (dateStr: string): Date => {
  return new Date(dateStr.replace(" ", "T"));
};
