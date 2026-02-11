"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/profile-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  user: any;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    cpf: user.cpf || "",
    address: {
      cep: user.address?.cep || "",
      street: user.address?.street || "",
      number: user.address?.number || "",
      neighborhood: user.address?.neighborhood || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Mask phone (11) 99999-9999
      let v = value.replace(/\D/g, "").slice(0, 11);
      let masked = v;
      if (v.length > 10) {
        masked = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
      } else if (v.length > 5) {
        masked = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
      } else if (v.length > 2) {
        masked = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
      }
      setFormData((prev) => ({ ...prev, [name]: masked }));
    } else if (name === "cpf") {
      // Mask CPF
      const v = value.replace(/\D/g, "").slice(0, 11);
      let masked = v;
      if (v.length > 9) {
        masked = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      } else if (v.length > 6) {
        masked = v.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3-");
      } else if (v.length > 3) {
        masked = v.replace(/(\d{3})(\d{3})/, "$1.$2.");
      } else if (v.length > 0) {
        masked = v.replace(/(\d{3})/, "$1.");
      }
      setFormData((prev) => ({ ...prev, [name]: masked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "cep") {
      const v = value.replace(/\D/g, "").slice(0, 8);
      const masked = v.replace(/^(\d{5})(\d{3})/, "$1-$2");
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: masked },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }));
    }
  };

  const handleCepBlur = async () => {
    const cep = formData.address.cep.replace(/\D/g, "");
    if (cep.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            address: {
              ...prev.address,
              street: data.logradouro,
              neighborhood: data.bairro,
              city: data.localidade,
              state: data.uf,
            },
          }));
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP.");
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfile(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Perfil atualizado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={handleInputChange}
            maxLength={14}
          />
        </div>

        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="cep">CEP</Label>
            <div className="relative">
              <Input
                id="cep"
                name="cep"
                value={formData.address.cep}
                onChange={handleAddressChange}
                onBlur={handleCepBlur}
                placeholder="00000-000"
                maxLength={9}
              />
              {cepLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="street">Rua</Label>
            <Input
              id="street"
              name="street"
              value={formData.address.street}
              onChange={handleAddressChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              name="number"
              value={formData.address.number}
              onChange={handleAddressChange}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              value={formData.address.neighborhood}
              onChange={handleAddressChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              name="city"
              value={formData.address.city}
              onChange={handleAddressChange}
            />
          </div>
          <div>
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              name="state"
              value={formData.address.state}
              onChange={handleAddressChange}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
}
