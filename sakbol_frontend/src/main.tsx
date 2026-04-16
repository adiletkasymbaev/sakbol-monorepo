import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import "./i18n";
import { setupAuthInterceptor } from "./shared/services/interceptors.ts";
import { registerSw } from "./modules/push/registerSw.ts";
import { testPush } from "./shared/utils/testPush.ts";

setupAuthInterceptor()
registerSw()
testPush() // Для отладки

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroUIProvider>
      {/* Toaster */}
      <ToastProvider placement="top-center" toastOffset={20} />
      {/* React Router Provider */}
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </HeroUIProvider>
  </StrictMode>,
)