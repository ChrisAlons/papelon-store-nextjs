'use client';

import * as React from "react";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false, // Para manejar la redirección manualmente y mostrar errores
        username,
        password,
      });

      if (result?.error) {
        setError("Credenciales inválidas. Por favor, inténtalo de nuevo.");
        toast.error("Error de inicio de sesión", {
          description: "Credenciales inválidas. Por favor, inténtalo de nuevo.",
        });
        setIsLoading(false);
      } else if (result?.ok) {
        toast.success("Inicio de sesión exitoso!");
        router.push("/dashboard"); // Redirige al dashboard o a donde necesites
      } else {
        // Caso inesperado
        setError("Ocurrió un error inesperado.");
        toast.error("Error", { description: "Ocurrió un error inesperado." });
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login submit error", err);
      setError("Ocurrió un error al intentar iniciar sesión.");
      toast.error("Error", { description: "Ocurrió un error al intentar iniciar sesión." });
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu nombre de usuario y contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder=""
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  {/* <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </a> */}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Cargando..." : "Iniciar Sesión"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
