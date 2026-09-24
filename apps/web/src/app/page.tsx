import { Sprout } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <Sprout className="size-7" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        GovRural
      </h1>
      <p className="max-w-md text-muted-foreground">
        Plataforma de Gestao, Atendimento e Inteligencia do Meio Rural para
        Municipios.
      </p>
      <Link href="/login" className={buttonVariants({ className: "mt-2" })}>
        Entrar
      </Link>
    </div>
  );
}
