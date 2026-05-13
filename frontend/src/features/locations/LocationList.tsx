import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetLocationsQuery,
  useDeleteLocationMutation,
} from "../surveys/surveysApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

function isRTKError(err: unknown): err is FetchBaseQueryError {
  return typeof err === "object" && err !== null && "status" in err;
}

export default function LocationList() {
  const { data: locations, isLoading } = useGetLocationsQuery();
  const [deleteLocation] = useDeleteLocationMutation();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLocation(deleteId).unwrap();
      toast.success("Local excluído.");
    } catch (err: unknown) {
      if (isRTKError(err)) {
        if (err.status === 409) {
          toast.error(
            "Este local está vinculado a pesquisas e não pode ser excluído.",
          );
        } else {
          toast.error("Erro ao excluir. Tente novamente.");
        }
      } else {
        toast.error("Erro inesperado.");
      }
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Locais</h1>
        <Button
          onClick={() => navigate("/locations/new")}
          data-testid="location-new"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo Local
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations?.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell className="font-medium min-w-36 whitespace-normal!">
                  {loc.name}
                </TableCell>
                <TableCell>
                  {Array.isArray(loc.city)
                    ? loc.city.join(", ") || "-"
                    : loc.city || "-"}
                  /{loc.state}
                </TableCell>
                <TableCell className="min-w-36 whitespace-normal!">
                  {Array.isArray(loc.neighborhood)
                    ? loc.neighborhood.join(", ") || "-"
                    : loc.neighborhood || "-"}
                </TableCell>
                <TableCell className="max-w-50 truncate">
                  {loc.notes || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/locations/${loc.id}/edit`)}
                      data-testid={`location-edit-${loc.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(loc.id)}
                      data-testid={`location-delete-${loc.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este local? Se houver pesquisas
              vinculadas, a exclusão será bloqueada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
