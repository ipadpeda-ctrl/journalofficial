import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { registerUserSchema, type RegisterUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, TrendingUp, CheckCircle2 } from "lucide-react";

import { Link } from "wouter";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pendingApproval, setPendingApproval] = useState(false);

  const form = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.pending) {
        setPendingApproval(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Registrazione completata",
          description: data.message,
        });
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore registrazione",
        description: error.message || "Errore durante la registrazione",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterUser) => {
    registerMutation.mutate(data);
  };

  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Registrazione completata!</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>In attesa di approvazione</AlertTitle>
              <AlertDescription>
                Il tuo account è stato creato ma deve essere approvato da un amministratore
                prima di poter accedere. Riceverai una notifica quando il tuo account sarà attivo.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/login")}
              data-testid="button-back-to-login"
            >
              Torna al login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-3xl font-bold tracking-tight">Benvenuto</CardTitle>
            <CardDescription className="text-base">Crea il tuo account per iniziare</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mario"
                            data-testid="input-firstName"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Rossi"
                            data-testid="input-lastName"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                          placeholder="Minimo 6 caratteri"
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
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-5 w-5 mr-2" />
                  )}
                  Registrati
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Hai già un account?{" "}
                  <Link href="/login">
                    <a
                      className="font-medium text-primary hover:underline"
                      data-testid="link-login"
                    >
                      Accedi
                    </a>
                  </Link>
                </p>
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
        <div className="absolute top-1/4 -right-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-teal-500/20 rounded-full blur-[100px]" />

        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <div className="flex justify-center mb-10">
            <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
              <TrendingUp className="h-16 w-16 text-teal-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-6">Migliora il tuo<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Trading.</span></h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Unisciti ai trader professionisti che usano il nostro Journal per mantenere il controllo costante delle proprie operazioni.
          </p>
        </div>
      </div>
    </div>
  );
}
