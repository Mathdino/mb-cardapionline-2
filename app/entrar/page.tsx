import { AuthForm } from "@/components/client/auth-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | Login",
  description: "Faça login ou crie sua conta",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
