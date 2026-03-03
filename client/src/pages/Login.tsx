import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { loginUserSchema, type LoginUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, TrendingUp, ArrowLeft } from "lucide-react";

import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login effettuato",
        description: "Benvenuto nel tuo Trading Journal!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Errore login",
        description: error.message || "Email o password non corretti",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Colonna Sinistra - Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm sm:bg-card bg-transparent">
          <CardHeader className="text-center md:text-left">
            <div className="flex justify-center md:justify-start mb-4">
              <div className="p-3 bg-primary/10 rounded-full md:hidden">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Bentornato</CardTitle>
            <CardDescription className="text-base">Accedi al tuo account per continuare</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nome@esempio.com"
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="La tua password"
                          data-testid="input-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4 mt-2">
                <Button
                  type="submit"
                  className="w-full text-base py-6"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <LogIn className="h-5 w-5 mr-2" />
                  )}
                  Accedi
                </Button>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline" data-testid="link-forgot-password">
                  Password dimenticata?
                </Link>
                <p className="text-sm text-muted-foreground text-center">
                  Non hai un account?{" "}
                  <Link href="/register" className="font-medium text-primary hover:underline" data-testid="link-register">
                    Registrati
                  </Link>
                </p>
                <Link href="/landing" className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mt-2" data-testid="link-back-to-landing">
                  <ArrowLeft className="w-4 h-4" />
                  Torna alla Home
                </Link>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      {/* Colonna Destra - Immagine/Branding */}
      <div className="hidden lg:flex flex-1 relative bg-zinc-950 items-center justify-center overflow-hidden">
        {/* Decorative background pattern & gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-zinc-950" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        {/* Glow effects */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-teal-500/20 rounded-full blur-[100px]" />

        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <div className="flex justify-center mb-10">
            <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
              <TrendingUp className="h-16 w-16 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-6">Il tuo Trading,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Organizzato.</span></h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Gestisci le tue operazioni, analizza le performance e migliora i tuoi risultati con il nostro strumento professionale.
          </p>
        </div>
      </div>
    </div>
  );
}
