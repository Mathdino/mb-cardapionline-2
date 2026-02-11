"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerCustomer } from "@/app/actions/customer-auth";
import { toast } from "sonner";
import Image from "next/image";
import { FoodLoading } from "@/components/ui/food-loading";
import { useRestaurant } from "@/components/client/restaurant-context";

export function AuthForm() {
  const { company } = useRestaurant();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "cpf") {
      // Simple mask
      const v = value.replace(/\D/g, "").slice(0, 11);
      // Format 000.000.000-00
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          cpf: formData.cpf,
          password: formData.password,
          redirect: false,
        });

        if (res?.error) {
          toast.error(res.error);
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        const res = await registerCustomer(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Conta criada com sucesso! Fazendo login...");
          // Auto login
          const loginRes = await signIn("credentials", {
            cpf: formData.cpf,
            password: formData.password,
            redirect: false,
          });

          if (loginRes?.error) {
            toast.error(
              "Erro ao fazer login automático. Tente entrar manualmente.",
            );
          } else {
            router.push("/");
            router.refresh();
          }
        }
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <FoodLoading size={100} logoSrc={company?.profileImage} />
        </div>
      )}
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 pb-2 font-medium ${isLogin ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
            onClick={() => setIsLogin(true)}
          >
            Entrar
          </button>
          <button
            className={`flex-1 pb-2 font-medium ${!isLogin ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
            onClick={() => setIsLogin(false)}
          >
            Criar Conta
          </button>
        </div>

        <Button
          variant="outline"
          className="w-full mb-4 flex items-center justify-center gap-2"
          onClick={() => signIn("google", { callbackUrl: "/perfil" })}
        >
          <Image
            src="/icon-google.svg"
            alt="Google"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          Continuar com Google
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              ou continue com CPF
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              required
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
          </Button>
        </form>
      </div>
    </>
  );
}
