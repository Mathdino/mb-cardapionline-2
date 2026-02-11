"use client";

import React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { paymentMethodLabels, defaultBusinessHours } from "@/lib/mock-data";
import type { Company, PaymentMethod, BusinessHours } from "@/lib/types";
import {
  Save,
  Plus,
  Trash2,
  ImageIcon,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  Truck,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPhone, getCroppedImg } from "@/lib/utils";
import { updateCompany, getCompanyById } from "@/app/actions/company";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { FoodLoading } from "@/components/ui/food-loading";

export default function InformacoesPage() {
  const { getCompany, updateCompanyData } = useAuth();
  const company = getCompany();
  const [formData, setFormData] = useState<Company | null>(
    company
      ? {
          ...company,
          name: company.name || "",
          description: company.description || "",
          instagram: company.instagram || "",
          facebook: company.facebook || "",
          whatsapp: company.whatsapp || "",
          minimumOrder: company.minimumOrder || 0,
          allowsDelivery: company.allowsDelivery ?? true,
          allowsPickup: company.allowsPickup ?? true,
          profileImage: company.profileImage || "",
          bannerImage: company.bannerImage || "",
          address: {
            cep: company.address?.cep || "",
            street: company.address?.street || "",
            number: company.address?.number || "",
            neighborhood: company.address?.neighborhood || "",
            city: company.address?.city || "",
            state: company.address?.state || "",
          },
          phone: Array.isArray(company.phone) ? company.phone : [],
          paymentMethods: Array.isArray(company.paymentMethods)
            ? company.paymentMethods
            : [],
          businessHours:
            Array.isArray(company.businessHours) &&
            company.businessHours.length > 0
              ? company.businessHours
              : defaultBusinessHours,
        }
      : null,
  );

  useEffect(() => {
    async function refreshData() {
      if (company?.id) {
        try {
          const freshCompany = await getCompanyById(company.id);
          if (freshCompany) {
            const typedCompany = freshCompany as unknown as Company;
            updateCompanyData(typedCompany);
            setFormData({
              ...typedCompany,
              name: typedCompany.name || "",
              description: typedCompany.description || "",
              instagram: typedCompany.instagram || "",
              facebook: typedCompany.facebook || "",
              whatsapp: typedCompany.whatsapp || "",
              minimumOrder: typedCompany.minimumOrder || 0,
              allowsDelivery: typedCompany.allowsDelivery ?? true,
              allowsPickup: typedCompany.allowsPickup ?? true,
              profileImage: typedCompany.profileImage || "",
              bannerImage: typedCompany.bannerImage || "",
              address: {
                cep: typedCompany.address?.cep || "",
                street: typedCompany.address?.street || "",
                number: typedCompany.address?.number || "",
                neighborhood: typedCompany.address?.neighborhood || "",
                city: typedCompany.address?.city || "",
                state: typedCompany.address?.state || "",
              },
              phone: Array.isArray(typedCompany.phone)
                ? typedCompany.phone
                : [],
              paymentMethods: Array.isArray(typedCompany.paymentMethods)
                ? typedCompany.paymentMethods
                : [],
              businessHours:
                Array.isArray(typedCompany.businessHours) &&
                typedCompany.businessHours.length > 0
                  ? typedCompany.businessHours
                  : defaultBusinessHours,
            });
          }
        } catch (error) {
          console.error("Failed to refresh company data:", error);
        }
      }
    }

    refreshData();
  }, [company?.id, updateCompanyData]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Crop state
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropField, setCropField] = useState<
    "profileImage" | "bannerImage" | null
  >(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  if (!formData || !company) {
    return (
      <div className="h-full flex items-center justify-center">
        <FoodLoading logoSrc={company?.profileImage} />
      </div>
    );
  }

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profileImage" | "bannerImage",
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCropImage(reader.result as string);
        setCropField(field);
        setIsCropping(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = "";
    }
  };

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels || !cropField) return;

    try {
      setIsUploading(true);
      const croppedImageBlob = await getCroppedImg(
        cropImage,
        croppedAreaPixels,
      );

      const file = new File([croppedImageBlob], "cropped-image.jpg", {
        type: "image/jpeg",
      });

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Falha no upload");

      const data = await response.json();

      // Update form data
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              [cropField]: data.url,
            }
          : null,
      );

      // Save to backend immediately
      if (company?.id) {
        const updateResult = await updateCompany(company.id, {
          [cropField]: data.url,
        });

        if (updateResult.success && updateResult.company) {
          updateCompanyData(updateResult.company as unknown as Company);
          setMessage({
            type: "success",
            text: "Imagem salva com sucesso!",
          });
        } else {
          setMessage({
            type: "error",
            text: "Imagem enviada, mas houve um erro ao salvar no perfil.",
          });
        }
      }

      setIsCropping(false);
      setCropImage(null);
      setCropField(null);
    } catch (error) {
      console.error("Erro no upload:", error);
      setMessage({ type: "error", text: "Erro ao fazer upload da imagem." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setCropImage(null);
    setCropField(null);
  };

  // Mantendo a função antiga para compatibilidade se necessário, mas redirecionando para o novo fluxo
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profileImage" | "bannerImage",
  ) => {
    handleImageSelect(e, field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      if (!company?.id) throw new Error("ID da empresa não encontrado");

      const dataToSave = {
        name: formData!.name,
        description: formData!.description,
        whatsapp: formData!.whatsapp,
        instagram: formData!.instagram,
        facebook: formData!.facebook,
        minimumOrder: Number(formData!.minimumOrder),
        allowsDelivery: formData!.allowsDelivery,
        allowsPickup: formData!.allowsPickup,
        phone: formData!.phone.filter((p) => p.trim() !== ""),
        address: formData!.address,
        businessHours: formData!.businessHours,
        paymentMethods: formData!.paymentMethods,
        profileImage: formData!.profileImage,
        bannerImage: formData!.bannerImage,
      };

      // Usar a nova API Route em vez da Server Action para evitar problemas de serialização
      const response = await fetch("/api/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();
      console.log("Update result from API:", result);

      if (result && result.success) {
        // Se a atualização foi bem sucedida, o servidor retorna os dados básicos
        // O revalidatePath cuidará de atualizar os dados reais no próximo refresh
        // Por segurança, vamos atualizar o contexto local apenas com o que enviamos
        const fullUpdatedCompany = { ...formData, ...dataToSave } as Company;
        updateCompanyData(fullUpdatedCompany);

        setMessage({
          type: "success",
          text: "Informações salvas com sucesso!",
        });
      } else {
        setMessage({
          type: "error",
          text: `Erro ao salvar informações: ${result?.error || "Erro desconhecido"}`,
        });
      }
    } catch (error: any) {
      console.error("Submit catch error:", error);
      setMessage({
        type: "error",
        text: `Erro ao salvar informações: ${error.message || "Erro de conexão"}`,
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateAddress = (field: keyof Company["address"], value: string) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            address: { ...prev.address, [field]: value },
          }
        : null,
    );
  };

  const updateBusinessHours = (
    dayIndex: number,
    field: keyof BusinessHours,
    value: string | boolean,
  ) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            businessHours: prev.businessHours.map((day, i) =>
              i === dayIndex ? { ...day, [field]: value } : day,
            ),
          }
        : null,
    );
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            paymentMethods: prev.paymentMethods.includes(method)
              ? prev.paymentMethods.filter((m) => m !== method)
              : [...prev.paymentMethods, method],
          }
        : null,
    );
  };

  const addPhone = () => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            phone: [...prev.phone, ""],
          }
        : null,
    );
  };

  const updatePhone = (index: number, value: string) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            phone: prev.phone.map((p, i) =>
              i === index ? formatPhone(value) : p,
            ),
          }
        : null,
    );
  };

  const removePhone = (index: number) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            phone: prev.phone.filter((_, i) => i !== index),
          }
        : null,
    );
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`,
      );
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) =>
          prev
            ? {
                ...prev,
                address: {
                  ...prev.address,
                  cep: cleanCep,
                  street: data.logradouro || "",
                  neighborhood: data.bairro || "",
                  city: data.localidade || "",
                  state: data.uf || "",
                },
              }
            : null,
        );
      }
    } catch (error) {
      console.log("Error fetching CEP:", error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Informações da Empresa
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure os dados da sua loja
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="font-bold text-foreground border-b pb-3">
            Dados Básicos
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, name: e.target.value } : null,
                  )
                }
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, description: e.target.value } : null,
                  )
                }
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Valor Mínimo do Pedido (R$)
                </label>
                <input
                  type="number"
                  value={formData.minimumOrder}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            minimumOrder: parseFloat(e.target.value) || 0,
                          }
                        : null,
                    )
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3 mt-2">
                  Métodos de Logística
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) =>
                        prev
                          ? { ...prev, allowsDelivery: !prev.allowsDelivery }
                          : null,
                      )
                    }
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.allowsDelivery
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-muted bg-muted/20 text-muted-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${formData.allowsDelivery ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Entrega</p>
                      <p className="text-xs opacity-80">
                        {formData.allowsDelivery ? "Ativado" : "Desativado"}
                      </p>
                    </div>
                    {formData.allowsDelivery && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) =>
                        prev
                          ? { ...prev, allowsPickup: !prev.allowsPickup }
                          : null,
                      )
                    }
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.allowsPickup
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-muted bg-muted/20 text-muted-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${formData.allowsPickup ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Retirada</p>
                      <p className="text-xs opacity-80">
                        {formData.allowsPickup ? "Ativado" : "Desativado"}
                      </p>
                    </div>
                    {formData.allowsPickup && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Info */}
        <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="font-bold text-foreground border-b pb-3">
            Redes Sociais
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, instagram: e.target.value } : null,
                  )
                }
                placeholder="Ex: @seurestaurante"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Facebook
              </label>
              <input
                type="text"
                value={formData.facebook || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, facebook: e.target.value } : null,
                  )
                }
                placeholder="Ex: facebook.com/seurestaurante"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="font-bold text-foreground border-b pb-3">Imagens</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Foto de Perfil
              </label>
              <div className="relative h-32 w-32 rounded-full border-2 border-dashed border-border overflow-hidden bg-secondary">
                {formData.profileImage ? (
                  <Image
                    src={formData.profileImage || "/placeholder.svg"}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={profileImageInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "profileImage")}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Recomendado: 200x200px
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => profileImageInputRef.current?.click()}
                >
                  Alterar foto
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Banner
              </label>
              <div className="relative h-32 w-full rounded-lg border-2 border-dashed border-border overflow-hidden bg-secondary">
                {formData.bannerImage ? (
                  <Image
                    src={formData.bannerImage || "/placeholder.svg"}
                    alt="Banner"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={bannerImageInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "bannerImage")}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Recomendado: 1200x300px
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bannerImageInputRef.current?.click()}
                >
                  Alterar banner
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Phones */}
        <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-foreground">Telefones</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPhone}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {formData.phone.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) =>
                    updatePhone(index, formatPhone(e.target.value))
                  }
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {formData.phone.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePhone(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="font-bold text-foreground border-b pb-3">Endereço</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                CEP
              </label>
              <input
                type="text"
                value={formData.address.cep}
                onChange={(e) => {
                  updateAddress("cep", e.target.value);
                  if (e.target.value.replace(/\D/g, "").length === 8) {
                    fetchAddressByCep(e.target.value);
                  }
                }}
                placeholder="00000-000"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Rua
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => updateAddress("street", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Número
              </label>
              <input
                type="text"
                value={formData.address.number}
                onChange={(e) => updateAddress("number", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bairro
              </label>
              <input
                type="text"
                value={formData.address.neighborhood}
                onChange={(e) => updateAddress("neighborhood", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estado
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
                maxLength={2}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="font-bold text-foreground border-b pb-3">
            Horários de Funcionamento
          </h2>

          <div className="space-y-3">
            {formData.businessHours?.map((day, index) => (
              <div
                key={day.dayOfWeek}
                className="flex flex-wrap items-center gap-3 p-3 bg-secondary/30 rounded-lg"
              >
                <label className="flex items-center gap-2 w-28">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(e) =>
                      updateBusinessHours(index, "isOpen", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="font-medium text-foreground">
                    {day.dayName}
                  </span>
                </label>

                {day.isOpen && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.openTime}
                      onChange={(e) =>
                        updateBusinessHours(index, "openTime", e.target.value)
                      }
                      className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-muted-foreground">até</span>
                    <input
                      type="time"
                      value={day.closeTime}
                      onChange={(e) =>
                        updateBusinessHours(index, "closeTime", e.target.value)
                      }
                      className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                {!day.isOpen && (
                  <span className="text-muted-foreground text-sm">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="font-bold text-foreground border-b pb-3">
            Selecione as Formas de Pagamento
          </h2>

          <div className="flex flex-wrap gap-3">
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
              (method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => togglePaymentMethod(method)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.paymentMethods.includes(method)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {paymentMethodLabels[method]}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="min-w-[150px]">
            {isSaving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Crop Modal */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajustar Imagem</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-80 bg-white mt-4">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={cropField === "profileImage" ? 1 : 4 / 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="py-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              Zoom
            </label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCropCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleCropSave} disabled={isUploading}>
              {isUploading ? (
                "Salvando..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Imagem
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
