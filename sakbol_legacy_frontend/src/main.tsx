import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {HeroUIProvider} from "@heroui/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./api/store.ts";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* UI Library's provider */}
    <HeroUIProvider>
      <Provider store={store}>
        {/* React Router Provider */}
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </HeroUIProvider>
  </StrictMode>,
)