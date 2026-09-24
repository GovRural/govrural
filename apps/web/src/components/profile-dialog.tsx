"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, apiFetch } from "@/lib/api-client";
import { resizeImageToDataUrl } from "@/lib/image-resize";
import type { AppUser } from "@/lib/user-types";
import { useAuthStore } from "@/stores/auth-store";

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.user);

  const meQuery = useQuery({
    queryKey: ["me", currentUser?.id],
    enabled: Boolean(accessToken && currentUser?.id && open),
    queryFn: () =>
      apiFetch<AppUser>(`/users/${currentUser!.id}`, { accessToken: accessToken! }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList className="w-full">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="senha">Senha</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="pt-3">
            {meQuery.data && <ProfileDataForm user={meQuery.data} />}
          </TabsContent>

          <TabsContent value="email" className="pt-3">
            {meQuery.data && <ProfileEmailForm currentEmail={meQuery.data.email} />}
          </TabsContent>

          <TabsContent value="senha" className="pt-3">
            <ProfilePasswordForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ProfileDataForm({ user }: { user: AppUser }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<AppUser>("/users/me", {
        method: "PATCH",
        accessToken: accessToken!,
        body: JSON.stringify({ name, phone, avatarUrl }),
      }),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: unknown) => {
      setSuccess(false);
      setError(err instanceof ApiError ? err.message : "Erro ao salvar dados.");
    },
  });

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no maximo 5MB.");
      return;
    }

    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setAvatarUrl(dataUrl);
      setError(null);
    } catch {
      setError("Nao foi possivel processar a imagem.");
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Foto de perfil"
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
              {initials(name || "?")}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Alterar foto"
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
          >
            <Camera className="size-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP ou GIF</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Nome completo</Label>
        <Input
          id="profile-name"
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-phone">Telefone / WhatsApp</Label>
        <Input
          id="profile-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-primary">Dados atualizados com sucesso.</p>
      )}
      <Button type="submit" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? "Salvando..." : "Salvar alteracoes"}
      </Button>
    </form>
  );
}

function ProfileEmailForm({ currentEmail }: { currentEmail: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<AppUser>("/users/me/email", {
        method: "PATCH",
        accessToken: accessToken!,
        body: JSON.stringify({ newEmail, currentPassword }),
      }),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setNewEmail("");
      setCurrentPassword("");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: unknown) => {
      setSuccess(false);
      setError(err instanceof ApiError ? err.message : "Erro ao alterar e-mail.");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>E-mail atual</Label>
        <Input value={currentEmail} disabled />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-email">Novo e-mail</Label>
        <Input
          id="new-email"
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email-current-password">Senha atual</Label>
        <Input
          id="email-current-password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-primary">
          E-mail atualizado. Faca login novamente para atualizar sua sessao.
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? "Salvando..." : "Alterar e-mail"}
      </Button>
    </form>
  );
}

function ProfilePasswordForm() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<void>("/users/me/password", {
        method: "PATCH",
        accessToken: accessToken!,
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao trocar senha.");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("A confirmacao nao corresponde a nova senha.");
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-password">Senha atual</Label>
        <Input
          id="current-password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <Input
          id="new-password"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirmar nova senha</Label>
        <Input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-primary">Senha alterada com sucesso.</p>}
      <Button type="submit" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? "Salvando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
