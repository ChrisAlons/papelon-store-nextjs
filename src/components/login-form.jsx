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

export function LoginForm({ className, callbackUrl = "/dashboard", ...props }) {
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
        callbackUrl, // Use the provided callback URL
      });

      if (result?.error) {
        setError("Credenciales inválidas. Por favor, inténtalo de nuevo.");
        toast.error("Error de inicio de sesión", {
          description: "Credenciales inválidas. Por favor, inténtalo de nuevo.",
        });
        setIsLoading(false);
      } else if (result?.ok) {
        toast.success("Inicio de sesión exitoso!");
        // Use the callback URL or default to dashboard
        router.push(callbackUrl);
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
        </CardHeader>        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Credentials info for development */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 mb-2">Credenciales de prueba:</p>
                <div className="space-y-1 text-blue-700">
                  <p>👑 <strong>Admin:</strong> admin / admin123</p>
                  <p>🛒 <strong>Vendedor:</strong> vendedor1 / vendedor123</p>
                  <p>💰 <strong>Cajero:</strong> cajero1 / cajero123</p>
                </div>
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
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
                  placeholder="Ingresa tu contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
