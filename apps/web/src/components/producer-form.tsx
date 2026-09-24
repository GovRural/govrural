"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Producer, ProducerType } from "@/lib/producer-types";

export interface ProducerFormValues {
  name: string;
  cpfCnpj: string;
  producerType: ProducerType;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
}

interface ProducerFormProps {
  initial?: Producer;
  onSubmit: (values: ProducerFormValues) => void;
  submitting: boolean;
  submitLabel: string;
  /** Quando true, renderiza so o <form>, sem o Card (para uso dentro de um Dialog). */
  bare?: boolean;
}

export function ProducerForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
  bare = false,
}: ProducerFormProps) {
  const [values, setValues] = useState<ProducerFormValues>({
    name: initial?.name ?? "",
    cpfCnpj: initial?.cpfCnpj ?? "",
    producerType: initial?.producerType ?? "INDIVIDUAL",
    phone: initial?.phone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  function update<K extends keyof ProducerFormValues>(
    key: K,
    value: ProducerFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const form = (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          required
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
        <Input
          id="cpfCnpj"
          required
          value={values.cpfCnpj}
          onChange={(e) => update("cpfCnpj", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="producerType">Tipo</Label>
        <select
          id="producerType"
          value={values.producerType}
          onChange={(e) => update("producerType", e.target.value as ProducerType)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="INDIVIDUAL">Pessoa fisica</option>
          <option value="COMPANY">Empresa</option>
          <option value="ASSOCIATION">Associacao</option>
          <option value="COOPERATIVE">Cooperativa</option>
          <option value="OTHER">Outro</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          value={values.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Endereco</Label>
        <Input
          id="address"
          value={values.address}
          onChange={(e) => update("address", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );

  if (bare) return form;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Dados do produtor</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
