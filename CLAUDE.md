# CLAUDE.md

本文件為 Claude Code (claude.ai/code) 在此代碼庫中工作時提供指引。

## 專案概述

Scaffold-ETH 2 是在以太坊上構建去中心化應用程式（dApps）的工具包。這是一個 **Yarn monorepo**，包含兩個協同工作的主要套件：

- **`packages/hardhat`**: Solidity 智能合約開發（撰寫、測試、部署）
- **`packages/nextjs`**: 具備 Web3 工具的 Next.js 前端（使用 App Router，非 Pages Router）

**技術堆疊**: Next.js 15 App Router, TypeScript, Tailwind CSS v4+, RainbowKit, Wagmi, Viem, Hardhat, Foundry

## 必要指令

### 開發工作流程
```bash
# 啟動本地區塊鏈（終端機 1）
yarn chain

# 部署合約（終端機 2）
yarn deploy

# 啟動 Next.js 前端（終端機 3）
yarn start
```

### 測試與建置
```bash
# 執行合約測試
yarn test                    # 或 yarn hardhat:test

# 檢查 TypeScript 類型
yarn hardhat:check-types     # 檢查合約
yarn next:check-types        # 檢查前端

# 建置生產版本
yarn next:build

# 格式化程式碼
yarn format                  # 格式化兩個套件
```

### 智能合約指令
```bash
yarn compile                 # 編譯合約
yarn hardhat:fork            # fork 主網
yarn verify                  # 在 Etherscan 上驗證
yarn hardhat:flatten         # 展平合約以便驗證
```

### 部署
```bash
yarn vercel                  # 部署前端到 Vercel
yarn ipfs                    # 部署到 IPFS
```

### 帳戶管理
```bash
yarn account:generate        # 生成新帳戶
yarn account:import          # 匯入現有私鑰
yarn account                 # 列出帳戶
```

## 架構與關鍵模式

### 合約熱重載系統

系統自動將已部署的合約同步到前端：

1. **合約來源**: `packages/hardhat/contracts/`（Solidity 檔案）
2. **部署腳本**: `packages/hardhat/deploy/*.ts`（hardhat-deploy 格式）
3. **自動生成**: `packages/nextjs/contracts/deployedContracts.ts`（部署時更新）
4. **前端消費**: Hooks 從 `deployedContracts.ts` 讀取 ABI 和地址

當您執行 `yarn deploy` 時，TypeScript 類型和合約資料會自動生成並立即可供前端使用。

### 智能合約互動模式

**請務必使用這些 hooks**（絕不直接使用原始 wagmi/viem）：

**讀取資料：**
```typescript
const { data } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "someFunction",
  args: [arg1, arg2], // 可選
});
```

**寫入資料：**
```typescript
const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "YourContract"
});

await writeContractAsync({
  functionName: "someFunction",
  args: [arg1, arg2],
  value: parseEther("0.1"), // 用於 payable 函數
});
```

**監聽事件：**
```typescript
const { data: events } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "EventName",
  watch: true, // 可選
});
```

所有 hooks 都在 `packages/nextjs/hooks/scaffold-eth/` 中。

### 顯示元件

**處理以太坊資料時請務必使用這些元件：**

- `<Address address={addr} />` - 顯示 ETH 地址（絕不使用純文字）
- `<AddressInput />` - 輸入 ETH 地址
- `<Balance address={addr} />` - 顯示 ETH/USDC 餘額
- `<EtherInput />` - 具有 ETH/USD 轉換的數字輸入

位於 `packages/nextjs/components/scaffold-eth/`。

### 設定檔

- **前端網路設定**: `packages/nextjs/scaffold.config.ts`
  - 設定目標網路、輪詢間隔、API 金鑰、錢包設定
- **Hardhat 設定**: `packages/hardhat/hardhat.config.ts`
  - 網路設定、編譯器版本、部署帳戶

### 外部合約

要與非本專案部署的合約互動：
1. 將合約 ABI 和地址加入 `packages/nextjs/contracts/externalContracts.ts`
2. 使用相同的 hooks（`useScaffoldReadContract` 等）搭配外部合約名稱

## 檔案結構模式

### Hardhat 套件
- `contracts/` - Solidity 智能合約
- `deploy/` - 部署腳本（編號，例如 `00_deploy_your_contract.ts`）
- `test/` - 合約測試（Hardhat/Chai）
- `scripts/` - 工具腳本（帳戶管理等）
- `typechain-types/` - 自動生成的合約 TypeScript 類型

### Next.js 套件
- `app/` - Next.js App Router 頁面和佈局
- `components/` - React 元件
  - `scaffold-eth/` - 預建 Web3 元件
- `hooks/` - React hooks
  - `scaffold-eth/` - 合約互動 hooks
- `contracts/` - 合約 ABIs 和地址（自動生成）
- `utils/` - 工具函數
- `services/` - 外部服務整合

## 開發提示

### 新增合約時
1. 在 `packages/hardhat/contracts/` 中建立 Solidity 檔案
2. 在 `packages/hardhat/deploy/` 中新增/修改部署腳本
3. 執行 `yarn deploy` - 這會自動更新 `deployedContracts.ts`
4. 合約立即可供前端 hooks 使用

### 建立合約互動 UI 時
1. 使用 `packages/nextjs/hooks/scaffold-eth/` 中的 hooks
2. 使用 `packages/nextjs/components/scaffold-eth/` 中的元件
3. 依名稱引用合約（與合約檔案名稱相符）

### Debug 頁面
訪問 `http://localhost:3000/debug` 透過自動生成的 UI 與已部署的合約互動。

## 重要注意事項

- **套件管理器**: 使用 Yarn（v3.2.3），非 npm
- **Node 版本**: 需要 Node >= v20.18.3
- **Monorepo**: 所有從根目錄執行的指令內部使用 `yarn workspace`
- **TypeScript**: 兩個套件都啟用嚴格模式
- **合約 ABIs**: 絕不手動編輯 `deployedContracts.ts` - 它是自動生成的
- **環境變數**: 使用 `.env.example` 作為本地 `.env` 檔案的範本

---

## 開發規範

### 重要提醒
**請在 ScaffoldEthAppWithProviders 現有的架構中做開發**

### 技術堆疊
- 框架：Next.js 15 App Router
- 語言：TypeScript 嚴格模式
- 樣式：Tailwind CSS v4+
- UI 套件：Shadcn UI

### 專案架構
- `/app` - Next.js App Router 頁面與佈局
- `/components` - 可重複使用 UI 元件
- `/lib` - 工具函數與配置
- `/types` - TypeScript 類型定義
- `/public` - 靜態資源

### React 元件規範
- 使用函數元件配合 TypeScript
- 元件名稱使用 PascalCase
- 檔案名稱使用 PascalCase：`UserCard.tsx`
- 使用命名導出，避免預設導出
- Props 介面名稱：元件名稱 + Props（如 `ButtonProps`）

### UI 規範
- 優先使用 Shadcn 有的 component（例如：`<Button>`、`<Input>` 等）

### Tailwind CSS 使用規範
- 只使用 Tailwind 工具類，不寫自訂 CSS
- 類別名稱順序：佈局 → 間距 → 顏色 → 狀態
- 響應式前綴使用：`sm:` `md:` `lg:` `xl:`
- 範例格式：`flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md`

### TypeScript 規範
- 所有函數參數和返回值必須有類型註解
- 介面定義優先使用 `interface` 而非 `type`
- 嚴格模式下不允許 `any` 類型
- 元件 Props 必須定義介面

### Next.js App Router 規範
- 頁面檔案：`page.tsx`
- 佈局檔：`layout.tsx`
- 載入狀態：`loading.tsx`
- 錯誤處理：`error.tsx`
- 預設使用 Server Components
- 需要客戶端互動時加入 `'use client'`

### 檔案命名約定
- 元件檔：`UserProfile.tsx`
- 頁面路由：`user-profile/page.tsx`
- 工具函數：`formatDate.ts`
- 類型定義：`UserTypes.ts`

### 開發重點提醒
- 優先使用 Server Components 提升效能
- 組件保持單一職責，避免過於複雜
- 遵循 Tailwind 設計系統的一致性
- 始終處理載入和錯誤狀態
