import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetPublicSurveyQuery } from "./publicSurveyApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function DemographicForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const token = slug ? localStorage.getItem(`survey-token-${slug}`) : null;
  const { data: survey } = useGetPublicSurveyQuery(slug!, { skip: !slug });

  const [form, setForm] = useState({
    ageRange: "",
    gender: "",
    incomeRange: "",
    education: "",
    occupation: "",
    locationId: "",
  });

  useEffect(() => {
    if (!token || !survey) {
      navigate(`/s/${slug}`);
    }
  }, [token, survey, slug, navigate]);

  if (!token || !survey) {
    return null;
  }

  const locations = survey.locations || [];

  const triggerVibration = () => {
    if ("vibrate" in navigator) {
      // Vibrate for 30ms, pause for 50ms, vibrate for 30ms
      navigator.vibrate([30, 50, 30]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some((v) => !v)) {
      toast.error("Preencha todos os campos.");
      return;
    }

    localStorage.setItem(`survey-${slug}-demographics`, JSON.stringify(form));
    triggerVibration();
    navigate(`/s/${slug}/session`);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto space-y-6 bg-card p-6 rounded-xl shadow-sm"
      >
        <h2 className="text-2xl font-bold">Quase lá! Preencha seus dados</h2>

        <div className="space-y-2">
          <Label htmlFor="demographics-age">Faixa etária</Label>
          <Select
            value={form.ageRange}
            onValueChange={(value) => setForm({ ...form, ageRange: value })}
          >
            <SelectTrigger id="demographics-age">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16-24">16-24 anos</SelectItem>
              <SelectItem value="25-34">25-34 anos</SelectItem>
              <SelectItem value="35-44">35-44 anos</SelectItem>
              <SelectItem value="45-54">45-54 anos</SelectItem>
              <SelectItem value="55-65">55-65 anos</SelectItem>
              <SelectItem value="65+">65+ anos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="demographics-gender">Gênero</Label>
          <Select
            value={form.gender}
            onValueChange={(value) => setForm({ ...form, gender: value })}
          >
            <SelectTrigger id="demographics-gender">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="NB">Não-binário</SelectItem>
              <SelectItem value="O">Outro</SelectItem>
              <SelectItem value="PNR">Prefiro não responder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="demographics-income">Renda familiar</Label>
          <Select
            value={form.incomeRange}
            onValueChange={(value) => setForm({ ...form, incomeRange: value })}
          >
            <SelectTrigger id="demographics-income">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="<1 SM">Menos de 1 SM</SelectItem>
              <SelectItem value="1-2 SM">1 a 2 SM</SelectItem>
              <SelectItem value="2-3 SM">2 a 3 SM</SelectItem>
              <SelectItem value="3-4 SM">3 a 4 SM</SelectItem>
              <SelectItem value=">4 SM">Mais de 4 SM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="demographics-education">Escolaridade</Label>
          <Select
            value={form.education}
            onValueChange={(value) => setForm({ ...form, education: value })}
          >
            <SelectTrigger id="demographics-education">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NA">Não alfabetizado</SelectItem>
              <SelectItem value="ENSINO_FUNDAMENTAL">
                Ensino Fundamental
              </SelectItem>
              <SelectItem value="ENSINO_MEDIO">Ensino Médio</SelectItem>
              <SelectItem value="ENSINO_SUPERIOR">Ensino Superior</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="demographics-occupation">Ocupação</Label>
          <Input
            id="demographics-occupation"
            data-testid="demographics-occupation"
            placeholder="Ocupação"
            value={form.occupation}
            onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            required
          />
        </div>

        {locations.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="demographics-location">Localização</Label>
            <Select
              value={form.locationId}
              onValueChange={(value) => setForm({ ...form, locationId: value })}
            >
              <SelectTrigger id="demographics-location">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button type="submit" className="w-full">
          Avançar para perguntas
        </Button>
      </form>
    </div>
  );
}
