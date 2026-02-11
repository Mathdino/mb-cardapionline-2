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
  ChevronRight,
  MapPin,
  Clock,
  Calendar,
  Settings,
  MessageCircle,
  Building2,
  Smartphone,
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
  const [formData, setFormData] = useState<Company | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Image states
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropField, setCropField] = useState<
    "profileImage" | "bannerImage" | null
  >(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

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
      setFormData((prev) => (prev ? { ...prev, [cropField]: data.url } : null));
      if (company?.id) {
        const updateResult = await updateCompany(company.id, {
          [cropField]: data.url,
        });
        if (updateResult.success && updateResult.company) {
          updateCompanyData(updateResult.company as unknown as Company);
          setMessage({ type: "success", text: "Imagem salva com sucesso!" });
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

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      if (!company?.id) throw new Error("ID da empresa não encontrado");
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        whatsapp: formData.whatsapp,
        minimumOrder: Number(formData.minimumOrder),
        allowsDelivery: formData.allowsDelivery,
        allowsPickup: formData.allowsPickup,
        phone: formData.phone.filter((p) => p.trim() !== ""),
        address: formData.address,
        businessHours: formData.businessHours,
        paymentMethods: formData.paymentMethods,
        profileImage: formData.profileImage,
        bannerImage: formData.bannerImage,
      };

      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();
      if (result && result.success) {
        updateCompanyData({ ...formData, ...dataToSave } as Company);
        setMessage({
          type: "success",
          text: "Informações salvas com sucesso!",
        });
        setActiveModal(null);
      } else {
        setMessage({
          type: "error",
          text: `Erro: ${result?.error || "Erro desconhecido"}`,
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: `Erro: ${error.message || "Erro de conexão"}`,
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateAddress = (field: keyof Company["address"], value: string) => {
    setFormData((prev) =>
      prev ? { ...prev, address: { ...prev.address, [field]: value } } : null,
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

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`,
      );
      const data = await response.json();
      if (!data.erro) {
        updateAddress("cep", cleanCep);
        updateAddress("street", data.logradouro || "");
        updateAddress("neighborhood", data.bairro || "");
        updateAddress("city", data.localidade || "");
        updateAddress("state", data.uf || "");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const SectionCard = ({ icon: Icon, title, description, onClick }: any) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white hover:bg-gray-50 transition-colors border-b last:border-0 first:rounded-t-xl last:rounded-b-xl"
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-gray-500 line-clamp-1">
          {description}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300" />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10 px-4">
      {/* Mensagem de Feedback */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${message.type === "success" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}
        >
          {message.text}
        </div>
      )}

      {/* Seção Minha Empresa */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">
          Minha Empresa
        </h2>
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <SectionCard
            icon={Building2}
            title="Dados da Empresa"
            description="Nome do estabelecimento e descrição"
            onClick={() => setActiveModal("dados")}
          />
          <SectionCard
            icon={MapPin}
            title="Endereço"
            description={`${formData.address.street}, ${formData.address.number}, ${formData.address.neighborhood}`}
            onClick={() => setActiveModal("endereco")}
          />
          <SectionCard
            icon={Clock}
            title="Horários de Funcionamento"
            description="Defina os horários de abertura e fechamento"
            onClick={() => setActiveModal("horarios")}
          />
          <SectionCard
            icon={Smartphone}
            title="Telefones de Contato"
            description={`${formData.phone.length} telefone(s) cadastrado(s)`}
            onClick={() => setActiveModal("telefones")}
          />
        </div>
      </section>

      {/* Seção Configurações */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">
          Configurações
        </h2>
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <SectionCard
            icon={Settings}
            title="Valor Mínimo e Entrega"
            description="Valor mínimo, entrega e retirada"
            onClick={() => setActiveModal("logistica")}
          />
          <SectionCard
            icon={ImageIcon}
            title="Aparência"
            description="Foto de perfil e banner da loja"
            onClick={() => setActiveModal("aparencia")}
          />
          <SectionCard
            icon={MessageCircle}
            title="Formas de Pagamento"
            description="Formas de pagamento aceitas"
            onClick={() => setActiveModal("pagamento")}
          />
        </div>
      </section>

      {/* MODAL: DADOS DA EMPRESA */}
      <Dialog
        open={activeModal === "dados"}
        onOpenChange={() => setActiveModal(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dados da Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Empresa</label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição da Loja</label>
              <textarea
                className="w-full p-2 border rounded-md h-24 resize-none"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ENDEREÇO */}
      <Dialog
        open={activeModal === "endereco"}
        onOpenChange={() => setActiveModal(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Endereço da Loja</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">CEP</label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.address.cep}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  updateAddress("cep", val);
                  if (val.length === 8) fetchAddressByCep(val);
                }}
                maxLength={8}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Rua</label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.address.street}
                onChange={(e) => updateAddress("street", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número</label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.address.number}
                onChange={(e) => updateAddress("number", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bairro</label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.address.neighborhood}
                onChange={(e) => updateAddress("neighborhood", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: HORÁRIOS */}
      <Dialog
        open={activeModal === "horarios"}
        onOpenChange={() => setActiveModal(null)}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Horários de Funcionamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {formData.businessHours.map((day, index) => (
              <div
                key={day.dayOfWeek}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                <div className="w-24 font-medium text-sm">{day.dayName}</div>
                <button
                  onClick={() =>
                    updateBusinessHours(index, "isOpen", !day.isOpen)
                  }
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${day.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {day.isOpen ? "Aberto" : "Fechado"}
                </button>
                {day.isOpen && (
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="time"
                      className="p-1 border rounded text-sm"
                      value={day.openTime}
                      onChange={(e) =>
                        updateBusinessHours(index, "openTime", e.target.value)
                      }
                    />
                    <span className="text-gray-400">às</span>
                    <input
                      type="time"
                      className="p-1 border rounded text-sm"
                      value={day.closeTime}
                      onChange={(e) =>
                        updateBusinessHours(index, "closeTime", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              Salvar Horários
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: LOGÍSTICA */}
      <Dialog
        open={activeModal === "logistica"}
        onOpenChange={() => setActiveModal(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Valor Mínimo e Entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Valor Mínimo do Pedido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded-md"
                value={formData.minimumOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumOrder: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Métodos de Entrega</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      allowsDelivery: !formData.allowsDelivery,
                    })
                  }
                  className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-colors ${formData.allowsDelivery ? "border-primary bg-primary/5 text-primary" : "text-gray-400"}`}
                >
                  <Truck className="h-6 w-6" />
                  <span className="text-xs font-bold">Entrega</span>
                </button>
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      allowsPickup: !formData.allowsPickup,
                    })
                  }
                  className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-colors ${formData.allowsPickup ? "border-primary bg-primary/5 text-primary" : "text-gray-400"}`}
                >
                  <Store className="h-6 w-6" />
                  <span className="text-xs font-bold">Retirada</span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: APARÊNCIA */}
      <Dialog
        open={activeModal === "aparencia"}
        onOpenChange={() => setActiveModal(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aparência da Loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <label className="text-sm font-medium self-start">
                Foto de Perfil
              </label>
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed flex items-center justify-center bg-gray-50">
                {formData.profileImage ? (
                  <Image
                    src={formData.profileImage}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => profileImageInputRef.current?.click()}
              >
                Alterar Foto
              </Button>
              <input
                type="file"
                ref={profileImageInputRef}
                hidden
                accept="image/*"
                onChange={(e) => handleImageSelect(e, "profileImage")}
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              <label className="text-sm font-medium self-start">
                Banner Superior
              </label>
              <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center bg-gray-50">
                {formData.bannerImage ? (
                  <Image
                    src={formData.bannerImage}
                    alt="Banner"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bannerImageInputRef.current?.click()}
              >
                Alterar Banner
              </Button>
              <input
                type="file"
                ref={bannerImageInputRef}
                hidden
                accept="image/*"
                onChange={(e) => handleImageSelect(e, "bannerImage")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setActiveModal(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: PAGAMENTO */}
      <Dialog
        open={activeModal === "pagamento"}
        onOpenChange={() => setActiveModal(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Formas de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 py-4">
            {Object.entries(paymentMethodLabels).map(([method, label]) => (
              <button
                key={method}
                onClick={() => togglePaymentMethod(method as PaymentMethod)}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${formData.paymentMethods.includes(method as PaymentMethod) ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}
              >
                <span className="font-medium text-sm">{label}</span>
                {formData.paymentMethods.includes(method as PaymentMethod) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: TELEFONES */}
      <Dialog
        open={activeModal === "telefones"}
        onOpenChange={() => setActiveModal(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Telefones de Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formData.phone.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="flex-1 p-2 border rounded-md"
                  value={phone}
                  onChange={(e) => updatePhone(index, e.target.value)}
                  placeholder="(00) 00000-0000"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      phone: formData.phone.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() =>
                setFormData({ ...formData, phone: [...formData.phone, ""] })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Telefone
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CROPPER DIALOG */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajustar Imagem</DialogTitle>
          </DialogHeader>
          <div className="relative h-80 w-full bg-black">
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
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={([v]) => setZoom(v)}
              />
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropping(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCropSave} disabled={isUploading}>
              {isUploading ? "Processando..." : "Confirmar e Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
