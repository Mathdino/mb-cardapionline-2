# MB Cardápio Online 🍔

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)

Uma plataforma SaaS moderna e completa para gestão de cardápios digitais e pedidos online. O sistema oferece uma interface intuitiva para clientes realizarem pedidos e um painel administrativo robusto para gerenciamento do restaurante.

## ✨ Funcionalidades Principais

### 📱 Para o Cliente

- **Cardápio Interativo**: Navegação fluida por categorias e produtos.
- **Combos Personalizáveis**: Interface rica para montagem de combos com regras flexíveis de escolha.
- **Carrinho de Compras**: Gestão fácil de itens e finalização de pedido.
- **Histórico de Pedidos**: Acompanhamento do status dos pedidos em tempo real.
- **Login Social**: Autenticação rápida com Google.

### 🏢 Para o Restaurante (Admin)

- **Dashboard Completo**: Visão geral de vendas e métricas.
- **Gestão de Produtos**: Cadastro detalhado de produtos, ingredientes, sabores e combos.
- **Promoções e Cupons**: Ferramentas para criar campanhas promocionais e descontos.
- **Gestão de Pedidos**: Controle de fluxo de pedidos (Aceitar, Preparar, Enviar, Concluir).
- **Relatórios Financeiros**: Acompanhamento de faturamento e desempenho.
- **Upload de Imagens**: Ferramenta integrada de corte e upload de imagens para produtos.

## 🚀 Tecnologias Utilizadas

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Banco de Dados**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Autenticação**: [NextAuth.js](https://next-auth.js.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL

### Passo a Passo

1.  **Clone o repositório**

    ```bash
    git clone https://github.com/seu-usuario/mb-cardapionline.git
    cd mb-cardapionline
    ```

2.  **Instale as dependências**

    ```bash
    npm install
    # ou
    pnpm install
    # ou
    yarn install
    ```

3.  **Configure as Variáveis de Ambiente**
    Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:

    ```env
    # Banco de Dados
    DATABASE_URL="postgresql://usuario:senha@localhost:5432/mb_cardapio?schema=public"

    # NextAuth
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="sua_chave_secreta_aqui"

    # Google Auth (Opcional para dev local se não usar login social)
    GOOGLE_CLIENT_ID="seu_client_id_google"
    GOOGLE_CLIENT_SECRET="seu_client_secret_google"
    ```

4.  **Configure o Banco de Dados**
    Execute as migrações do Prisma para criar as tabelas:

    ```bash
    npx prisma migrate dev
    ```

5.  **Inicie o Servidor de Desenvolvimento**
    ```bash
    npm run dev
    ```
    O projeto estará rodando em `http://localhost:3000`.

## 📂 Estrutura do Projeto

```
mb-cardapionline/
├── app/                    # Páginas e Rotas (App Router)
│   ├── [slug]/             # Página pública do restaurante
│   ├── empresa/dashboard/  # Painel administrativo
│   ├── api/                # Rotas de API (Next.js API Routes)
│   └── ...
├── components/             # Componentes React Reutilizáveis
│   ├── client/             # Componentes Client-Side
│   ├── ui/                 # Componentes Base (Shadcn/UI)
│   └── ...
├── lib/                    # Utilitários e Configurações (Prisma, Auth, Utils)
├── prisma/                 # Schema do Banco de Dados e Migrations
└── public/                 # Arquivos Estáticos (Imagens, Ícones)
```

## 📸 Acessos

- **LOGIN CLIENTE**: `http://localhost:3000`
- **LOGIN RESTAURANTE**: `http://localhost:3000/empresa`
  - **EMAIL**: `admin@empresa.com`
  - **SENHA**: `123456`

---

Desenvolvido por MB Soluções em Tecnologia
